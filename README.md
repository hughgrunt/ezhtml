### ezhtml - Simple class for handling some standard DOM actions i kinda always need

1. #### Element-Creation
   1. ### ezhtml.create(tagname, props={}, ...children;
      Example:
      let div = ezhtml.create("div", {}, ezhtml.create("button", {innerHTML:"i am a button"}));
   2. ### ezhtml.build("div").withText("hallo").withProp("someprop", "somevalue").e();
      #### only e() returns the element
      current methods:
        1. constructor(String element_tag)
        2. withProp(String prop, String value)
             assigns value to the element property
        3. withText(String value)
           sets textContent with value
        4. withInner(String value)
           sets innerHTML with value
        5. withChild(HTMLObject child)
           appends child to element
        7. e()
           returns the HTML element
2. ### Element-Tracking
   let target_element = new ezhtml.element("id_or_class");
   current features:
     1. constructor(String element_tag)
     2. id()
        returns the element_id
    3. e()
        returns the HTML element
     4. inner(String value)
        sets innerHTML with value
     5. add_child(HTMLObject child)
        appends child to element
     6. clear()
        sets innerHTML to an empty string
3. #### Data-Table
  Example initialization:
  let table = new ezhtml.datatable(data)
              .withColumn(<br>
                "Titel", // heading of the column<br>
                "title", // data key of the column represented in ata<br>
                (value, data)=>"custom render "+ value, //custom render function<br>
                true, // if you can edit the column<br>
                (data, key, newvalue)=>{console.log(`${key} has ben edited of entry ${JSON.stringify(data) with new value ${newvalue});return true;} // handle editing data<br>
              );
  current methods:
    1. withColumn(String label, String datakey, custom_render_function (value,data)=>{}, boolean isEditable, on_edit_function (data, key, newvalue)=>{});
      only if on_edit_function returns true it will apply the change to the cell
    2. withRowOnClick(function (e, rowdata) =>{ //handle rowdata and/or rowelement ... }
    3. withAction(String name, method (rowdata, tr_element, btn_element)=>{// handle on action button}, props)
      if actions > 0, a column with the action buttons will get added
    4. withPageSize(int value)
      set page size meaning results per page


