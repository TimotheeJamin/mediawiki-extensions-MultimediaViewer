<?php
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
 *
 * @file
 * @ingroup extensions
 * @author Mark Holmquist <mtraceur@member.fsf.org>
 * @copyright Copyright © 2013, Mark Holmquist
 */

// do not pollute global namespace
call_user_func( function() {
	global $wgExtensionMessagesFiles, $wgResourceModules, $wgExtensionFunctions,
		$wgAutoloadClasses, $wgHooks, $wgExtensionCredits, $wgNetworkPerformanceSamplingFactor;

	/** @var int|bool: If set, records image load network performance once per this many requests. False if unset. **/
	$wgNetworkPerformanceSamplingFactor = false;

	$wgExtensionMessagesFiles['MultimediaViewer'] = __DIR__ . '/MultimediaViewer.i18n.php';

	/**
	 * @param string $path
	 * @return array
	 */
	$moduleInfo = function( $path ) {
		return array(
			'localBasePath' => __DIR__ . "/resources/$path",
			'remoteExtPath' => "MultimediaViewer/resources/$path",

		);
	};

	$wgResourceModules['multilightbox.interface'] = array_merge( array(
		'scripts' => array(
			'lightboxinterface.js',
		),

		'styles' => array(
			'multilightbox.less',
		),
	), $moduleInfo( 'multilightbox' ) );

	$wgResourceModules['multilightbox.image'] = array_merge( array(
		'scripts' => array(
			'lightboximage.js',
		),
	), $moduleInfo( 'multilightbox' ) );

	$wgResourceModules['multilightbox'] = array_merge( array(
		'scripts' => array(
			'multilightbox.js',
		),

		'dependencies' => array(
			'mmv.lightboxinterface',
		),
	), $moduleInfo( 'multilightbox' ) );

	$wgResourceModules['mmv.lightboximage'] = array_merge( array(
		'scripts' => array(
			'mmv.lightboximage.js',
		),

		'dependencies' => array(
			'oojs',
			'multilightbox.image',
		),
	), $moduleInfo( 'mmv' ) );

	$wgResourceModules['mmv.lightboxinterface'] = array_merge( array(
		'scripts' => array(
			'mmv.lightboxinterface.js',
		),

		'dependencies' => array(
			'oojs',
			'multilightbox.interface',
			'mmv.ui.buttons',
			'mmv.ui.categories',
			'mmv.ui.description',
			'mmv.ui.fileUsage',
			'mmv.ui.metadataPanel',
			'mmv.ThumbnailWidthCalculator',
		),
	), $moduleInfo( 'mmv' ) );

	$wgResourceModules['mmv.ThumbnailWidthCalculator'] = array_merge( array(
		'scripts' => array(
			'mmv.ThumbnailWidthCalculator.js',
		),

		'dependencies' => array(
			'mediawiki',
			'jquery',
			'jquery.hidpi',
			'mmv.base',
			'mmv.model.ThumbnailWidth',
		),
	), $moduleInfo( 'mmv' ) );

	$wgResourceModules['mmv.model'] = array_merge( array(
		'scripts' => array(
			'mmv.model.js',
		),

		'dependencies' => array(
			'mmv.base',
			'oojs',
		),
	), $moduleInfo( 'mmv/model' ) );

	$wgResourceModules['mmv.multilightbox'] = array_merge( array(
		'scripts' => array(
			'mmv.multilightbox.js',
		),

		'dependencies' => array(
			'oojs',
			'multilightbox',
		),
	), $moduleInfo( 'mmv' ) );

	$wgResourceModules['mmv.model.FileUsage'] = array_merge( array(
		'scripts' => array(
			'mmv.model.FileUsage.js',
		),

		'dependencies' => array(
			'mmv.model',
		),
	), $moduleInfo( 'mmv/model' ) );

	$wgResourceModules['mmv.model.Image'] = array_merge( array(
		'scripts' => array(
			'mmv.model.Image.js',
		),

		'dependencies' => array(
			'mmv.model',
		),
	), $moduleInfo( 'mmv/model' ) );

	$wgResourceModules['mmv.model.Repo'] = array_merge( array(
		'scripts' => array(
			'mmv.model.Repo.js',
		),

		'dependencies' => array(
			'mmv.model',
			'oojs',
		),
	), $moduleInfo( 'mmv/model' ) );

	$wgResourceModules['mmv.model.Thumbnail'] = array_merge( array(
		'scripts' => array(
			'mmv.model.Thumbnail.js',
		),

		'dependencies' => array(
			'mmv.model',
		),
	), $moduleInfo( 'mmv/model' ) );

	$wgResourceModules['mmv.model.ThumbnailWidth'] = array_merge( array(
		'scripts' => array(
			'mmv.model.ThumbnailWidth.js',
		),

		'dependencies' => array(
			'mmv.model',
		),
	), $moduleInfo( 'mmv/model' ) );

	$wgResourceModules['mmv.model.User'] = array_merge( array(
		'scripts' => array(
			'mmv.model.User.js',
		),

		'dependencies' => array(
			'mmv.model',
		),
	), $moduleInfo( 'mmv/model' ) );

	$wgResourceModules['mmv.model.TaskQueue'] = array_merge( array(
		'scripts' => array(
			'mmv.model.TaskQueue.js',
		),

		'dependencies' => array(
			'mmv.model',
		),
	), $moduleInfo( 'mmv/model' ) );

	$wgResourceModules['mmv.provider'] = array_merge( array(
		'scripts' => array(
			'mmv.provider.Api.js',
			'mmv.provider.ImageUsage.js',
			'mmv.provider.GlobalUsage.js',
			'mmv.provider.ImageInfo.js',
			'mmv.provider.FileRepoInfo.js',
			'mmv.provider.ThumbnailInfo.js',
			'mmv.provider.UserInfo.js',
			'mmv.provider.Image.js',
		),

		'dependencies' => array(
			'mediawiki.Title',
			'mmv.model',
			'mmv.model.TaskQueue',
			'oojs',
		),
	), $moduleInfo( 'mmv/provider' ) );

	$wgResourceModules['mmv.base'] = array_merge( array(
		'scripts' => array(
			'mmv.base.js',
		),
	), $moduleInfo( 'mmv' ) );

	$wgResourceModules['mmv.ui'] = array_merge( array(
		'scripts' => array(
			'mmv.ui.js',
		),

		'dependencies' => array(
			'mmv.base',
		),
	), $moduleInfo( 'mmv/ui' ) );

	$wgResourceModules['mmv.ui.categories'] = array_merge( array(
		'scripts' => array(
			'mmv.ui.categories.js',
		),

		'styles' => array(
			'mmv.ui.categories.less',
		),

		'dependencies' => array(
			'mmv.ui',
			'oojs',
		),
	), $moduleInfo( 'mmv/ui' ) );

	$wgResourceModules['mmv.ui.description'] = array_merge( array(
		'scripts' => array(
			'mmv.ui.description.js',
		),

		'dependencies' => array(
			'mmv.ui',
			'oojs',
		),
	), $moduleInfo( 'mmv/ui' ) );

	$wgResourceModules['mmv.ui.fileUsage'] = array_merge( array(
		'scripts' => array(
			'mmv.ui.fileUsage.js',
		),

		'styles' => array(
			'mmv.ui.fileUsage.less',
		),

		'dependencies' => array(
			'mediawiki.Uri',
			'mediawiki.jqueryMsg',
			'mmv.ui',
			'oojs',
		),
	), $moduleInfo( 'mmv/ui' ) );

	$wgResourceModules['mmv.ui.metadataPanel'] = array_merge( array(
		'scripts' => array(
			'mmv.ui.metadataPanel.js',
		),
		// Note: We should pull these styles out, but the LESS patch should get merged first.
//		'styles' => array(
//			'mmv.ui.metadataPanel.less',
//		),

		'dependencies' => array(
			'mmv.ui',
			'mmv.ui.fileReuse',
			'oojs',
			'moment',
		),

		'messages' => array(
			'multimediaviewer-repository',
			'multimediaviewer-repository-local',

			'multimediaviewer-credit',

			'multimediaviewer-userpage-link',

			'multimediaviewer-datetime-created',
			'multimediaviewer-datetime-uploaded',

			'multimediaviewer-geoloc-north',
			'multimediaviewer-geoloc-east',
			'multimediaviewer-geoloc-south',
			'multimediaviewer-geoloc-west',
			'multimediaviewer-geoloc-coord',
			'multimediaviewer-geoloc-coords',
			'multimediaviewer-geolocation',

			'multimediaviewer-about-mmv',
			'multimediaviewer-discuss-mmv',
		),
	), $moduleInfo( 'mmv/ui' ) );

	$wgResourceModules['mmv.ui.fileReuse'] = array_merge( array(
		'scripts' => array(
			'mmv.ui.fileReuse.js',
		),

		'styles' => array(
			'mmv.ui.fileReuse.less',
		),

		'dependencies' => array(
			'mmv.ui',
			'oojs',
		),
	), $moduleInfo( 'mmv/ui' ) );

	$wgResourceModules['mmv.ui.buttons'] = array_merge( array(
		'scripts' => array(
			'mmv.ui.buttons.js',
		),

		'styles' => array(
			'mmv.ui.buttons.less',
		),

		'dependencies' => array(
			'mmv.ui',
			'oojs',
		),
	), $moduleInfo( 'mmv/ui' ) );

	$wgResourceModules['mmv.logger'] = array_merge( array(
		'scripts' => array(
			'mmv.logger.js',
		),

		'dependencies' => array(
			'oojs',
		),
	), $moduleInfo( 'mmv' ) );

	$wgResourceModules['mmv.performance'] = array_merge( array(
		'scripts' => array(
			'mmv.performance.js',
		),

		'dependencies' => array(
			'jquery',
			'mediawiki',
			'mmv.base',
		),
	), $moduleInfo( 'mmv' ) );

	$wgResourceModules['mmv'] = array_merge( array(
		'scripts' => array(
			'mmv.js',
		),

		'styles' => array(
			'mmv.less',
		),

		'dependencies' => array(
			'mmv.logger',
			'multilightbox',
			'jquery.scrollTo',
			'mmv.lightboximage',
			'jquery.fullscreen',
			'jquery.throttle-debounce',
			'mediawiki.api',
			'mediawiki.Uri',
			'mediawiki.Title',
			'jquery.ui.dialog',
			'jquery.hidpi',
			'mmv.model',
			'mmv.model.FileUsage',
			'mmv.model.Image',
			'mmv.model.Repo',
			'mmv.model.Thumbnail',
			'mmv.model.User',
			'mmv.model.TaskQueue',
			'mmv.provider',
			'mediawiki.language',
			'mmv.multilightbox',
			'mmv.performance',
			'mmv.ThumbnailWidthCalculator',
		),

		'messages' => array(
			'comma-separator',

			'multimediaviewer-file-page',
			'multimediaviewer-use-file',
			'multimediaviewer-use-file-owt',
			'multimediaviewer-use-file-own',
			'multimediaviewer-use-file-offwiki',
			'multimediaviewer-desc-nil',

			'multimediaviewer-fileusage-count',
			'multimediaviewer-fileusage-count-more',
			'multimediaviewer-fileusage-link',
			'multimediaviewer-fileusage-local-section',
			'multimediaviewer-fileusage-global-section',
		),
	), $moduleInfo( 'mmv' ) );

	$wgResourceModules['jquery.scrollTo'] = array_merge( array(
		'scripts' => array(
			'jquery.scrollTo.js',
		),
	), $moduleInfo( 'jquery.scrollTo' ) );

	$wgExtensionFunctions[] = function () {
		global $wgResourceModules;

		if ( isset( $wgResourceModules['ext.eventLogging'] ) ) {
			$wgResourceModules['schema.MediaViewer'] = array(
				'class' => 'ResourceLoaderSchemaModule',
				'schema' => 'MediaViewer',
				'revision' => 6636420,
			);

			$wgResourceModules['schema.MultimediaViewerNetworkPerformance'] = array(
				'class' => 'ResourceLoaderSchemaModule',
				'schema' => 'MultimediaViewerNetworkPerformance',
				'revision' => 7393226,
			);

			$wgResourceModules['mmv']['dependencies'][] = 'ext.eventLogging';
			$wgResourceModules['mmv']['dependencies'][] = 'schema.MediaViewer';
			$wgResourceModules['mmv']['dependencies'][] = 'schema.MultimediaViewerNetworkPerformance';
		}
	};

	$licenses = array(
		'cc-by-1.0',
		'cc-sa-1.0',
		'cc-by-sa-1.0',
		'cc-by-2.0',
		'cc-by-sa-2.0',
		'cc-by-2.1',
		'cc-by-sa-2.1',
		'cc-by-2.5',
		'cc-by-sa-2.5',
		'cc-by-3.0',
		'cc-by-sa-3.0',
		'cc-by-sa-3.0-migrated',
		'cc-by-4.0',
		'cc-by-sa-4.0',
		'cc-pd',
		'cc-zero',
		'pd',
		'default',
	);

	foreach ( $licenses as $license ) {
		$wgResourceModules['mmv']['messages'][] = 'multimediaviewer-license-' . $license;
	}

	$wgAutoloadClasses['MultimediaViewerHooks'] = __DIR__ . '/MultimediaViewerHooks.php';
	$wgHooks['GetBetaFeaturePreferences'][] = 'MultimediaViewerHooks::getBetaPreferences';
	$wgHooks['BeforePageDisplay'][] = 'MultimediaViewerHooks::getModulesForArticle';
	$wgHooks['CategoryPageView'][] = 'MultimediaViewerHooks::getModulesForCategory';
	$wgHooks['ResourceLoaderGetConfigVars'][] = 'MultimediaViewerHooks::resourceLoaderGetConfigVars';
	$wgHooks['ResourceLoaderTestModules'][] = 'MultimediaViewerHooks::getTestModules';

	$wgExtensionCredits['betafeatures'][] = array(
		'path' => __FILE__,
		'name' => 'MultimediaViewer',
		'descriptionmsg' => 'multimediaviewer-desc',
		'version' => '0.2.0',
		'author' => array(
			'MarkTraceur (Mark Holmquist)',
			'Gilles Dubuc',
			'Gergő Tisza',
			'Aaron Arcos',
			'Zeljko Filipin',
			'Pau Giner',
			'theopolisme',
			'MatmaRex',
			'apsdehal',
			'vldandrew',
			'Ebrahim Byagowi',
			'Dereckson',
			'Brion VIBBER',
			'Yuki Shira',
			'Yaroslav Melnychuk',
			'tonythomas01',
			'Raimond Spekking',
			'Kunal Mehta',
			'Jeff Hall',
			'Christian Aistleitner',
			'Amir E. Aharoni',
		),
		'url' => 'https://mediawiki.org/wiki/Extension:MultimediaViewer',
	);

} );
