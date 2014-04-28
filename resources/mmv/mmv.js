/*
 * This file is part of the MediaWiki extension MultimediaViewer.
 *
 * MultimediaViewer is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * MultimediaViewer is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with MultimediaViewer.  If not, see <http://www.gnu.org/licenses/>.
 */

( function ( mw, $ ) {
	var MMVP,
		comingFromHashChange = false;

	/**
	 * Analyses the page, looks for image content and sets up the hooks
	 * to manage the viewing experience of such content.
	 * @class mw.mmv.MultimediaViewer
	 * @constructor
	 */
	function MultimediaViewer() {
		var apiCacheMaxAge = 86400; // one day

		/**
		 * @property {mw.mmv.provider.Image}
		 * @private
		 */
		this.imageProvider = new mw.mmv.provider.Image();

		/**
		 * @property {mw.mmv.provider.ImageInfo}
		 * @private
		 */
		this.imageInfoProvider = new mw.mmv.provider.ImageInfo( new mw.mmv.Api( 'imageinfo' ),
			// Short-circuit, don't fallback, to save some tiny amount of time
			{ language: mw.config.get( 'wgUserLanguage', false ) || mw.config.get( 'wgContentLanguage', 'en' ) }
		);

		/**
		 * @property {mw.mmv.provider.FileRepoInfo}
		 * @private
		 */
		this.fileRepoInfoProvider = new mw.mmv.provider.FileRepoInfo( new mw.mmv.Api( 'filerepoinfo' ),
			{ maxage: apiCacheMaxAge } );

		/**
		 * @property {mw.mmv.provider.ThumbnailInfo}
		 * @private
		 */
		this.thumbnailInfoProvider = new mw.mmv.provider.ThumbnailInfo( new mw.mmv.Api( 'thumbnailinfo' ),
			{ maxage: apiCacheMaxAge } );

		/**
		 * @property {mw.mmv.provider.ThumbnailInfo}
		 * @private
		 */
		this.guessedThumbnailInfoProvider = new mw.mmv.provider.GuessedThumbnailInfo();

		/**
		 * @property {mw.mmv.provider.UserInfo}
		 * @private
		 */
		this.userInfoProvider = new mw.mmv.provider.UserInfo( new mw.mmv.Api( 'userinfo' ), {
			useApi: this.needGender(),
			maxage: apiCacheMaxAge
		} );

		/**
		 * @property {mw.mmv.provider.ImageUsage}
		 * @private
		 */
		this.imageUsageProvider = new mw.mmv.provider.ImageUsage( new mw.mmv.Api( 'imageusage' ),
			{ maxage: apiCacheMaxAge } );

		/**
		 * @property {mw.mmv.provider.GlobalUsage}
		 * @private
		 */
		this.globalUsageProvider = new mw.mmv.provider.GlobalUsage( new mw.mmv.Api( 'globalusage' ), {
			useApi: mw.config.get( 'wgMultimediaViewer' ).globalUsageAvailable,
			maxage: apiCacheMaxAge
		} );
		// replace with this one to test global usage on a local wiki without going through all the
		// hassle required for installing the extension:
		//this.globalUsageProvider = new mw.mmv.provider.GlobalUsage(
		//	new mw.mmv.Api( {ajax: { url: 'http://commons.wikimedia.org/w/api.php', dataType: 'jsonp' } } )
		//);

		/**
		 * Image index on page.
		 * @property {number}
		 */
		this.currentIndex = 0;

		/**
		 * @property {mw.mmv.routing.Router} router -
		 */
		this.router = new mw.mmv.routing.Router();

		/**
		 * UI object used to display the pictures in the page.
		 * @property {mw.mmv.LightboxInterface}
		 * @private
		 */
		this.ui = new mw.mmv.LightboxInterface();

		/**
		 * How many sharp images have been displayed in Media Viewer since the pageload
		 * @property {number}
		 */
		this.imageDisplayedCount = 0;

		/**
		 * How many data-filled metadata panels have been displayed in Media Viewer since the pageload
		 * @property {number}
		 */
		this.metadataDisplayedCount = 0;
	}

	MMVP = MultimediaViewer.prototype;

	/**
	 * Check if we need to fetch gender information. This relies on the fact that
	 * multimediaviewer-userpage-link is the only message which takes a gender parameter.
	 * @return {boolean}
	 * FIXME there has to be a better way than this
	 */
	MMVP.needGender = function () {
		var male, female, unknown;

		male = mw.message( 'multimediaviewer-userpage-link', '_', 'male' ).text();
		female = mw.message( 'multimediaviewer-userpage-link', '_', 'female' ).text();
		unknown = mw.message( 'multimediaviewer-userpage-link', '_', 'unknown' ).text();

		return male !== female || male !== unknown || female !== unknown;
	};

	/**
	 * Initialize the lightbox interface given an array of thumbnail
	 * objects.
	 * @param {Object[]} thumbs Complex structure...TODO, document this better.
	 */
	MMVP.initWithThumbs = function ( thumbs ) {
		var i, thumb;

		this.thumbs = thumbs;

		for ( i = 0; i < this.thumbs.length; i++ ) {
			thumb = this.thumbs[ i ];
			// Create a LightboxImage object for each legit image
			thumb.image = this.createNewImage(
				thumb.$thumb.prop( 'src' ),
				thumb.link,
				thumb.title,
				i,
				thumb.thumb,
				thumb.caption
			);
		}
	};

	/**
	 * Create an image object for the lightbox to use.
	 * @protected
	 * @param {string} fileLink Link to the file - generally a thumb URL
	 * @param {string} filePageLink Link to the File: page
	 * @param {mw.Title} fileTitle Represents the File: page
	 * @param {number} index Which number file this is
	 * @param {HTMLImageElement} thumb The thumbnail that represents this image on the page
	 * @param {string} [caption] The caption, if any.
	 * @returns {mw.mmv.LightboxImage}
	 */
	MMVP.createNewImage = function ( fileLink, filePageLink, fileTitle, index, thumb, caption ) {
		var thisImage = new mw.mmv.LightboxImage( fileLink, filePageLink, fileTitle, index, thumb, caption ),
			$thumb = $( thumb );

		thisImage.filePageLink = filePageLink;
		thisImage.filePageTitle = fileTitle;
		thisImage.index = index;
		thisImage.thumbnail = thumb;
		thisImage.originalWidth = parseInt( $thumb.data( 'file-width' ), 10 );
		thisImage.originalHeight = parseInt( $thumb.data( 'file-height' ), 10 );

		return thisImage;
	};

	/**
	 * Handles resize events in viewer.
	 * @protected
	 * @param {mw.mmv.LightboxInterface} ui lightbox that got resized
	 */
	MMVP.resize = function ( ui ) {
		var viewer = this,
			image = this.thumbs[ this.currentIndex].image,
			imageWidths;

		this.preloadThumbnails();

		if ( image ) {
			imageWidths = ui.canvas.getCurrentImageWidths();
			this.fetchThumbnailForLightboxImage(
				image, imageWidths.real
			).then( function( thumbnail, image ) {
				viewer.setImage( ui, thumbnail, image, imageWidths );
			}, function ( error ) {
				viewer.ui.canvas.showError( error );
			} );
		}

		this.updateControls();
	};

	/**
	 * Updates positioning of controls, usually after a resize event.
	 */
	MMVP.updateControls = function () {
		var numImages = this.thumbs ? this.thumbs.length : 0,
			showNextButton = this.currentIndex < (numImages - 1),
			showPreviousButton = this.currentIndex > 0;

		this.ui.updateControls( showNextButton, showPreviousButton );
	};

	/**
	 * Loads and sets the specified image. It also updates the controls.
	 * @param {mw.mmv.LightboxInterface} ui image container
	 * @param {mw.mmv.model.Thumbnail} thumbnail thumbnail information
	 * @param {HTMLImageElement} image
	 * @param {mw.mmv.model.ThumbnailWidth} imageWidths
	 */
	MMVP.setImage = function ( ui, thumbnail, image, imageWidths ) {
		ui.canvas.setImageAndMaxDimensions( thumbnail, image, imageWidths );
		this.updateControls();
	};

	/**
	 * Loads a specified image.
	 * @param {mw.mmv.LightboxImage} image
	 * @param {HTMLImageElement} initialImage A thumbnail to use as placeholder while the image loads
	 */
	MMVP.loadImage = function ( image, initialImage ) {
		var imageWidths,
			imagePromise,
			metadataPromise,
			start,
			viewer = this,
			$initialImage = $( initialImage );

		this.currentIndex = image.index;

		this.currentImageFilename = image.filePageTitle.getPrefixedText();
		this.currentImageFileTitle = image.filePageTitle;

		if ( !this.isOpen ) {
			this.ui.open();
			this.isOpen = true;
		} else {
			this.ui.empty();
		}
		this.setHash();

		// At this point we can't show the thumbnail because we don't
		// know what size it should be. We still assign it to allow for
		// size calculations in getCurrentImageWidths, which needs to know
		// the aspect ratio
		$initialImage.hide();
		this.ui.canvas.set( image, $initialImage );

		this.preloadImagesMetadata();
		this.preloadThumbnails();
		// this.preloadFullscreenThumbnail( image ); // disabled - #474

		imageWidths = this.ui.canvas.getCurrentImageWidths();

		this.resetBlurredThumbnailStates();

		start = $.now();

		imagePromise = this.fetchThumbnailForLightboxImage( image, imageWidths.real );

		viewer.displayPlaceholderThumbnail( image, $initialImage, imageWidths );

		this.setupProgressBar( image, imagePromise );

		imagePromise.done( function ( thumbnail, imageElement ) {
			if ( viewer.currentIndex !== image.index ) {
				return;
			}

			if ( viewer.imageDisplayedCount++ === 0 ) {
				mw.mmv.DurationLogger.stop( 'click-to-first-image' );
			}
			viewer.displayRealThumbnail( thumbnail, imageElement, imageWidths, $.now() - start );
		} ).fail( function ( error ) {
			viewer.ui.canvas.showError( error );
		} );

		metadataPromise = this.fetchSizeIndependentLightboxInfo(
			image.filePageTitle
		).done( function ( imageInfo, repoInfo, localUsage, globalUsage, userInfo ) {
			if ( viewer.currentIndex !== image.index ) {
				return;
			}

			if ( viewer.metadataDisplayedCount++ === 0 ) {
				mw.mmv.DurationLogger.stop( 'click-to-first-metadata' );
			}
			viewer.ui.panel.setImageInfo( image, imageInfo, repoInfo, localUsage, globalUsage, userInfo );
		} ).fail( function ( error ) {
			if ( viewer.currentIndex !== image.index ) {
				return;
			}

			viewer.ui.panel.showError( error );
		} );

		$.when( imagePromise, metadataPromise ).then( function() {
			if ( viewer.currentIndex !== image.index ) {
				return;
			}

			viewer.ui.panel.animateMetadataOnce();
			viewer.preloadDependencies();
		} );

		this.comingFromHashChange = false;
	};

	/**
	 * Loads an image by its title
	 * @param {mw.Title} title
	 * @param {boolean} updateHash Viewer should update the location hash when true
	 */
	MMVP.loadImageByTitle = function ( title, updateHash ) {
		var viewer = this;

		if ( !this.thumbs || !this.thumbs.length ) {
			return;
		}

		this.comingFromHashChange = !updateHash;

		$.each( this.thumbs, function ( idx, thumb ) {
			if ( thumb.title.getPrefixedText() === title.getPrefixedText() ) {
				viewer.loadImage( thumb.image, thumb.$thumb.clone()[ 0 ], true );
				return false;
			}
		} );
	};

	/**
	 * Resets the cross-request states needed to handle the blurred thumbnail logic
	 */
	MMVP.resetBlurredThumbnailStates = function () {
		this.realThumbnailShown = false;
		this.blurredThumbnailShown = false;
	};

	/**
	 * Display the real, full-resolution, thumbnail that was fetched with fetchThumbnail
	 * @param {mw.mmv.model.Thumbnail} thumbnail
	 * @param {HTMLImageElement} image
	 * @param {mw.mmv.model.ThumbnailWidth} imageWidths
	 * @param {number} loadTime Time it took to load the thumbnail
	 */
	MMVP.displayRealThumbnail = function ( thumbnail, image, imageWidths, loadTime ) {
		this.realThumbnailShown = true;

		this.setImage( this.ui, thumbnail, image, imageWidths );

		// We only animate unblur if the image wasn't loaded from the cache
		// A load in < 10ms is considered to be a browser cache hit
		// And of course we only unblur if there was a blur to begin with
		if ( this.blurredThumbnailShown && loadTime > 10 ) {
			this.ui.canvas.unblur();
		}

		mw.mmv.logger.log( 'image-view' );
	};

	/**
	 * Display the blurred thumbnail from the page
	 * @param {mw.mmv.LightboxImage} image
	 * @param {jQuery} $initialImage The thumbnail from the page
	 * @param {mw.mmv.model.ThumbnailWidth} imageWidths
	 * @param {boolean} [recursion=false] for internal use, never set this
	 */
	MMVP.displayPlaceholderThumbnail = function ( image, $initialImage, imageWidths, recursion ) {
		var viewer = this,
			size = { width : image.originalWidth, height : image.originalHeight };

		// If the actual image has already been displayed, there's no point showing the blurry one
		if ( this.realThumbnailShown ) {
			return;
		}

		// Width/height of the original image are added to the HTML by MediaViewer via a PHP hook,
		// and can be missing in exotic circumstances, e. g. when the extension has only been
		// enabled recently and the HTML cache has not cleared yet. If that is the case, we need
		// to fetch the size from the API first.
		if ( !size.width || !size.height ) {
			if ( recursion ) {
				// this should not be possible, but an infinite recursion is nasty
				// business, so we make a sanity check
				throw 'MediaViewer internal error: displayPlaceholderThumbnail recursion';
			}
			this.imageInfoProvider.get( image.filePageTitle ).done( function ( imageInfo ) {
				// Make sure the user has not navigated away while we were waiting for the size
				if ( viewer.currentIndex === image.index ) {
					image.originalWidth = imageInfo.width;
					image.originalHeight = imageInfo.height;
					viewer.displayPlaceholderThumbnail( image, $initialImage, imageWidths, true );
				}
			} );
		} else {
			this.blurredThumbnailShown = this.ui.canvas.maybeDisplayPlaceholder(
				size, $initialImage, imageWidths );
		}
	};

	/**
	 * Displays a progress bar for the image loading, if necessary, and sets up handling of
	 * all the related callbacks.
	 * FIXME would be nice to pass a simple promise which only returns a single number
	 * and does not fire when the image is not visible
	 * @param {mw.mmv.LightboxImage} image
	 * @param {jQuery.Promise.<mw.mmv.model.Thumbnail, HTMLImageElement>} imagePromise
	 */
	MMVP.setupProgressBar = function ( image, imagePromise ) {
		var viewer = this;

		// Reset the progress bar, it could be at any state if we're calling loadImage
		// while another image is already loading
		// FIXME we should probably jump to the current progress instead
		viewer.ui.panel.progressBar.percent( 0 );

		if ( imagePromise.state() !== 'pending' ) {
			// image has already loaded (or failed to load) - nothing to do
			return;
		}

		// FIXME this is all wrong, we might be navigating back to a half-loaded image

		// Animate progress bar to 5 to give a sense to something is happening, even if we're
		// stuck waiting for server-side processing, such as thumbnail (re)generation
		viewer.ui.panel.progressBar.percent( 5 );

		imagePromise.progress( function ( thumbnailInfoResponse, imageResponse ) {
			// FIXME this should be explained in a comment
			var progress = imageResponse[1];

			if ( viewer.currentIndex !== image.index ) {
				return;
			}

			// We started from 5, don't move backwards
			if ( progress > 5 ) {
				viewer.ui.panel.progressBar.percent( progress );
			}
		} ).done( function () {
			if ( viewer.currentIndex !== image.index ) {
				return;
			}

			// Fallback in case the browser doesn't have fancy progress updates
			viewer.ui.panel.progressBar.percent( 100 );
		} ).fail( function () {
			if ( viewer.currentIndex !== image.index ) {
				return;
			}
			// Hide progress bar on error
			viewer.ui.panel.progressBar.percent( 0 );
		} );
	};

	/**
	 * Preload this many prev/next images to speed up navigation.
	 * (E.g. preloadDistance = 3 means that the previous 3 and the next 3 images will be loaded.)
	 * Preloading only happens when the viewer is open.
	 * @property {number}
	 */
	MMVP.preloadDistance = 1;

	/**
	 * Stores image metadata preloads, so they can be cancelled.
	 * @property {mw.mmv.model.TaskQueue}
	 */
	MMVP.metadataPreloadQueue = null;

	/**
	 * Stores image thumbnail preloads, so they can be cancelled.
	 * @property {mw.mmv.model.TaskQueue}
	 */
	MMVP.thumbnailPreloadQueue = null;

	/**
	 * Orders lightboximage indexes for preloading. Works similar to $.each, except it only takes
	 * the callback argument. Calls the callback with each lightboximage index in some sequence
	 * that is ideal for preloading.
	 * @private
	 * @param {function(number, mw.mmv.LightboxImage)} callback
	 */
	MMVP.eachPrealoadableLightboxIndex = function( callback ) {
		for ( var i = 0; i <= this.preloadDistance; i++ ) {
			if ( this.currentIndex + i < this.thumbs.length ) {
				callback(
					this.currentIndex + i,
					this.thumbs[ this.currentIndex + i ].image
				);
			}
			if ( i && this.currentIndex - i >= 0 ) { // skip duplicate for i==0
				callback(
					this.currentIndex - i,
					this.thumbs[ this.currentIndex - i ].image
				);
			}
		}
	};

	/**
	 * A helper function to fill up the preload queues.
	 * taskFactory(lightboxImage) should return a preload task for the given lightboximage.
	 * @private
	 * @param {function(mw.mmv.LightboxImage): function()} taskFactory
	 * @return {mw.mmv.model.TaskQueue}
	 */
	MMVP.pushLightboxImagesIntoQueue = function( taskFactory ) {
		var queue = new mw.mmv.model.TaskQueue();

		this.eachPrealoadableLightboxIndex( function( i, lightboxImage ) {
			queue.push( taskFactory( lightboxImage ) );
		} );

		return queue;
	};

	/**
	 * Cancels in-progress image metadata preloading.
	 */
	MMVP.cancelImageMetadataPreloading = function() {
		if ( this.metadataPreloadQueue ) {
			this.metadataPreloadQueue.cancel();
		}
	};

	/**
	 * Cancels in-progress image thumbnail preloading.
	 */
	MMVP.cancelThumbnailsPreloading = function() {
		if ( this.thumbnailPreloadQueue ) {
			this.thumbnailPreloadQueue.cancel();
		}
	};

	/**
	 * Preload metadata for next and prev N image (N = MMVP.preloadDistance).
	 * Two images will be loaded at a time (one forward, one backward), with closer images
	 * being loaded sooner.
	 */
	MMVP.preloadImagesMetadata = function() {
		var viewer = this;

		this.cancelImageMetadataPreloading();

		this.metadataPreloadQueue = this.pushLightboxImagesIntoQueue( function( lightboxImage ) {
			return function() {
				return viewer.fetchSizeIndependentLightboxInfo( lightboxImage.filePageTitle );
			};
		} );

		this.metadataPreloadQueue.execute();
	};

	/**
	 * Preload thumbnails for next and prev N image (N = MMVP.preloadDistance).
	 * Two images will be loaded at a time (one forward, one backward), with closer images
	 * being loaded sooner.
	 */
	MMVP.preloadThumbnails = function() {
		var viewer = this;

		this.cancelThumbnailsPreloading();

		this.thumbnailPreloadQueue = this.pushLightboxImagesIntoQueue( function( lightboxImage ) {
			return function() {
				// viewer.ui.canvas.getLightboxImageWidths needs the viewer to be open
				// because it needs to read the size of visible elements
				if ( !viewer.isOpen ) {
					return;
				}

				return viewer.fetchThumbnailForLightboxImage(
					lightboxImage,
					viewer.ui.canvas.getLightboxImageWidths( lightboxImage ).real
				);
			};
		} );

		this.thumbnailPreloadQueue.execute();
	};

	/**
	 * Preload the fullscreen size of the current image.
	 */
	MMVP.preloadFullscreenThumbnail = function( image ) {
		this.fetchThumbnailForLightboxImage(
			image,
			this.ui.canvas.getLightboxImageWidthsForFullscreen( image ).real
		);
	};

	/**
	 * Loads all the size-independent information needed by the lightbox (image metadata, repo
	 * information, file usage, uploader data).
	 * @param {mw.Title} fileTitle Title of the file page for the image.
	 * @returns {jQuery.Promise.<mw.mmv.model.Image, mw.mmv.model.Repo, mw.mmv.model.FileUsage,
	 *     mw.mmv.model.FileUsage, mw.mmv.model.User>}
	 */
	MMVP.fetchSizeIndependentLightboxInfo = function ( fileTitle ) {
		var viewer = this,
			imageInfoPromise = this.imageInfoProvider.get( fileTitle ),
			repoInfoPromise = this.fileRepoInfoProvider.get( fileTitle ),
			imageUsagePromise = this.imageUsageProvider.get( fileTitle ),
			globalUsagePromise = this.globalUsageProvider.get( fileTitle ),
			userInfoPromise;

		userInfoPromise = $.when(
			imageInfoPromise, repoInfoPromise
		).then( function( imageInfo, repoInfoHash ) {
			if ( imageInfo.lastUploader ) {
				return viewer.userInfoProvider.get( imageInfo.lastUploader, repoInfoHash[imageInfo.repo] );
			} else {
				return null;
			}
		} );

		return $.when(
			imageInfoPromise, repoInfoPromise, imageUsagePromise, globalUsagePromise, userInfoPromise
		).then( function( imageInfo, repoInfoHash, imageUsage, globalUsage, userInfo ) {
			return $.Deferred().resolve( imageInfo, repoInfoHash[imageInfo.repo], imageUsage, globalUsage, userInfo );
		} );
	};

	/**
	 * Loads size-dependent components of a lightbox - the thumbnail model and the image itself.
	 * @param {mw.mmv.LightboxImage} image
	 * @param {number} width the width of the requested thumbnail
	 * @returns {jQuery.Promise.<mw.mmv.model.Thumbnail, HTMLImageElement>}
	 */
	MMVP.fetchThumbnailForLightboxImage = function ( image, width ) {
		return this.fetchThumbnail(
			image.filePageTitle,
			width,
			image.src,
			image.originalWidth,
			image.originalHeight
		);
	};

	/**
	 * Loads size-dependent components of a lightbox - the thumbnail model and the image itself.
	 * @param {mw.Title} fileTitle
	 * @param {number} width the width of the requested thumbnail
	 * @param {string} [sampleUrl] a thumbnail URL for the same file (but with different size) (might be missing)
	 * @param {number} [originalWidth] the width of the original, full-sized file (might be missing)
	 * @param {number} [originalHeight] the height of the original, full-sized file (might be missing)
	 * @returns {jQuery.Promise.<mw.mmv.model.Thumbnail, HTMLImageElement>}
	 */
	MMVP.fetchThumbnail = function ( fileTitle, width, sampleUrl, originalWidth, originalHeight ) {
		var viewer = this,
			guessing = false,
			thumbnailPromise,
			imagePromise;

		if ( originalWidth && width > originalWidth ) {
			// Do not request images larger than the original image
			// This would be possible (but still unwanted) for SVG images
			width = originalWidth;
		}

		if (
			sampleUrl && originalWidth && originalHeight &&
			mw.config.get( 'wgMultimediaViewer' ).useThumbnailGuessing
		) {
			guessing = true;
			thumbnailPromise = this.guessedThumbnailInfoProvider.get(
				fileTitle, sampleUrl, width, originalWidth, originalHeight
			).then( null, function () { // catch rejection, use fallback
					return viewer.thumbnailInfoProvider.get( fileTitle, width );
			} );
		} else {
			thumbnailPromise = this.thumbnailInfoProvider.get( fileTitle, width );
		}

		imagePromise = thumbnailPromise.then( function ( thumbnail ) {
			return viewer.imageProvider.get( thumbnail.url );
		} );

		if ( guessing ) {
			// If we guessed wrong, need to retry with real URL on failure.
			// As a side effect this introduces an extra (harmless) retry of a failed thumbnailInfoProvider.get call
			// because thumbnailInfoProvider.get is already called above when guessedThumbnailInfoProvider.get fails.
			imagePromise = imagePromise.then( null, function () {
				return viewer.thumbnailInfoProvider.get( fileTitle, width ).then( function ( thumbnail ) {
					return viewer.imageProvider.get( thumbnail.url );
				} );
			} );
		}

		return $.when( thumbnailPromise, imagePromise );
	};

	/**
	 * Loads an image at a specified index in the viewer's thumbnail array.
	 * @param {number} index
	 */
	MMVP.loadIndex = function ( index ) {
		var thumb;

		if ( index < this.thumbs.length && index >= 0 ) {
			thumb = this.thumbs[ index ];
			this.loadImage( thumb.image, thumb.$thumb.clone()[0] );
		}
	};

	/**
	 * Opens the next image
	 */
	MMVP.nextImage = function () {
		mw.mmv.logger.log( 'next-image' );
		this.loadIndex( this.currentIndex + 1 );
	};

	/**
	 * Opens the previous image
	 */
	MMVP.prevImage = function () {
		mw.mmv.logger.log( 'prev-image' );
		this.loadIndex( this.currentIndex - 1 );
	};

	/**
	 * Handles close event coming from the lightbox
	 */
	MMVP.close = function () {
		if ( comingFromHashChange === false ) {
			$( document ).trigger( $.Event( 'mmv-hash', { hash : '#' } ) );
		} else {
			comingFromHashChange = false;
		}

		// This has to happen after the hash reset, because setting the hash to # will reset the page scroll
		$( document ).trigger( $.Event( 'mmv-cleanup-overlay' ) );

		this.isOpen = false;
	};

	/**
	 * Handles a hash change coming from the browser
	 */
	MMVP.hash = function () {
		var route = this.router.parseLocation( window.location );

		if ( route instanceof mw.mmv.routing.ThumbnailRoute ) {
			this.loadImageByTitle( route.fileTitle );
		} else if ( this.isOpen ) {
			// This allows us to avoid the mmv-hash event that normally happens on close
			comingFromHashChange = true;

			if ( this.ui ) {
				// FIXME triggers mmv-close event, which calls viewer.close()
				this.ui.unattach();
			} else {
				this.close();
			}
		}
	};

	MMVP.setHash = function() {
		var route, hashFragment;
		if ( !this.comingFromHashChange ) {
			route = new mw.mmv.routing.ThumbnailRoute( this.currentImageFileTitle );
			hashFragment = '#' + this.router.createHash( route );
			$( document ).trigger( $.Event( 'mmv-hash', { hash : hashFragment } ) );
		}
	};

	/**
	 * @event mmv-close
	 * Fired when the viewer is closed. This is used by the ligthbox to notify the main app.
	 */
	/**
	 * @event mmv-next
	 * Fired when the user requests the next image.
	 */
	/**
	 * @event mmv-prev
	 * Fired when the user requests the previous image.
	 */
	/**
	 * @event mmv-resize
	 * Fired when the screen size changes.
	 */
	/**
	 * @event mmv-request-thumbnail
	 * Used by components to request a thumbnail URL for the current thumbnail, with a given size.
	 * @param {number} size
	 */
	/**
	 * Registers all event handlers
	 */
	MMVP.setupEventHandlers = function () {
		var viewer = this;

		$( document ).on( 'mmv-close.mmvp', function () {
			viewer.close();
		} ).on( 'mmv-next.mmvp', function () {
			viewer.nextImage();
		} ).on( 'mmv-prev.mmvp', function () {
			viewer.prevImage();
		} ).on( 'mmv-resize.mmvp', function () {
			viewer.resize( viewer.ui );
		} ).on( 'mmv-request-thumbnail.mmvp', function ( e, size ) {
			if ( viewer.currentImageFileTitle ) {
				return viewer.thumbnailInfoProvider.get( viewer.currentImageFileTitle, size );
			} else {
				return $.Deferred().reject();
			}
		} );
	};

	/**
	* Unregisters all event handlers. Currently only used in tests.
	*/
	MMVP.cleanupEventHandlers = function () {
		$( document ).off( 'mmv-close.mmvp mmv-next.mmvp mmv-prev.mmvp mmv-resize.mmvp' );
	};

	/**
	 * Preloads JS and CSS dependencies that aren't needed to display the first image, but could be needed later
	 */
	MMVP.preloadDependencies = function () {
		mw.loader.load( [ 'mmv.ui.reuse.share', 'mmv.ui.reuse.embed', 'mmv.ui.reuse.download', 'moment' ] );
	};

	mw.mmv.MultimediaViewer = MultimediaViewer;
}( mediaWiki, jQuery ) );
