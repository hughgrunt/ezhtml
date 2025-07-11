class ezhtml {
  static create(tag, props = {}, ...children) {
    let e = document.createElement(tag);
    for (let prop in props) {
      e[prop] = props[prop];
    }
    for (let child of children) {
      e.appendChild(child);
    }
    return e;
  }
  static build = class {
    element;
    constructor(tag) {
      this.element = document.createElement(tag);
    }
    withProp(prop, value) {
      this.element[prop] = value;
      return this;
    }
    withText(value) {
      return this.withProp("textContent", value);
    }
    withInner(value) {
      return this.withProp("innerHTML", value);
    }
    withChild(child) {
      this.element.appendChild(child);
      return this;
    }
    e() {
      return this.element;
    }
  };
  static element = class {
    element_id;
    element_reference = null;
    constructor(element_id) {
      this.element_id = element_id;
    }
    id() {
      return this.element_id;
    }
    e() {
      if (
        !this.element_reference ||
        !document.body.contains(this.element_reference)
      ) {
        this.element_reference = document.querySelector(
          `#${this.element_id},.${this.element_id}`,
        );
      }
      return this.element_reference;
    }
    inner(value) {
      this.e().innerHTML = value;
    }
    add_child(child) {
      this.e().appendChild(child);
    }
    clear() {
      this.clear("");
    }
  };
}
