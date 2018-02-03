const Rotation = function(_onRotate, _onRotateStop) {
  this.rotationSpeed = 1;
  this.rotating = false;

  var top = 0,
    length = 0;
  var stack = [];
  var currentOperator = {};
  var currentAngle, targetAngle, rotataionDir;

  this.update = () => {
    if (!this.rotating) return;

    currentAngle += 0.05 * this.rotationSpeed * rotataionDir;
    let delta = (targetAngle - currentAngle) * rotataionDir;
    let { face, layers } = currentOperator;

    if (delta <= 0) this.stop();
    else _onRotate && _onRotate(face, layers, currentAngle);
  };

  this.stop = () => {
    currentAngle = 0;
    this.rotating = false;
    clearInterval(this.timer);

    let { face, layers, dir, num } = currentOperator;
    _onRotate && _onRotate(face, layers, 0);
    _onRotateStop && _onRotateStop(face, layers, dir, num);
    onResolve && onResolve();
  };

  this.start = (operator, srcAngle = 0, dstAngle = operator.dir * operator.num * (Math.PI / 2)) => {
    if (this.rotating) return;
    return new Promise((resolve, reject) => {
      currentOperator = operator;
      currentAngle = srcAngle;
      targetAngle = dstAngle;
      rotataionDir = srcAngle < dstAngle ? 1 : -1;
      onResolve = resolve;
      this.rotating = true;
      pushNewOperator();
    });
  };

  function pushNewOperator() {
    if (!currentOperator.inStack && currentOperator.num > 0) {
      currentOperator.inStack = true;
      stack[top++] = currentOperator;
      length = top;
      this.onUndoRedoChange && this.onUndoRedoChange(true, false);
    }
  }

  this.undo = async () => {
    if (!this.rotating && top > 0) {
      let { face, layers, dir, num } = stack[--top];
      await this.start({
        face,
        layers,
        dir: -dir,
        num,
        inStack: true,
      });
      this.onUndoRedoChange && this.onUndoRedoChange(top > 0, true);
    }
  };

  this.redo = async () => {
    if (!this.rotating && top < length) {
      let oper = stack[top++];
      await this.start(oper);
      this.onUndoRedoChange && this.onUndoRedoChange(true, top < length);
    }
  };

  this.reset = () => {
    this.rotating = false;
    top = 0;
    length = 0;
    stack = [];
    this.onUndoRedoChange && this.onUndoRedoChange(false, false);
  };
};
