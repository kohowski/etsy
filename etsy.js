var page = require('webpage').create();
var system = require('system');
var loadedCount = 0;

//var TERM = 'seed bead pendant';
var TERM = 'seed bead necklace';
//var TERM = 'bead embroidered necklace beaded necklace';

var searchPageIndex = 0;
var SEARCH_PAGE_LIMIT = 1;
var uniqueShops = {};
var shopIndex = 0;

page.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/600.7.12 (KHTML, like Gecko) Version/8.0.7 Safari/600.7.12';

//page.onResourceRequested = function (request) {
//    system.stderr.writeLine('= onResourceRequested()');
//    system.stderr.writeLine('  request: ' + JSON.stringify(request, undefined, 4));
//};
//
//page.onResourceReceived = function(response) {
//    system.stderr.writeLine('= onResourceReceived()' );
//    system.stderr.writeLine('  id: ' + response.id + ', stage: "' + response.stage + '", response: ' + JSON.stringify(response));
//};
//page.onLoadStarted = function() {
//    system.stderr.writeLine('= onLoadStarted()');
//    var currentUrl = page.evaluate(function() {
//        return window.location.href;
//    });
//    system.stderr.writeLine('  leaving url: ' + currentUrl);
//};
//page.onLoadFinished = function(status) {
//    system.stderr.writeLine('= onLoadFinished()');
//    system.stderr.writeLine('  status: ' + status);
//};
//page.onNavigationRequested = function(url, type, willNavigate, main) {
//    system.stderr.writeLine('= onNavigationRequested');
//    system.stderr.writeLine('  destination_url: ' + url);
//    system.stderr.writeLine('  type (cause): ' + type);
//    system.stderr.writeLine('  will navigate: ' + willNavigate);
//    system.stderr.writeLine('  from page\'s main frame: ' + main);
//};
page.onResourceError = function(resourceError) {
    system.stderr.writeLine('= onResourceError()');
    system.stderr.writeLine('  - unable to load url: "' + resourceError.url + '"');
    system.stderr.writeLine('  - error code: ' + resourceError.errorCode + ', description: ' + resourceError.errorString );
};

page.onError = function (msg, trace) {
    system.stderr.writeLine('= onError()');
    var msgStack = ['  ERROR: ' + msg];
    if (trace) {
        msgStack.push('  TRACE:');
        trace.forEach(function (t) {
            msgStack.push('    -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
        });
    }
    system.stderr.writeLine(msgStack.join('\n'));
};

page.onConsoleMessage = function (msg) {
    console.log(msg);
};

page.onLoadFinished = function (status) {
    loadedCount++;
    //page.render('render' + loadedCount + '.png');
    if (status != 'success') {
        phantom.exit(1);
    }
    if (loadedCount == 1) {
        system.stderr.writeLine('Landed.');
        page.evaluate(function () {
            $('#username-existing').val('');
            $('#password-existing').val('');
            $('#signin-form').submit();
        });
    } else if (loadedCount == 2) {
        system.stderr.writeLine('Logged in.');
        navigate('https://www.etsy.com/search?q=' + TERM+ '&page=' + ++searchPageIndex);
    } else if (searchPageIndex <= SEARCH_PAGE_LIMIT) {
        var shops = page.evaluate(function (edge) {
                                                                            var shops = [];
                                                                            $('.favorite-container button:not(.done)').each(function () {
                                                                                if (Math.random() < edge) {
                                                                                    this.click();
                                                                                    shops.push($(this).parents('.listing-card').find('.card-shop-name').attr('href'));
                                                                                }
                                                                            });
                                                                            return shops;
        }, Math.random());
        system.stderr.writeLine('Favorited ' + shops.length + ' listings on page #' + searchPageIndex);
        for (var i = 0; i < shops.length; i++) {
            uniqueShops[shops[i]] = 1;
        }
        if (searchPageIndex < SEARCH_PAGE_LIMIT) {
            navigate('https://www.etsy.com/search?q=' + TERM + '&page=' + ++searchPageIndex);
        } else if (Object.keys(uniqueShops).length > 0) {
            searchPageIndex++;
            system.stderr.writeLine('Will favorite ' + Object.keys(uniqueShops).length + ' shops.');
            navigate(Object.keys(uniqueShops)[shopIndex++]);
        } else {
            phantom.exit(0);
        }
    } else if (shopIndex <= Object.keys(uniqueShops).length) {
        page.evaluate(function() {
            $('.button-fave-container a:not(.favorited-button)').click();
        });
        system.stderr.writeLine('Favoirted ' + shopIndex + '-th shop.');
        if (shopIndex < Object.keys(uniqueShops).length) {
            navigate(Object.keys(uniqueShops)[shopIndex++]);
        } else {
            phantom.exit(0);
        }
    }
    system.stderr.writeLine();
};

function navigate(url) {
    var sleepSeconds = Math.floor((Math.random() * 3) + 3);
    system.stderr.writeLine('Sleeping ' + sleepSeconds + ' seconds.');
    setTimeout(function() {
        page.open(url);
    }, 1000 * sleepSeconds);
}

page.open('https://www.etsy.com');
