/*
 * This file is part of the MediaWiki extension MediaViewer.
 *
 * MediaViewer is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * MediaViewer is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with MediaViewer.  If not, see <http://www.gnu.org/licenses/>.
 */

( function ( mw, $ ) {
	var CP;

	/**
	 * @class mw.mmv.Config
	 * Contains/retrieves configuration/environment information for MediaViewer.
	 * @constructor
	 */
	function Config( viewerConfig, mwConfig, mwUser, api, localStorage ) {
		/**
		 * A plain object storing MediaViewer-specific settings
		 * @type {Object}
		 */
		this.viewerConfig = viewerConfig;

		/**
		 * The mw.config object, for dependency injection
		 * @type {mw.Map}
		 */
		this.mwConfig = mwConfig;

		/**
		 * mw.user object, for dependency injection
		 * @type {Object}
		 */
		this.mwUser = mwUser;

		/**
		 * API object, for dependency injction
		 * @type {mw.Api}
		 */
		this.api = api;

		/**
		 * The localStorage object, for dependency injection
		 * @type {Object}
		 */
		this.localStorage = localStorage;
	}
	CP = Config.prototype;

	/**
	 * Get value from local storage or fail gracefully.
	 * @param {string} key
	 * @param {*} [fallback] value to return when key is not set or localStorage is not supported
	 * @returns {*} stored value or fallback or null if neither exists
	 */
	CP.getFromLocalStorage = function ( key, fallback ) {
		var value = null;
		if ( this.localStorage ) {
			value = this.localStorage.getItem( key );
		}
		if ( value === null && fallback !== undefined ) {
			value = fallback;
		}
		return value;
	};

	/**
	 * Set item in local storage or fail gracefully.
	 * @param {string} key
	 * @param {*} value
	 * @return {boolean} whether storing the item was successful
	 */
	CP.setInLocalStorage = function ( key, value ) {
		var success = false;
		if ( this.localStorage ) {
			try {
				this.localStorage.setItem( key, value );
				success = true;
			} catch ( e ) {}
		}
		return success;
	};

	/**
	 * Remove item from local storage or fail gracefully.
	 * @param {string} key
	 * @return {boolean} whether storing the item was successful
	 */
	CP.removeFromLocalStorage = function ( key ) {
		if ( this.localStorage ) {
			try {
				this.localStorage.removeItem( key );
				return true;
			} catch ( e ) {
				return false;
			}
		}
		return true; // since we never even stored the value, this is considered a success
	};

	/**
	 * Set user preference via AJAX
	 * @param {string} key
	 * @param {string} value
	 * @returns {jQuery.Promise} a deferred which resolves/rejects on success/failure respectively
	 */
	CP.setUserPreference = function ( key, value ) {
		return this.api.postWithToken( 'options', {
			action: 'options',
			optionname: key,
			optionvalue: value
		} );
	};

	/**
	 * Returns true if MediaViewer should handle thumbnail clicks.
	 */
	CP.isMediaViewerEnabledOnClick = function () {
		// IMPORTANT: mmv.head.js uses the same logic but does not use this class to be lightweight. Make sure to keep it in sync.
		return this.mwConfig.get( 'wgMediaViewer' ) // global opt-out switch, can be set in user JS
			&& this.mwConfig.get( 'wgMediaViewerOnClick' ) // thumbnail opt-out, can be set in preferences
			&& ( !this.mwUser.isAnon() || this.getFromLocalStorage( 'wgMediaViewerOnClick', 1 ) === 1 ); // thumbnail opt-out for anons
	};

	/**
	 * (Semi-)permanently stores the setting whether MediaViewer should handle thumbnail clicks.
	 * - for logged-in users, we use preferences
	 * - for anons, we use localStorage
	 * - for anons with old browsers, we don't do anything
	 * @param {boolean} enabled
	 * @return {jQuery.Promise} a deferred which resolves/rejects on success/failure respectively
	 */
	CP.setMediaViewerEnabledOnClick = function ( enabled ) {
		var deferred,
			newPrefValue,
			defaultPrefValue = this.mwConfig.get( 'wgMediaViewerEnabledByDefault' ),
			config = this,
			success = true;

		if ( this.mwUser.isAnon() ) {
			if ( !enabled ) {
				success = this.setInLocalStorage( 'wgMediaViewerOnClick', '0' ); // localStorage stringifies everything, best use strings in the first place
			} else {
				success = this.removeFromLocalStorage( 'wgMediaViewerOnClick' );
			}
			if ( success ) {
				deferred = $.Deferred().resolve();
			} else {
				deferred = $.Deferred().reject();
			}
		} else {
			// Simulate changing the option in Special:Preferences. Turns out this is quite hard (bug 69942):
			// we need to delete the user_properties row if the new setting is the same as the default,
			// otherwise set '1' for enabled, '' for disabled. In theory the pref API will delete the row
			// if the new value equals the default, but this does not always work.
			if ( defaultPrefValue === true ) {
				newPrefValue = enabled ? '1' : '';
			} else {
				// undefined will cause the API call to omit the optionvalue parameter
				// which in turn will cause the options API to delete the row and revert the pref to default
				newPrefValue = enabled ? '1' : undefined;
			}
			deferred = this.setUserPreference( 'multimediaviewer-enable', newPrefValue );
		}

		return deferred.done( function () {
			// make the change work without a reload
			config.mwConfig.set( 'wgMediaViewerOnClick', enabled );
			if ( !enabled ) {
				// set flag for showing a popup if this was a first-time disable
				config.maybeEnableStatusInfo();
			}
		} );
	};

	/**
	 * Returns true if #setMediaViewerEnabledOnClick() is supported.
	 * @return {boolean}
	 */
	CP.canSetMediaViewerEnabledOnClick = function () {
		return !this.mwUser.isAnon() || !!this.localStorage;
	};


	/**
	 * True if info about enable/disable status should be displayed (mingle #719).
	 * @returns {boolean}
	 */
	CP.shouldShowStatusInfo = function () {
		return !this.isMediaViewerEnabledOnClick() && this.getFromLocalStorage( 'mmv-showStatusInfo' ) === '1';
	};

	/**
	 * @private
	 * Called when MediaViewer is disabled. If status info was never displayed before, future
	 * shouldShowStatusInfo() calls will return true.
	 */
	CP.maybeEnableStatusInfo = function ( ) {
		var currentShowStatusInfo = this.getFromLocalStorage( 'mmv-showStatusInfo' );
		if ( currentShowStatusInfo === null ) {
			this.setInLocalStorage( 'mmv-showStatusInfo', '1' );
		}
	};

	/**
	 * Called when status info is displayed. Future shouldShowStatusInfo() calls will retrurn false.
	 */
	CP.disableStatusInfo = function ( ) {
		this.setInLocalStorage( 'mmv-showStatusInfo', '0' );
	};

	mw.mmv.Config = Config;
} ( mediaWiki, jQuery ) );
