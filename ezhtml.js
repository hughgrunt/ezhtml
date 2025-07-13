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
      this.inner("");
    }
  };
  static datatable = class {
    data;
    filtered_data = [];
    current_page = 1;
    pagesize = 3;
    searches = {};
    columns = []; //{name:"name", key:"key"}
    table;
    thead;
    tbody;
    tfoot;
    rowonclick;
    actions = []; // buttons with methods for the row data
    constructor(data) {
      this.data = data;
    }
    withRowOnClick(fn) {
      this.rowonclick = fn;
      return this;
    }
    withColumn(name, key, render = false, editable = false, on_edit = false) {
      this.columns.push({ name, key, render, editable, on_edit });
      return this;
    }
    withAction(name, method, props = {}) {
      this.actions.push({ name, method, props });
      return this;
    }
    withPageSize(pagesize) {
      this.pagesize = pagesize;
      return this;
    }
    build() {
      let table = document.createElement("table");
      let thead = document.createElement("thead");
      let tbody = document.createElement("tbody");
      let tfoot = document.createElement("tfoot");
      table.appendChild(thead);
      table.appendChild(tbody);
      table.appendChild(tfoot);

      // headings, search
      let tr_headings = document.createElement("tr");
      let tr_search = document.createElement("tr");
      this.columns.forEach((column) => {
        let heading = document.createElement("th");
        heading.textContent = column.name;
        tr_headings.appendChild(heading);

        let th_input = document.createElement("th");
        let input = document.createElement("input");
        input.type = "search";
        input.placeholder = `suche in ${column.name}`;
        input.oninput = (e) => {
          this.update_searches(e.target, column);
          this.search();
          this.draw_data();
        };
        th_input.appendChild(input);
        tr_search.appendChild(th_input);
      });
      if (this.actions.length > 0) {
        let th = document.createElement("th");
        th.textContent = "actions";
        tr_headings.appendChild(th);
        tr_search.appendChild(document.createElement("th"));
      }
      thead.appendChild(tr_headings);
      thead.appendChild(tr_search);
      this.table = table;
      this.thead = thead;
      this.tbody = tbody;
      this.tfoot = tfoot;
      this.filtered_data = this.data;
      this.draw_data();
      return table;
    }
    update_searches(input, column) {
      column.value = input.value;
      if (column.value === "") {
        delete this.searches[column.name];
        return;
      }
      this.searches[column.name] = column;
    }
    search() {
      if (Object.keys(this.searches).length == 0) {
        this.filtered_data = this.data;
        return;
      }
      this.filtered_data = this.data.filter((d) =>
        Object.values(this.searches).every(
          (search) =>
            d[search.key] &&
            d[search.key].toLowerCase().includes(search.value.toLowerCase()),
        ),
      );
    }
    draw_data() {
      this.tbody.innerHTML = "";
      let total_pages = Math.ceil(this.filtered_data.length / this.pagesize);
      if (total_pages <= 1) {
        this.current_page = 1;
      }
      let pagestart = (this.current_page - 1) * this.pagesize;
      let pageend = pagestart + this.pagesize;
      this.filtered_data.slice(pagestart, pageend).forEach((data) => {
        let tr = document.createElement("tr");
        // add row onclick if existing
        if (this.rowonclick) {
          tr.onclick = (e) => this.rowonclick(e, data);
        }
        // draw data columns;
        this.columns.forEach((column) => {
          let td = document.createElement("td");
          let value = data[column.key];
          if (column.render) {
            td.innerHTML = column.render(value, data);
          } else {
            td.textContent = value;
          }
          if (column.editable) {
            td.ondblclick = async () => {
              if (td.querySelector("input")) return;
              td.innerHTML = "";
              let input = document.createElement("input");
              input.type = "text";
              input.value = data[column.key];
              input.onblur = input.onkeydown = async (e) => {
                if (
                  e.type === "blur" ||
                  (e.type === "keydown" && e.key === "Enter")
                ) {
                  let new_value = e.target.value;
                  let render_value = value;
                  if (new_value !== value) {
                    let on_edit_method = column.on_edit || this.on_edit;
                    let success = true;
                    if (on_edit_method) {
                      success = await on_edit_method(
                        data,
                        column.key,
                        new_value,
                      );
                    }
                    if (success) {
                      data[column.key] = new_value;
                      render_value = new_value;
                    }
                  }
                  td.innerHTML = column.render
                    ? column.render(render_value, data)
                    : render_value;
                }
              };
              td.appendChild(input);
              input.focus();
            };
          }
          tr.appendChild(td);
        });
        // add actions if defined
        if (this.actions.length > 0) {
          let td_actions = document.createElement("td");
          this.actions.forEach((action) => {
            let btn = document.createElement("button");
            btn.innerHTML = action.name;
            btn.onclick = (e) => {
              e.stopPropagation();
              action.method(data, tr, btn);
            };
            td_actions.appendChild(btn);
          });
          tr.appendChild(td_actions);
        }

        this.tbody.appendChild(tr);
      });
      this.draw_pagination();
    }
    draw_pagination() {
      this.tfoot.innerHTML = "";
      let total_pages = Math.ceil(this.filtered_data.length / this.pagesize);
      let tr = document.createElement("tr");

      let td = document.createElement("td");
      td.colSpan = this.columns.length;

      let back = document.createElement("button");
      back.textContent = "<";
      back.disabled = this.current_page === 1;
      back.onclick = () => {
        if (this.current_page > 1) {
          this.current_page--;
          this.draw_data();
        }
      };

      let current = document.createElement("button");
      current.textContent = this.current_page;
      current.disabled = true;
      current.style.fontWeight = "bold";

      let next = document.createElement("button");
      next.textContent = ">";
      next.disabled = this.current_page === total_pages;
      next.onclick = () => {
        if (this.current_page < total_pages) {
          this.current_page++;
          this.draw_data();
        }
      };
      td.appendChild(back);
      td.appendChild(current);
      td.appendChild(next);
      tr.appendChild(td);
      this.tfoot.appendChild(tr);
    }
  };
}
