const Rotation = function(_onRotate, _onRotateStop) {
  const ROTATION_SPEED = 50;

  this.rotating = false;

  this.update = () => {
    if (!this.rotating) return;

    this.angle += 0.1 * this.dir;
    let delta = (this.dstAngle - this.angle) * this.dir;

    if (delta <= 0) this.stop();
    else _onRotate && _onRotate(this.face, this.layers, this.angle);
  };

  this.stop = () => {
    this.angle = 0;
    this.rotating = false;
    clearInterval(this.timer);
    _onRotate && _onRotate(this.face, this.layers, 0);
    this.onStop && this.onStop(this.face, this.layers, this.dir);
  };

  this.start = (
    face,
    layers,
    dir,
    srcAngle = 0,
    dstAngle = dir * (Math.PI / 2),
    onStop = _onRotateStop
  ) => {
    if (this.rotating) return;
    return new Promise((resolve, reject) => {
      this.face = face;
      this.layers = layers;
      this.dir = dir || (srcAngle < dstAngle ? 1 : -1);
      this.rotating = true;
      this.angle = srcAngle;
      this.dstAngle = dstAngle;
      this.onStop = onStop;
      this.timer = setInterval(() => {
        this.update();
        if (!this.rotating) resolve();
      }, 1000 / ROTATION_SPEED);
    });
  };

  this.onKeyDown = event => {
    const key2face = {
      KeyF: 0,
      KeyR: 1,
      KeyB: 2,
      KeyL: 3,
      KeyU: 4,
      KeyD: 5,
    };
    if (key2face[event.code] !== undefined)
      this.start(key2face[event.code], [event.ctrlKey ? 1 : 0], event.shiftKey ? -1 : 1);
  };

  window.addEventListener('keydown', this.onKeyDown, false);
};
