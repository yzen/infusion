/*
Copyright 2007-2009 University of Cambridge
Copyright 2007-2009 University of Toronto
Copyright 2007-2009 University of California, Berkeley

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

// Declare dependencies.
/*global jQuery */

var fluid_1_2 = fluid_1_2 || {};
var fluid = fluid || fluid_1_2;

(function ($, fluid) {
    
    var inCreationMarker = "__CURRENTLY_IN_CREATION__";
    
    findMatchingComponent = function(that, visitor, except) {
       for (var name in that) {
           var component = that[name];
           if (component === except || !component.typeName) {continue;}
           if (visitor(component, name)) {
               return true;
           }
           findMatchingComponent(component, visitor);
        }
    };
    
    // thatStack contains an increasing list of MORE SPECIFIC thats.
    visitComponents = function(thatStack, visitor) {
        var lastDead;
        for (var i = thatStack.length - 1; i >= 0; -- i) {
            var that = thatStack[i];
            if (that.options && that.options.fireBreak) { // TODO: formalise this
               return;
            }
            if (that.typeName) {
                if (visitor(that, "")) {
                    return;
                }
            }
            if (findMatchingComponent(that, visitor, lastDead)) {
                return;
            }
            lastDead = that;
        }
    };
    
    function getValueGingerly(thatStack, component, segs, ind) {
        var thisSeg = segs[ind];
        var atval = thisSeg === ""? component: component[thisSeg];
        if (atval) {
            if (atval[inCreationMarker]) {
                fluid.fail("Component of type " + 
                atval.typeName + " cannot be used for lookup of path " + segs.join(".") +
                " since it is still in creation. Please reorganise your dependencies so that they no longer contain circular references");
            }
        }
        else {
            if (component.options.components && component.options.components[thisSeg]) {
                fluid.initDependent(component, thisSeg, thatStack);
                atval = component[thisSeg];
            }
            else {
                fluid.fail("Could not resolve reference segment \"" + thisSeg + 
                "\" within component of type " + component.typeName);
            }
        }
        if (ind === segs.length - 1) {
            return atval;
        }
        else {
            return getValueGingerly(thatStack, atval, segs, ind + 1);
        }
    };
    
    fluid.resolveReference = function(thatStack, reference) {
        var path = reference;
        var context = "";
        if (reference.charAt(0) === "{") {
            var endcpos = reference.indexOf("}");
            if (endcpos === -1) {
                fluid.fail("Malformed context reference without }");
            }
            var context = reference.substring(1, endcpos);
            path = reference.substring(endcpos + 1);
        }
        if (path.indexOf("that") === 0) {
            path = path.substring(4);
        }
        if (path.charAt(0) === ".") {
            path = path.substring(1);
        }
        var foundComponent;
        visitComponents(thatStack, function(component, name) {
            if (context === name || context === component.typeName || context === component.nickName) {
                foundComponent = component;
                return true; // YOUR VISIT IS AT AN END!!
            }
        });
        if (!foundComponent) {
            fluid.fail("No context matched for name " + context + " from root of type " + that.typeName);
        }
        return getValueGingerly(thatStack, foundComponent, fluid.model.parseEL(path), 0);
    };
    
    function resolveRvalue(thatStack, arg, initArgs, options) {
        if (arg !== fluid.COMPONENT_OPTIONS) {
            if (arg.charAt(0) === "@") {
                var argpos = arg.substring(1);
                arg = initArgs[argpos];
            }
            else {
                arg = fluid.resolveReference(thatStack, arg);
            }
        }
        else {
            arg = options;
        }
        return arg;
    }
    
    
    /** Given a concrete argument list and/or options, determine the final concrete
     * "invocation specification" which is coded by the supplied demandspec in the 
     * environment "thatStack" - the return is a package of concrete global function name
     * and argument list which is suitable to be executed directly by fluid.invokeGlobalFunction.
     */
    fluid.embodyDemands = function(thatStack, demandspec, initArgs, options) {
        var demands = demandspec.args;
        if (demands) {
            var args = [];
            for (var i = 0; i < demands.length; ++ i) {
                var arg = demands[i];
                if (typeof(arg) === "object" && !fluid.isMarker(arg)) {
                    var options = {};
                    for (key in arg) {
                        var ref = arg[key];
                        var rvalue = resolveRvalue(thatStack, ref, initArgs, options);
                        fluid.model.setBeanValue(options, key, rvalue);
                    }
                    args[i] = options;
                }
                else{
                    var arg = resolveRvalue(thatStack, arg, initArgs, options);
                    args[i] = arg;
                }
            }
        }
        else {
            args = initArgs? initArgs: [];
        }

        var togo = {
            args: args,
            funcName: demandspec.funcName
        };
        return togo;
    } 
    /** Determine the appropriate demand specification held in the fluid.demands environment 
     * relative to "thatStack" for the function name(s) funcNames.
     */
    fluid.determineDemands = function (thatStack, funcNames) {
        var that = thatStack[thatStack.length - 1];
        var funcNames = $.makeArray(funcNames);
        var demandspec = fluid.locateDemands(funcNames, thatStack);
        if (!demandspec) {
            demandspec = {};
        }
        if (demandspec.funcName) {
            funcNames[0] = demandspec.funcName;
            var demandspec2 = fluid.fetchDirectDemands(funcNames[0], that.typeName);
            if (demandspec2) {
                demandspec = demandspec2; // follow just one redirect
            }
        }
        return {funcName: funcNames[0], args: demandspec.args};
    };
    
    fluid.resolveDemands = function (thatStack, funcNames, initArgs, options) {
        var demandspec = fluid.determineDemands(thatStack, funcNames);
        return fluid.embodyDemands(thatStack, demandspec, initArgs, options);
    };
    
    /** The identity function, which returns its argument(s) unchanged. Useful in some
     * wiring scenarios.
     */
    fluid.identity = function() {
        if (arguments.length < 2) {
            return arguments[0];
        }
        else return $.makeArray(arguments);
    }
    
    // fluid.invoke is not really supportable as a result of thatStack requirement - 
    // fluid.bindInvoker is recommended instead
    fluid.invoke = function(that, functionName, args, environment) {
        var invokeSpec = fluid.resolveDemands($.makeArray(that), functionName, args);
        return fluid.invokeGlobalFunction(invokeSpec.funcName, invokeSpec.args, environment);
    };
    
    fluid.makeInvoker = function(thatStack, demandspec, functionName, environment) {
        var demandspec = demandspec || fluid.determineDemands(thatStack, functionName);
        thatStack = $.makeArray(thatStack); // take a copy of this since it will most likely go away
        return function() {
            var invokeSpec = fluid.embodyDemands(thatStack, demandspec, arguments);
            return fluid.invokeGlobalFunction(invokeSpec.funcName, invokeSpec.args, environment);
        };
    }
    
    fluid.addBoiledListener = function(thatStack, eventName, listener, namespace, predicate) {
        var thatStack = $.makeArray(thatStack);
        var topThat = thatStack[thatStack.length - 1];
        topThat.events[eventName].addListener(function(args) {
            var resolved = fluid.resolveDemands(thatStack, eventName, args);
            listener.apply(null, resolved.args);
        }, namespace, predicate);
    };
    
    var dependentStore = {};
    
    function composeDemandKey(demandingName, contextName) {
        return demandingName + "|" + contextName;
    }
    
    fluid.demands = function(demandingName, contextName, spec) {
        if (spec.length) {
            spec = {args: spec};
        }
        dependentStore[composeDemandKey(demandingName, contextName)] = spec;
    };
    
    fluid.fetchDirectDemands = function(demandingName, contextName) {
        return dependentStore[composeDemandKey(demandingName, contextName)];
    };
    
    fluid.locateDemands = function(demandingNames, thatStack) {
        var demands;
        visitComponents(thatStack, function(component) {
            for (var i = 0; i < demandingNames.length; ++ i) {
                demands = fluid.fetchDirectDemands(demandingNames[i], component.typeName);
                if (demands) {
                    return true;
                }
            }
        });
        return demands;
    };
    
    fluid.initDependent = function(that, name, thatStack) {
        if (!that) { return; }
        var component = that.options.components[name];
        var invokeSpec = fluid.resolveDemands(thatStack, [component.type, name], [], component.options);
        var instance = fluid.initSubcomponentImpl(that, {type: invokeSpec.funcName}, invokeSpec.args);
        if (instance) { // TODO: more fallibility
            that[name] = instance;
        }
    };
        
    fluid.initDependents = function(that) {
        var options = that.options;
        that[inCreationMarker] = true;
        var root = fluid.invoke(fluid.environmentalRoot, "fluid.threadLocal");
        var thatStack = root["fluid.initDependents"];
        if (!thatStack) {
            thatStack = [that];
            root["fluid.initDependents"] = thatStack;
        }
        else {
            thatStack.push(that);
        }
        try {
            var components = options.components || {};
            for (var name in components) {
                fluid.initDependent(that, name, thatStack);
            }
            var invokers = options.invokers || {};
            for (var name in invokers) {
                var invokerec = invokers[name];
                var funcName = typeof(invokerec) === "string"? invokerec : null;
                that[name] = fluid.makeInvoker(thatStack, funcName? null : invokerec, funcName);
            }
        }
        finally {
            thatStack.pop();
            delete that[inCreationMarker];
        }
    };
    
    // Standard Fluid component types
    
    fluid.typeTag = function(name) {
        return {
            typeName: name
        };
    };
    
    fluid.standardComponent = function(name) {
        return function(container, options) {
            var that = fluid.initView(name, container, options);
            fluid.initDependents(that);
            return that;
        };
    };
    
    fluid.littleComponent = function(name) {
        return function(options) {
            var that = fluid.initLittleComponent(name, options);
            fluid.initDependents(that);
            return that;
        };
    };
    
    fluid.makeComponents = function(components, env) {
        if (!env) {
            env = fluid.environment;
        }
        for (var name in components) {
            fluid.model.setBeanValue({}, name, 
               fluid.invokeGlobalFunction(components[name], [name], env), env);
        }
    };
    
    
    // Definitions to operate ThreadLocals
    
    var singleThreadLocal = {};
    
    fluid.singleThreadLocal = function() {
        return singleThreadLocal;
    };
    
    // MOVE TO env2.js
    var rhinoThreadLocal; 
    
    fluid.rhinoThreadLocal = function() {
        if (!rhinoThreadLocal) {
            rhinoThreadLocal = new java.ThreadLocal();
        }
        var togo = rhinoThreadLocal.get();
        if (!togo) {
            togo = {};
            rhinoThreadLocal.set(togo);
        }
        return togo;
    }
    
    fluid.environmentalRoot = {};
    
    fluid.environmentalRoot.environmentClass = fluid.typeTag("fluid.browser");
    
    // fluid.environmentalRoot.environmentClass = fluid.typeTag("fluid.rhino");
    
    fluid.demands("fluid.threadLocal", "fluid.browser", {funcName: "fluid.singleThreadLocal"});
    fluid.demands("fluid.threadLocal", "fluid.rhino", {funcName: "fluid.rhinoThreadLocal"});
    
})(jQuery, fluid_1_2);
    