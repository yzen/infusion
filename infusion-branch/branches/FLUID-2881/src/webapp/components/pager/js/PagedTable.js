/*
Copyright 2008-2009 University of Cambridge
Copyright 2008-2009 University of Toronto

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

    fluid.demands("fluid.table.modelFilter", "fluid.table", 
        {funcName: "fluid.table.directModelFilter", args: ["{table}.model", "{table}.perm", "{pager}.pageStart", "{pager}.pageLimit"]});

    fluid.pager.directModelFilter = function (tableModel, pagerModel, perm) {
        var start = pagerModel.pageIndex * pagerModel.pageSize;
        var limit = computePageLimit(pagerModel);
        return fluid.table.directModelFilter(tableModel, perm, start, limit);
    };

    fluid.pager.rangeAnnotator = function (that, options) {
        var roots = {};
        that.events.onRenderPageLinks.addListener(function (tree, newModel) {
            var column = that.options.annotateColumnRange;
            var dataModel = that.options.dataModel;
            // TODO: reaching into another component's options like this is a bit unfortunate
            var columnDefs = getColumnDefs(that);

            if (!column || !dataModel || !columnDefs) {
                return;
            }
            var columnDef = fluid.pager.findColumnDef(columnDefs, column);
            
            function fetchValue(index) {
                index = that.permutation? that.permutation[index] : index;
                return fluid.pager.fetchValue(that, dataModel, index, columnDef.valuebinding, roots);
            }
            var tModel = {};
            fluid.model.copyModel(tModel, newModel);
            
            fluid.transform(tree, function (cell) {
                if (cell.ID === "page-link:link") {
                    var page = cell.pageIndex;
                    var start = page * tModel.pageSize;
                    tModel.pageIndex = page;
                    var limit = computePageLimit(tModel);
                    var iValue = fetchValue(start);
                    var lValue = fetchValue(limit - 1);
                    
                    var text = "<b>" + iValue + "</b><br/>&mdash;<br/><b>" + lValue + "</b>";
                    
                    var decorator = {
                        type: "jQuery",
                        func: "tooltip",
                        args: {
                            delay: that.options.tooltipDelay,
                            extraClass: that.options.styles.tooltip,
                            bodyHandler: function () { 
                                return text; 
                            },
                            showURL: false,
                            id: that.options.tooltipId
                        }
                    };
                    cell.decorators.push(decorator);
                }
            });
        });
    };

    fluid.makeComponents({"fluid.pagedTable": "fluid.standardComponent"});

    fluid.defaults("fluid.pagedTable", {
        components: {
            pager: {type: "fluid.pager"},
            table: {type: "fluid.table"},
            rangeAnnotator: {
              type: "fluid.pager.rangeAnnotator"
            }
        },
        annotateColumnRange: undefined,
                

        });   

})(jQuery, fluid_1_2);