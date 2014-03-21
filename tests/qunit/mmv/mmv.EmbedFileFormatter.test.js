( function ( mw ) {
	QUnit.module( 'mmv.EmbedFileFormatter', QUnit.newMwEnvironment() );

	function createEmbedFileInfo( options ) {
		var license = options.licenseShortName ? new mw.mmv.model.License( options.licenseShortName,
				options.licenseInternalName, options.licenseLongName, options.licenseUrl ) : undefined,
			imageInfo = new mw.mmv.model.Image( options.title, undefined, undefined, undefined,
				undefined, options.imgUrl, options.filePageUrl, 'repo', undefined, undefined,
				undefined, undefined, options.source, options.author, license ),
			repoInfo = { displayName: options.siteName, getSiteLink:
				function () { return options.siteUrl; } };

		return new mw.mmv.model.EmbedFileInfo( imageInfo, repoInfo, options.caption );
	}

	QUnit.test( 'EmbedFileFormatter constructor sanity check', 1, function ( assert ) {
		var formatter = new mw.mmv.EmbedFileFormatter();
		assert.ok( formatter, 'constructor with no argument works');
	} );

	QUnit.test( 'getByline():', 4, function ( assert ) {
		var formatter = new mw.mmv.EmbedFileFormatter(),
			author = '<span class="mw-mlb-author">Homer</span>',
			source = '<span class="mw-mlb-source">Iliad</span>',
			byline;

		// Works with no arguments
		byline = formatter.getByline();
		assert.strictEqual( byline, undefined, 'No argument case handled correctly.' );

		// Author and source present
		byline = formatter.getByline( author, source );
		assert.ok( byline.match ( /Homer|Iliad/ ), 'Author and source found in bylines' );

		// Only author present
		byline = formatter.getByline( author );
		assert.ok( byline.match ( /Homer/ ), 'Author found in bylines.' );

		// Only source present
		byline = formatter.getByline( undefined, source );
		assert.ok( byline.match( /Iliad/ ), 'Source found in bylines.' );
	} );

	QUnit.test( 'getSiteLink():', 2, function ( assert ) {
		var repoInfo = new mw.mmv.model.Repo( 'Wikipedia', '//wikipedia.org/favicon.ico', true ),
			info = new mw.mmv.model.EmbedFileInfo( {}, repoInfo ),
			formatter = new mw.mmv.EmbedFileFormatter(),
			siteUrl = repoInfo.getSiteLink(),
			siteLink = formatter.getSiteLink( info );

		assert.ok( siteLink.match( 'Wikipedia' ), 'Site name is present in site link' );
		assert.ok( siteLink.match( siteUrl ), 'Site URL is present in site link' );
	} );


	QUnit.test( 'getThumbnailHtml():', 36, function ( assert ) {
		var formatter = new mw.mmv.EmbedFileFormatter(),
			titleText = 'Music Room',
			title = mw.Title.newFromText( titleText ),
			imgUrl = 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Foobar.jpg',
			filePageUrl = 'https://commons.wikimedia.org/wiki/File:Foobar.jpg',
			siteName = 'Site Name',
			siteUrl = '//site.url/',
			licenseShortName = 'Public License',
			licenseInternalName = '-',
			licenseLongName = 'Public Domain, copyrights have lapsed',
			licenseUrl = '//example.com/pd',
			author = '<span class="mw-mlb-author">Homer</span>',
			source = '<span class="mw-mlb-source">Iliad</span>',
			thumbUrl = 'https://upload.wikimedia.org/wikipedia/thumb/Foobar.jpg',
			width = 700,
			height = 500,
			info,
			generatedHtml;

		// Bylines, license and site
		info = createEmbedFileInfo( { title: title, imgUrl: imgUrl, filePageUrl: filePageUrl,
			siteName: siteName, siteUrl: siteUrl, licenseShortName: licenseShortName,
			licenseInternalName: licenseInternalName, licenseLongName: licenseLongName,
			licenseUrl: licenseUrl, author: author, source: source } );
		generatedHtml = formatter.getThumbnailHtml( info, thumbUrl, width, height);

		assert.ok( generatedHtml.match( titleText ), 'Title appears in generated HTML.' );
		assert.ok( generatedHtml.match( filePageUrl ), 'Page url appears in generated HTML.' );
		assert.ok( generatedHtml.match( thumbUrl ), 'Thumbnail url appears in generated HTML' );
		assert.ok( generatedHtml.match( siteName ), 'Site name appears in generated HTML' );
		assert.ok( generatedHtml.match( 'Public License' ), 'License appears in generated HTML' );
		assert.ok( generatedHtml.match( 'Homer' ), 'Author appears in generated HTML' );
		assert.ok( generatedHtml.match( 'Iliad' ), 'Source appears in generated HTML' );
		assert.ok( generatedHtml.match( width ), 'Width appears in generated HTML' );
		assert.ok( generatedHtml.match( height ), 'Height appears in generated HTML' );

		// Bylines, no license and site
		info = createEmbedFileInfo( { title: title, imgUrl: imgUrl, filePageUrl: filePageUrl,
			siteName: siteName, siteUrl: siteUrl,
			author: author, source: source } );
		generatedHtml = formatter.getThumbnailHtml( info, thumbUrl, width, height);

		assert.ok( generatedHtml.match( titleText ), 'Title appears in generated HTML.' );
		assert.ok( generatedHtml.match( filePageUrl ), 'Page url appears in generated HTML.' );
		assert.ok( generatedHtml.match( thumbUrl ), 'Thumbnail url appears in generated HTML' );
		assert.ok( generatedHtml.match( siteName ), 'Site name appears in generated HTML' );
		assert.ok( ! generatedHtml.match( 'Public License' ), 'License should not appear in generated HTML' );
		assert.ok( generatedHtml.match( 'Homer' ), 'Author appears in generated HTML' );
		assert.ok( generatedHtml.match( 'Iliad' ), 'Source appears in generated HTML' );
		assert.ok( generatedHtml.match( width ), 'Width appears in generated HTML' );
		assert.ok( generatedHtml.match( height ), 'Height appears in generated HTML' );

		// No bylines, license and site
		info = createEmbedFileInfo( { title: title, imgUrl: imgUrl, filePageUrl: filePageUrl,
			siteName: siteName, siteUrl: siteUrl, licenseShortName: licenseShortName,
			licenseInternalName: licenseInternalName, licenseLongName: licenseLongName,
			licenseUrl: licenseUrl } );
		generatedHtml = formatter.getThumbnailHtml( info, thumbUrl, width, height);

		assert.ok( generatedHtml.match( titleText ), 'Title appears in generated HTML.');
		assert.ok( generatedHtml.match( filePageUrl ), 'Page url appears in generated HTML.' );
		assert.ok( generatedHtml.match( thumbUrl ), 'Thumbnail url appears in generated HTML' );
		assert.ok( generatedHtml.match( siteName ), 'Site name appears in generated HTML' );
		assert.ok( generatedHtml.match( 'Public License' ), 'License appears in generated HTML' );
		assert.ok( ! generatedHtml.match( 'Homer' ), 'Author should not appear in generated HTML' );
		assert.ok( ! generatedHtml.match( 'Iliad' ), 'Source should not appear in generated HTML' );
		assert.ok( generatedHtml.match( width ), 'Width appears in generated HTML' );
		assert.ok( generatedHtml.match( height ), 'Height appears in generated HTML' );

		// No bylines, no license and site
		info = createEmbedFileInfo( { title: title, imgUrl: imgUrl, filePageUrl: filePageUrl,
			siteName: siteName, siteUrl: siteUrl } );
		generatedHtml = formatter.getThumbnailHtml( info, thumbUrl, width, height);

		assert.ok( generatedHtml.match( titleText ), 'Title appears in generated HTML.');
		assert.ok( generatedHtml.match( filePageUrl ), 'Page url appears in generated HTML.' );
		assert.ok( generatedHtml.match( thumbUrl ), 'Thumbnail url appears in generated HTML' );
		assert.ok( generatedHtml.match( siteName ), 'Site name should appear in generated HTML' );
		assert.ok( ! generatedHtml.match( 'Public License' ), 'License should not appear in generated HTML' );
		assert.ok( ! generatedHtml.match( 'Homer' ), 'Author should not appear in generated HTML' );
		assert.ok( ! generatedHtml.match( 'Iliad' ), 'Source should not appear in generated HTML' );
		assert.ok( generatedHtml.match( width ), 'Width appears in generated HTML' );
		assert.ok( generatedHtml.match( height ), 'Height appears in generated HTML' );

	} );

	QUnit.test( 'getThumbnailWikitext():', 3, function ( assert ) {
		var formatter = new mw.mmv.EmbedFileFormatter(),
			title = mw.Title.newFromText( 'File:Foobar.jpg' ),
			imgUrl = 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Foobar.jpg',
			filePageUrl = 'https://commons.wikimedia.org/wiki/File:Foobar.jpg',
			caption = 'Foobar caption.',
			width = 700,
			info,
			wikitext;

		// Title, width and caption
		info = createEmbedFileInfo( { title: title, imgUrl: imgUrl, filePageUrl: filePageUrl,
			caption: caption } );
		wikitext = formatter.getThumbnailWikitextFromEmbedFileInfo( info, width );

		assert.strictEqual(
			wikitext,
			'[[File:Foobar.jpg|700px|thumb|Foobar caption.]]',
			'Wikitext generated correctly.' );

		// Title, width and no caption
		info = createEmbedFileInfo( { title: title, imgUrl: imgUrl, filePageUrl: filePageUrl } );
		wikitext = formatter.getThumbnailWikitextFromEmbedFileInfo( info , width );

		assert.strictEqual(
			wikitext,
			'[[File:Foobar.jpg|700px|thumb|Foobar]]',
			'Wikitext generated correctly.' );

		// Title, no width and no caption
		info = createEmbedFileInfo( { title: title, imgUrl: imgUrl, filePageUrl: filePageUrl } );
		wikitext = formatter.getThumbnailWikitextFromEmbedFileInfo( info );

		assert.strictEqual(
			wikitext,
			'[[File:Foobar.jpg|thumb|Foobar]]',
			'Wikitext generated correctly.' );
	} );

}( mediaWiki ) );
