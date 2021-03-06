/*
Copyright 2008-2009 University of Toronto
Copyright 2008-2009 University of California, Berkeley
Copyright 2010-2011 OCAD University
Copyright 2011 Lucendo Development Ltd.

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt
*/

// Declare dependencies
/*global window, fluid_1_5:true, jQuery*/

// JSLint options 
/*jslint white: true, funcinvoke: true, undef: true, newcap: true, nomen: true, regexp: true, bitwise: true, browser: true, forin: true, maxerr: 100, indent: 4 */

var fluid_1_5 = fluid_1_5 || {};

/************
 * Uploader *
 ************/

(function ($, fluid) {
    fluid.registerNamespace("fluid.uploader");

    fluid.uploader.fileOrFiles = function (that, numFiles) {
        return (numFiles === 1) ? that.options.strings.progress.singleFile : 
            that.options.strings.progress.pluralFiles;
    };
    
    // TODO: Use of these four utilities should be replaced by use of the "visibility model" described in FLUID-4928
    fluid.uploader.enableElement = function (that, elm) {
        elm.prop("disabled", false);
        elm.removeClass(that.options.styles.dim);
    };
    
    fluid.uploader.disableElement = function (that, elm) {
        elm.prop("disabled", true);
        elm.addClass(that.options.styles.dim);
    };
    
    fluid.uploader.showElement = function (that, elm) {
        elm.removeClass(that.options.styles.hidden);
    };
     
    fluid.uploader.hideElement = function (that, elm) {
        elm.addClass(that.options.styles.hidden);
    };
    
    fluid.uploader.maxFilesUploaded = function (that) {
        var fileUploadLimit = that.queue.getUploadedFiles().length + that.queue.getReadyFiles().length + that.queue.getErroredFiles().length;
        return (fileUploadLimit === that.options.queueSettings.fileUploadLimit);
    };    
    
    fluid.uploader.setTotalProgressStyle = function (that, didError) {
        didError = didError || false;
        var indicator = that.totalProgress.indicator;
        indicator.toggleClass(that.options.styles.totalProgress, !didError);
        indicator.toggleClass(that.options.styles.totalProgressError, didError);
    };
    
    fluid.uploader.setStateEmpty = function (that) {
        fluid.uploader.disableElement(that, that.locate("uploadButton"));
        
        // If the queue is totally empty, treat it specially.
        if (that.queue.files.length === 0) { 
            that.locate("browseButtonText").text(that.options.strings.buttons.browse);
            that.locate("browseButton").removeClass(that.options.styles.browseButton);
            fluid.uploader.showElement(that, that.locate("instructions"));
        }
    };
    
    // Only enable the browse button if the fileUploadLimit 
    // has not been reached
    fluid.uploader.enableBrowseButton = function (that) {
        if (!fluid.uploader.maxFilesUploaded(that)) {
            fluid.uploader.enableElement(that, that.locate("browseButton"));
            that.strategy.local.enableBrowseButton();            
        }
    };
    
    // See above comment: All of this wasted logic should be replaced by a model mapping system
    fluid.uploader.setStateDone = function (that) {
        fluid.uploader.disableElement(that, that.locate("uploadButton"));
        fluid.uploader.hideElement(that, that.locate("pauseButton"));
        fluid.uploader.showElement(that, that.locate("uploadButton"));
        fluid.uploader.enableBrowseButton(that);
    };

    fluid.uploader.setStateLoaded = function (that) {
        that.locate("browseButtonText").text(that.options.strings.buttons.addMore);
        that.locate("browseButton").addClass(that.options.styles.browseButton);
        fluid.uploader.hideElement(that, that.locate("pauseButton"));
        fluid.uploader.showElement(that, that.locate("uploadButton"));
        fluid.uploader.enableElement(that, that.locate("uploadButton"));
        fluid.uploader.hideElement(that, that.locate("instructions"));
        that.totalProgress.hide();
        fluid.uploader.enableBrowseButton(that);
    };
    
    fluid.uploader.setStateUploading = function (that) {
        that.totalProgress.hide(false, false);
        fluid.uploader.setTotalProgressStyle(that);
        fluid.uploader.hideElement(that, that.locate("uploadButton"));
        fluid.uploader.disableElement(that, that.locate("browseButton"));
        that.strategy.local.disableBrowseButton();
        fluid.uploader.enableElement(that, that.locate("pauseButton"));
        fluid.uploader.showElement(that, that.locate("pauseButton"));
    };

    fluid.uploader.setStateFull = function (that) {        
        that.locate("browseButtonText").text(that.options.strings.buttons.addMore);
        that.locate("browseButton").addClass(that.options.styles.browseButton);
        fluid.uploader.hideElement(that, that.locate("pauseButton"));
        fluid.uploader.showElement(that, that.locate("uploadButton"));
        fluid.uploader.enableElement(that, that.locate("uploadButton"));
        fluid.uploader.disableElement(that, that.locate("browseButton"));        
        that.strategy.local.disableBrowseButton();
        fluid.uploader.hideElement(that, that.locate("instructions"));
        that.totalProgress.hide();
    };    
    
    // TODO: Refactor this to be a general ARIA utility
    fluid.uploader.ariaLiveRegionUpdater = function (statusRegion, totalFileStatusText, events) {
        statusRegion.attr("role", "log");     
        statusRegion.attr("aria-live", "assertive");
        statusRegion.attr("aria-relevant", "text");
        statusRegion.attr("aria-atomic", "true");

        var regionUpdater = function () {
            statusRegion.text(totalFileStatusText.text());
        };

        events.afterFileDialog.addListener(regionUpdater);
        events.afterFileRemoved.addListener(regionUpdater);
        events.afterUploadComplete.addListener(regionUpdater);
    };
    
    fluid.uploader.renderUploadTotalMessage = function (that) {
        // Render template for the total file status message.
        var numReadyFiles = that.queue.getReadyFiles().length;
        var bytesReadyFiles = that.queue.sizeOfReadyFiles();
        var fileLabelStr = fluid.uploader.fileOrFiles(that, numReadyFiles);

        var totalStateStr = fluid.stringTemplate(that.options.strings.progress.toUploadLabel, {
            fileCount: numReadyFiles, 
            fileLabel: fileLabelStr, 
            totalBytes: fluid.uploader.formatFileSize(bytesReadyFiles)
        });
        that.locate("totalFileStatusText").html(totalStateStr);
    };
    
    fluid.uploader.renderFileUploadLimit = function (that) {
        if (that.options.queueSettings.fileUploadLimit > 0) {
            var fileUploadLimitText = fluid.stringTemplate(that.options.strings.progress.fileUploadLimitLabel, {
                fileUploadLimit: that.options.queueSettings.fileUploadLimit, 
                fileLabel: fluid.uploader.fileOrFiles(that, that.options.queueSettings.fileUploadLimit) 
            });
            that.locate("fileUploadLimitText").html(fileUploadLimitText);
        }
    };
    
            
   /**
    * Pretty prints a file's size, converting from bytes to kilobytes or megabytes.
    * 
    * @param {Number} bytes the files size, specified as in number bytes.
    */
    fluid.uploader.formatFileSize = function (bytes) {
        if (typeof (bytes) === "number") {
            if (bytes === 0) {
                return "0.0 KB";
            } else if (bytes > 0) {
                if (bytes < 1048576) {
                    return (Math.ceil(bytes / 1024 * 10) / 10).toFixed(1) + " KB";
                } else {
                    return (Math.ceil(bytes / 1048576 * 10) / 10).toFixed(1) + " MB";
                }
            }
        }
        return "";
    };

    fluid.uploader.derivePercent = function (num, total) {
        return Math.round((num * 100) / total);
    };
        
    fluid.uploader.updateTotalProgress = function (that) {
        var batch = that.queue.currentBatch;
        var totalPercent = fluid.uploader.derivePercent(batch.totalBytesUploaded, batch.totalBytes);
        var numFilesInBatch = batch.files.length;
        var fileLabelStr = fluid.uploader.fileOrFiles(that, numFilesInBatch);
        
        var totalProgressStr = fluid.stringTemplate(that.options.strings.progress.totalProgressLabel, {
            curFileN: batch.fileIdx, 
            totalFilesN: numFilesInBatch, 
            fileLabel: fileLabelStr,
            currBytes: fluid.uploader.formatFileSize(batch.totalBytesUploaded), 
            totalBytes: fluid.uploader.formatFileSize(batch.totalBytes)
        });  
        that.totalProgress.update(totalPercent, totalProgressStr);
    };
    
    fluid.uploader.updateTotalAtCompletion = function (that) {
        var numErroredFiles = that.queue.getErroredFiles().length;
        var numTotalFiles = that.queue.files.length;
        var fileLabelStr = fluid.uploader.fileOrFiles(that, numTotalFiles);
        var errorStr = "";
        
        // if there are errors then change the total progress bar
        // and set up the errorStr so that we can use it in the totalProgressStr
        if (numErroredFiles > 0) {
            var errorLabelString = (numErroredFiles === 1) ? that.options.strings.progress.singleError : 
                                                             that.options.strings.progress.pluralErrors;
            fluid.uploader.setTotalProgressStyle(that, true);
            errorStr = fluid.stringTemplate(that.options.strings.progress.numberOfErrors, {
                errorsN: numErroredFiles,
                errorLabel: errorLabelString
            });
        }
        
        var totalProgressStr = fluid.stringTemplate(that.options.strings.progress.completedLabel, {
            curFileN: that.queue.getUploadedFiles().length, 
            totalFilesN: numTotalFiles,
            errorString: errorStr,
            fileLabel: fileLabelStr,
            totalCurrBytes: fluid.uploader.formatFileSize(that.queue.sizeOfUploadedFiles())
        });
        
        that.totalProgress.update(100, totalProgressStr);
    };

    /*
     * Summarizes the status of all the files in the file queue.  
     */
    fluid.uploader.updateQueueSummaryText = function (that) {
        var fileQueueTable = that.locate("fileQueue");        
        if (that.queue.files.length === 0) {
            fileQueueTable.attr("summary", that.options.strings.queue.emptyQueue);
        } else {
            var queueSummary = fluid.stringTemplate(that.options.strings.queue.queueSummary, {
                totalUploaded: that.queue.getUploadedFiles().length, 
                totalInUploadQueue: that.queue.files.length - that.queue.getUploadedFiles().length
            });
            fileQueueTable.attr("summary", queueSummary);
        }
    };

    fluid.uploader.updateStateAfterFileDialog = function (that) {
        var queueLength = that.queue.getReadyFiles().length;
        if (queueLength > 0) {
            fluid.uploader[queueLength === that.options.queueSettings.fileUploadLimit ? "setStateFull" : "setStateLoaded"](that);
            fluid.uploader.renderUploadTotalMessage(that);
            that.locate(that.options.focusWithEvent.afterFileDialog).focus();
            fluid.uploader.updateQueueSummaryText(that);
        }
    };
    
    fluid.uploader.updateStateAfterFileRemoval = function (that) {
        fluid.uploader[that.queue.getReadyFiles().length === 0 ? "setStateEmpty" : "setStateLoaded"] (that);
        fluid.uploader.renderUploadTotalMessage(that);
        fluid.uploader.updateQueueSummaryText(that);
    };
    
    fluid.uploader.updateStateAfterCompletion = function (that) {
        fluid.uploader[that.queue.getReadyFiles().length === 0 ? "setStateDone" : "setStateLoaded"] (that);
        fluid.uploader.updateTotalAtCompletion(that);
        fluid.uploader.updateQueueSummaryText(that);
    }; 
    
    fluid.uploader.uploadNextOrFinish = function (that) {
        if (that.queue.shouldUploadNextFile()) {
            that.strategy.remote.uploadNextFile();
        } else {
            that.events.afterUploadComplete.fire(that.queue.currentBatch.files);
            that.queue.clearCurrentBatch();
        }        
    };
    
    // Standard event listening functions
    
    fluid.uploader.onFileStart = function (file, queue) {
        file.filestatus = fluid.uploader.fileStatusConstants.IN_PROGRESS;
        queue.startFile();      
    };
    
    // TODO: Improve the dependency profile of this listener and "updateTotalProgress"
    fluid.uploader.onFileProgress = function (that, currentBytes) {
        that.queue.updateBatchStatus(currentBytes);
        fluid.uploader.updateTotalProgress(that);
    };
    
    fluid.uploader.onFileComplete = function (file, that) {
        that.queue.finishFile(file);
        that.events.afterFileComplete.fire(file); 
        fluid.uploader.uploadNextOrFinish(that);      
    };
    
    // TODO: Avoid reaching directly into the FileQueue and manipulating its state from this and the next two listeners
    fluid.uploader.onFileSuccess = function (file, that) {
        file.filestatus = fluid.uploader.fileStatusConstants.COMPLETE;
        if (that.queue.currentBatch.bytesUploadedForFile === 0) {
            that.queue.currentBatch.totalBytesUploaded += file.size;
        }
       fluid.uploader.updateTotalProgress(that);       
    };
    
    fluid.uploader.onFileError = function (file, error, that) {
        if (error === fluid.uploader.errorConstants.UPLOAD_STOPPED) {
            file.filestatus = fluid.uploader.fileStatusConstants.CANCELLED;
        } else {
            file.filestatus = fluid.uploader.fileStatusConstants.ERROR;
            if (that.queue.isUploading) {
                that.queue.currentBatch.totalBytesUploaded += file.size;
                that.queue.currentBatch.numFilesErrored++;
                fluid.uploader.uploadNextOrFinish(that);
            }
        }
    };
    
    fluid.uploader.afterUploadComplete = function (that) {
        that.queue.isUploading = false;
        fluid.uploader.updateStateAfterCompletion(that);
    };
    
    fluid.uploaderImpl = function () {
        fluid.fail("Error creating uploader component - please make sure that a " + 
            "progressiveCheckerForComponent for \"fluid.uploader\" is registered either in the " + 
            "static environment or else is visible in the current component tree");
    };
    
    fluid.enhance.check({
        "fluid.browser.supportsBinaryXHR": "fluid.enhance.supportsBinaryXHR",
        "fluid.browser.supportsFormData": "fluid.enhance.supportsFormData",
        "fluid.browser.supportsFlash": "fluid.enhance.supportsFlash"
    });
    
    /**
     * Instantiates a new Uploader component.
     * 
     * @param {Object} container the DOM element in which the Uploader lives
     * @param {Object} options configuration options for the component.
     */
    
    fluid.defaults("fluid.uploader", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        components: {
            uploaderContext: {
                type: "fluid.progressiveCheckerForComponent",
                options: {componentName: "fluid.uploader"}
            },
            uploaderImpl: {
                type: "fluid.uploaderImpl",
                container: "{uploader}.container",
            }
        },
        returnedPath: "uploaderImpl", // compatibility courtesy for manual construction
        distributeOptions: {
            // Allow the uploader implementation component to impersonate the exterior exposed "fluid.uploader" by broadcasting all options to it
            source: "{that}.options",
            removeSource: true,
            exclusions: ["components.uploaderContext", "components.uploaderImpl"],
            target: "{that > uploaderImpl}.options"
        },
        progressiveCheckerOptions: {
            checks: [
                {
                    feature: "{fluid.browser.supportsBinaryXHR}",
                    contextName: "fluid.uploader.html5"
                },
                {
                    feature: "{fluid.browser.supportsFlash}",
                    contextName: "fluid.uploader.swfUpload"
                }
            ],
            defaultContextName: "fluid.uploader.singleFile"
        }
    });

    fluid.uploader.demoTypeTag = function (demo) {
        return demo ? "fluid.uploader.demo" : "fluid.uploader.live";
    };

    // Implementation of standard public invoker methods
    
    fluid.uploader.browse = function (queue, localStrategy) {
        if (!queue.isUploading) {
            localStrategy.browse();
        }    
    };

    fluid.uploader.removeFile = function (queue, localStrategy, afterFileRemoved, file) {
        queue.removeFile(file);
        localStrategy.removeFile(file);
        afterFileRemoved.fire(file);      
    };

    fluid.uploader.start = function (queue, remoteStrategy, onUploadStart) {
        queue.start();
        onUploadStart.fire(queue.currentBatch.files);           
        remoteStrategy.uploadNextFile();      
    };
    
    fluid.uploader.stop = function (remoteStrategy, onUploadStop) {
        onUploadStop.fire();
        remoteStrategy.stop();      
    };
    
    fluid.uploader.defaultQueueSettings = {
        uploadURL: "",
        postParams: {},
        fileSizeLimit: "20480",
        fileTypes: null,
        fileTypesDescription: null,
        fileUploadLimit: 0,
        fileQueueLimit: 0
    };
    
    // Automatically bind a listener transferring focus to those DOM elements requested for component events
    fluid.uploader.bindFocus = function (focusWithEvent, noAutoFocus, events, dom) {
        fluid.each(focusWithEvent, function (element, event) {
            if (!noAutoFocus[event]) {
                events[event].addListener(function () {
                    dom.locate(element).focus()
                });
            }
        });
    };
    
    /**
     * Multiple file Uploader implementation. Use fluid.uploader() for IoC-resolved, progressively
     * enhanceable Uploader, or call this directly if you don't want support for old-style single uploads
     *
     * @param {jQueryable} container the component's container
     * @param {Object} options configuration options
     */
    fluid.defaults("fluid.uploader.multiFileUploader", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        nickName: "uploader",       
        invokers: {
            /**
             * Opens the native OS browse file dialog.
             */
            browse: {
                funcName: "fluid.uploader.browse",
                args: ["{that}.queue", "{that}.strategy.local"]
            },
            /**
             * Removes the specified file from the upload queue.
             * 
             * @param {File} file the file to remove
             */
            removeFile: {
                funcName: "fluid.uploader.removeFile",
                args: ["{that}.queue", "{that}.strategy.local", "{that}.events.afterFileRemoved", "{arguments}.0"]  
            },
            /**
             * Starts uploading all queued files to the server.
             */
            start: {
                funcName: "fluid.uploader.start",
                args: ["{that}.queue", "{that}.strategy.remote", "{that}.events.onUploadStart"]
            },
            /**
             * Cancels an in-progress upload.
             */
            stop: {
                funcName: "fluid.uploader.stop",
                args: ["{that}.strategy.remote", "{that}.events.onUploadStop"]
            },
            statusUpdater: {
                funcName: "fluid.uploader.ariaLiveRegionUpdater",
                args: ["{that}.dom.statusRegion", "{that}.dom.totalFileStatusText", "{that}.events"]
            }
        },
        
        components: {
            demoTag: {
                type: "fluid.typeFount",
                options: {
                    targetTypeName: {
                        expander: {
                            funcName: "fluid.uploader.demoTypeTag",
                            args: "{uploader}.options.demo"
                        }
                    }
                }  
            },
            queue: {
                type: "fluid.uploader.fileQueue"  
            },
            strategy: {
                type: "fluid.uploader.strategy"
            },
            errorPanel: {
                type: "fluid.uploader.errorPanel"
            },
            fileQueueView: {
                type: "fluid.uploader.fileQueueView",
                options: {
                    model: "{uploader}.queue.files",
                    uploaderContainer: "{uploader}.container"
                }
            },
            totalProgress: {
                type: "fluid.progress",
                container: "{uploader}.container",
                options: {
                    selectors: {
                        progressBar: ".flc-uploader-queue-footer",
                        displayElement: ".flc-uploader-total-progress", 
                        label: ".flc-uploader-total-progress-text",
                        indicator: ".flc-uploader-total-progress",
                        ariaElement: ".flc-uploader-total-progress"
                    }
                }
            }
        },
        
        queueSettings: fluid.uploader.defaultQueueSettings,

        demo: false,
        
        selectors: {
            fileQueue: ".flc-uploader-queue",
            browseButton: ".flc-uploader-button-browse",
            browseButtonText: ".flc-uploader-button-browse-text",
            uploadButton: ".flc-uploader-button-upload",
            pauseButton: ".flc-uploader-button-pause",
            totalFileStatusText: ".flc-uploader-total-progress-text",
            fileUploadLimitText: ".flc-uploader-upload-limit-text",
            instructions: ".flc-uploader-browse-instructions",
            statusRegion: ".flc-uploader-status-region",
            errorsPanel: ".flc-uploader-errorsPanel"
        },
        noAutoFocus: { // Specifies a member of "focusWithEvent" which the uploader will not attempt to automatically honour
            afterFileDialog: true
        },

        // Specifies a selector name to move keyboard focus to when a particular event fires.
        // Event listeners must already be implemented to use these options.
        focusWithEvent: {
            afterFileDialog: "uploadButton",
            onUploadStart: "pauseButton",
            onUploadStop: "uploadButton"
        },
        
        styles: {
            disabled: "fl-uploader-disabled",
            hidden: "fl-uploader-hidden",
            dim: "fl-uploader-dim",
            totalProgress: "fl-uploader-total-progress-okay",
            totalProgressError: "fl-uploader-total-progress-errored",
            browseButton: "fl-uploader-browseMore"
        },
        
        events: {
            // TODO: this event "afterReady" is currently only fired by the Flash Uploader but is not listened to - it should 
            // be, since SWF or some other piece of the strategy may only be ready asynchronously 
            afterReady: null, 
            onFileDialog: null,
            onFilesSelected: null,
            onFileQueued: null,     // file
            afterFileQueued: null,  // file
            onFileRemoved: null,    // file
            afterFileRemoved: null, // file
            afterFileDialog: null,
            onUploadStart: null,
            onUploadStop: null,
            onFileStart: null,      // file
            onFileProgress: null,   // file, currentBytes, totalBytes
            onFileError: null,      // file, error
            onQueueError: null,
            onFileSuccess: null,
            onFileComplete: null,
            afterFileComplete: null,
            afterUploadComplete: null
        },
        listeners: {
            "onCreate": [{
                    listener: "fluid.uploader.bindFocus",
                    args: ["{that}.options.focusWithEvent", "{that}.options.noAutoFocus", "{that}.events", "{that}.dom"]
                },
                { // TODO: These two part of the "new renderer" as "new decorators"
                    "this": "{that}.dom.uploadButton",
                    method: "click",
                    args: "{that}.start"
                }, {
                    "this": "{that}.dom.pauseButton",
                    method: "click",
                    args: "{that}.stop"
                }
            ],
            // Namespace all our standard listeners so they are easy to override
            "afterFileDialog.uploader": {
                listener: "fluid.uploader.updateStateAfterFileDialog",
                args: "{that}"
            },
            "afterFileQueued.uploader": {
                listener: "{that}.queue.addFile",
                args: "{arguments}.0" // file
            },
            "onFileRemoved.uploader": {
                listener: "{that}.removeFile",
                args: "{arguments}.0" // file
            },
            "afterFileRemoved.uploader": {
                listener: "fluid.uploader.updateStateAfterFileRemoval",
                args: "{that}"
            },
            "onUploadStart.uploader": {
                listener: "fluid.uploader.setStateUploading",
                args: "{that}"
            },
            "onFileStart.uploader": {
                listener: "fluid.uploader.onFileStart",
                args: ["{arguments}.0", "{that}.queue"]  
            },
            "onFileProgress.uploader": {
                listener: "fluid.uploader.onFileProgress",
                args: ["{that}", "{arguments}.1"] // 1: currentBytes
            },
            "onFileComplete.uploader": {
                listener: "fluid.uploader.onFileComplete",
                args: ["{arguments}.0", "{that}"]
            },
            "onFileSuccess.uploader": {
                listener: "fluid.uploader.onFileSuccess",
                args: ["{arguments}.0", "{that}"]
            },
            "onFileError.uploader": {
                listener: "fluid.uploader.onFileError",
                args: ["{arguments}.0", "{arguments}.1", "{that}"]
            },
            "afterUploadComplete.uploader": {
                listener: "fluid.uploader.afterUploadComplete",
                args: "{that}"
            }
        },

        strings: {
            progress: {
                fileUploadLimitLabel: "%fileUploadLimit %fileLabel maximum",
                toUploadLabel: "To upload: %fileCount %fileLabel (%totalBytes)", 
                totalProgressLabel: "Uploading: %curFileN of %totalFilesN %fileLabel (%currBytes of %totalBytes)", 
                completedLabel: "Uploaded: %curFileN of %totalFilesN %fileLabel (%totalCurrBytes)%errorString",
                numberOfErrors: ", %errorsN %errorLabel",
                singleFile: "file",
                pluralFiles: "files",
                singleError: "error",
                pluralErrors: "errors"
            },
            buttons: {
                browse: "Browse Files",
                addMore: "Add More",
                stopUpload: "Stop Upload",
                cancelRemaning: "Cancel remaining Uploads",
                resumeUpload: "Resume Upload"
            },
            queue: {
                emptyQueue: "File list: No files waiting to be uploaded.",
                queueSummary: "File list: %totalUploaded files uploaded, %totalInUploadQueue file waiting to be uploaded." 
            }
        }
    });
    
    fluid.uploader.multiFileUploader.finalInit = function (that) {
        // Upload button should not be enabled until there are files to upload
        fluid.uploader.disableElement(that, that.locate("uploadButton"));
        
        fluid.uploader.updateQueueSummaryText(that);
        that.statusUpdater();
        fluid.uploader.renderFileUploadLimit(that);
        
        // Uploader uses application-style keyboard conventions, so give it a suitable role.
        that.container.attr("role", "application");
    };
    
    
    fluid.defaults("fluid.uploader.strategy", {
        gradeNames: ["fluid.littleComponent"],
        components: {
            local: {
                type: "fluid.uploader.local"
            },
            remote: {
                type: "fluid.uploader.remote"
            }
        }  
    });
    
    fluid.defaults("fluid.uploader.local", {
        gradeNames: ["fluid.eventedComponent"],
        queueSettings: "{uploader}.options.queueSettings",
        members: {
            queue: "{uploader}.queue",
        },
        events: {
            onFileDialog: "{uploader}.events.onFileDialog",
            onFilesSelected: "{uploader}.events.onFilesSelected",
            afterFileDialog: "{uploader}.events.afterFileDialog",
            afterFileQueued: "{uploader}.events.afterFileQueued",
            onQueueError: "{uploader}.events.onQueueError"
        },
        invokers: {
            enableBrowseButton: "fluid.uploader.local.enableBrowseButton", // TODO: FLUID-4928 "visibility model"
            disableBrowseButton: "fluid.uploader.local.disableBrowseButton"
        }
    });
    
    fluid.defaults("fluid.uploader.remote", {
        gradeNames: ["fluid.eventedComponent"],
        members: {
            queue: "{uploader}.queue", // TODO: explosions, see FLUID-4925
            queueSettings: "{uploader}.options.queueSettings"
        },
        events: {
            onFileStart: "{uploader}.events.onFileStart",
            onFileProgress: "{uploader}.events.onFileProgress",
            onFileSuccess: "{uploader}.events.onFileSuccess",
            onFileError: "{uploader}.events.onFileError",
            onFileComplete: "{uploader}.events.onFileComplete",
            onUploadStop: "{uploader}.events.onUploadStop",
            afterFileComplete: "{uploader}.events.afterFileComplete",
            afterUploadComplete: "{uploader}.events.afterUploadComplete"
        },
        invokers: {
            uploadNextFile: "fluid.uploader.uploadNextFile",
            stop: "fluid.uploader.stop"
        }     
    });
    
    
    /** Demands blocks for binding to fileQueueView **/
            
    fluid.demands("fluid.uploader.fileQueueView", "fluid.uploader.multiFileUploader", {
        container: "{uploader}.dom.fileQueue",
        options: {
            events: {
                onFileRemoved: "{uploader}.events.onFileRemoved"
            }
        }
    });
        
    fluid.demands("fluid.uploader.fileQueueView.eventBinder", [
        "fluid.uploader.multiFileUploader",
        "fluid.uploader.fileQueueView"
    ], {
        options: {
            listeners: {
                "{uploader}.events.afterFileQueued": "{fileQueueView}.addFile",
                "{uploader}.events.onUploadStart": "{fileQueueView}.prepareForUpload",
                "{uploader}.events.onFileStart": "{fileQueueView}.showFileProgress",
                "{uploader}.events.onFileProgress": "{fileQueueView}.updateFileProgress",
                "{uploader}.events.onFileSuccess": "{fileQueueView}.markFileComplete",
                "{uploader}.events.onFileError": "{fileQueueView}.showErrorForFile",
                "{uploader}.events.afterFileComplete": "{fileQueueView}.hideFileProgress",
                "{uploader}.events.afterUploadComplete": "{fileQueueView}.refreshAfterUpload"
            }
        }
    });
    
    /**************************************************
     * Error constants for the Uploader               *
     * 
     **************************************************/
     // Partial TODO: The values of these keys are now our own - however, the key
     // values themselves still align with those in SWFUpload
    fluid.uploader.queueErrorConstants = {
        QUEUE_LIMIT_EXCEEDED:    "queue limit exceeded",
        FILE_EXCEEDS_SIZE_LIMIT: "file exceeds size limit",
        ZERO_BYTE_FILE:          "zero byte file",
        INVALID_FILETYPE:        "invalid filetype"
    };
    
    fluid.uploader.errorConstants = {
        HTTP_ERROR:                  "HTTP error",
        MISSING_UPLOAD_URL:          "Missing upload URL",
        IO_ERROR:                    "I/O error",
        SECURITY_ERROR:              "Security error",
        UPLOAD_LIMIT_EXCEEDED:       "Upload limit exceeded",
        UPLOAD_FAILED:               "Uploader failed",
        SPECIFIED_FILE_ID_NOT_FOUND: "Specified file ID not found",
        FILE_VALIDATION_FAILED:      "File validation failed",
        FILE_CANCELLED:              "File cancelled",
        UPLOAD_STOPPED:              "Upload stopped"
    };
    
    fluid.uploader.fileStatusConstants = {
        QUEUED:      "queued",
        IN_PROGRESS: "in progress",
        ERROR:       "error",
        COMPLETE:    "complete",
        CANCELLED:   "cancelled"
    };

    var toggleVisibility = function (toShow, toHide) {
        // For FLUID-2789: hide() doesn't work in Opera
        if (window.opera) { 
            toShow.show().removeClass("hideUploaderForOpera");
            toHide.show().addClass("hideUploaderForOpera");
        } else {
            toShow.show();
            toHide.hide();
        }
    };

    /**
     * Single file Uploader implementation. Use fluid.uploader() for IoC-resolved, progressively
     * enhanceable Uploader, or call this directly if you only want a standard single file uploader.
     * But why would you want that?
     *
     * @param {jQueryable} container the component's container
     * @param {Object} options configuration options
     */

    fluid.defaults("fluid.uploader.singleFileUploader", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        selectors: {
            basicUpload: ".fl-progEnhance-basic"
        }
    });

    fluid.uploader.singleFileUploader.finalInit = function (that) {
        // TODO: direct DOM fascism that will fail with multiple uploaders on a single page.
        toggleVisibility($(that.options.selectors.basicUpload), that.container);
    };

    fluid.demands("fluid.uploaderImpl", "fluid.uploader.singleFile", {
        funcName: "fluid.uploader.singleFileUploader"
    });
    
})(jQuery, fluid_1_5);
