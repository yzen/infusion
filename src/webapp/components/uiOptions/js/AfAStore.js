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
                args: ["{afaStore}"]
            },
            save: {
                funcName: "fluid.afaStore.save",
                args: ["{arguments}.0", "{afaStore}"]
            },
            AfAtoUIO: {
                funcName: "fluid.afaStore.AfAtoUIO",
                args: ["{arguments}.0", "{afaStore}"]
            },
            UIOtoAfA: {
                funcName: "fluid.afaStore.UIOtoAfA",
                args: ["{arguments}.0", "{afaStore}"]
            }
        },
        events: {
            rulesReady: null
        },
        prefsServerURL: "http://localhost:8080/store/",
        userToken: "123"
    });

    fluid.afaStore.getServerURL = function (prefsServerURL, userToken) {
        return prefsServerURL + userToken;
    };
    
    fluid.afaStore.fetch = function (that) {
        $.get(fluid.afaStore.getServerURL(that.options.prefsServerURL, that.options.userToken), function (data) {
            that.originalPrefs = data;
            
            that.events.settingsReady.fire($.extend(true, {}, that.options.defaultSiteSettings, that.AfAtoUIO(data)));
        });
    };

    fluid.afaStore.save = function (settings, that) {
        $.ajax({
            url: fluid.afaStore.getServerURL(that.options.prefsServerURL, that.options.userToken),
            type: "POST",
            data: JSON.stringify(that.UIOtoAfA(settings)),
            headers: {
                "Accept": "application/json",
                "Content-type": "application/json"
            }
        });
    };

    fluid.afaStore.AfAtoUIO = function (settings, that) {
        return fluid.model.transformWithRules(settings, [
            fluid.afaStore.AfAtoUIOAdaptPrefRules,
            fluid.afaStore.AfAtoUIOrules
        ]);
    };
    
    fluid.afaStore.UIOtoAfA = function (settings, that) {
        return fluid.model.transformWithRules(settings, fluid.afaStore.UIOtoAfArules);
    };

    /**********************************************
     * Model Transformers
     **********************************************/
    fluid.registerNamespace("fluid.afaStore.transform");

    /**
     * convert a string value into one of several possible path-value pairs.
     * 'valueMap' maps the string value to the path/value.
     * Note that the value may be an object.
     * NOTE: This does not yet handle recursion or special cases
     */
    fluid.afaStore.transform.valueMapper = function (model, expandSpec, recurse) {
        var val = fluid.get(model, expandSpec.path);
        
        if (typeof val !== "undefined") {
            return expandSpec.valueMap[val];
        }
    };
    
    /**
     * Produce a caption AfA adaptationPreference object.
     * This transformer assumes knowledge of the "language" path in the source model.
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

    /**
     * Produce a transcript AfA adaptationPreference object.
     * This transformer assumes knowledge of the "language" path in the source model.
     */
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
    
    /**
     * Intermediate process: flatten the array of adaptationPreferences
     */
    fluid.afaStore.transform.flattenAdaptPrefs = function (model, expandSpec, recurse) {
        var adaptPrefs = fluid.get(model, expandSpec.path);
        if (!adaptPrefs) {
            return {};
        }
        var result = {};
        fluid.each(adaptPrefs, function (value, key) {
            if (value.adaptationType === "caption" && !result.captions) {
                result.captions = true;
                result.language = value.language;
            } else if (value.representationForm && $.inArray("transcript", value.representationForm) !== -1) {
                result.transcripts = true;
                if (!result.language) {
                    result.language = value.language;
                }
            }
        });
        return result;
    };
    
    var baseDocumentFontSize = function () {
        return parseFloat($("html").css("font-size")); // will be the float # of pixels
    };

    /**
     * 
     */
    fluid.afaStore.transform.fontFactor = function (model, expandSpec, recurse) {
        var val = fluid.get(model, expandSpec.path);
        if (!val) {
            return {};
        }

        return (Math.round(parseFloat(val / baseDocumentFontSize()) * 10) / 10).toString();
    };

    /**
     * 
     */
    fluid.afaStore.transform.fontSize = function (model, expandSpec, recurse) {
        var val = fluid.get(model, expandSpec.path);
        if (!val) {
            return {};
        }

        return baseDocumentFontSize() * val;
    };

    var colourTable = {
        white: {
            black: "wb"
        },
        yellow: {
            black: "yb"
        },
        black: {
            white: "bw",
            yellow: "by"
        }
    };
    /**
     * Convert a foreground/background colour combination into a theme name.
     * Assumptions: If one of the colours is not specified, we cannot identify a theme.
     */
    fluid.afaStore.transform.coloursToTheme = function (model, expandSpec, recurse) {
        var fg = fluid.get(model, expandSpec.fgpath);
        var bg = fluid.get(model, expandSpec.bgpath);
        if (colourTable[fg]) {
            return colourTable[fg][bg];
        }
    };

    /**********************************************
     * Transformation Rules
     **********************************************/

    fluid.afaStore.AfAtoUIOrules = {
        "textFont": {
            "expander": {
                "type": "fluid.afaStore.transform.valueMapper",
                "path": "display.screenEnhancement.fontFace.genericFontFace",
                "_comment": "TODO: For now, this ignores the actual 'fontName' setting",
                "valueMap": {
                    "serif": "times",
                    "sans serif": "verdana",
                    "monospaced": "default",
                    "fantasy": "default",
                    "cursive": "default"
                }
            }
        },
        "textSize": {
            "expander": {
                "type": "fluid.afaStore.transform.fontFactor",
                "path": "display.screenEnhancement.fontSize"
            }
        },
        "toc": {
            "expander": {
                "type": "fluid.model.transform.value",
                "path": "control.structuralNavigation.tableOfContents"
            }
        },
        "captions": {
            "expander": {
                "type": "fluid.model.transform.value",
                "path": "flatAdaptationPreferences.captions"
            }
        },
        "transcripts": {
            "expander": {
                "type": "fluid.model.transform.value",
                "path": "flatAdaptationPreferences.transcripts"
            }
        },
        "language": {
            "expander": {
                "type": "fluid.model.transform.value",
                "path": "flatAdaptationPreferences.language"
            }
        },
        "theme": {
            "expander": {
                "type": "fluid.afaStore.transform.coloursToTheme",
                "fgpath": "display.screenEnhancement.foregroundColor",
                "bgpath": "display.screenEnhancement.backgroundColor"
            }
        }
    };

    fluid.afaStore.AfAtoUIOAdaptPrefRules = {
        "flatAdaptationPreferences": {
            "expander": {
                "type": "fluid.afaStore.transform.flattenAdaptPrefs",
                "path": "content.adaptationPreference"
            }
        },
        "display": "display",
        "control": "control"
    };

    fluid.afaStore.UIOtoAfArules = {
        "display.screenEnhancement.fontFace": {
            "expander": {
                "type": "fluid.afaStore.transform.valueMapper",
                "path": "textFont",
                "valueMap": {
                    "times": {
                        "fontName": ["Times New Roman"],
                        "genericFontFace": "serif"
                    },
                    "verdana": {
                        "fontName": ["Verdana"],
                        "genericFontFace": "sans serif"
                    },
                    "arial": {
                        "fontName": ["Arial"],
                        "genericFontFace": "sans serif"
                    },
                    "comic": {
                        "fontName": ["Comic Sans"],
                        "genericFontFace": "sans serif"
                    }
                }
            }
        },
        "display.screenEnhancement.fontSize": {
            "expander": {
                "type": "fluid.afaStore.transform.fontSize",
                "path": "textSize"
            }
        },
        "control.structuralNavigation.tableOfContents": {
            "expander": {
                "type": "fluid.model.transform.value",
                "path": "toc"
            }
        },
        "content.adaptationPreference.0": {
            "expander": {
                "type": "fluid.afaStore.transform.afaCaption",
                "path": "captions"
            }
        },
        "_comment": "NB: This will always place transcripts second in the array, even if there are no captions",
        "content.adaptationPreference.1": {
            "expander": {
                "type": "fluid.afaStore.transform.afaTranscript",
                "path": "transcripts"
            }
        },
        "display.screenEnhancement.foregroundColor": {
            "expander": {
                "type": "fluid.afaStore.transform.valueMapper",
                "path": "theme",
                "valueMap": {
                    "yb": "yellow",
                    "by": "black",
                    "wb": "white",
                    "bw": "black"
                }
            }
        },
        "display.screenEnhancement.backgroundColor": {
            "expander": {
                "type": "fluid.afaStore.transform.valueMapper",
                "path": "theme",
                "valueMap": {
                    "yb": "black",
                    "by": "yellow",
                    "wb": "black",
                    "bw": "white"
                }
            }
        }
    };
})(jQuery, fluid_1_5);
