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

    /** Table Component **/

    fluid.table.findColumnDef = function (columnDefs, key) {
        var columnDef = $.grep(columnDefs, function (def) {
            return def.key === key;
        })[0];
        return columnDef;
    };
    
    function getRoots(target, overallThat, index) {
        var cellRoot = (overallThat.options.dataOffset? overallThat.options.dataOffset + ".": "");
        target.shortRoot = index;
        target.longRoot = cellRoot + target.shortRoot;
    }
    
    function expandPath(EL, shortRoot, longRoot) {
        if (EL.charAt(0) === "*") {
            return longRoot + EL.substring(1); 
        }
        else {
            return EL.replace("*", shortRoot);
        }
    }
    
    fluid.table = function() {
        return fluid.tableImpl.apply(null, arguments);
    };
    
    fluid.table.fetchValue = function (that, dataModel, index, valuebinding, roots) {
        getRoots(roots, that, index);

        var path = expandPath(valuebinding, roots.shortRoot, roots.longRoot);
        return fluid.model.getBeanValue(dataModel, path);
    };
    
    fluid.table.basicSorter = function (overallThat, model) {        
        var dataModel = overallThat.options.dataModel;
        var roots = {};
        var columnDefs = getColumnDefs(overallThat);
        var columnDef = fluid.table.findColumnDef(columnDefs, model.sortKey);
        var sortrecs = [];
        for (var i = 0; i < model.totalRange; ++ i) {
            sortrecs[i] = {
                index: i,
                value: fluid.table.fetchValue(overallThat, dataModel, i, columnDef.valuebinding, roots)
            };
        }
        var columnType = typeof sortrecs[0].value;
        function sortfunc(arec, brec) {
            var a = arec.value;
            var b = brec.value;
            return a === b? 0 : (a > b? model.sortDir : -model.sortDir); 
        }
        sortrecs.sort(sortfunc);
        return fluid.transform(sortrecs, function (row) {return row.index; });
    };

    fluid.demands("fluid.table.modelFilter", "fluid.table", 
        {funcName: "fluid.table.directModelFilter", args: ["{table}.model", "{table.perm}"]});
        
    fluid.table.directModelFilter = function (tableModel, perm, start, limit) {
        var togo = [];
        if (start === undefined) {
            start = 0;
        }
        if (limit === undefined) {
            limit = tableModel.length;
        }
        for (var i = start; i < limit; ++ i) {
            var index = perm? perm[i]: i;
            togo[togo.length] = {index: index, row: tableModel[index]};
        }
        return togo;
    };
    
    function expandVariables(value, opts) {
        var togo = "";
        var index = 0;
        while (true) {
            var nextindex = value.indexOf("${", index);
            if (nextindex === -1) {
                togo += value.substring(index);
                break;
            }
            else {
                togo += value.substring(index, nextindex);
                var endi = value.indexOf("}", nextindex + 2);
                var EL = value.substring(nextindex + 2, endi);
                if (EL === "VALUE") {
                    EL = opts.EL;
                }
                else {
                    EL = expandPath(EL, opts.shortRoot, opts.longRoot);
                }

                var val = fluid.model.getBeanValue(opts.dataModel, EL);
                togo += val;
                index = endi + 1;
            }
        }
        return togo;
    }
   
    function expandPaths(target, tree, opts) {
        for (var i in tree) {
            var val = tree[i];
            if (val === fluid.VALUE) {
                if (i === "valuebinding") {
                    target[i] = opts.EL;
                }
                else {
                    target[i] = {"valuebinding" : opts.EL};
                }
            }
            else if (i === "valuebinding") {
                target[i] = expandPath(tree[i], opts);
            }
            else if (typeof(val) === 'object') {
                target[i] = val.length !== undefined? [] : {};
                expandPaths(target[i], val, opts);
            }
            else if (typeof(val) === 'string') {
                target[i] = expandVariables(val, opts);
            }
            else {target[i] = tree[i]; }
        }
        return target;
    }
   
   // sets opts.EL, returns ID
    function iDforColumn(columnDef, opts) {
        var options = opts.options;
        var EL = columnDef.valuebinding;
        var key = columnDef.key;
        if (!EL) {
            fluid.fail("Error in definition for column with key " + key + ": valuebinding is not set");
        }
        opts.EL = expandPath(EL, opts.shortRoot, opts.longRoot);
        if (!key) {
            var segs = fluid.model.parseEL(EL);
            key = segs[segs.length - 1];
        }
        var ID = (options.keyPrefix? options.keyPrefix : "") + key;
        return ID;
    }
   
    function expandColumnDefs(filteredRow, opts) {
        var tree = fluid.transform(opts.columnDefs, function (columnDef) {
            var ID = iDforColumn(columnDef, opts);
            var togo;
            if (!columnDef.components) {
                return {
                    ID: ID,
                    valuebinding: opts.EL
                };
            }
            else if (typeof columnDef.components === 'function') {
                togo = columnDef.components(filteredRow.row, filteredRow.index);
            }
            else {
                togo = columnDef.components;
            }
            togo = expandPaths({}, togo, opts);
            togo.ID = ID;
            return togo;
        });
        return tree;
    }
   
    function fetchModel(overallThat) {
        return fluid.model.getBeanValue(overallThat.options.dataModel, 
            overallThat.options.dataOffset);
    }
   
    
    function bigHeaderForKey(key, opts) {
        var id = opts.options.renderOptions.idMap["header:" + key];
        var smallHeader = fluid.jById(id);
        if (smallHeader.length === 0) {return null; }
        var headerSortStylisticOffset = opts.overallOptions.selectors.headerSortStylisticOffset;
        var bigHeader = fluid.findAncestor(smallHeader, function (element) {
            return $(element).is(headerSortStylisticOffset); });
        return bigHeader;
    }
   
    function setSortHeaderClass(styles, element, sort) {
        element = $(element);
        element.removeClass(styles.ascendingHeader);
        element.removeClass(styles.descendingHeader);
        if (sort !== 0) {
            element.addClass(sort === 1? styles.ascendingHeader : styles.descendingHeader);
        }
    }
    
    function isCurrentColumnSortable(columnDefs, model) {
        var columnDef = model.sortKey? fluid.pager.findColumnDef(columnDefs, model.sortKey) : null;
        return columnDef ? columnDef.sortable : false;
    };
    
    function setModelSortHeaderClass(newModel, opts) {
        var styles = opts.overallOptions.styles;
        var sort = isCurrentColumnSortable(opts.columnDefs, newModel) ? newModel.sortDir : 0;
        setSortHeaderClass(styles, bigHeaderForKey(newModel.sortKey, opts), sort);
    }
   
 
    function generateColumnClick(overallThat, columnDef, opts) {
        return function () {
            if (columnDef.sortable === true) {
              // !!!! This will be shared model with Pager!!!!
                var model = overallThat.model;
                var newModel = fluid.copy(model);
                var styles = overallThat.options.styles;
                var oldKey = model.sortKey;
                if (columnDef.key !== model.sortKey) {
                    newModel.sortKey = columnDef.key;
                    newModel.sortDir = 1;
                    var oldBig = bigHeaderForKey(oldKey, opts);
                    if (oldBig) {
                        setSortHeaderClass(styles, oldBig, 0);
                    }
                }
                else if (newModel.sortKey === columnDef.key) {
                    newModel.sortDir = -1 * newModel.sortDir;
                }
                else {return false; }
                newModel.pageIndex = 0;
                fireModelChange(overallThat, newModel, true);
                setModelSortHeaderClass(newModel, opts);                
            }
            return false;
        };
    }
   
    function fetchHeaderDecorators(decorators, columnDef) {
        return decorators[columnDef.sortable? "sortableHeader" : "unsortableHeader"];
    }
   
    function generateHeader(overallThat, columnDefs, opts) {
        return {
            children:  
                fluid.transform(columnDefs, function (columnDef) {
                return {
                    ID: iDforColumn(columnDef, opts),
                    value: columnDef.label,
                    decorators: [
                        {"jQuery": ["click", generateColumnClick(overallThat, columnDef, opts)]},
                        {identify: "header:" + columnDef.key}].concat(fetchHeaderDecorators(opts.overallOptions.decorators, columnDef))
                };
            }
       )};
    }
   
    fluid.demands("fluid.table", "fluid.table.selfRender", 
    ["{table}.container", {
     "columnDefs": "{table}.columnDefs",
     "model": "{table}.model",
     
    "": fluid.COMPONENT_OPTIONS}]);
    /** A body renderer implementation which uses the Fluid renderer to render a table section **/
   
    fluid.table.selfRender = function (container, options) {
        var that = fluid.initView("fluid.table.selfRender", container, options);
        var options = that.options;
        options.renderOptions.idMap = options.renderOptions.idMap || {};
        var idMap = options.renderOptions.idMap;
        var root = that.locate("root");
        var template = fluid.selfRender(root, {}, options.renderOptions);
        root.addClass(options.styles.root);
        var expOpts = {options: options, columnDefs: columnDefs, overallOptions: overallThat.options, dataModel: overallThat.options.dataModel, idMap: idMap};
        var directModel = fetchModel(overallThat);

        return {
            returnedOptions: {
                listeners: {
                    onModelChange: function (newModel, oldModel) {
                        var filtered = overallThat.options.modelFilter(directModel, newModel, overallThat.permutation);
                        var tree = fluid.transform(filtered, 
                            function (filteredRow) {
                                var roots = getRoots(expOpts, overallThat, filteredRow.index);
                                if (columnDefs === "explode") {
                                    return fluid.explode(filteredRow.row, root);
                                }
                                else if (columnDefs.length) {
                                    return expandColumnDefs(filteredRow, expOpts);
                                }
                            }
                            );
                        var fullTree = {};
                        fullTree[options.row] = tree;
                        if (typeof(columnDefs) === "object") {
                            fullTree[options.header] = generateHeader(overallThat, columnDefs, expOpts);
                        }
                        options.renderOptions = options.renderOptions || {};
                        options.renderOptions.model = expOpts.dataModel;
                        fluid.reRender(template, root, fullTree, options.renderOptions);
                        setModelSortHeaderClass(newModel, expOpts); // TODO, should this not be actually renderable?
                    }
                }
            }
        };
    };

    fluid.defaults("fluid.table.selfRender", {
        selectors: {
            root: ".flc-table-body-template"
        },
        
        styles: {
            root: "fl-table"
        },
        
        keyStrategy: "id",
        keyPrefix: "",
        row: "row:",
        header: "header:",
        // Options passed upstream to the renderer
        renderOptions: {}
    });
    
    
    fluid.table = function(container, options) {
        var that = fluid.initView(container, options);
        
       //that.bodyRenderer = fluid.initSubcomponent(that, "bodyRenderer", [that, fluid.COMPONENT_OPTIONS]);
       
        fluid.initDependents(that, options);
        return that;
    };
    
    
    fluid.defaults("fluid.table", {
        selectors: {
            headerSortStylisticOffset: ".flc-table-sort-header"
        },
        decorators: {
            sortableHeader: [],
            unsortableHeader: []
        },
        model: undefined,
        // Offset of the tree's "main" data from the overall model root
        modelOffset: "",
    
        styles: {
            tooltip: "fl-pager-tooltip",
            ascendingHeader: "fl-table-asc",
            descendingHeader: "fl-table-desc"
        },
        
        components: {
           modelFilter: fluid.pager.directModelFilter
        },
            
        bodyRenderer: {
            type: "fluid.table.selfRender"
        },
        
        sorter: fluid.table.basicSorter,
        
        // strategy for generating a tree row, either "explode" or an array of columnDef objects
        columnDefs: "explode",
        events: {
            onRender: null,
            afterRender: null
            }
        });


})(jQuery, fluid_1_2);
