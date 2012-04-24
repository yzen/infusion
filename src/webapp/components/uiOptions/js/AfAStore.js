/*
Copyright 2009 University of Toronto
Copyright 2011 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid_1_5:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_5 = fluid_1_5 || {};

(function ($, fluid) {

    /****************
     * AfA Store *
     ****************/
     
    /**
     * SettingsStore Subcomponent that uses the GPII Preferences server for persistence, and handles
     * the GPII Access for All settings format.
     */
    fluid.defaults("fluid.afaStore", {
        gradeNames: ["fluid.uiOptions.store", "autoInit"],
        invokers: {
            fetch: {
                funcName: "fluid.afaStore.fetch",
                args: ["{afaStore}.options.userToken", "{afaStore}.options.defaultSiteSettings"]
            },
            save: {
                funcName: "fluid.afaStore.save",
                args: ["{arguments}.0", "{afaStore}.options.userToken"]
            },
            AfAtoUIO: {
                funcName: "fluid.afaStore.AfAtoUIO",
                args: ["{arguments}.0"] // need this?
            },
            UIOtoAfA: {
                funcName: "fluid.afaStore.UIOtoAfA",
                args: ["{arguments}.0"]
            }
        },
        components: {
            prefsStore: {
                type: "",
                options: "fluid.afaStore.gpiiPrefsServer"
            }
        }
    });

    fluid.afaStore.fetch = function (userToken, defaults) {
        var retObj;
        return retObj || defaults;
    };

    fluid.afaStore.save = function (settings, userToken) {
    };

    fluid.afaStore.AfAtoUIO = function (settings) {
        return fluid.model.transformWithRules(settings, [
            fluid.afaStore.flattenCaptionSpecRules,
            fluid.afaStore.AfAtoUIOtransformationRules
        ]);
    };
    
    fluid.afaStore.UIOtoAfA = function (settings) {
        return fluid.model.transformWithRules(settings, fluid.afaStore.UIOtoAfAtransformationRules);
    };

    fluid.afaStore.AfAtoUIOtransformationRules = {
        textFont: {
            expander: {
                type: "fluid.afaStore.transform.valueMapper",
                path: "display.screenEnhancement.fontFace.genericFontFace",
                // TODO: For now, this ignores the actual "fontName" setting
                valueMap: {
                    serif: "times",
                    "sans serif": "verdana",
                    monospaced: "default",
                    fantasy: "default",
                    cursive: "default"
                }
            }
        },
        toc: {
            expander: {
                type: "fluid.model.transform.value",
                path: "control.structuralNavigation.tableOfContents"
            }
        },
        captions: {
            expander: {
                type: "fluid.model.transform.value",
                path: "flatAdaptationPreferences.captions"
            }
        },
        transcripts: {
            expander: {
                type: "fluid.model.transform.value",
                path: "flatAdaptationPreferences.transcripts"
            }
        },
        language: {
            expander: {
                type: "fluid.model.transform.value",
                path: "flatAdaptationPreferences.language"
            }
        }
    };

    fluid.afaStore.flattenCaptionSpecRules = {
        flatAdaptationPreferences: {
            expander: {
                type: "fluid.afaStore.transform.flattenCaptions", 
                path: "content.adaptationPreference"
            }
        },
        display: "display",
        control: "control"
    };
    fluid.afaStore.UIOtoAfAtransformationRules = {
        "display.screenEnhancement.fontFace": {
            expander: {
                type: "fluid.afaStore.transform.valueMapper",
                path: "textFont",
                valueMap: {
                    times: {
                        fontName: ["Times New Roman"],
                        genericFontFace: "serif"
                    },
                    verdana: {
                        fontName: ["Verdana"],
                        genericFontFace: "sans serif"
                    },
                    arial: {
                        fontName: ["Arial"],
                        genericFontFace: "sans serif"
                    },
                    comic: {
                        fontName: ["Comic Sans"],
                        genericFontFace: "sans serif"
                    }
                }
            }
        },
        "control.structuralNavigation.tableOfContents": {
            expander: {
                type: "fluid.model.transform.value",
                path: "toc"
            }
        },
        "content.adaptationPreference.0": {
            expander: {
                type: "fluid.afaStore.transform.afaCaption",
                path: "captions"
            }
        },
        // NB: This will always place transcripts second in the array, even if there are no captions
        "content.adaptationPreference.1": {
            expander: {
                type: "fluid.afaStore.transform.afaTranscript",
                path: "transcripts"
            }
        }
    };

    /*********************
     * Model Transformers
     *********************/
    fluid.registerNamespace("fluid.afaStore.transform");

    /**
     * convert a string value into one of several possible path-value pairs.
     * 'valueMap' maps the string value to the path/value.
     * Note that the value may be an object.
     * NOTE: This does not yet handle recursion or special cases
     */
    fluid.afaStore.transform.valueMapper = function (model, expandSpec, recurse) {
        var val = fluid.get(model, expandSpec.path);
        
        if (typeof(val) !== "undefined") {
            return expandSpec.valueMap[val];
        }
    };
    
    /**
     * Produce a caption AfA adaptationPreference object.
     * This transformer assumes knowledge of the "language" path in the sourc model.
     */
    fluid.afaStore.transform.afaCaption = function (model, expandSpec, recurse) {
        var cap = fluid.get(model, expandSpec.path);
        if (!cap) {
            return {};
        }
        return {
            adaptationType: "caption",
            language: fluid.get(model, "language")
        };
    };

    fluid.afaStore.transform.afaTranscript = function (model, expandSpec, recurse) {
        var tran = fluid.get(model, expandSpec.path);
        if (!tran) {
            return {};
        }
        return {
            representationForm: ["transcript"],
            language: fluid.get(model, "language")
        };
    };
    
    fluid.afaStore.transform.uioCaption = function (model, expandSpec, recurse) {
        var adaptPrefs = fluid.get(model, expandSpec.path);
        if (!adaptPrefs) {
            return {};
        }

        var capSpec;
        for (var i = 0; i < adaptPrefs.length; i++) {
            // find the first caption specification
            if (adaptPrefs[i].adaptationType === "caption") {
                capSpec = adaptPrefs[i];
                break;
            }
        }
        if (!capSpec) {
            return {};
        }
        return true;
    };

    fluid.afaStore.transform.uioCaptionLanguage = function (model, expandSpec, recurse) {
        var adaptPrefs = fluid.get(model, expandSpec.path);
        if (!adaptPrefs) {
            return {};
        }

        var capSpec;
        for (var i = 0; i < adaptPrefs.length; i++) {
            // find the first caption specification
            if (adaptPrefs[i].adaptationType === "caption") {
                capSpec = adaptPrefs[i];
                break;
            }
        }
        if (!capSpec) {
            return {};
        }
        return capSpec.language;
    };
    
    fluid.afaStore.transform.flattenCaptions = function (model,expandSpec, recurse) {
        var adaptPrefs = fluid.get(model, expandSpec.path);
        if (!adaptPrefs) {
            return {};
        }
        result = {};
        fluid.each(adaptPrefs, function (value, key) {
            if (value.adaptationType === "caption" && !result.captions) {
                result.captions = true;
                result.language = value.language;
            } else if (value.representationForm && $.inArray("transcript", value.representationForm)){
                result.transcripts = true;
                if (!result.language) {
                    result.language = value.language;
                }
            }
        });
        return result;
    };
})(jQuery, fluid_1_5);