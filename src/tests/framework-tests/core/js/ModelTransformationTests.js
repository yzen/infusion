/*
Copyright 2010-2011 OCAD University
Copyright 2011 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid, jqUnit, jQuery, deepEqual*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

(function ($) {
  
    fluid.registerNamespace("fluid.tests");
    
    var source = {
        cat: "meow",
        dog: null,
        gerbil: undefined,
        goat: false,
        hamster: {
            wheel: "spin"
        },
        cow: {
            grass: "chew"
        },
        sheep: [
            "baaa",
            "wooooool"
        ],
        hippo: 0,
        polar: "grrr",
        dozen: 12,
        hundred: 100,
        halfdozen: 6,
        lt: "<",
        catsAreDecent: true,
        floatyLowy: 12.3910,
        floatyHighy: 12.52,
        floaty2: -9876.789
    };

    jqUnit.module("Model Transformation");
    
    function testOneExpander(message, model, expander, method, expected) {
        var transformed = fluid.model.transform(model, {
            value: {
                expander: expander
            }
        });
        jqUnit[method].apply(null, [message, expected, transformed.value]); 
    }

    var testOneStructure = function (tests) {
        fluid.each(tests, function (v) {
            testOneExpander(v.message, v.model || source, v.expander, v.method, v.expected);
        });
    };
    
    var scaleValueTests = [{
        message: "scaleValue - no parameters given",
        expander: {
            type: "fluid.model.transform.scaleValue",
            valuePath: "dozen"
        },
        method: "assertEquals",
        expected: 12
    }, {
        message: "scaleValue - factor parameter only",
        expander: {
            type: "fluid.model.transform.scaleValue",
            valuePath: "dozen",
            factor: 0.25
        },
        method: "assertEquals",
        expected: 3
    }, {
        message: "scaleValue - factor parameter and offset",
        expander: {
            type: "fluid.model.transform.scaleValue",
            value: 12,
            factor: 0.50,
            offset: 100
        },
        method: "assertEquals",
        expected: 106
    }, {
        message: "scaleValue - everything by path",
        expander: {
            type: "fluid.model.transform.scaleValue",
            valuePath: "dozen",
            factorPath: "halfdozen",
            offsetPath: "hundred"
        },
        method: "assertEquals",
        expected: 172
    }];

    jqUnit.test("fluid.model.transform.scaleValue()", function () {
        testOneStructure(scaleValueTests);
    });

    var binaryOpTests = [{
        message: "binaryOp - ===",
        expander: {
            type: "fluid.model.transform.binaryOp",
            leftPath: "dozen",
            operator: "===",
            right: 12
        },
        method: "assertEquals",
        expected: true
    }, {
        message: "binaryOp - !==",
        expander: {
            type: "fluid.model.transform.binaryOp",
            left: 100,
            operator: "!==",
            rightPath: "hundred"
        },
        method: "assertEquals",
        expected: false
    }, {
        message: "binaryOp - <=",
        expander: {
            type: "fluid.model.transform.binaryOp",
            leftPath: "dozen",
            operator: "<=",
            right: 13
        },
        method: "assertEquals",
        expected: true
    }, {
        message: "binaryOp - <",
        expander: {
            type: "fluid.model.transform.binaryOp",
            leftPath: "hundred",
            operator: "<",
            rightPath: "dozen"
        },
        method: "assertEquals",
        expected: false
    }, {
        message: "binaryOp - >=",
        expander: {
            type: "fluid.model.transform.binaryOp",
            leftPath: "dozen",
            operator: ">=",
            right: 13
        },
        method: "assertEquals",
        expected: false
    }, {
        message: "binaryOp - >",
        expander: {
            type: "fluid.model.transform.binaryOp",
            leftPath: "hundred",
            operator: ">",
            rightPath: "dozen"
        },
        method: "assertEquals",
        expected: true
    }, {
        message: "binaryOp - +",
        expander: {
            type: "fluid.model.transform.binaryOp",
            leftPath: "dozen",
            operator: "+",
            right: 13
        },
        method: "assertEquals",
        expected: 25
    }, {
        message: "binaryOp - -",
        expander: {
            type: "fluid.model.transform.binaryOp",
            leftPath: "hundred",
            operator: "-",
            rightPath: "dozen"
        },
        method: "assertEquals",
        expected: 88
    }, {
        message: "binaryOp - *",
        expander: {
            type: "fluid.model.transform.binaryOp",
            leftPath: "dozen",
            operator: "*",
            right: 13
        },
        method: "assertEquals",
        expected: 156
    }, {
        message: "binaryOp - /",
        expander: {
            type: "fluid.model.transform.binaryOp",
            left: 96,
            operator: "/",
            rightPath: "dozen"
        },
        method: "assertEquals",
        expected: 8
    }, {
        message: "binaryOp - %",
        expander: {
            type: "fluid.model.transform.binaryOp",
            leftPath: "hundred",
            operator: "%",
            rightPath: "dozen"
        },
        method: "assertEquals",
        expected: 4
    }, {
        message: "binaryOp - &&",
        expander: {
            type: "fluid.model.transform.binaryOp",
            leftPath: "catsAreDecent",
            operator: "&&",
            right: false
        },
        method: "assertEquals",
        expected: false
    }, {
        message: "binaryOp - ||",
        expander: {
            type: "fluid.model.transform.binaryOp",
            left: false,
            operator: "||",
            rightPath: "catsAreDecent"
        },
        method: "assertEquals",
        expected: true
    }, {
        message: "binaryOp - invalid operator",
        expander: {
            type: "fluid.model.transform.binaryOp",
            left: false,
            operator: "-+",
            rightPath: "catsAreDecent"
        },
        method: "assertEquals",
        expected: undefined
    }];

    jqUnit.test("fluid.model.transform.binaryOp()", function () {
        testOneStructure(binaryOpTests);
    });

    var conditionTests = [
        {
            message: "simple condition",
            expander: {
                type: "fluid.model.transform.condition",
                conditionPath: "catsAreDecent",
                "true": "it was true",
                "false": "it was false"
            },
            method: "assertEquals",
            expected: "it was true"
        }, {
            message: "truePath condition",
            expander: {
                type: "fluid.model.transform.condition",
                condition: true,
                "truePath": "cow"
            },
            method: "assertDeepEq",
            expected: {
                grass: "chew"
            }
        }, {
            message: "invalid truePath",
            expander: {
                type: "fluid.model.transform.condition",
                conditionPath: "catsAreDecent",
                "true": source.bow
            },
            method: "assertEquals",
            expected: undefined
        }, {
            message: "Nesting",
            expander: {
                type: "fluid.model.transform.condition",
                condition: {
                    expander: {
                        type: "fluid.model.transform.binaryOp",
                        left: true,
                        operator: "&&",
                        right: false
                    }
                },
                "false": {
                    expander: {
                        type: "fluid.model.transform.literalValue",
                        value: "Congratulations, you are a genius",
                        outputPath: "conclusion"
                    }
                }              
            },
            method: "assertDeepEq",
            expected: {
                conclusion: "Congratulations, you are a genius"
            }
        }
    ];

    jqUnit.test("fluid.model.transform.condition()", function () {
        testOneStructure(conditionTests);
    });

    var valueTests = [
        {
            message: "A value transform should resolve the specified path.", 
            expander: {
                type: "fluid.model.transform.value", 
                inputPath: "hamster.wheel"
            }, 
            method: "assertEquals", 
            expected: source.hamster.wheel
        }, {
            message: "When the path is valid, the value option should not be returned.", 
            expander: {
                type: "fluid.model.transform.value", 
                inputPath: "hamster.wheel",
                input: "hello!"
            }, 
            method: "assertNotEquals", 
            expected: "hello!"
        }, {
            message: "When the path's value is null, the value option should not be returned.",
            expander: {
                type: "fluid.model.transform.value", 
                inputPath: "dog",
                input: "hello!"
            }, 
            method: "assertNotEquals", 
            expected: "hello!"
        }, {
            message: "When the path's value is false, the value option should not be returned.",
            expander: {
                type: "fluid.model.transform.value", 
                inputPath: "goat",
                input: "hello!"
            }, 
            method: "assertNotEquals", 
            expected: "hello!"
        }, {
            message: "When the path's value is undefined, the value option should be returned.",
            expander: {
                type: "fluid.model.transform.value", 
                inputPath: "gerbil",
                input: "hello!"
            }, 
            method: "assertEquals", 
            expected: "hello!"
        }, {
            message: "When the path's value is not specified, the value option should be returned.",
            expander: {
                type: "fluid.model.transform.value", 
                input: "toothpick"
            }, 
            method: "assertEquals", 
            expected: "toothpick"
        }, {
            message: "When the path's value is defined, the referenced value should be returned.",
            expander: {
                type: "fluid.model.transform.value", 
                inputPath: "cat",
                input: "rrrrr"
            }, 
            method: "assertEquals", 
            expected: source.cat
        }, {
            message: "Where the path is a rules object, the result should be an expanded version of it.",
            expander: {
                type: "fluid.model.transform.value", 
                input: {
                    alligator: {
                        expander: {
                            type: "fluid.model.transform.value",
                            inputPath: "hamster"
                        }
                    },
                    tiger: {
                        expander: {
                            type: "fluid.model.transform.value",
                            inputPath: "hamster.wheel"
                        }
                    }
                }
            }, 
            method: "assertDeepEq", 
            expected: {
                alligator: source.hamster,
                tiger: source.hamster.wheel
            }
        }
    ];
    
    jqUnit.test("fluid.model.transform.value()", function () {
        testOneStructure(valueTests);
    });

    var transformToShortNames = {
        expander: {
            inputPath: "*.expander.type",
            type: "fluid.computeNickName"  
        }
    };
    
    jqUnit.test("Transform with wildcard path and short names", function () {
        var shortened = fluid.model.transform(valueTests, transformToShortNames, {isomorphic: true});
        var expected = fluid.transform(valueTests, function (config) {
            return {
                expander: {
                    type: fluid.computeNickName(config.expander.type)
                }
            };
        });
        jqUnit.assertDeepEq("Transformed expander types to short names", expected, shortened);
        var newConfig = $.extend(true, [], valueTests, shortened);
        testOneStructure(newConfig);
    });

    var arrayValueTests = [{
        message: "arrayValue() should box a non-array value up as one.", 
        expander: {
            type: "fluid.model.transform.arrayValue", 
            inputPath: "cat"
        }, 
        method: "assertDeepEq", 
        expected: [source.cat]
    }, {
        message: "arrayValue() should not box up an array value.", 
        expander: {
            type: "fluid.model.transform.arrayValue", 
            inputPath: "sheep"
        }, 
        method: "assertDeepEq", 
        expected: source.sheep
    }];

    jqUnit.test("fluid.model.transform.arrayValue()", function () {
        testOneStructure(arrayValueTests);
    });

    var countTests = [{
        message: "count() should return a length of 1 for a non-array value.", 
        expander: {
            type: "fluid.model.transform.count", 
            inputPath: "cat"
        }, 
        method: "assertEquals", 
        expected: 1
    }, {
        message: "count() should return the length for array values.", 
        expander: {
            type: "fluid.model.transform.count", 
            inputPath: "sheep"
        }, 
        method: "assertEquals", 
        expected: 2
    }];

    jqUnit.test("fluid.model.transform.count()", function () {
        testOneStructure(countTests);
    });
    
    var roundTests = [{
        message: "round() expected to return round down number", 
        expander: {
            type: "fluid.model.transform.round", 
            inputPath: "floatyLowy"
        }, 
        method: "assertEquals", 
        expected: 12
    }, {        
        message: "round() expected to return round up number", 
        expander: {
            type: "fluid.model.transform.round", 
            inputPath: "floatyHighy"
        }, 
        method: "assertEquals", 
        expected: 13
    }, {
        message: "round() should round up on negative float.", 
        expander: {
            type: "fluid.model.transform.round", 
            inputPath: "floaty2"
        }, 
        method: "assertEquals", 
        expected: -9877
    }];

    jqUnit.test("fluid.model.transform.round()", function () {
        testOneStructure(roundTests);
    });
    
    var firstValueTests = [{
        message: "firstValue() should return the first non-undefined value in paths", 
        expander: {
            type: "fluid.model.transform.firstValue", 
            values: ["cat", "dog"]
        }, 
        method: "assertEquals", 
        expected: source.cat
    }, {
        message: "firstValue() should return the second path value when the first is undefined", 
        expander: {
            type: "fluid.model.transform.firstValue", 
            values: ["gerbil", "cat"]
        }, 
        method: "assertEquals", 
        expected: source.cat
    }, {
        message: "firstValue() should return the first path value when is false", 
        expander: {
            type: "fluid.model.transform.firstValue", 
            values: ["goat", "cat"]
        }, 
        method: "assertEquals", 
        expected: source.goat
    }, {
        message: "firstValue() should return the first path value when is null", 
        expander: {
            type: "fluid.model.transform.firstValue", 
            values: ["dog", "cat"]
        }, 
        method: "assertEquals", 
        expected: source.dog
    }, {
        message: "firstValue() should return the first path value when is 0", 
        expander: {
            type: "fluid.model.transform.firstValue", 
            values: ["hippo", "cat"]
        }, 
        method: "assertEquals", 
        expected: source.hippo
    }];
    
    jqUnit.test("fluid.model.transform.firstValue()", function () {
        testOneStructure(firstValueTests);
    });
    
    var mapperModel = {
        tracking: "focus"  
    };
    
    var mapperOptions = {
        "mouse": {
            "outputPath": "FollowMouse",
            "outputValue": true
        },
        "focus": {
            "outputPath": "FollowFocus",
            "outputValue": true
        },
        "caret": {
            "outputPath": "FollowCaret",
            "outputValue": true
        }
    };
    
    var mapperTests = {
        "simple": {
            message: "valueMapper selects focus based on path",
            model: mapperModel, 
            expander: {
                type: "fluid.model.transform.valueMapper",
                inputPath: "tracking",
                options: mapperOptions
            },
            method: "assertDeepEq",
            expected: {
                "FollowFocus": true
            }
        }, 
        "deffolt": {
            message: "valueMapper selects mouse by default",
            model: {
                tracking: "unknown-thing"
            }, 
            expander: {
                type: "fluid.model.transform.valueMapper",
                inputPath: "tracking",
                defaultInputValue: "mouse",
                options: mapperOptions
            },
            method: "assertDeepEq",
            expected: {
                "FollowMouse": true
            }
        }, 
        "nonString": {
            message: "valueMapper with default output value and non-string input value",
            model: {
                condition: true
            }, 
            expander: {
                type: "fluid.model.transform.valueMapper",
                inputPath: "condition",
                defaultOutputValue: "CATTOO",
                options: {
                    "true": {
                        outputPath: "trueCATT"
                    },
                    "false": {
                        outputPath: "falseCATT"
                    }
                }
            },
            method: "assertDeepEq",
            expected: {
                "trueCATT": "CATTOO"
            }
        }, 
        "nonString-long": {
            message: "valueMapper with default output value and non-string input value with long records",
            model: {
                condition: true
            }, 
            expander: {
                type: "fluid.model.transform.valueMapper",
                inputPath: "condition",
                defaultOutputValue: "CATTOO",
                options: [ 
                    {
                        inputValue: true,
                        outputPath: "trueCATT"
                    }, {
                        inputValue: false,
                        outputPath: "falseCATT"
                    }
                ]
            },
            method: "assertDeepEq",
            expected: {
                "trueCATT": "CATTOO"
            }
        },
        "unmatched-none": {
            message: "valueMapper with unmatched input value and no defaultInput",
            model: {
                condition: true
            }, 
            expander: {
                type: "fluid.model.transform.valueMapper",
                inputPath: "uncondition",
                defaultOutputValue: "CATTOO",
                defaultOutputPath: "anyCATT",
                options: [ 
                    {
                        undefinedInputValue: true,
                        undefinedOutputValue: true,
                        outputPath: "trueCATT"
                    }, {
                        inputValue: true,
                        outputPath: "trueCATT"
                    }, {
                        inputValue: false,
                        outputPath: "falseCATT"
                    }
                ]
            },
            method: "assertDeepEq",
            expected: undefined
        }, 
        "unmatched-definite": {
            message: "valueMapper with unmatched input value mapped to definite value",
            model: {}, 
            expander: {
                type: "fluid.model.transform.valueMapper",
                inputPath: "uncondition",
                options: [ 
                    {
                        undefinedInputValue: true,
                        outputValue: "undefinedCATT",
                        outputPath: "trueCATT"
                    }
                ]
            },
            method: "assertDeepEq",
            expected: {
                trueCATT: "undefinedCATT"
            }
        },
        "unmatched-undefined-short": {
            message: "valueMapper with unmatched input value mapped to undefined value with short form",
            model: {}, 
            expander: {
                type: "fluid.model.transform.valueMapper",
                inputPath: "uncondition",
                defaultOutputPath: "wouldbeCATT",
                options: {
                    "undefined": {
                        undefinedOutputValue: true
                    }
                }
            },
            method: "assertDeepEq",
            expected: undefined
        },
        "unmatched-defaultOutpath": {
            message: "Valuemapper with defaultOutputPath",
            model: {
                foo: "bar"
            }, 
            expander: {
                type: "fluid.model.transform.valueMapper",
                inputPath: "foo",
                defaultOutputPath: "stupidCATT",
                options: {
                    bar: {
                        outputValue: "it works"
                    }
                }
            },
            method: "assertDeepEq",
            expected: {
                stupidCATT: "it works"
            }
        },
        "unmatched-nodefaults": {
            message: "valueMapper with unmatched input value and no default or undefined values specified.",
            model: {
                display: {
                    screenEnhancement: {
                        fontSize: 24
                    }
                }
            },
            expander: {
                type: "fluid.model.transform.valueMapper",
                inputPath: "display.screenEnhancement.tracking",
                options: {
                    "mouse": {
                        "outputValue": "centered"
                    }
                }
            },
            method: "assertDeepEq",
            expected: undefined
        }, 
        "nested-mapping": {
            message: "valueMapper with nested expanders.",
            model: {
                animals: {
                    mammals: {
                        elephant: "big",
                        mouse: "small"
                    }
                }
            },
            expander: {
                type: "fluid.model.transform.valueMapper",
                inputPath: "animals.mammals.elephant",
                options: {
                    big: {
                        outputPath: "correct",
                        outputValue: {
                            expander: {
                                type: "fluid.model.transform.literalValue",
                                value: "Elephant - Brilliant work, it is indeed big",
                                outputPath: "path"
                            }
                        }
                    }
                }
            },
            method: "assertDeepEq",
            expected: {
                correct: {
                    path: "Elephant - Brilliant work, it is indeed big"
                }
            }
        },
        "valueMapping-multiout": {
            message: "valueMapper with multiple outputs.",
            model: {
                screenReaderTTSEnabled: false
            },
            expander: {
                type: "fluid.model.transform.valueMapper",
                inputPath: "screenReaderTTSEnabled",
                options: {
                    "false": {
                        outputValue: {
                            expander: [
                                {
                                    type: "fluid.model.transform.literalValue",
                                    value: "silence",
                                    outputPath: "speech.synth"
                                },
                                {
                                    type: "fluid.model.transform.literalValue",
                                    value: "Microsoft Sound Mapper",
                                    outputPath: "speech.outputDevice"  
                                }
                            ]
                        }
                    }
                }
            },
            method: "assertDeepEq",
            expected: {
                speech: {
                    synth: "silence",
                    outputDevice: "Microsoft Sound Mapper"
                }
            }
        }
    };
    
    jqUnit.test("fluid.model.transform.valueMapper()", function () {
        testOneStructure(mapperTests);
    });
    
    var a4aFontRules = {
        "textFont": {
            "expander": {
                "type": "fluid.model.transform.valueMapper",
                "inputPath": "fontFace.genericFontFace",
                "_comment": "TODO: For now, this ignores the actual 'fontName' setting",
                "options": {
                    "serif": "times",
                    "sans serif": "verdana",
                    "monospaced": "default",
                    "fantasy": "default",
                    "cursive": "default"
                }
            }
        }
    };
    
    fluid.tests.expandCompactRule = function (value) {
        return {
            outputValue: value,
            outputPath: ""
        };
    };
    
    jqUnit.test("valueMapper with compact value", function () {
        var source = {
            fontFace: {
                genericFontFace: "serif",
                fontName: ["Times New Roman"]
            }
        };
        var expected = {textFont: "times"};
        function testCompact(message, rules) {
            var transformed = fluid.model.transform(source, rules);
            jqUnit.assertDeepEq("valueMapper with compact value" + message, expected, transformed);
        }
                  
        testCompact(" - compact", a4aFontRules);
        var exRules = {
            "textFont.expander.options.*": {
                expander: {
                    type: "fluid.tests.expandCompactRule"
                }
            }, 
            "": "" // put this last to test key sorting
        };
        var expandedRules = fluid.model.transform(a4aFontRules, exRules);
        var expectedRules = fluid.copy(a4aFontRules);
        fluid.set(expectedRules, "textFont.expander.options", fluid.transform(a4aFontRules.textFont.expander.options, function (value) {
            return fluid.tests.expandCompactRule(value);
        }));
        jqUnit.assertDeepEq("Rules transformed to expanded form", expectedRules, expandedRules);
        testCompact(" - expanded", expandedRules); 
    });

    jqUnit.test("transform with custom schema", function () {
        var rules = {
            "0.0.feline": "cat"
        };
        var schema = {
            "": "array",
            "*": "array"
        };
        var expected = [
            [ {
                feline: "meow"
            } ]
        ];
        var result = fluid.model.transform(source, rules, {flatSchema: schema});
        jqUnit.assertDeepEq("Default array structure should have been created by transform", expected, result);            
    });
     
    jqUnit.test("transform with isomorphic schema and wildcards", function () {
        var gpiiSettingsResponse = [{
            "org.gnome.desktop.a11y.magnifier": {
                "settings": {
                    "cross-hairs-clip": { "oldValue":  false, "newValue": true }
                }
            }
        }];
        var rules = {
            "*.*.settings.*": {
                expander: {
                    type: "value",
                    inputPath: "newValue"
                }
            }
        };
        var expected = [{
            "org.gnome.desktop.a11y.magnifier": {
                "settings": {
                    "cross-hairs-clip": true 
                }
            }
        }];
        var result = fluid.model.transform(gpiiSettingsResponse, rules, {isomorphic: true});
        jqUnit.assertDeepEq("isomorphic structure with wildcards and recursive expander", expected, result);    
    });
    
    jqUnit.test("transform with no schema, wildcards and dot-paths", function () {
        var flatterGpiiSettingsResponse = {
            "org.gnome.desktop.a11y.magnifier": {
                "settings": {
                    "cross-hairs-clip": { "oldValue":  false, "newValue": true }
                }
            }
        };
        var rules = {
            "*.settings.*": {
                expander: {
                    type: "value",
                    inputPath: "newValue"
                }
            }
        };
        var expected = {
            "org.gnome.desktop.a11y.magnifier": {
                "settings": {
                    "cross-hairs-clip": true 
                }
            }
        };
        var result = fluid.model.transform(flatterGpiiSettingsResponse, rules);
        jqUnit.assertDeepEq("wildcards, recursive expander and dot-paths", expected, result);    
    });
    
    jqUnit.test("transform with schema, wildcards AFTER dot-paths", function () {
        var modernGpiiSettingsResponse = {
            "org.gnome.desktop.a11y.magnifier": [{
                "settings": {
                    "cross-hairs-clip": { "oldValue":  false, "newValue": true }
                }
            }]
        };
        var rules = {
            "*.*.settings.*": {
                expander: {
                    type: "value",
                    inputPath: "newValue"
                }
            }
        };
        var expected = {
            "org.gnome.desktop.a11y.magnifier": [{
                "settings": {
                    "cross-hairs-clip": true 
                }
            }]
        };
        var result = fluid.model.transform(modernGpiiSettingsResponse, rules, {isomorphic: true});
        jqUnit.assertDeepEq("wildcards, recursive expander and dot-paths", expected, result);    
    });

    jqUnit.test("transform with path named value and literalValue", function () {
        var model = {
            "Magnification": 100
        };
        var transform = {
            "Magnification": {
                expander: {
                    type: "fluid.model.transform.value",
                    inputPath: "Magnification",
                    outputPath: "value"
                },
                dataType: {
                    expander: {
                        type: "fluid.model.transform.literalValue",
                        value: "REG_DWORD"
                    }
                }
            }
        };
         
        var expected = {
            "Magnification": {
                "value": 100,
                "dataType": "REG_DWORD"
            }
        };
     
        var actual = fluid.model.transform(model, transform);
     
        jqUnit.assertDeepEq("Model transformed with value", actual, expected);
    });
   
    jqUnit.test("transform with compact inputPath", function () {
        var rules = {
            feline: "cat",
            kangaroo: {
                value: "literal value"
            },
            "farm.goat": "goat",
            "farm.sheep": "sheep"
        };
        var expected = {
            feline: "meow", // prop rename
            kangaroo: "literal value",
            farm: { // Restructure
                goat: false,
                sheep: [
                    "baaa",
                    "wooooool"
                ]
            }
        };
        var result = fluid.model.transform(source, rules);
        jqUnit.assertDeepEq("The model should be transformed based on the specified rules", expected, result);
    });
    
    jqUnit.test("transform with nested farm.goat", function () {
        var rules = {
            "farm": {
                "goat": {
                    expander: {
                        type: "fluid.model.transform.value",
                        inputPath: "goat"
                    }
                }
            }
        };
        var expected = {
            farm: { // Restructure
                goat: false
            }
        };
        var result = fluid.model.transform(source, rules);
        jqUnit.assertDeepEq("The model should be transformed based on the specified rules", expected, result);
    });
    
    jqUnit.test("invert simple transformation", function () {
        var rules = {
            farm: "goat"
        };
        var inverseRules = fluid.model.transform.invertConfiguration(rules);
        var expectedInverse = {
            expander: [{
                type: "fluid.model.transform.value",
                inputPath: "farm",
                outputPath: "goat"
            }]
        };
        jqUnit.assertDeepEq("Inverted simple rules", expectedInverse, inverseRules);
        var forward = fluid.model.transform(source, rules);
        var reverse = fluid.model.transform(forward, inverseRules);
        var modelBit = {
            goat: false
        };
        jqUnit.assertDeepEq("Recovered image of model", modelBit, reverse);
    });

    jqUnit.test("invert valueMapper transformation", function () {
        var rules = {
            expander: {
                type: "fluid.model.transform.valueMapper",
                inputPath: "tracking",
                options: mapperOptions
            }
        };
        var mapperModel = {
            tracking: "focus"  
        };
        
        var inverseRules = fluid.model.transform.invertConfiguration(rules);
        var expectedInverse = {
            expander: [{
                type: "fluid.model.transform.valueMapper",
                defaultOutputPath: "tracking",
                options: [
                    {
                        inputPath: "FollowMouse",
                        inputValue: true,
                        outputValue: "mouse"
                    },
                    {
                        inputPath: "FollowFocus",
                        inputValue: true,
                        outputValue: "focus"
                    },
                    {
                        inputPath: "FollowCaret",
                        inputValue: true,
                        outputValue: "caret"
                    }
                ]
            }]
        };
        jqUnit.assertDeepEq("Inverted valueMapper", expectedInverse, inverseRules);
        var forward = fluid.model.transform(mapperModel, rules);
        var reverse = fluid.model.transform(forward, inverseRules);
        jqUnit.assertDeepEq("Perfectly inverted mapping", mapperModel, reverse);
    });
    
    jqUnit.test("invert long form valueMapper", function () {
        var cattoo = mapperTests["nonString-long"];
        var rules = {expander: cattoo.expander};
        var inverseRules = fluid.model.transform.invertConfiguration(rules);
        var expectedInverse = {
            expander: [{
                type: "fluid.model.transform.valueMapper",
                defaultOutputPath: "condition",
                options: [ {
                    outputValue: true,
                    inputValue: "CATTOO",
                    inputPath: "trueCATT"
                }, {
                    outputValue: false,
                    inputValue: "CATTOO",
                    inputPath: "falseCATT"
                }] 
            }]
        };
        jqUnit.assertDeepEq("Inverted valueMapper", expectedInverse, inverseRules);
        var forward = fluid.model.transform(cattoo.model, rules);
        var reverse = fluid.model.transform(forward, inverseRules);
        jqUnit.assertDeepEq("Perfectly inverted mapping", cattoo.model, reverse);
    });

    var capabilitiesTransformations = {
        "mag-factor": "display.screenEnhancement.magnification",
        "show-cross-hairs": "display.screenEnhancement.showCrosshairs",
        "mouse-tracking": {
            "expander": {
                "type": "fluid.model.transform.valueMapper",
                "inputPath": "display.screenEnhancement.tracking",
                "options": {
                    "mouse": {
                        "outputValue": "centered"
                    }
                }
            }
        },
        "foo-bar": {
            expander: {
                type: "fluid.model.transform.value",
                input: {
                    expander: {
                        type: "fluid.model.transform.value",
                        inputPath: "im.nested"
                    }
                } 
            }
        }
    };
    
    jqUnit.test("collect inputPath from mixed transformation", function () {
        var paths = fluid.model.transform.collectInputPaths(capabilitiesTransformations);
        var expected = [
            "display.screenEnhancement.magnification",
            "display.screenEnhancement.showCrosshairs",
            "display.screenEnhancement.tracking",
            "im.nested"
        ];
        jqUnit.assertDeepEq("Collected input paths", expected, paths.sort());
    });

    var multiInputTransformations = {
        expander: {
            type: "fluid.model.transform.condition",
            condition: {
                expander: {
                    type: "fluid.model.transform.binaryOp",
                    leftPath: "hello.world",
                    operator: "&&",
                    right: false
                }
            },
            "false": {
                expander: {
                    type: "fluid.model.transform.value",
                    inputPath: "falsey.goes.here",
                    outputPath: "conclusion"
                }
            },
            truePath: "kasper.rocks"
        }
    };
    
    jqUnit.test("collect inputPath from multiInput transformations", function () {
        var paths = fluid.model.transform.collectInputPaths(multiInputTransformations);
        var expected = [
            "falsey.goes.here",
            "hello.world",
            "kasper.rocks"
        ];
        jqUnit.assertDeepEq("Collected input paths", expected, paths.sort());
    });
    
    jqUnit.test("fluid.model.transform()", function () {
        var rules = {
            // Rename a property
            feline: { 
                expander: {
                    type: "fluid.model.transform.value",
                    inputPath: "cat"
                }
            },

            // Use a default value
            gerbil: {
                expander: {
                    type: "fluid.model.transform.value",
                    inputPath: "gerbil",
                    value: "sold out"
                }
            },

            // Use a literal value
            kangaroo: {
                expander: {
                    type: "fluid.model.transform.value",
                    value: "literal value"
                }
            },

            // Restructuring/nesting
            "farm.goat": {                                          
                expander: {
                    type: "fluid.model.transform.value",
                    inputPath: "goat"
                }
            },
            "farm.sheep": {
                expander: {
                    type: "fluid.model.transform.value",
                    inputPath: "sheep"
                }
            },

            // First value
            "bear": {
                expander: {
                    type: "fluid.model.transform.firstValue",
                    values: [
                        {
                            expander: {
                                type: "fluid.model.transform.value",
                                inputPath: "grizzly"
                            }
                        },
                        {
                            expander: {
                                type: "fluid.model.transform.value",
                                inputPath: "polar"
                            }
                        }
                    ]
                }
            }
        };

        var expected = {
            feline: "meow", // prop rename
            gerbil: "sold out", // default value
            kangaroo: "literal value",
            farm: { // Restructure
                goat: false,
                sheep: [
                    "baaa",
                    "wooooool"
                ]
            },
            bear: "grrr" // first value
        };
        
        var result = fluid.model.transform(source, rules);
        jqUnit.assertDeepEq("The model should transformed based on the specified rules", expected, result);
    });
    
    jqUnit.test("fluid.model.transform() with idempotent rules", function () {
        var idempotentRules = {
            wheel: {
                expander: {
                    type: "fluid.model.transform.firstValue",
                    values: [
                        {
                            expander: {
                                type: "fluid.model.transform.value",
                                inputPath: "wheel"
                            }
                        },
                        {
                            expander: {
                                type: "fluid.model.transform.value",
                                inputPath: "hamster.wheel"
                            }
                        }
                    ]
                }
            },
            "barn.cat": {
                expander: {
                    type: "fluid.model.transform.firstValue",
                    values: [
                        {
                            expander: {
                                type: "fluid.model.transform.value",
                                inputPath: "barn.cat"
                            }
                        },
                        {
                            expander: {
                                type: "fluid.model.transform.value",
                                inputPath: "cat"
                            }
                        }
                    ]
                }
            }
        };
        
        var expected = {
            wheel: "spin",
            barn: {
                cat: "meow"
            }
        };
        
        var result = fluid.model.transform(source, idempotentRules);
        
        // Test idempotency of the transform (with these particular rules).
        result = fluid.model.transform(fluid.copy(result), idempotentRules);
        jqUnit.assertDeepEq("Running the transform on the output of itself shouldn't mangle the result.",
                            expected, result);
                            
        // Test that a model that already matches the rules isn't mangled by the transform (with these particular rules).
        result = fluid.model.transform(fluid.copy(expected), idempotentRules);
        jqUnit.assertDeepEq("With the appropriate rules, a model that already matches the transformation rules should pass through successfully.",
                            expected, result);
    });
    
    jqUnit.test("fluid.model.transformWithRules() with multiple rules", function () {
        var ruleA = {
            kitten: "cat"
        };
        
        var ruleB = {
            sirius: "kitten"
        };
        
        var expected = {
            sirius: "meow"
        };
        
        var result = fluid.model.transform.sequence(source, [ruleA, ruleB]);
        jqUnit.assertDeepEq("An array of rules should cause each to be applied in sequence.", expected, result);
    });
    
    var oldOptions = {
        cat: {
            type: "farm.cat"
        },
        numFish: 2
    };
    
    var expectedDelete = {
        cat: {
            type: "farm.cat"
        }
    };
    
    var transformRules = {
        "components.cat": "cat",
        "components.fish.type": {
            expander: {
                type: "fluid.model.transform.value",
                value: "bowl.fish"
            }
        },
        "components.fish.options.quantity": "numFish",
        "food": "food"
    };
    
    var modernOptions = {
        components: {
            cat: {
                type: "farm.cat"
            },
            fish: {
                type: "bowl.fish",
                options: {
                    quantity: 2
                }
            }
        }
    };
    
    var transformFixtures = [ 
        {
            message: "options backwards compatibility",
            rules: transformRules,
            expected: modernOptions
        }, {
            message: "root transform rules, delete and sorting reverse",
            rules: {
                expander: {
                    outputPath: "numFish",
                    type: "fluid.model.transform.delete"
                },
                "" : ""
            },
            expected: expectedDelete
        }, {
            message: "root transform rules, delete and sorting forward",
            rules: {
                "" : "",
                expander: {
                    outputPath: "numFish",
                    type: "fluid.model.transform.delete"
                }
            },
            expected: expectedDelete
        }, {
            message: "merge directive",
            rules: {
                "" : "",
                expander: {
                    outputPath: "cat",
                    inputPath: "",
                    merge: true,
                    type: "fluid.model.transform.value"
                }
            },
            expected: {
                cat: {
                    type: "farm.cat",
                    numFish: 2,
                    cat: {
                        type: "farm.cat"
                    }
                },
                numFish: 2
            }
        }
    ];
    
    fluid.each(transformFixtures, function (fixture) {
        jqUnit.test("fluid.model.transform(): " + fixture.message, function () {
            var result = fluid.model.transform(oldOptions, fixture.rules);
            jqUnit.assertDeepEq("Options should be transformed successfully based on the provided rules.", fixture.expected, result);
        });      
    });
    
    fluid.registerNamespace("fluid.tests.transform");
        
    fluid.defaults("fluid.tests.testTransformable", {
        gradeNames: ["fluid.littleComponent", "autoInit"],
        food: "tofu"
    });
    
    fluid.makeComponents({
        "farm.cat": "fluid.littleComponent",
        "bowl.fish": "fluid.littleComponent"
    });
    
    var checkTransformedOptions = function (that) {
        var expected = fluid.merge(null, fluid.copy(fluid.rawDefaults(that.typeName)), modernOptions);
        expected = fluid.censorKeys(expected, ["gradeNames"]);
        jqUnit.assertLeftHand("Options sucessfully transformed", expected, that.options);
    };
    
    jqUnit.test("fluid.model.transform applied automatically to component options, without IoC", function () {
        var options = fluid.copy(oldOptions);
        options.transformOptions = {
            transformer: "fluid.model.transform",
            config: transformRules  
        };
        var that = fluid.tests.testTransformable(options);
        checkTransformedOptions(that);
    });
    
    fluid.demands("fluid.tests.testTransformableIoC", ["fluid.tests.transform.version.old"], {
        transformOptions: {
            transformer: "fluid.model.transform",
            config: transformRules
        }
    });

    fluid.defaults("fluid.tests.transform.strategy", {
        gradeNames: ["fluid.littleComponent", "autoInit"]
    });
    
    fluid.defaults("fluid.tests.testTransformableIoC", {
        gradeNames: ["fluid.littleComponent", "autoInit"],
        components: {
            strategy: {
                type: "fluid.tests.transform.strategy"
            }
        }
    });
    
    fluid.defaults("fluid.tests.transform.tip", {
        gradeNames: ["fluid.littleComponent", "autoInit"],
        components: {
            versionTag: {
                type: "fluid.typeFount",
                options: {
                    targetTypeName: "fluid.tests.transform.version.old"
                }  
            },
            transformable: {
                type: "fluid.tests.testTransformableIoC",
                options: oldOptions
            }  
        }
    });
    
    jqUnit.test("fluid.model.transform applied automatically to component options, with IoC", function () {
        var that = fluid.tests.transform.tip();
        checkTransformedOptions(that.transformable);
    });

    /* --------------- arrayToObject and objectToArray tests -------------------- */
    var arrayObjectArrayTests = [
        {
            name: "Basic Array transformations",
            expectPerfectInversion: true,
            raw: {
                a: {
                    c: [ 
                        { name: "c1", val: "vc1" },
                        { name: "c2", val: "vc2" }
                    ]
                }
            }, 
            rules: {
                "a.c": {
                    "expander": {
                        type: "fluid.model.transform.arrayToObject",
                        inputPath: "a.c",
                        key: "name"
                    }
                }
            },
            expectedInputPaths: [
                "a.c"
            ],    
            expected: {                
                a: {
                    c: {
                        c1: { val: "vc1" },
                        c2: { val: "vc2" }
                    } 
                }
            },
            invertedRules: {
                expander: [ 
                    {
                        type: "fluid.model.transform.objectToArray",
                        inputPath: "a.c",
                        outputPath: "a.c",
                        key: "name"
                    }
                ]
            }    
        }, {
            name: "More Complex Array transformations",
            expectPerfectInversion: true,
            raw: {
                b: {
                    b1: "hello",
                    b2: "hello"
                },
                a: {
                    "dotted.key": [ 
                        { "uni.que": "u.q1", val: { first: "vc1.1", second: "vc1.2" }},
                        { "uni.que": "u.q2", val: { first: "vc2.1", second: "vc2.2" }}
                    ]
                }
            }, 
            rules: {
                b: "b",
                "c.dotted\\.key": {
                    "expander": {
                        type: "fluid.model.transform.arrayToObject",
                        inputPath: "a.dotted\\.key",
                        key: "uni.que"
                    }
                }
            },
            expectedInputPaths: [
                "b",
                "a.dotted\\.key"
            ], 
            expected: {
                b: {
                    b1: "hello",
                    b2: "hello"
                },
                c: {
                    "dotted.key": {
                        "u.q1": { val: { first: "vc1.1", second: "vc1.2" } },
                        "u.q2": { val: { first: "vc2.1", second: "vc2.2" } }
                    } 
                }
            },
            invertedRules: {
                expander: [ 
                    { 
                        type: 'fluid.model.transform.value',
                        inputPath: 'b',
                        outputPath: 'b'
                    }, {
                        type: "fluid.model.transform.objectToArray",
                        inputPath: "c.dotted\\.key",
                        outputPath: "a.dotted\\.key",
                        key: "uni.que"
                    }
                ]
            }
        }, {
            name: "basic Nested Transformation",
            expectPerfectInversion: false,
            raw: {
                foo: {
                    bar: [ 
                        { product: "salad", info: { price: 10, healthy: "yes" }},
                        { product: "candy", info: { price: 18, healthy: "no", tasty: "yes" }}
                    ]
                }
            }, 
            rules: {
                expander: {
                    type: "fluid.model.transform.arrayToObject",
                    inputPath: "foo.bar",
                    key: "product",
                    innerValue: [{
                        expander: {
                            type: "fluid.model.transform.value",
                            inputPath: "info.healthy"
                        }

                    }]
                }
            },
            expected: {
                "candy": "no",
                "salad": "yes"
            },
            invertedRules: {
                expander: [{
                    type: "fluid.model.transform.objectToArray",
                    outputPath: "foo.bar",
                    key: "product",
                    innerValue: [{
                        expander: [{
                            type: "fluid.model.transform.value",
                            inputPath: "",
                            outputPath: "info.healthy"
                        }]
                    }],
                    inputPath: ""
                }]
            }
        }, {
            name: "Nested Array transformations",
            expectPerfectInversion: true,
            raw: {
                outer: [
                    { 
                        outerpivot: "outerkey1",
                        outervar:  [
                            {
                                innerpivot: "innerkey1.1",
                                innervar: "innerval1.1.1",
                                innervarx: "innerval1.1.2"
                            },
                            {
                                innerpivot: "innerkey1.2",
                                innervar: "innerval1.2.1"
                            }
                        ]
                    }, {
                        outerpivot: "outerkey2",
                        outervar: [
                            {
                                innerpivot: "innerkey2.1",
                                innervar: "innerval2.1.1",
                                innervarx: "innerval2.1.2"
                            },
                            {
                                innerpivot: "innerkey2.2",
                                innervar: "innerval2.2.1"
                            }
                        ]
                    }
                ]
            }, 
            rules: {
                "outer": {
                    "expander": {
                        type: "fluid.model.transform.arrayToObject",
                        inputPath: "outer",
                        key: "outerpivot",
                        innerValue: [
                            {
                                "outervar": {
                                    "expander": {
                                        type: "fluid.model.transform.arrayToObject",
                                        inputPath: "outervar",
                                        key: "innerpivot"
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            expectedInputPaths: [
                "outer",
                "outervar"
            ], 
            expected: {
                "outer": {
                    "outerkey1": {
                        "outervar": {
                            "innerkey1.1": {
                                "innervar": "innerval1.1.1",
                                "innervarx": "innerval1.1.2"
                            },
                            "innerkey1.2": {
                                "innervar": "innerval1.2.1"
                            }
                        }
                    },
                    "outerkey2": {
                        "outervar": {
                            "innerkey2.1": {
                                "innervar": "innerval2.1.1",
                                "innervarx": "innerval2.1.2"
                            },
                            "innerkey2.2": {
                                "innervar": "innerval2.2.1"
                            }
                        }
                    }
                }
            },
            invertedRules: {
                "expander": [{
                    type: "fluid.model.transform.objectToArray",
                    inputPath: "outer",
                    outputPath: "outer",
                    key: "outerpivot",
                    innerValue: [{
                        expander: [{
                            type: "fluid.model.transform.objectToArray",
                            inputPath: "outervar",
                            outputPath: "outervar",
                            key: "innerpivot"
                        }]
                    }]
                }]
            }
        }, {
            name: "Multiple Nested Array transformations",
            expectPerfectInversion: true,
            raw: {
                outer: [
                    { 
                        outerpivot: "outerkey1",
                        outervar:  {
                            arr1: [
                                {
                                    innerpivot1: "arr1.1",
                                    innervar: "arr1.1.1"
                                },
                                {
                                    innerpivot1: "arr1.2",
                                    innervar: "arr1.2.1"
                                }
                            ],
                            arr2: [
                                {
                                    innerpivot2: "arr2.1",
                                    innervar: "arr2.1.1"
                                },
                                {
                                    innerpivot2: "arr2.2",
                                    innervar: "arr2.2.1"
                                }
                            ]
                        }
                    }
                ]
            }, 
            rules: {
                "outer": {
                    "expander": {
                        type: "fluid.model.transform.arrayToObject",
                        inputPath: "outer",
                        key: "outerpivot",
                        innerValue: [
                            {
                                "outervar.arr1": {
                                    "expander": {
                                        type: "fluid.model.transform.arrayToObject",
                                        inputPath: "outervar.arr1",
                                        key: "innerpivot1"
                                    }
                                }
                            }, 
                            {
                                "outervar.arr2": {
                                    "expander": {
                                        type: "fluid.model.transform.arrayToObject",
                                        inputPath: "outervar.arr2",
                                        key: "innerpivot2"
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            expectedInputPaths: [
                "outer",
                "outervar.arr1",
                "outervar.arr2"
            ],
            expected: {
                "outer": {
                    "outerkey1": {
                        "outervar": {
                            "arr1": {
                                "arr1.1": { "innervar": "arr1.1.1" },
                                "arr1.2": { "innervar": "arr1.2.1" }
                            },
                            "arr2": {
                                "arr2.1": { "innervar": "arr2.1.1" },
                                "arr2.2": { "innervar": "arr2.2.1" }
                            }
                        }
                    }
                }
            },
            invertedRules: {
                "expander": [{
                    type: "fluid.model.transform.objectToArray",
                    inputPath: "outer",
                    outputPath: "outer",
                    key: "outerpivot",
                    innerValue: [{
                        expander: [{
                            type: "fluid.model.transform.objectToArray",
                            inputPath: "outervar.arr1",
                            outputPath: "outervar.arr1",
                            key: "innerpivot1"
                        }]
                    }, {
                        expander: [{
                            type: "fluid.model.transform.objectToArray",
                            inputPath: "outervar.arr2",
                            outputPath: "outervar.arr2",
                            key: "innerpivot2"
                        }]
                    }]
                }]
            }
        }
    ];
            
    var arrayTest = function (json) {
        var description = json.name;
        var transformed = fluid.model.transformWithRules(json.raw, json.rules);
        jqUnit.assertDeepEq(description + " forward transformation", json.expected, transformed);
        // NOT YET IMPLEMENTED: FLUID-5051
        // var paths = fluid.model.transform.collectInputPaths(json.rules);
        // jqUnit.assertDeepEq(description+" path collection", json.expectedInputPaths, paths);
        var inverseRules = fluid.model.transform.invertConfiguration(json.rules);
        jqUnit.assertDeepEq(description + " inverted rules", json.invertedRules, inverseRules);        
        if (json.expectPerfectInversion === true) {
            var inverseTransformed = fluid.model.transformWithRules(json.expected, json.invertedRules);
            jqUnit.assertDeepEq(description + " inverted transformation", json.raw, inverseTransformed);
        }
    };

    jqUnit.test("arrayToObject and objectToArray transformation tests", function () {
        fluid.each(arrayObjectArrayTests, function (v) {
            arrayTest(v);
        });
    });

/* --------------- fixedArray to outputs -------------------- */
    var arrayToSetMembershipTests = [{
        name: "basic test",
        raw: {
            a: [ "foo", "bar" ]
        }, 
        rules: {
            "b": {
                "expander": {
                    type: "fluid.model.transform.arrayToSetMembership",
                    inputPath: "a",
                    presentValue: "yes",
                    missingValue: "no",
                    options: { //(paths)
                        "foo": "settingF", 
                        "bar": "settingB",
                        "tar": "settingT"
                    }
                }
            }
        },
        expected: {
            b: {
                settingF: "yes",
                settingB: "yes",
                settingT: "no"
            }
        },
        invertedRules: {
            expander: [ 
                {
                    type: "fluid.model.transform.setMembershipToArray",
                    outputPath: "a",
                    presentValue: "yes",
                    missingValue: "no",
                    options: {
                        "b.settingF": "foo", 
                        "b.settingB": "bar",
                        "b.settingT": "tar"
                    }
                }
            ]
        }
    }, {
        name: "basic test",
        raw: {
            a: [ "foo", "bar" ]
        }, 
        rules: {
            "b": {
                "expander": {
                    type: "fluid.model.transform.arrayToSetMembership",
                    inputPath: "a",
                    options: { //(paths)
                        "foo": "settingF", 
                        "bar": "settingB",
                        "tar": "settingT"
                    }
                }
            }
        },
        expected: {
            b: {
                settingF: true,
                settingB: true,
                settingT: false
            }
        },
        invertedRules: {
            expander: [ 
                {
                    type: "fluid.model.transform.setMembershipToArray",
                    outputPath: "a",
                    presentValue: true,
                    missingValue: false,
                    options: {
                        "b.settingF": "foo", 
                        "b.settingB": "bar",
                        "b.settingT": "tar"
                    }
                }
            ]
        }
    }];

    jqUnit.test("arrayToSetMembership and setMembershipToArray transformation tests", function () {
        fluid.each(arrayToSetMembershipTests, function (v) {
            arrayTest(v);
        });
    });

})(jQuery);
