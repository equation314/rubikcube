const Rotation = function(onRotate, onRotateStop) {
  this.rotationSpeed = 10;

  this.rotating = false;

  this.update = () => {
    if (!this.rotating) return;
    this.angle += 0.01 * this.rotationSpeed;

    if (this.angle > Math.PI / 2) this.stop();
    else onRotate && onRotate(this.face, this.layers, this.dir, this.angle);
  };

  this.stop = () => {
    this.angle = 0;
    this.rotating = false;
    onRotate && onRotate(this.face, this.layers, this.dir, 0);
    onRotateStop && onRotateStop(this.face, this.layers, this.dir);
  };

  this.start = (face, layers, dir) => {
    if (this.rotating) return;
    this.face = face;
    this.layers = layers;
    this.dir = dir;
    this.rotating = true;
    this.angle = 0;
  };

  this.onKeyDown = event => {
    switch (event.code) {
      case "KeyR":
        this.start(0, [event.ctrlKey ? 1 : 0], event.shiftKey ? -1 : 1);
        break;
      case "KeyL":
        this.start(1, [event.ctrlKey ? 1 : 0], event.shiftKey ? -1 : 1);
        break;
      case "KeyU":
        this.start(2, [event.ctrlKey ? 1 : 0], event.shiftKey ? -1 : 1);
        break;
      case "KeyD":
        this.start(3, [event.ctrlKey ? 1 : 0], event.shiftKey ? -1 : 1);
        break;
      case "KeyF":
        this.start(4, [event.ctrlKey ? 1 : 0], event.shiftKey ? -1 : 1);
        break;
      case "KeyB":
        this.start(5, [event.ctrlKey ? 1 : 0], event.shiftKey ? -1 : 1);
        break;
    }
  };

  window.addEventListener("keydown", this.onKeyDown, false);
};
