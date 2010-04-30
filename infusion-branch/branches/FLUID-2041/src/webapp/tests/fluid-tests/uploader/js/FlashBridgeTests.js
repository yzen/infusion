/*global jQuery, fluid, jqUnit*/

(function ($) {
    $(document).ready(function () {  
        var flashBridgeTests = new jqUnit.TestCase("Flash Bridge Tests");

        flashBridgeTests.test("Don't self-render", function () {
            var bridge = fluid.flashBridge("#existingMarkup");
            var container = $("#existingMarkup");
            jqUnit.assertEquals("The component container should still be in the DOM.", 1, container.length);
            jqUnit.assertEquals("The object tag should remain in the DOM", 1, container.find("object").length);
            jqUnit.assertNotUndefined("The object tag should have been given an id.", container.find("object").attr("id"));
        });
        
        flashBridgeTests.test("Self render: don't replace container", function () {
            var bridge = fluid.flashBridge("#selfRender");
            var container = $("#selfRender");
            jqUnit.assertEquals("The component container should still be in the DOM.", 1, container.length);
            
            var object = container.find("object");
            jqUnit.assertEquals("The container should have an object tag inside it.", 1, object.length);
        });
        
        flashBridgeTests.test("Self render: replace container", function () {
            var bridge = fluid.flashBridge("#selfRender", {
                replaceContainer: true
            });
            
            var container = $("div#selfRender");
            jqUnit.assertEquals("The component container should not be in the DOM anymore.", 0, container.length);
            
            var object = $("object#selfRender");
            jqUnit.assertEquals("The container should have been replaced by an object tag and its id should be preserved.", 
                                1, object.length);
        });
        
        flashBridgeTests.test("Parameter rendering", function () {
            // Test the defaults.
            var bridge = fluid.flashBridge("#selfRender", {
                replaceContainer: true
            });
            
            jqUnit.assertEquals("The quality param should have been set.", 
                               "high", 
                               bridge.container.find("param[name=quality]").attr("value"));
                               
            jqUnit.assertEquals("The allowScriptAccess param should have been set.", 
                                "always", 
                                bridge.container.find("param[name=allowScriptAccess]").attr("value"));
                                
            jqUnit.assertEquals("The wMode param should have been set.", 
                                "transparent", 
                                bridge.container.find("param[name=wMode]").attr("value"));
                                
            jqUnit.assertEquals("The swfLiveConnect param should have been set.", 
                                "true", 
                                bridge.container.find("param[name=swLiveConnect]").attr("value"));
                                
            jqUnit.assertEquals("The flashVars param should be empty.", 
                                "", 
                                bridge.container.find("param[name=flashvars]").attr("value"));  
                                
            // Now try overriding a parameter.
            bridge = fluid.flashBridge("#selfRender", {
                replaceContainer: true,
                params: {
                    wMode: "window",
                    foo: "bar"
                }
            });
            
            jqUnit.assertEquals("The allowScriptAccess param should have the default value.", 
                                "always", 
                                bridge.container.find("param[name=allowScriptAccess]").attr("value"));
                                
            jqUnit.assertEquals("The wMode param should have been set to a custom value.", 
                                "window", 
                                bridge.container.find("param[name=wMode]").attr("value"));
                                
            jqUnit.assertEquals("Additional parameters should also be rendered", 
                                "bar", 
                                bridge.container.find("param[name=foo]").attr("value"));
        });
        
        flashBridgeTests.test("Event exposure", function () {
            var wasOnLoadCalled = false;
            var wasOnFooCalled = false;
            
            bridge = fluid.flashBridge("#selfRender", {
                replaceContainer: true,
                events: {
                    onLoad: null,
                    onFoo: null
                },
                listeners: {
                    onLoad: function () {
                        wasOnLoadCalled = true;
                    },
                    onFoo: function () {
                        wasOnFooCalled = true;
                    }
                }
            });
            
            var flashvars = bridge.container.find("param[name=flashvars]").attr("value");
            var eventSegments = flashvars.split("&");
            var onLoadCallbackPath = eventSegments[0].split("=")[1];
            var onFooCallbackPath = eventSegments[1].split("=")[1];
            
            jqUnit.assertEquals("The flashVars param should expose the event names to Flash.", 
                                "onLoad=fluid.flashBridge.callbacks.selfRender.onLoad&onFoo=fluid.flashBridge.callbacks.selfRender.onFoo", 
                                flashvars);
                                
            // Ensure that the event is globally callable.
            fluid.invokeGlobalFunction(onLoadCallbackPath);
            jqUnit.assertTrue("The onLoad callback should have been invoked.", wasOnLoadCalled);
            jqUnit.assertFalse("The onFoo callback should not have been invoked.", wasOnFooCalled);
            fluid.invokeGlobalFunction(onFooCallbackPath);
            jqUnit.assertTrue("The onFoo callback should have been invoked.", wasOnFooCalled);
        });
        
        flashBridgeTests.test("Flash URL", function () {
            var url = "file:///foo/bar.swf";
            var bridge = fluid.flashBridge("#selfRender", {
                replaceContainer: true,
                movieURL: url
            });
            
            if ($.browser.msie) {
                var movieParam = bridge.container.find("param[name=movie]");
                jqUnit.assertEquals("In IE, the movie URL should have been added as a param element.", 1, movieParam.length);
                jqUnit.assertEquals("The movieURL should have been specified correctly.", url, movieParam.attr("value"));
            } else {
                jqUnit.assertEquals("In non-IE browsers, the movieURL should have been specified as a 'data' attribute on the object.",
                                    url, bridge.container.attr("data"));
            }
        });
    });
})(jQuery);
