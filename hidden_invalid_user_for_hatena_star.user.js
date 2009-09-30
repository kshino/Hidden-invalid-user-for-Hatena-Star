// ==UserScript==
// @name           Hidden invalid user for Hatena Star
// @namespace      http://www.scrapcode.net/
// @include        http://*
// @include        https://*
// @version        1.0.0
// ==/UserScript==
(function(){

    // 下の「 return [ 」と「 ] }; 」の間に、非表示にしたいユーザーのはてなIDを記述
    var ngUsers = function() { return [
        ""
    ] };

/* はてなIDの記述方法について。

    はてなIDを2つの " (ダブルクォーテーション) で囲みます。
    はてなIDが id:khashi の場合、"khashi" になります。

    複数記述する場合はそれぞれのはてなIDを個別にダブルクォーテーションで囲み、
    囲んだものを半角カンマで連結します。
    "khashi","kshino"

    半角カンマで連結するときに、カンマの前後に改行を入れても構いません。
    "khashi",
    "kshino"

    記述例1: 「khashi」一人を非表示にする場合
    var ngUsers = function() { return [
        "khashi"
    ] };

    記述例2: 「khashi」と「kshino」の二人を非表示にする場合
    var ngUsers = function() { return [
        "khashi","kshino"
    ] };

    記述例3: 「khashi」と「kshino」の二人を非表示にする場合で、改行を入れる場合
    var ngUsers = function() { return [
        "khashi",
        "kshino"
    ] };
*/

    var w = unsafeWindow;
    if( typeof( w.Hatena ) == 'undefined' ) return;
    if( typeof( w.Hatena.Star ) == 'undefined' ) return;
    if( typeof( w.Hatena.Star.InnerCount )  == 'undefined' ) return;
    if( typeof( w.Hatena.Star.EntryLoader ) == 'undefined' ) return;

    var ngUserFunc = function( idFunc ) {
        if( ! idFunc ) return;
        var ids = idFunc();
        
        if( ids.length == 0 || ( ids.length == 1 && ids[0] == '' ) ) return;

        var ng  = {};
        for( var i = 0; i < ids.length; ++i ) {
            var id = ids[i];
            if( id != '' ) ng[ ids[i] ] = 1;
        }

        var grep = function( uri, stars, do_collapse ) {
            var result = [];
            if( typeof( stars ) == 'undefined' ) return stars;

            if(
                   stars.length == 3
                && ( ! stars[0].count || stars[0].count == "" )
                && typeof( stars[1] ) == 'number'
                && ( ng[ stars[0].name ] || ng[ stars[2].name ] )
            ) {
                var klass = new iClass();
                var uri   = Hatena.Star.BaseURL + 'entry.json?uri=' + encodeURIComponent( uri );
                new Ten.JSONP( uri, klass, 'receiveStarEntry' );
                return null;
            }

            var count = 0;
            for( var i = 0; i < stars.length; ++i ) {
                var obj = stars[i];
                if( typeof( obj ) == 'object' ) {
                    if( ng[ obj.name ] ) continue;
                    else count += obj.count == '' ? 1: obj.count;
                }
                if( typeof( obj ) == 'object' && ng[ obj.name ] ) continue;
                result.push( obj );
            }

            if( do_collapse && count >= 16 ) {
                if( result[0].count != '' ) {
                    result[0].count = '';
                    result[ result.length - 1 ].count = '';
                }
                result = [ result[0], count - 2, result[ result.length - 1 ] ];
            }

            return result;
        };

        var grep_stars = function( res, do_collapse ) {
            var entries = [];
            for( var i = 0; i < res.entries.length; ++i ) {
                var e = res.entries[i];
                e.stars    = grep( e.uri, e.stars, do_collapse );
                e.comments = grep( e.uri, e.comments, do_collapse );

                var valid_cs = true;
                if( e.colored_stars ) {
                    for( var j = 0; j < e.colored_stars.length; ++j ) {
                        var c = e.colored_stars[j];
                        c.stars = grep( e.uri, c.stars, do_collapse );
                        valid_cs = c.stars != null;
                    }
                }
                if( e.stars != null && valid_cs ) entries.push( e );
            }
            res.entries = entries;
            return res;
        };

        var iClass = function() {
            this.receiveStarEntry = function( res ) {
                res = grep_stars( res, true );
                var c = Hatena.Star.EntryLoader;
                c.receiveStarEntries.call( c, res );
            };
        };

        var pt  = Hatena.Star.InnerCount.prototype;
        var receiveStarEntry = pt.receiveStarEntry;
        pt.receiveStarEntry = function( res ) {
            receiveStarEntry.call( this, grep_stars( res, false ) );
        };

        pt = Hatena.Star.EntryLoader;
        var receiveStarEntries = pt.receiveStarEntries;
        pt.receiveStarEntries = function( res ) {
            receiveStarEntries.call( this, grep_stars( res, true ) );
        };
    };

    location.href = 'javascript:( ' + ngUserFunc.toString() + ')( ' + ngUsers.toString() + ' )';
})();
