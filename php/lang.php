<?php

require_once dirname( __FILE__ ) . '/Names.php';

// Based on http://www.thefutureoftheweb.com/blog/use-accept-language-header
$langs = array();
if ( isset( $_SERVER['HTTP_ACCEPT_LANGUAGE'] ) ) {
	// break up string into pieces (languages and q factors)
        $l = strtolower($_SERVER['HTTP_ACCEPT_LANGUAGE']);
	preg_match_all('/([a-z]+(?:-[a-z]+)?)\s*(?:;\s*q\s*=\s*(1|0?\.[0-9]+))?/i', $l, $lang_parse);
	
	if ( count( $lang_parse[1] ) > 0 ) {
		// create a list like "en" => 0.8
		foreach ( $lang_parse[1] as $i => $code ) {
			if ( isset( $lang_parse[2][$i] ) && $lang_parse[2][$i] != '' ) {
				$langs[strtolower($code)] = (float) $lang_parse[2][$i];
			} else {
				$langs[strtolower($code)] = 1;
			}
		}
		
		// sort list based on value	
		arsort($langs, SORT_NUMERIC);
	}
}


foreach ( $langs as $code => $q ) {
	if ( !isset( $coreLanguageNames[$code] ) ) {
		unset( $langs[$code] );
	}
}

$out = array();
foreach ( $langs as $code => $q ) {
	$out[] = (object) array(
		'code' => $code,
		'name' => $coreLanguageNames[$code],
	);
}

//header( 'Content-type: text/plain; charset=UTF-8' ); 
header( 'Content-type: application/javascript; charset=UTF-8' ); 
header( 'Cache-Control: private, s-maxage=0, max-age=' . (60*60*24) );
header( 'Vary: Accept-Language' );
echo "var _global_languages = " . json_encode( $out ) . ";";


