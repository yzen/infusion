/*
Copyright 2008-2009 University of Cambridge
Copyright 2008-2009 University of Toronto
Copyright 2007-2009 University of California, Berkeley

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://source.fluidproject.org/svn/LICENSE.txt
*/

/*global jQuery*/
/*global fluid_1_2*/

fluid_1_2 = fluid_1_2 || {};

(function ($, fluid) {

    /** Returns an array of size count, filled with increasing integers, 
     *  starting at 0 or at the index specified by first. 
     */
    
    fluid.iota = function (count, first) {
        first = first || 0;
        var togo = [];
        for (var i = 0; i < count; ++ i) {
            togo[togo.length] = first++;
        }
        return togo;
    };
 
    /*******************
     * Pager Component *
     *******************/
    
    fluid.pager = function () {
        return fluid.pagerImpl.apply(null, arguments);
    };

    fluid.demands("fluid.pager.directPageSize", "fluid.pager", 
      ["{pager}.dom", "{pager}.events", "{pager}.applier"]);

    fluid.pager.directPageSize = function (dom, events, applier) {
        var node = dom.locate("pageSize");
        if (node.length > 0) {
            that.events.modelChanged.addListener(
                function (newModel, oldModel) {
                    if (node.val() !== newModel.pageSize) {
                        node.val(newModel.pageSize);
                    }
                }
            );
            node.change(function () {
                applier.requestChange("pageSize", node.val());
                //that.events.initiatePageSizeChange.fire(node.val());
            });
        }
    };

    /******************
     * Pager Bar View *
     ******************/

    
    function updateStyles(pageListThat, newModel, oldModel, styles) {
        if (!pageListThat.pageLinks) {
            return;
        }
        if (oldModel.pageIndex !== undefined) {
            var oldLink = pageListThat.pageLinks.eq(oldModel.pageIndex);
            oldLink.removeClass(styles.currentPage);
        }
        var pageLink = pageListThat.pageLinks.eq(newModel.pageIndex);
        pageLink.addClass(styles.currentPage); 


    }
    
    function bindLinkClick(link, events, eventArg) {
        link.unbind("click.fluid.pager");
        link.bind("click.fluid.pager", function () {events.initiatePageChange.fire(eventArg); });
    }
    // Given the "totalRange" and current page size, compute the total number of pages 
    // 10 -> 1, 11 -> 2
    fluid.pager.computePageCount = function(model) {
        return Math.max(1, Math.floor((model.totalRange - 1) / model.pageSize) + 1);
    }
    // Compute the number of elements visible on the current page
    fluid.pager.computePageLimit = function (model) {
        return Math.min(model.totalRange, (model.pageIndex + 1) * model.pageSize);
    }

    fluid.demands("fluid.pager.summary", "fluid.pager", ["{pager}.dom", fluid.COMPONENT_OPTIONS]);

    fluid.pager.summary = function (dom, options) {
        var node = dom.locate("summary");
        return {
            returnedOptions: {
                listeners: {
                    modelChanged: function (newModel, oldModel) {
                        var text = fluid.stringTemplate(options.message, {
                            first: newModel.pageIndex * newModel.pageSize + 1,
                            last: newModel.pageLimit,
                            total: newModel.totalRange
                        });
                        if (node.length > 0) {
                            node.text(text);
                        }
                    }
                }
            }
        };
    };
   
       
    fluid.demands("fluid.pager.directPageList", "fluid.pager", 
        ["{pagerBar}.options.styles", "{pagerBar}.dom", "{pager}.events"]);
   
    fluid.pager.directPageList = function (styles, dom, events) {
        var that = fluid.initLittleComponent("fluid.pager.directPageList");
        that.pageLinks = dom.locate("pageLinks");
        for (var i = 0; i < that.pageLinks.length; ++ i) {
            var pageLink = that.pageLinks.eq(i);
            bindLinkClick(pageLink, events, {pageIndex: i});
        }
        events.modelChanged.addListener(
            function (newModel, oldModel) {
                updateStyles(that, newModel, oldModel, styles);
            }
        );
        that.defaultModel = {
            pageIndex: undefined,
            pageSize: 1,
            totalRange: that.pageLinks.length
        };
        return that;
    };
    
    fluid.demands("fluid.pager.initialModelDeterminer", "fluid.pager.directPageList",
        {funcName: "fluid.identity", args: ["{fluid.pager.directPageList}.defaultModel"]});
  

    fluid.pager.everyPageStrategy = fluid.iota;
    
    fluid.pager.gappedPageStrategy = function (locality, midLocality) {
        if (!locality) {
            locality = 3;
        }
        if (!midLocality) {
            midLocality = locality;
        }
        return function (count, first, mid) {
            var togo = [];
            var j = 0;
            var lastSkip = false;
            for (var i = 0; i < count; ++ i) {
                if (i < locality || (count - i - 1) < locality || (i >= mid - midLocality && i <= mid + midLocality)) {
                    togo[j++] = i;
                    lastSkip = false;
                }
                else if (!lastSkip) {
                    togo[j++] = -1;
                    lastSkip = true;
                }
            }
            return togo;
        };
    };

    fluid.demands("fluid.pager.rendererdPageList", "fluid.pager", 
        ["{pagerBar}.container", 
           {"selectors": "{pagerBar}.options.selectors",
            "strings": "{pager}.options.strings",
            "events": "{pager}.events",
            "": fluid.COMPONENT_OPTIONS}]);
            
    
    fluid.pager.renderedPageList = function (container, options) {
        var that = fluid.initView("fluid.pager.renderedPageList", container, options);
        options = that.options;
        var renderOptions = {
            cutpoints: [ {
                id: "page-link:link",
                selector: options.selectors.pageLinks
            },
            {
                id: "page-link:skip",
                selector: options.selectors.pageLinkSkip
            },
            {
                id: "page-link:disabled",
                selector: options.selectors.pageLinkDisabled
            }]
        };
        
        if (options.linkBody) {
            renderOptions.cutpoints[renderOptions.cutpoints.length] = {
                id: "payload-component",
                selector: options.linkBody
            };
        }        
        function pageToComponent(current) {
            return function (page) {
                return page === -1? {
                    ID: "page-link:skip"
                } : 
                {
                    ID: page === current? "page-link:link": "page-link:link",
                    localID: page + 1,
                    value: page + 1,
                    pageIndex: page,
                    decorators: [
                        {type: "jQuery",
                             func: "click", 
                             args: function () {options.events.initiatePageChange.fire({pageIndex: page}); }
                         },
                        {type: page === current? "addClass" : "",
                             classes: options.styles.currentPage}
                         ]
                };
            };
        }
        var root = that.locate("root");
        fluid.expectFilledSelector(root, "Error finding root template for fluid.pager.renderedPageList");
        
        var template = fluid.selfRender(root, {}, renderOptions);
        options.events.modelChanged.addListener(
            function (newModel, oldModel) {
                var pages = options.pageStrategy(newModel.pageCount, 0, newModel.pageIndex);
                var pageTree = fluid.transform(pages, pageToComponent(newModel.pageIndex));
                pageTree[pageTree.length - 1].value = pageTree[pageTree.length - 1].value + options.strings.last;
                options.events.onRenderPageLinks.fire(pageTree, newModel);
                fluid.reRender(template, root, pageTree, renderOptions);
                updateStyles(that, newModel, oldModel, styles);
            }
        );
        return that;
    };
    
    fluid.defaults("fluid.pager.renderedPageList", {
            selectors: {
                root: ".flc-pager-links"
            },
            linkBody: "a",
            pageStrategy: fluid.pager.everyPageStrategy
        }
    );
    
    var updatePreviousNext = function (that, styles, newModel) {
        if (newModel.pageIndex === 0) {
            that.previous.addClass(styles.disabled);
        } else {
            that.previous.removeClass(styles.disabled);
        }
        
        if (newModel.pageIndex === newModel.pageCount - 1) {
            that.next.addClass(styles.disabled);
        } else {
            that.next.removeClass(styles.disabled);
        }
    };

    fluid.demands("fluid.pager.previousNext", "fluid.pager", 
       ["{pagerBar}.container", "{pagerBar}.options.styles", 
                                "{pagerBar}.dom",
                                "{pager}.events"]);
    
    fluid.pager.previousNext = function (container, styles, dom, events) {
        var that = fluid.initLittleComponent("fluid.pager.previousNext");
        that.previous = dom.locate("previous");
        bindLinkClick(that.previous, events, {relativePage: -1});
        that.next = dom.locate("next");
        bindLinkClick(that.next, events, {relativePage: +1});
        events.modelChanged.addListener(
            function (newModel, oldModel, overallThat) {
                updatePreviousNext(that, styles, newModel);
            }
        );
        return that;
    };


    fluid.makeComponents({"fluid.pager.pagerBar": "fluid.standardComponent"});
    
    
    fluid.defaults("fluid.pager.pagerBar", {
        components: {
            previousNext: {
                type: "fluid.pager.previousNext"
            },
            
            pageList: {
                type: "fluid.pager.directPageList"
            }
        },
        
        selectors: {
            pageLinks: ".flc-pager-pageLink",
            pageLinkSkip: ".flc-pager-pageLink-skip",
            pageLinkDisabled: ".flc-pager-pageLink-disabled",
            previous: ".flc-pager-previous",
            next: ".flc-pager-next"
        },
        
        styles: {
            currentPage: "fl-pager-currentPage",
            disabled: "fl-pager-disabled"
        }
    });
    
    function conformPageIndex(pageIndex, model) {
        if (pageIndex < 0 || !pageIndex) {
            pageIndex = 0;
        }
        if (pageIndex >= model.pageCount) {
            pageIndex = model.pageCount - 1;
        }
        return pageIndex;      
    }
    
    function pageIndexConformingGuard(model, changeRequest) {
        if (changeRequest.path === "pageIndex") {
            changeRequest.value = conformPageIndex(changeRequest.value, model);
        }
    }
    
    function modelConformingGuard(model, changes, applier) {
        applier.requestChange("pageCount", fluid.pager.computePageCount(model));
        applier.requestChange("pageIndex", conformPageIndex(model.pageIndex, model));
        applier.requestChange("pageLimit", fluid.pager.computePageLimit(model));
    }

      // To go into PagedTable
      //var sorted = isCurrentColumnSortable(getColumnDefs(that), newModel) ? 
      //    that.options.sorter(that, newModel) : null;
      //that.permutation = sorted;
    
    fluid.pagerImpl = function (container, options) {
        var that = fluid.initView("fluid.pager", container, options);
 
        that.model = {};
        that.applier = fluid.makeChangeApplier(that.model, {transactional: true, cullUnchanged: true});
        $.extend(true, that.model, that.options.model);
        
        fluid.initDependents(that, options);
        var applier = that.applier;
 
        applier.guards.addListener("!pageIndex", pageIndexConformingGuard);
        applier.postGuards.addListener("!*", modelConformingGuard);
        applier.modelChanged.addListener("!*", function(newModel, oldModel, changes) {
            that.events.modelChanged.fire(newModel, oldModel, that);
        });
        
        that.events.initiatePageChange.addListener(
            function (arg) {
                var pageIndex = arg.relativePage === undefined? arg.pageIndex : that.model.pageIndex + arg.relativePage;
                applier.requestChange("pageIndex", pageIndex); 
            }
        );

        var initialModel = that.initialModelDeterminer? that.initialModelDeterminer() : undefined;

        var fullModel = $.extend(true, {}, that.options.model, initialModel);

        that.applier.requestChange("", fullModel);
        if (that.model.totalRange === undefined) {
            fluid.fail("Error in Pager configuration - cannot determine total range, " +
                " since not configured in model.totalRange and no initialModelDeterminer is configured");
        }

        return that;
    };
    

    
    fluid.defaults("fluid.tooltip", {
        delay: 300,
        id: "tooltip"
        });
 
    fluid.demands("pagerBar", "fluid.pager", ["{pager}.options.selectors.pagerBar", fluid.COMPONENT_OPTIONS]);
    fluid.demands("pagerBarSecondary", "fluid.pager", ["{pager}.options.selectors.pagerBarSecondary", fluid.COMPONENT_OPTIONS]);
        
    fluid.defaults("fluid.pager", {
        components: {
            pagerBar: {
                type: "fluid.pager.pagerBar"},
            pagerBarSecondary: {
                type: "fluid.pager.pagerBar"},
            summary: {
                type: "fluid.pager.summary", 
                options: {
                    message: "%first-%last of %total items"
                }
            },
            pageSize: {
                type: "fluid.pager.directPageSize"
            },
        
        },
        
        model: {
            pageIndex: 0,
            pageSize: 10,
            totalRange: undefined
        },
        
        invokers: {
            initialModelDeterminer: "fluid.pager.initialModelDeterminer"
        },
       
        selectors: {
            pagerBar: ".flc-pager-top",
            pagerBarSecondary: ".flc-pager-bottom",
            summary: ".flc-pager-summary",
            pageSize: ".flc-pager-page-size",
        },
        
        styles: {
            tooltip: "fl-pager-tooltip",
        },
        
        strings: {
            last: " (last)"
        },
        
        events: {
            initiatePageChange: null,
            modelChanged: null,
            onRenderPageLinks: null
        }
    });
})(jQuery, fluid_1_2);
