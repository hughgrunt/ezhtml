simple class for handling html dom actions

two ways for creating:
1. ezhtml.create(tagname, props={}, ...children);
2. ezhml.build("div").withText("hallo").withProp("someProp", "somepropvalue").e();

example for 1:
let table = ezhtml.create("table",{},
                        ezhtml.create("tr",{},
                          ezhtml.create("td",{textContent:"columne"}),
                          ezhtml.create("td", {textContent:"column2"})
                          )
            );
and so on...

also you can kinda remember an element and call it more convienient for inner and appendingChild like this:
let div_somename = ezhtml.element("elementid_or_classname"); // will always return the first so take care for using it
div_somename.inner("some inner text");
div_somename.append_child(somechild);

div_somename.clear(); // clears it 

div_someone.e(); // will return the element reference


