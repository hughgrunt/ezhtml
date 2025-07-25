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
    static grid = class {
        size = "";
        elements = [];
        constructor(val) {
            this.size = val;
        }
        withSize(value) {
            this.size = value;
            return this;
        }
        withElement(...e) {
            e.forEach(element => { this.elements.push(element) });
            return this;
        }
        build() {
            let grid = document.createElement("div");
            grid.style.display = "grid";
            grid.style.gridTemplateColumns = this.size;
            this.elements.forEach(e => {
                grid.appendChild(e);
            });
            return grid;
        }
    }
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
        add(...children) {
            for (let child of children) {
                this.e().appendChild(child);
            }
        }
        clear() {
            this.inner("");
        }
    };
    static datatable = class {
        withSearch = true;
        withPagination = true;
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
        actions = {}; // buttons with methods for the row data, stored by name so repated calls will replace a butto, usually needed for setting data, so the buttons als updates
        constructor(data) {
            this.data = data;
        }
        clearAction() {
            this.actions = {};
            return this;
        }
        withRowOnClick(fn) {
            this.rowonclick = fn;
            return this;
        }
        withColumn(name, key, render = false, editable = false, on_edit = false) {
            this.columns.push({ name, key, render, editable, on_edit });
            return this;
        }
        withOnEdit(method) {
            this.on_edit = method;
            return this;
        }
        withAction(name, method, renderfn = false, props = {}) {
            this.actions[name] = { name, method, props, renderfn };
            return this;
        }
        withPageSize(pagesize) {
            this.pagesize = pagesize;
            return this;
        }
        withoutSearch() {
            this.withSearch = false;
            return this;
        }
        withoutPagination() {
            this.withPagination = false;
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
            if (this.withSearch) { thead.appendChild(tr_search); }
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
                    (search) => {
                        if (!d[search.key]) {
                            return false;
                        }
                        if (Array.isArray(d[search.key])) {
                            return d[search.key].some(array_value => {
                                return array_value.toLowerCase().includes(search.value.toLowerCase());
                            });
                        }
                        if (typeof d[search.key] === "string") {
                            return d[search.key].toLowerCase().includes(search.value.toLowerCase());
                        }
                        return false;
                    }
                ),
            );
        }
        set_data(data) {
            this.data = data;
            this.search();
            this.draw_data();
        }
        draw_data() {
            this.tbody.innerHTML = "";
            let total_pages = Math.ceil(this.filtered_data.length / this.pagesize);
            if (total_pages <= 1) {
                this.current_page = 1;
            }
            let pagestart = (this.current_page - 1) * this.pagesize;
            let pageend = pagestart + this.pagesize;
            this.filtered_data.slice(pagestart, pageend).forEach((data, index) => {
                let tr = document.createElement("tr");
                // add row onclick if existing
                if (this.rowonclick) {
                    tr.onclick = (e) => this.rowonclick(e, data);
                }
                // draw data columns;
                this.columns.forEach((column) => {
                    let td = document.createElement("td");
                    let value = data[column.key] || "";
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
                            input.onkeydown = (e) => {
                                if (e.key === "Enter") {
                                    input.blur();
                                }
                            };
                            input.onblur = async (e) => {
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
                                            this,
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
                            };
                            td.appendChild(input);
                            input.focus();
                        };
                    }
                    tr.appendChild(td);
                });
                // add actions if defined
                if (Object.keys(this.actions).length > 0) {
                    let td_actions = document.createElement("td");
                    Object.values(this.actions).forEach((action) => {
                        let btn;
                        if (action.renderfn) {
                            btn = action.renderfn(data);
                        }
                        else {
                            btn = document.createElement("button");
                            btn.innerHTML = action.name;
                        }
                        btn.onclick = (e) => {
                            e.stopPropagation();
                            action.method(data, tr, btn, this);
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
            if (this.withPagination) {
                td.appendChild(back);
                td.appendChild(current);
                td.appendChild(next);
            }

            tr.appendChild(td);
            this.tfoot.appendChild(tr);
        }
    };
    static modal = class {
        wrapper;
        wrapper_class = "modal-wrapper";
        window_class = "modal-window";
        close_class = "modal-close";
        id = "modal-wrapper";
        size = { x: "200px", y: "200px" }

        z_index = 99;
        close = {
            default_props: {
            },
            manual_props: {
            }
        }
        divs = {
            top: {
                content: [],
                classlist: [],
                post_content: [],
                props: {}
            },
            center: {
                content: [],
                classlist: [],
                props: {}
            },
            bottom: {
                content: [],
                classlist: [],
                props: {}
            }
        }
        constructor() {

        }
        withZ(value) {
            this.z_index = value;
            return this;
        }
        setContentFor(key, value) {
            if (!this.divs[key]) {
                return;
            }
            this.divs[key].content.push(value);
            return this;
        }
        withTitle(value) {
            if (typeof value === "string") {
                let h1 = document.createElement("h1");
                h1.textContent = value;
                value = h1;
            }
            this.setContentFor("top", value);
            return this;
        }
        withContent(...values) {
            for (let value of values) {
                this.setContentFor("center", value);
            }
            return this;
        }
        withFootnote(value) {
            this.setContentFor("bottom", value);
            return this;
        }
        withOnKill(killfn) {
            this.onkillfn = killfn;
            return this;
        }
        build() {
            // wrapper and modal
            let div_wrapper = document.createElement("div");
            div_wrapper.id = this.id;
            div_wrapper.classList.add(this.wrapper_class);
            this.wrapper = div_wrapper;

            let window = document.createElement("div");
            window.classList.add(this.window_class);
            //window.style.width = this.size.x;
            //window.style.height = this.size.y;

            div_wrapper.appendChild(window);

            // close button
            let close_me = document.createElement("button");
            close_me.style.zIndex = this.z_index + 1;
            close_me.classList.add("modal-close");
            close_me.innerHTML = "schließen";
            close_me.onclick = (e) => {
                this.kill();
            }
            for (let prop in this.close.default_props) {
                close_me[prop] = this.close.default_props[prop];
            }
            for (let prop in this.close.manual_props) {
                close_me[prop] = this.close.manual_props[prop];
            }
            this.divs["top"].content.push(close_me);

            // div parts
            for (let div in this.divs) {
                let d = document.createElement("div");
                d.classList.add(`modal-${div}`);

                this.divs[div].classlist.forEach(c => {
                    d.classList.add(c);
                });
                this.divs[div].content.forEach(c => {
                    if (c instanceof HTMLElement) {
                        d.appendChild(c);
                    }
                    else {
                        d.innerHTML += c;
                    }

                });
                window.appendChild(d);
            }
            document.body.appendChild(this.wrapper);
            return this;
        }
        kill() {
            if (this.onkillfn) {
                this.onkillfn();
            }
            this.wrapper.remove();
        }


    }
}
