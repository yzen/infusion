/*global google*/
/*global jQuery*/
/*global fluid_0_7*/

fluid_1_2 = fluid_1_2 || {};

(function ($, fluid) {

    var browseForFiles = function (that) {
        that.events.onFileDialog.fire();
        
        var openFileOptions = {
            singleFile: (that.options.fileQueueLimit === 1) ? true : false,
            filter: that.options.fileTypes
        };
        
        that.gearsDesktop.openFiles(function (files) {
            that.addFiles(files);
            that.events.afterFileDialog.fire(files.length, files.length, that.queue.files.length);
        }, openFileOptions);
    };
    
    var addFiles = function (that, files) {
        // Add the files to our queue and tell the world about it.
        $.each(files, function (idx, file) {
            file.filestatus = fluid.uploader.fileStatusConstants.QUEUED;
            file.size = file.blob.length;
            fluid.allocateSimpleId(file);
            
            that.queue.addFile(file);
            that.events.afterFileQueued.fire(file);
        });
    };
    
    var updateProgress = function (that, progressEvent) {
        that.events.onFileProgress.fire(that.queue.currentBatch.files[that.queue.currentBatch.fileIdx], 
                                        progressEvent.loaded, 
                                        progressEvent.total); // Fix me; gears returns an accumated loaded
                                                              // Whereas our event semantics assume a block value
                                                              // since the last event.    
        that.queueManager.updateBatchStatus(progressEvent.loaded);
    };
    
    var sendMultipartRequest = function (gearsDesktop, xhr, files) { 
        files = $.makeArray(files);
        var boundary = "---------------------------1636807826563613512101929267",
            multipart = google.gears.factory.create("beta.blobbuilder");
            
        $.each(files, function (idx, file) {
            // We should use a real id here..
            multipart.append("--" + boundary + "\r\n");
            multipart.append("Content-Disposition: form-data;" +
                            " name=\"fluid-uploader-gears\";" + 
                            " filename=\"" + file.name + "\"" + "\r\n");
            multipart.append("Content-Type: " + gearsDesktop.extractMetaData(file.blob).mimeType + "\r\n\r\n");
            multipart.append(file.blob);
            multipart.append("\r\n--" + boundary + "--\r\n");
        });
        
        xhr.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
        xhr.send(multipart.getAsBlob());    
    };
    
    var finishFile = function (that, xhr, file) {
        // Update file status and fire the appropriate event.
        if (xhr.status === 200) {
            file.filestatus = fluid.uploader.fileStatusConstants.COMPLETE;
            that.events.onFileSuccess.fire(file);
        } else {
            file.filestatus = fluid.uploader.fileStatusConstants.ERROR;
            that.events.onFileError.fire(file);
        }        
        
        // Upload the next file if there are more pending, otherwise clean up.
        that.queueManager.finishFile(file);
        if (that.queueManager.shouldUploadNextFile()) {
            uploadNextFile(that);
        } else {
            that.queueManager.complete();
        }
    };
    
    var bindXHREventsForFile = function (that, xhr, file) {
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                finishFile(that, xhr, file);
            }
        };
        xhr.upload.onprogress = function (evt){
            that.updateProgress(that, evt);
        };
    };
    
    var postFile = function (that, file) {
        if (!file) {
            return;
        }
        
        var xhr = google.gears.factory.create('beta.httprequest');
        xhr.open("POST", that.options.uploadURL);
        bindXHREventsForFile(that, xhr, file);
        sendMultipartRequest(that.gearsDesktop, xhr, file); 
    };
    
    var uploadNextFile = function (that) {
        var file = that.queue.currentBatch.files[that.queue.currentBatch.fileIdx];
        file.filestatus = fluid.uploader.fileStatusConstants.IN_PROGRESS;
        postFile(that, file);
    };
    
    var startUploadingFiles = function (that) {
        that.queueManager.start();
        that.queueManager.startFile();
        uploadNextFile(that);
    };

    var setupGearsUploadManager = function (that, events) {  
        that.queue = fluid.fileQueue();
        that.events = events;
        that.queueManager = fluid.fileQueue.manager(that.queue, that.events);
        that.gearsDesktop = google.gears.factory.create("beta.desktop");
        that.events.afterReady.fire();
    };
    
    fluid.uploader.gearsUploadManager = function (events, options) {
        var that = {};
        fluid.mergeComponentOptions(that, "fluid.gearsUploadManager", options);
        fluid.mergeListeners(events, that.options.listeners);
        
        /**
         * Starts uploading all queued files to the server.
         */
        that.start = function () {
            startUploadingFiles(that);
        };
        
        /**
         * Adds new files to the queue.
         * @param {Array} files an array of files to add
         */
        that.addFiles = function (files) {
            addFiles(that, files);
        };
        
        /**
         * Removes a file from the queue.
         * @param {File} the file to remove
         */
        that.removeFile = function (file) {
            that.queue.removeFile();
            that.events.afterFileRemoved.fire(file);
        };
        
        /**
         * Opens the native OS browse file dialog using Gears.
         */
        that.browseForFiles = function () {
            browseForFiles(that);
        };
        
        that.updateProgress = function (progressEvent) {
            updateProgress(that, progressEvent);
        };
        
        setupGearsUploadManager(that, events);
        return that;
    };
    
    fluid.defaults("fluid.uploader.gearsUploadManager", {
        uploadURL: "",
        fileSizeLimit: "20480",
        fileTypes: undefined,
        fileUploadLimit: 0,
        fileQueueLimit: 0
    });
    
})(jQuery, fluid_1_2);
