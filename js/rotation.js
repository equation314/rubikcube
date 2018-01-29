const Rotation = function(rotateFunc) {
  this.rotationSpeed = 10;

  this.rotating = false;

  this.update = () => {
    this.angle += 0.01 * this.rotationSpeed;
    if (this.rotating)
      rotateFunc(
        this.face,
        this.layers,
        this.angle > Math.PI / 2 ? 0 : this.angle,
        this.dir
      );
    if (this.angle > Math.PI / 2) this.stop();
  };

  this.stop = () => {
    this.angle = 0;
    this.rotating = false;
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
        this.start(0, [0], event.shiftKey ? -1 : 1);
        break;
      case "KeyL":
        this.start(1, [0], event.shiftKey ? -1 : 1);
        break;
      case "KeyU":
        this.start(2, [0], event.shiftKey ? -1 : 1);
        break;
      case "KeyD":
        this.start(3, [0], event.shiftKey ? -1 : 1);
        break;
      case "KeyF":
        this.start(4, [0], event.shiftKey ? -1 : 1);
        break;
      case "KeyB":
        this.start(5, [0], event.shiftKey ? -1 : 1);
        break;
    }
  };

  window.addEventListener("keydown", this.onKeyDown, false);
};
