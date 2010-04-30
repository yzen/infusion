/*global jQuery*/
/*global fluid_0_7*/
/*global __flash__argumentsToXML*/

fluid_0_7 = fluid_0_7 || {};

(function ($, fluid) {
    
    var invokeFlash = function (that, fnName) {
        var xmlArgs = __flash__argumentsToXML(arguments, 2);
        var invocation = that.movie[0].CallFunction("<invoke name='" + 
                                                 fnName + 
                                                 "' returntype='javascript'>" + 
                                                 xmlArgs + 
                                                 "</invoke>");
        return eval(invocation);
    };
    
    var exposeEventsToFlash = function (that) {
        var callbacks = {};
        var id = that.movie.attr("id");
        
        $.each(that.events, function (eventName, firer) {
            callbacks[eventName] = firer.fire;
            that.options.params.flashvars[eventName] = "fluid.flashBridge.callbacks." + id + "." + eventName;
        });
        
        fluid.flashBridge.callbacks[id] = callbacks;
    };
    
    var setupParamsAndProps = function (that) {
        exposeEventsToFlash(that);
        that.options.params.flashvars = fluid.toQueryString(that.options.params.flashvars);
        if ($.browser.msie) {
            that.options.params.movie = that.options.movieURL;
        } else {
            that.options.properties.classid = undefined; // classid is only needed on IE browsers.
            that.options.properties.data = that.options.movieURL;
        }
    };
    
    var renderParamsAndProps = function (that) {
        // We should really only be rendering these if they're not already found in the markup!
        $.each(that.options.properties, function (propName, value) {
            that.movie.attr(propName, value);
        });
        
        $.each(that.options.params, function (paramName, value) {
            that.movie.append("<param name='" + paramName + "' value='" + value + "' />");
        });
    };
    
    var flashObjectRenderer = function (that) {
        var object = $("<object></object>");
        if (that.options.replaceContainer) {
            var containerId = that.container.attr("id");
            that.container.replaceWith(object);
            object.attr("id", containerId);
            that.container = object;
        } else {
            that.container.append(object);
        }
  
        return object;
    };
    
    var setupFlashBridge = function (that) {
        that.movie = that.locate("flashMovie");
        
        // Self-render if necessary.
        if (!that.movie || that.movie.length < 1) {
            that.movie = flashObjectRenderer(that);
        }
        
        fluid.allocateSimpleId(that.movie);
        
        // Add parameters and properties to the markup.
        setupParamsAndProps(that);
        renderParamsAndProps(that);
    };
    
    fluid.flashBridge = function (container, options) {
        var that = fluid.initView("fluid.flashBridge", container, options);
        
        that.invokeFlash = function (fnName) {
            invokeFlash(that, fnName);
        };
        
        setupFlashBridge(that);
        return that;
    };
    
    fluid.flashBridge.callbacks = {};
    
    fluid.defaults("fluid.flashBridge", {
        movieURL: null,
        replaceContainer: false,
        objectRenderer: flashObjectRenderer,
        
        properties: {
            height: 1,
            width: 1,
            type: "application/x-shockwave-flash",
            classid: "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
        },
        
        params: {
            quality: "high",
            allowScriptAccess: "always",
            wMode: "transparent",
            swLiveConnect: true,
            flashvars: {}
        },

        events: {},
        
        selectors: {
            flashMovie: ".flashMovie"
        }
    });
    
})(jQuery, fluid_0_7);
