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

( function ( mw, $, oo ) {
	var L;

	/**
	 * Writes log entries
	 * @class mw.mmv.logging.ActionLogger
	 * @extends mw.mmv.logging.Logger
	 * @constructor
	 */
	function ActionLogger() {}

	oo.inheritClass( ActionLogger, mw.mmv.logging.Logger );

	L = ActionLogger.prototype;

	/**
	 * Sampling factor key-value map.
	 *
	 * The map's keys are the action identifiers and the values are the sampling factor for each action type.
	 * There is a "default" key defined providing a default sampling factor for actions that aren't explicitely
	 * set in the map.
	 * @property {Object.<string, number>}
	 * @static
	 */
	L.samplingFactorMap = mw.config.get( 'wgMultimediaViewer' ).actionLoggingSamplingFactorMap;

	/**
	 * @override
	 * @inheritdoc
	 */
	L.schema = 'MediaViewer';

	/**
	 * Possible log actions, and their associated English developer log strings.
	 *
	 * These events are not de-duped. Eg. if the user opens the same site link
	 * in 10 tabs, there will be 10 file-description-page events. If they view the
	 * same image 10 times by hitting the prev/next buttons, there will be 10
	 * image-view events, etc.
	 * @property
	 * @static
	 */
	L.logActions = {
		'thumbnail': 'User clicked on a thumbnail to open Media Viewer.',
		'enlarge': 'User clicked on an enlarge link to open Media Viewer.',
		'fullscreen': 'User entered fullscreen mode.',
		'defullscreen': 'User exited fullscreen mode.',
		'close': 'User closed Media Viewer.',
		'view-original-file': 'User clicked on the direct link to the original file',
		'file-description-page': 'User opened the file description page.',
		'file-description-page-abovefold': 'User opened the file description page via the above-the-fold button.',
		'use-this-file-open': 'User opened the dialog to use this file.',
		'image-view': 'User viewed an image.',
		'metadata-open': 'User opened the metadata panel.',
		'metadata-close': 'User closed the metadata panel.',
		'next-image': 'User viewed the next image.',
		'prev-image': 'User viewed the previous image.',
		'terms-open': 'User opened the usage terms.',
		'license-page': 'User opened the license page.',
		'author-page': 'User opened the author page.',
		'source-page': 'User opened the source page.',
		'hash-load': 'User loaded the image via a hash on pageload.',
		'history-navigation': 'User navigated with the browser history.',
		'optout-loggedin': 'opt-out (via quick link at bottom of metadata panel) by logged-in user',
		'optout-anon': 'opt-out by anonymous user',
		'optin-loggedin': 'opt-in (via quick link at bottom of metadata panel) by logged-in user',
		'optin-anon': 'opt-in by anonymous user',
		'about-page': 'User opened the about page.',
		'discuss-page': 'User opened the discuss page.',
		'help-page': 'User opened the help page.',
		'location-page': 'User opened the location page.',
		'uploader-page': 'User opened the uploader page.',
		'download-select-menu-original': 'User selected the original size in the download dropdown menu.',
		'download-select-menu-small': 'User selected the small size in the download dropdown menu.',
		'download-select-menu-medium': 'User selected the medium size in the download dropdown menu.',
		'download-select-menu-large': 'User selected the large size in the download dropdown menu.',
		'download': 'User clicked on the button to download a file.',
		'download-view-in-browser': 'User clicked on the link to view the image in the browser in the download tab.',
		'share-page': 'User opened the link to the current image.',
		'share-link-copied': 'User copied the share link.',
		'embed-html-copied': 'User copied the HTML embed code.',
		'embed-wikitext-copied': 'User copied the wikitext embed code.',
		'embed-switched-to-html': 'User switched to the HTML embed code.',
		'embed-switched-to-wikitext': 'User switched to the wikitext embed code.',
		'embed-select-menu-wikitext-default': 'User switched to the default thumbnail size on wikitext.',
		'embed-select-menu-wikitext-small': 'User switched to the small thumbnail size on wikitext.',
		'embed-select-menu-wikitext-medium': 'User switched to the medium thumbnail size on wikitext.',
		'embed-select-menu-wikitext-large': 'User switched to the large thumbnail size on wikitext.',
		'embed-select-menu-html-original': 'User switched to the original thumbnail size on html.',
		'embed-select-menu-html-small': 'User switched to the small thumbnail size on html.',
		'embed-select-menu-html-medium': 'User switched to the medium thumbnail size on html.',
		'embed-select-menu-html-large': 'User switched to the large thumbnail size on html.',
		'use-this-file-close': 'User closed the dialog to use this file.',
		'download-open': 'User opened the dialog to download this file.',
		'download-close': 'User closed the dialog to download this file.',
		'options-open': 'User opened the enable/disable dialog.',
		'options-close': 'User either canceled an enable/disable action or closed a confirmation window.',
		'disable-about-link': 'User clicked on the "Learn more" link in the disable window.',
		'enable-about-link': 'User clicked on the "Learn more" link in the enable window.'
	};

	/**
	 * Logs an action
	 * @param {string} action The key representing the action
	 * @param {boolean} skipEventLog True if we don't want the action to be recorded in the event log
	 * @param {Object} substitutions A list of variable subtitutions for parametrized action texts
	 * @returns {jQuery.Promise}
	 */
	L.log = function ( action, skipEventLog, substitutions ) {
		var translatedAction = this.logActions[action] || action,
			self = this;

		if ( $.isPlainObject( substitutions ) ) {
			$.each( substitutions, function( key, value ) {
				translatedAction = translatedAction.replace( key, value );
			} );
		}

		mw.log( translatedAction );

		if ( !skipEventLog && self.isInSample( action ) ) {
			return this.loadDependencies().then( function () {
				self.eventLog.logEvent( self.schema, {
					action : action,
					samplingFactor : self.getActionFactor( action )
				} );
			} );
		} else {
			return $.Deferred().resolve();
		}
	};

	/**
	 * Returns the sampling factor for a given action
	 * @param {string} action The key representing the action
	 * @returns {number} Sampling factor
	 */
	L.getActionFactor = function ( action ) {
		return this.samplingFactorMap[ action ] || this.samplingFactorMap['default'];
	};

	/**
	 * Returns whether or not we should measure this request for this action
	 * @param {string} action The key representing the action
	 * @returns {boolean} True if this request needs to be sampled
	 */
	L.isInSample = function ( action ) {
		var factor = this.getActionFactor( action );

		if ( !$.isNumeric( factor ) || factor < 1 ) {
			return false;
		}
		return Math.floor( Math.random() * factor ) === 0;
	};

	mw.mmv.logging.ActionLogger = ActionLogger;
	mw.mmv.actionLogger = new ActionLogger();
}( mediaWiki, jQuery, OO ) );
