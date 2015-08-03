var system = require('system');
var webPage = require('webpage');

var BASE = 'https://www.etsy.com/search/handmade'; // exclude vintage
var CATEGORIES = ['jewelry', 'accessories', 'weddings']; // only relative categories
var TERMS = ['seed bead embroidery', 'seed bead bracelet', 'seed bead necklace', 'bead embroidered necklace beaded necklace']; // multiple terms
var SEARCH_PAGE_LIMIT = 10;

var completed = 0;

for (var i = 0; i < CATEGORIES.length; i++) {
    for (var j = 0; j < TERMS.length; j++) {
        (function(category, term) {
            var page = webPage.create();
            page.loadedCount = 0;
            page.searchPageIndex = 0;
            page.shopIndex = 0;
            page.uniqueShops = {};

            page.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/600.7.12 (KHTML, like Gecko) Version/8.0.7 Safari/600.7.12';

            page.onResourceRequested = function (requestData, networkRequest) {
                if (
                    requestData.url.indexOf('facebook') > -1
                    || requestData.url.indexOf('twitter') > -1
                    || requestData.url.indexOf('mpstat') > -1
                    || requestData.url.indexOf('google') > -1
                ) {
                    networkRequest.abort();
                }
            };

            //page.onNavigationRequested = function(url, type, willNavigate, main) {
            //    log('= onNavigationRequested');
            //    log('  destination_url: ' + url);
            //    log('  type (cause): ' + type);
            //    log('  will navigate: ' + willNavigate);
            //    log('  from page\'s main frame: ' + main);
            //};

            page.onResourceError = function(resourceError) {
                if (!resourceError.url) {
                    return;
                }
                log('= onResourceError()');
                log('  - unable to load url: "' + resourceError.url + '"');
                log('  - error code: ' + resourceError.errorCode + ', description: ' + resourceError.errorString );
            };

            page.onError = function (msg, trace) {
                log('= onError()');
                var msgStack = ['  ERROR: ' + msg];
                if (trace) {
                    msgStack.push('  TRACE:');
                    trace.forEach(function (t) {
                        msgStack.push('    -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
                    });
                }
                log(msgStack.join('\n'));
            };

            page.onConsoleMessage = function (msg) {
                //console.log(msg);
            };

            page.onLoadFinished = function (status) {
                page.loadedCount++;
                //page.render('render/' + category + '/' + term + '/render' + page.loadedCount + '.png');
                if (status != 'success') {
                    exit(1);
                }
                if (page.loadedCount == 1) {
                    log('Landed.');
                    page.evaluate(function () {
                        $('#username-existing').val('');
                        $('#password-existing').val('');
                        $('#signin-form').submit();
                    });
                } else if (page.loadedCount == 2) {
                    log('Logged in.');
                    navigate(page, BASE + '/' + category + '?q=' + term + '&page=' + ++page.searchPageIndex);
                } else if (page.searchPageIndex <= SEARCH_PAGE_LIMIT) {
                    var shops = page.evaluate(function (factor) {
                                                                                        var shops = [];
                                                                                        try {
                                                                                            $('.favorite-container button:not(.done)').each(function () {
                                                                                                if (Math.random() < factor) {
                                                                                                    this.click();
                                                                                                    var shopUrl = $(this).parents('.listing-card').find('.card-shop-name').attr('href');
                                                                                                    shops.push(shopUrl.substring(0, shopUrl.indexOf('?')));
                                                                                                }
                                                                                            });
                                                                                        } catch(e) {
                                                                                            console.log('Jquery not loaded');
                                                                                        }
                                                                                        return shops;
                    }, Math.random()); // different like factor per page
                    log('Favorited ' + shops.length + ' listings on page #' + page.searchPageIndex);
                    for (var i = 0; i < shops.length; i++) {
                        page.uniqueShops[shops[i]] = 1;
                    }
                    if (page.searchPageIndex < SEARCH_PAGE_LIMIT) {
                        navigate(page, BASE + '/' + category + '?q=' + term + '&page=' + ++page.searchPageIndex);
                    } else if (Object.keys(page.uniqueShops).length > 0) {
                        page.searchPageIndex++; // <-- just a hack to proceed to the next elseif
                        log('Will favorite ' + Object.keys(page.uniqueShops).length + ' shops.');
                        log(JSON.stringify(Object.keys(page.uniqueShops)));
                        navigate(page, Object.keys(page.uniqueShops)[page.shopIndex++]);
                    } else {
                        exit(0);
                    }
                } else {
                //} else if (page.shopIndex <= Object.keys(page.uniqueShops).length) {
                    page.evaluate(function() {
                                                                                        try {
                                                                                            $('.button-fave-container a:not(.favorited-button)').click();
                                                                                        } catch (e) {
                                                                                            console.log('Jquery not loaded');
                                                                                        }
                    });
                    log('Favoirted ' + page.shopIndex + '-th shop.');
                    if (page.shopIndex < Object.keys(page.uniqueShops).length) {
                        navigate(page, Object.keys(page.uniqueShops)[page.shopIndex++]);
                    } else {
                        exit(0);
                    }
                }
            };

            navigate(page, 'https://www.etsy.com');
        })(CATEGORIES[i], TERMS[j]);
    }
}

function navigate(page, url) {
    var sleepSeconds = Math.random() * 3 + 3; // this is not only for human-like behaviour, but rather to let ajax complete on the current page
    log('Sleeping ' + sleepSeconds.toFixed(2) + ' seconds.');
    setTimeout(function() {
        page.open(url);
    }, Math.random() * 1000);
}

function exit(status) {
    if (status) {
        phantom.exit(status);
    }
    completed++;
    if (completed == TERMS.length * CATEGORIES.length) {
        log('Exiting..');
        setTimeout(function() {   //let ajax complete
            phantom.exit(0);
        }, 1000 * 5);
    }
}

function log(msg) {
    system.stderr.writeLine(msg);
}


