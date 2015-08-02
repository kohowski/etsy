var page = require('webpage').create();
var system = require('system');
var loadedCount = 0;

var TERM = 'some relevant search';
var HEART_SELECTOR = '.favorite-container button:not(.done)';

var searchPage = 0;
var SEARCH_PAGE_LIMIT = 20;

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
//page.onResourceError = function(resourceError) {
//    system.stderr.writeLine('= onResourceError()');
//    system.stderr.writeLine('  - unable to load url: "' + resourceError.url + '"');
//    system.stderr.writeLine('  - error code: ' + resourceError.errorCode + ', description: ' + resourceError.errorString );
//};

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

//page.onConsoleMessage = function (msg) {
//    console.log(msg);
//};

page.onLoadFinished = function (status) {
    //console.log(status);
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
    } else { // logged in
        if (searchPage == 0) {
            system.stderr.writeLine('Logged in.');
        } else {
            var notLiked = page.evaluate(function (sel) {
                                                                                return $(sel).size();
            }, HEART_SELECTOR);
            var clicked = page.evaluate(function (sel, edge) {
                                                                                var clicked = 0;
                                                                                $(sel).each(function () {
                                                                                    if (Math.random() < edge) {
                                                                                        this.click();
                                                                                        clicked++;
                                                                                    }
                                                                                });
                                                                                return clicked;
            }, HEART_SELECTOR, Math.random());
            system.stderr.writeLine('Clicked ' + clicked + '/' + notLiked + ' hearts on page #' + searchPage);
        }
        searchPage++;
        if (searchPage > SEARCH_PAGE_LIMIT) {
            phantom.exit(0);
        }

        var sleepSeconds = Math.floor((Math.random() * 3) + 2);
        system.stderr.writeLine('Sleeping ' + sleepSeconds + ' seconds.');
        setTimeout(function() {
            page.open('https://www.etsy.com/search?q=' + TERM + '&page=' + searchPage);
        }, 1000 * sleepSeconds);
    }
};

page.open('https://www.etsy.com');
