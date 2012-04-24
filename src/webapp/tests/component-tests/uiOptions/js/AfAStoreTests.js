/*
Copyright 2012 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global fluid, jqUnit, expect, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

(function ($) {
    $(document).ready(function () {

        // UIO automatically saves all settings all the time, so any UIO object that is to be
        // processed will always contain all of these properties
        // On the other hand, when creating a UIO settings object, we don't need to create all of them
        var testUIOSettingsAll = {
            // NOTE: settings that AfA doesn't support still need to be preserved
            textSize: "1.6",
            textFont: "times",
            theme: "yb",
            lineSpacing: 1.4,
            toc: true,
            links: true,
            inputsLarger: true,
            layout: true,
            captions: true,
            transcripts: true,
            language: "fr",
            volume: 42
        };

        // An AfA settings object will not necessarily contain all of these preferences
        var testAfASettingsAll = {
            // we'll need to preserve unsupported settings (e.g. magnification)
            display: {
                screenEnhancement: {
                    fontFace: {
                        fontName: ["Times New Roman"], // necessary?
                        genericFontFace: "serif"
                    },
                    fontSize: "19.2",
                    foregroundColor: "yellow", // what format should these be?
                    backgroundColor: "black",  // hex? rgb? css strings?
                    invertColourChoice: false
                }
            },
            control: {
                structuralNavigation: {
                    tableOfContents: true
                }
            },
            content: {
                adaptationPreference: [{
                    adaptationType: "caption",
                    language: "fr"
                },{
                    representationForm: ["transcript"],
                    language: "fr"
                }]
            }
        };
        




        var tests = new jqUnit.TestCase("Access for All Store Tests");

        /**
         *  Test font transformations
         */

        tests.test("UIO to AfA: fonts", function () {
            var afaResult = fluid.afaStore.UIOtoAfA({textFont: "times"});
            jqUnit.assertEquals("Font name for 'times'", "Times New Roman", afaResult.display.screenEnhancement.fontFace.fontName[0]);
            jqUnit.assertEquals("Font face for 'times'", "serif", afaResult.display.screenEnhancement.fontFace.genericFontFace);

            afaResult = fluid.afaStore.UIOtoAfA({textFont: "verdana"});
            jqUnit.assertEquals("Font name for 'verdana'", "Verdana", afaResult.display.screenEnhancement.fontFace.fontName[0]);
            jqUnit.assertEquals("Font face for 'verdana'", "sans serif", afaResult.display.screenEnhancement.fontFace.genericFontFace);

            afaResult = fluid.afaStore.UIOtoAfA({textFont: "default"});
            jqUnit.assertUndefined("No result for 'default'", afaResult.screenEnhancement);
        });
        tests.test("AfA to UIO: fonts", function () {
            var afaFontFamilySettings = {
                display: {
                    screenEnhancement: {
                        fontFace: {
                            // For this iteration, we're going to ignore the font name
                            genericFontFace: "serif"
                        }
                    }
                }
            };
            var uioResult = fluid.afaStore.AfAtoUIO(afaFontFamilySettings);
            jqUnit.assertEquals("serif", "times", uioResult.textFont);

            afaFontFamilySettings.display.screenEnhancement.fontFace.genericFontFace = "sans serif";
            uioResult = fluid.afaStore.AfAtoUIO(afaFontFamilySettings);
            jqUnit.assertEquals("sans serif", "verdana", uioResult.textFont);

            afaFontFamilySettings.display.screenEnhancement.fontFace.genericFontFace = "monospaced";
            uioResult = fluid.afaStore.AfAtoUIO(afaFontFamilySettings);
            jqUnit.assertEquals("monospaced", "default", uioResult.textFont);

            afaFontFamilySettings.display.screenEnhancement.fontFace.genericFontFace = "fantasy";
            uioResult = fluid.afaStore.AfAtoUIO(afaFontFamilySettings);
            jqUnit.assertEquals("fantasy", "default", uioResult.textFont);

            afaFontFamilySettings.display.screenEnhancement.fontFace.genericFontFace = "cursive";
            uioResult = fluid.afaStore.AfAtoUIO(afaFontFamilySettings);
            jqUnit.assertEquals("cursive", "default", uioResult.textFont);

            uioResult = fluid.afaStore.AfAtoUIO({});
            jqUnit.assertUndefined("no result for no setting", uioResult.textFont);
        });

        /**
         *  Test table of contents transformations
         */

        tests.test("UIO to AfA: Table of contents", function () {
            var afaResult = fluid.afaStore.UIOtoAfA({toc: true});
            jqUnit.assertEquals("Table of contents on", true, afaResult.control.structuralNavigation.tableOfContents);

            var afaResult = fluid.afaStore.UIOtoAfA({toc: false});
            jqUnit.assertEquals("Table of contents off", false, afaResult.control.structuralNavigation.tableOfContents);

            var afaResult = fluid.afaStore.UIOtoAfA({});
            jqUnit.assertUndefined("no result for no setting", afaResult.control);
        });
        tests.test("AfA to UIO: Table of contents", function () {
            var afaTocSettings = {
                control: {
                    structuralNavigation: {
                        tableOfContents: true
                    }
                }
            };
            var uioResult = fluid.afaStore.AfAtoUIO(afaTocSettings);
            jqUnit.assertEquals("Table of contents: true", true, uioResult.toc);

            afaTocSettings.control.structuralNavigation.tableOfContents = false;
            uioResult = fluid.afaStore.AfAtoUIO(afaTocSettings);
            jqUnit.assertEquals("Table of contents: false", false, uioResult.toc);

            uioResult = fluid.afaStore.AfAtoUIO({});
            jqUnit.assertUndefined("no result for no setting", uioResult.toc);
        });

        /**
         *  Test caption transformations
         */
        tests.test("UIO to AfA: Captions", function () {
            var uioCaptions = {
                captions: true,
                language: "fr"
            };
            var expectedAfa = {
                content: {
                    adaptationPreference: [{
                        adaptationType: "caption",
                        language: "fr"
                    },{
                        // for now we assume there are always two adaptationPreferences,
                        // and first one is captions
                    }]
                }
            };
            var afaResult = fluid.afaStore.UIOtoAfA(uioCaptions);
            jqUnit.assertEquals("adaptation type", expectedAfa.content.adaptationPreference[0].adaptationType, afaResult.content.adaptationPreference[0].adaptationType);
            jqUnit.assertEquals("Caption language", expectedAfa.content.adaptationPreference[0].language, afaResult.content.adaptationPreference[0].language);
            
            afaResult = fluid.afaStore.UIOtoAfA({});
            jqUnit.assertDeepEq("Empty object for no setting", {}, afaResult.content.adaptationPreference[0]);
        });
        tests.test("AfA to UIO: Captions", function () {
            var afaCaptions = {
                content: {
                    adaptationPreference: [{
                        adaptationType: "caption",
                        language: "fr"
                    }]
                }
            };
            var expectedUIO = {
                captions: true,
                language: "fr"
            };
            var uioResult = fluid.afaStore.AfAtoUIO(afaCaptions);
            jqUnit.assertEquals("Captions", expectedUIO.captions, uioResult.captions);
            jqUnit.assertEquals("language", expectedUIO.language, uioResult.language);
        });

        /**
         *  Test transcript transformations
         */

        tests.test("UIO to AfA: Transcripts", function () {
            var uioTranscripts = {
                transcripts: true,
                language: "es"
            };
            var expectedAfa = {
                content: {
                    adaptationPreference: [{
                        // for now we assume there are always two adaptationPreferences,
                        // and second one is captions
                    },{
                        representationForm: ["transcript"],
                        language: "es"
                    }]
                }
            };
            var afaResult = fluid.afaStore.UIOtoAfA(uioTranscripts);
            jqUnit.assertEquals("representation form", expectedAfa.content.adaptationPreference[1].representationForm[0], afaResult.content.adaptationPreference[1].representationForm[0]);
            jqUnit.assertEquals("Transcript language", expectedAfa.content.adaptationPreference[1].language, afaResult.content.adaptationPreference[1].language);
            
            afaResult = fluid.afaStore.UIOtoAfA({});
            jqUnit.assertDeepEq("Empty object for no setting", {}, afaResult.content.adaptationPreference[1]);
        });
        tests.test("AfA to UIO: Transcripts", function () {
            var afaTranscript = {
                content: {
                    adaptationPreference: [{
                        representationForm: ["transcript"],
                        language: "fr"
                    }]
                }
            };
            var expectedUIO = {
                transcripts: true,
                language: "fr"
            };
            var uioResult = fluid.afaStore.AfAtoUIO(afaTranscript);
            jqUnit.assertEquals("Transcripts", expectedUIO.transcripts, uioResult.transcripts);
            jqUnit.assertEquals("language", expectedUIO.language, uioResult.language);
        });


        /**
         * Test both captions and transcripts
         */
        tests.test("UIO to AfA: Captions and Transcripts", function () {
            var uioCaptions = {
                captions: true,
                transcripts: true,
                language: "eo"
            };
            var expectedAfa = {
                content: {
                    adaptationPreference: [{
                        adaptationType: "caption",
                        language: "eo"
                    },{
                        representationForm: ["transcript"],
                        language: "eo"
                    }]
                }
            };
            var afaResult = fluid.afaStore.UIOtoAfA(uioCaptions);
            jqUnit.assertEquals("adaptation type", expectedAfa.content.adaptationPreference[0].adaptationType, afaResult.content.adaptationPreference[0].adaptationType);
            jqUnit.assertEquals("Caption language", expectedAfa.content.adaptationPreference[0].language, afaResult.content.adaptationPreference[0].language);
            jqUnit.assertEquals("representation form", expectedAfa.content.adaptationPreference[1].representationForm[0], afaResult.content.adaptationPreference[1].representationForm[0]);
            jqUnit.assertEquals("Transcript language", expectedAfa.content.adaptationPreference[1].language, afaResult.content.adaptationPreference[1].language);
        });
        tests.test("AfA to UIO: Captions and Transcripts", function () {
            var expectedUIO = {
                captions: true,
                transcripts: true,
                language: "eo"
            };
            var afaAdaptations = {
                content: {
                    adaptationPreference: [{
                        adaptationType: "caption",
                        language: "eo"
                    },{
                        representationForm: ["transcript"],
                        language: "es"
                    }]
                }
            };
            var uioResult = fluid.afaStore.AfAtoUIO(afaAdaptations);
            jqUnit.assertEquals("Captions", expectedUIO.captions, uioResult.captions);
            jqUnit.assertEquals("Transcripts", expectedUIO.transcripts, uioResult.transcripts);
            jqUnit.assertEquals("language", expectedUIO.language, uioResult.language);
        });




        tests.test("AfA caption and transcript language different", function () {});

        tests.test("Extra settings preserved", function () {

        });

    });
})(jQuery);
