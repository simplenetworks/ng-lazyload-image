"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("rxjs/add/operator/filter");
require("rxjs/add/operator/do");
require("rxjs/add/operator/take");
require("rxjs/add/operator/map");
require("rxjs/add/operator/mergeMap");
require("rxjs/add/operator/catch");
require("rxjs/add/observable/of");
var Observable_1 = require("rxjs/Observable");
var rect_1 = require("./rect");
function isVisible(element, threshold, _window, scrollContainer) {
    if (threshold === void 0) { threshold = 0; }
    var elementBounds = rect_1.Rect.fromElement(element);
    var windowBounds = rect_1.Rect.fromWindow(_window);
    elementBounds.inflate(threshold);
    if (scrollContainer) {
        var scrollContainerBounds = rect_1.Rect.fromElement(scrollContainer);
        var intersection = scrollContainerBounds.getIntersectionWith(windowBounds);
        return elementBounds.intersectsWith(intersection);
    }
    else {
        return elementBounds.intersectsWith(windowBounds);
    }
}
exports.isVisible = isVisible;
function isChildOfPicture(element) {
    return Boolean(element.parentElement && element.parentElement.nodeName.toLowerCase() === "picture");
}
exports.isChildOfPicture = isChildOfPicture;
function isImageElement(element) {
    return element.nodeName.toLowerCase() === "img";
}
exports.isImageElement = isImageElement;
function loadImage(element, imagePath, useSrcset) {
    var img;
    if (isImageElement(element) && isChildOfPicture(element)) {
        var parentClone = element.parentNode.cloneNode(true);
        img = parentClone.getElementsByTagName("img")[0];
        setSourcesToLazy(img);
        setImage(img, imagePath, useSrcset);
    }
    else {
        img = new Image();
        if (isImageElement(element) && element.sizes) {
            img.sizes = element.sizes;
        }
        if (useSrcset) {
            img.srcset = imagePath;
        }
        else {
            img.src = imagePath;
        }
    }
    return Observable_1.Observable.create(function (observer) {
        img.onload = function () {
            observer.next(imagePath);
            observer.complete();
        };
        img.onerror = function (err) {
            observer.error(null);
        };
    });
}
function setImage(element, imagePath, useSrcset) {
    if (isImageElement(element)) {
        if (useSrcset) {
            element.srcset = imagePath;
        }
        else {
            element.src = imagePath;
        }
    }
    else {
        element.style.backgroundImage = "url('" + imagePath + "')";
        element.style['backgroundBlendMode'] = 'multiply';
        element.style.backgroundColor = "#BEBEBE";
        element.style.animationName = "none";
    }
    return element;
}
function setSources(attrName) {
    return function (image) {
        var sources = image.parentElement.getElementsByTagName("source");
        for (var i = 0; i < sources.length; i++) {
            var attrValue = sources[i].getAttribute(attrName);
            if (attrValue) {
                sources[i].srcset = attrValue;
            }
        }
    };
}
var setSourcesToDefault = setSources("defaultImage");
var setSourcesToLazy = setSources("lazyLoad");
var setSourcesToError = setSources("errorImage");
function setImageAndSources(setSourcesFn) {
    return function (element, imagePath, useSrcset) {
        if (isImageElement(element) && isChildOfPicture(element)) {
            setSourcesFn(element);
        }
        if (imagePath) {
            setImage(element, imagePath, useSrcset);
        }
    };
}
var setImageAndSourcesToDefault = setImageAndSources(setSourcesToDefault);
var setImageAndSourcesToLazy = setImageAndSources(setSourcesToLazy);
var setImageAndSourcesToError = setImageAndSources(setSourcesToError);
function setLoadedStyle(element) {
    var styles = element.className
        .split(" ")
        .filter(function (s) { return !!s; })
        .filter(function (s) { return s !== "ng-lazyloading"; });
    styles.push("ng-lazyloaded");
    element.className = styles.join(" ");
    return element;
}
function lazyLoadImage(element, imagePath, defaultImagePath, errorImgPath, offset, useSrcset, scrollContainer) {
    if (useSrcset === void 0) { useSrcset = false; }
    setImageAndSourcesToDefault(element, defaultImagePath, useSrcset);
    if (element.className && element.className.includes("ng-lazyloaded")) {
        element.className = element.className.replace("ng-lazyloaded", "");
    }
    return function (scrollObservable) {
        return scrollObservable
            .filter(function () { return isVisible(element, offset, window, scrollContainer); })
            .take(1)
            .mergeMap(function () { return loadImage(element, imagePath, useSrcset); })
            .do(function () { return setImageAndSourcesToLazy(element, imagePath, useSrcset); })
            .map(function () { return true; })
            .catch(function () {
            setImageAndSourcesToError(element, errorImgPath, useSrcset);
            element.className += " ng-failed-lazyloaded";
            return Observable_1.Observable.of(false);
        })
            .do(function () { return setLoadedStyle(element); });
    };
}
exports.lazyLoadImage = lazyLoadImage;
//# sourceMappingURL=lazyload-image.js.map