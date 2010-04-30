/*
Copyright 2008-2009 University of Cambridge
Copyright 2008-2009 University of Toronto
Copyright 2008-2009 University of California, Berkeley

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

/*global jQuery*/
/*global fluid*/
/*global jqUnit*/

fluid.testUtils = fluid.testUtils || {};

fluid.demands("fluid.testUtils.testComponent2", "fluid.testUtils.testComponent", 
    ["{testComponent}.container", 
   {"default1": "{testComponent}.options.default1"}]);
   
fluid.demands("fluid.reorderer.gridReorderer", "fluid.reorderer",
    ["{that}.container",
    {"orientation": "{gridReorderer.orientation}"}]);

fluid.defaults("fluid.testUtils.testComponent", {
    default1: "testComponent value",
    components: {
        test2: {
            type: "fluid.testUtils.testComponent2",
            options: {
                value: "Original default value"
            }
        }
    }
});

fluid.makeComponents({
    "fluid.testUtils.testComponent":   "fluid.standardComponent",
    "fluid.testUtils.testComponent2":  "fluid.standardComponent",
    "fluid.testUtils.testOrder":       "fluid.standardComponent", 
    "fluid.testUtils.subComponent":    "fluid.standardComponent",
    "fluid.testUtils.invokerComponent":"fluid.littleComponent"});

fluid.defaults("fluid.testUtils.testComponent2", {
    components: {
        sub1: {
          type: "fluid.testUtils.subComponent",
        },
        sub2: {
          type: "fluid.testUtils.subComponent",
          options: {
              value: "Subcomponent 2 default"
          }
        }
    }});
    
fluid.defaults("fluid.testUtils.invokerComponent", {
    template: "Every {0} has {1} {2}(s)",
    invokers: {
        render: {
            funcName: "fluid.formatMessage",
            args:["{invokerComponent}.options.template", "@0"] 
        }
    },
    events: {
        testEvent: null
    }
});
    
fluid.demands("sub1", "fluid.testUtils.testComponent2",
["{testComponent2}.container", {"crossDefault": "{testComponent2}.sub2.options.value"}]
);

fluid.demands("sub2", "fluid.testUtils.testComponent2",
["{testComponent2}.container", fluid.COMPONENT_OPTIONS]);

(function ($) {
    $(document).ready(function () {
        fluid.logEnabled = true;
        
        var fluidIoCTests = new jqUnit.TestCase("Fluid IoC Tests");

        fluidIoCTests.test("construct", function() {
            expect(2);
            var that = fluid.testUtils.testComponent("#pager-top", {});
            jqUnit.assertValue("Constructed", that);
            jqUnit.assertEquals("Value transmitted", "testComponent value", that.test2.options.default1);
        });

        fluidIoCTests.test("crossConstruct", function() {
            expect(2);
            var that = fluid.testUtils.testComponent2("#pager-top", {});
            jqUnit.assertValue("Constructed", that);
            jqUnit.assertEquals("Value transmitted", "Subcomponent 2 default", that.sub1.options.crossDefault);
        });
        
        fluidIoCTests.test("invokers", function() {
            expect(2);
            var that = fluid.testUtils.invokerComponent();
            jqUnit.assertValue("Constructed", that);
            jqUnit.assertEquals("Rendered", "Every CATT has 4 Leg(s)", 
                that.render(["CATT", "4", "Leg"]));
        });
        
    });
})(jQuery);
