(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
;(function (global, factory) { // eslint-disable-line
	"use strict"
	/* eslint-disable no-undef */
	var m = factory(global)
	if (typeof module === "object" && module != null && module.exports) {
		module.exports = m
	} else if (typeof define === "function" && define.amd) {
		define(function () { return m })
	} else {
		global.m = m
	}
	/* eslint-enable no-undef */
})(typeof window !== "undefined" ? window : this, function (global, undefined) { // eslint-disable-line
	"use strict"

	m.version = function () {
		return "v0.2.5"
	}

	var hasOwn = {}.hasOwnProperty
	var type = {}.toString

	function isFunction(object) {
		return typeof object === "function"
	}

	function isObject(object) {
		return type.call(object) === "[object Object]"
	}

	function isString(object) {
		return type.call(object) === "[object String]"
	}

	var isArray = Array.isArray || function (object) {
		return type.call(object) === "[object Array]"
	}

	function noop() {}

	var voidElements = {
		AREA: 1,
		BASE: 1,
		BR: 1,
		COL: 1,
		COMMAND: 1,
		EMBED: 1,
		HR: 1,
		IMG: 1,
		INPUT: 1,
		KEYGEN: 1,
		LINK: 1,
		META: 1,
		PARAM: 1,
		SOURCE: 1,
		TRACK: 1,
		WBR: 1
	}

	// caching commonly used variables
	var $document, $location, $requestAnimationFrame, $cancelAnimationFrame

	// self invoking function needed because of the way mocks work
	function initialize(mock) {
		$document = mock.document
		$location = mock.location
		$cancelAnimationFrame = mock.cancelAnimationFrame || mock.clearTimeout
		$requestAnimationFrame = mock.requestAnimationFrame || mock.setTimeout
	}

	// testing API
	m.deps = function (mock) {
		initialize(global = mock || window)
		return global
	}

	m.deps(global)

	/**
	 * @typedef {String} Tag
	 * A string that looks like -> div.classname#id[param=one][param2=two]
	 * Which describes a DOM node
	 */

	function parseTagAttrs(cell, tag) {
		var classes = []
		var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g
		var match

		while ((match = parser.exec(tag))) {
			if (match[1] === "" && match[2]) {
				cell.tag = match[2]
			} else if (match[1] === "#") {
				cell.attrs.id = match[2]
			} else if (match[1] === ".") {
				classes.push(match[2])
			} else if (match[3][0] === "[") {
				var pair = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/.exec(match[3])
				cell.attrs[pair[1]] = pair[3] || ""
			}
		}

		return classes
	}

	function getVirtualChildren(args, hasAttrs) {
		var children = hasAttrs ? args.slice(1) : args

		if (children.length === 1 && isArray(children[0])) {
			return children[0]
		} else {
			return children
		}
	}

	function assignAttrs(target, attrs, classes) {
		var classAttr = "class" in attrs ? "class" : "className"

		for (var attrName in attrs) {
			if (hasOwn.call(attrs, attrName)) {
				if (attrName === classAttr &&
						attrs[attrName] != null &&
						attrs[attrName] !== "") {
					classes.push(attrs[attrName])
					// create key in correct iteration order
					target[attrName] = ""
				} else {
					target[attrName] = attrs[attrName]
				}
			}
		}

		if (classes.length) target[classAttr] = classes.join(" ")
	}

	/**
	 *
	 * @param {Tag} The DOM node tag
	 * @param {Object=[]} optional key-value pairs to be mapped to DOM attrs
	 * @param {...mNode=[]} Zero or more Mithril child nodes. Can be an array,
	 *                      or splat (optional)
	 */
	function m(tag, pairs) {
		var args = []

		for (var i = 1, length = arguments.length; i < length; i++) {
			args[i - 1] = arguments[i]
		}

		if (isObject(tag)) return parameterize(tag, args)

		if (!isString(tag)) {
			throw new Error("selector in m(selector, attrs, children) should " +
				"be a string")
		}

		var hasAttrs = pairs != null && isObject(pairs) &&
			!("tag" in pairs || "view" in pairs || "subtree" in pairs)

		var attrs = hasAttrs ? pairs : {}
		var cell = {
			tag: "div",
			attrs: {},
			children: getVirtualChildren(args, hasAttrs)
		}

		assignAttrs(cell.attrs, attrs, parseTagAttrs(cell, tag))
		return cell
	}

	function forEach(list, f) {
		for (var i = 0; i < list.length && !f(list[i], i++);) {
			// function called in condition
		}
	}

	function forKeys(list, f) {
		forEach(list, function (attrs, i) {
			return (attrs = attrs && attrs.attrs) &&
				attrs.key != null &&
				f(attrs, i)
		})
	}
	// This function was causing deopts in Chrome.
	function dataToString(data) {
		// data.toString() might throw or return null if data is the return
		// value of Console.log in some versions of Firefox (behavior depends on
		// version)
		try {
			if (data != null && data.toString() != null) return data
		} catch (e) {
			// silently ignore errors
		}
		return ""
	}

	// This function was causing deopts in Chrome.
	function injectTextNode(parentElement, first, index, data) {
		try {
			insertNode(parentElement, first, index)
			first.nodeValue = data
		} catch (e) {
			// IE erroneously throws error when appending an empty text node
			// after a null
		}
	}

	function flatten(list) {
		// recursively flatten array
		for (var i = 0; i < list.length; i++) {
			if (isArray(list[i])) {
				list = list.concat.apply([], list)
				// check current index again and flatten until there are no more
				// nested arrays at that index
				i--
			}
		}
		return list
	}

	function insertNode(parentElement, node, index) {
		parentElement.insertBefore(node,
			parentElement.childNodes[index] || null)
	}

	var DELETION = 1
	var INSERTION = 2
	var MOVE = 3

	function handleKeysDiffer(data, existing, cached, parentElement) {
		forKeys(data, function (key, i) {
			existing[key = key.key] = existing[key] ? {
				action: MOVE,
				index: i,
				from: existing[key].index,
				element: cached.nodes[existing[key].index] ||
					$document.createElement("div")
			} : {action: INSERTION, index: i}
		})

		var actions = []
		for (var prop in existing) {
			if (hasOwn.call(existing, prop)) {
				actions.push(existing[prop])
			}
		}

		var changes = actions.sort(sortChanges)
		var newCached = new Array(cached.length)

		newCached.nodes = cached.nodes.slice()

		forEach(changes, function (change) {
			var index = change.index
			if (change.action === DELETION) {
				clear(cached[index].nodes, cached[index])
				newCached.splice(index, 1)
			}
			if (change.action === INSERTION) {
				var dummy = $document.createElement("div")
				dummy.key = data[index].attrs.key
				insertNode(parentElement, dummy, index)
				newCached.splice(index, 0, {
					attrs: {key: data[index].attrs.key},
					nodes: [dummy]
				})
				newCached.nodes[index] = dummy
			}

			if (change.action === MOVE) {
				var changeElement = change.element
				var maybeChanged = parentElement.childNodes[index]
				if (maybeChanged !== changeElement && changeElement !== null) {
					parentElement.insertBefore(changeElement,
						maybeChanged || null)
				}
				newCached[index] = cached[change.from]
				newCached.nodes[index] = changeElement
			}
		})

		return newCached
	}

	function diffKeys(data, cached, existing, parentElement) {
		var keysDiffer = data.length !== cached.length

		if (!keysDiffer) {
			forKeys(data, function (attrs, i) {
				var cachedCell = cached[i]
				return keysDiffer = cachedCell &&
					cachedCell.attrs &&
					cachedCell.attrs.key !== attrs.key
			})
		}

		if (keysDiffer) {
			return handleKeysDiffer(data, existing, cached, parentElement)
		} else {
			return cached
		}
	}

	function diffArray(data, cached, nodes) {
		// diff the array itself

		// update the list of DOM nodes by collecting the nodes from each item
		forEach(data, function (_, i) {
			if (cached[i] != null) nodes.push.apply(nodes, cached[i].nodes)
		})
		// remove items from the end of the array if the new array is shorter
		// than the old one. if errors ever happen here, the issue is most
		// likely a bug in the construction of the `cached` data structure
		// somewhere earlier in the program
		forEach(cached.nodes, function (node, i) {
			if (node.parentNode != null && nodes.indexOf(node) < 0) {
				clear([node], [cached[i]])
			}
		})

		if (data.length < cached.length) cached.length = data.length
		cached.nodes = nodes
	}

	function buildArrayKeys(data) {
		var guid = 0
		forKeys(data, function () {
			forEach(data, function (attrs) {
				if ((attrs = attrs && attrs.attrs) && attrs.key == null) {
					attrs.key = "__mithril__" + guid++
				}
			})
			return 1
		})
	}

	function isDifferentEnough(data, cached, dataAttrKeys) {
		if (data.tag !== cached.tag) return true

		if (dataAttrKeys.sort().join() !==
				Object.keys(cached.attrs).sort().join()) {
			return true
		}

		if (data.attrs.id !== cached.attrs.id) {
			return true
		}

		if (data.attrs.key !== cached.attrs.key) {
			return true
		}

		if (m.redraw.strategy() === "all") {
			return !cached.configContext || cached.configContext.retain !== true
		}

		if (m.redraw.strategy() === "diff") {
			return cached.configContext && cached.configContext.retain === false
		}

		return false
	}

	function maybeRecreateObject(data, cached, dataAttrKeys) {
		// if an element is different enough from the one in cache, recreate it
		if (isDifferentEnough(data, cached, dataAttrKeys)) {
			if (cached.nodes.length) clear(cached.nodes)

			if (cached.configContext &&
					isFunction(cached.configContext.onunload)) {
				cached.configContext.onunload()
			}

			if (cached.controllers) {
				forEach(cached.controllers, function (controller) {
					if (controller.onunload) {
						controller.onunload({preventDefault: noop})
					}
				})
			}
		}
	}

	function getObjectNamespace(data, namespace) {
		if (data.attrs.xmlns) return data.attrs.xmlns
		if (data.tag === "svg") return "http://www.w3.org/2000/svg"
		if (data.tag === "math") return "http://www.w3.org/1998/Math/MathML"
		return namespace
	}

	var pendingRequests = 0
	m.startComputation = function () { pendingRequests++ }
	m.endComputation = function () {
		if (pendingRequests > 1) {
			pendingRequests--
		} else {
			pendingRequests = 0
			m.redraw()
		}
	}

	function unloadCachedControllers(cached, views, controllers) {
		if (controllers.length) {
			cached.views = views
			cached.controllers = controllers
			forEach(controllers, function (controller) {
				if (controller.onunload && controller.onunload.$old) {
					controller.onunload = controller.onunload.$old
				}

				if (pendingRequests && controller.onunload) {
					var onunload = controller.onunload
					controller.onunload = noop
					controller.onunload.$old = onunload
				}
			})
		}
	}

	function scheduleConfigsToBeCalled(configs, data, node, isNew, cached) {
		// schedule configs to be called. They are called after `build` finishes
		// running
		if (isFunction(data.attrs.config)) {
			var context = cached.configContext = cached.configContext || {}

			// bind
			configs.push(function () {
				return data.attrs.config.call(data, node, !isNew, context,
					cached)
			})
		}
	}

	function buildUpdatedNode(
		cached,
		data,
		editable,
		hasKeys,
		namespace,
		views,
		configs,
		controllers
	) {
		var node = cached.nodes[0]

		if (hasKeys) {
			setAttributes(node, data.tag, data.attrs, cached.attrs, namespace)
		}

		cached.children = build(
			node,
			data.tag,
			undefined,
			undefined,
			data.children,
			cached.children,
			false,
			0,
			data.attrs.contenteditable ? node : editable,
			namespace,
			configs
		)

		cached.nodes.intact = true

		if (controllers.length) {
			cached.views = views
			cached.controllers = controllers
		}

		return node
	}

	function handleNonexistentNodes(data, parentElement, index) {
		var nodes
		if (data.$trusted) {
			nodes = injectHTML(parentElement, index, data)
		} else {
			nodes = [$document.createTextNode(data)]
			if (!(parentElement.nodeName in voidElements)) {
				insertNode(parentElement, nodes[0], index)
			}
		}

		var cached

		if (typeof data === "string" ||
				typeof data === "number" ||
				typeof data === "boolean") {
			cached = new data.constructor(data)
		} else {
			cached = data
		}

		cached.nodes = nodes
		return cached
	}

	function reattachNodes(
		data,
		cached,
		parentElement,
		editable,
		index,
		parentTag
	) {
		var nodes = cached.nodes
		if (!editable || editable !== $document.activeElement) {
			if (data.$trusted) {
				clear(nodes, cached)
				nodes = injectHTML(parentElement, index, data)
			} else if (parentTag === "textarea") {
				// <textarea> uses `value` instead of `nodeValue`.
				parentElement.value = data
			} else if (editable) {
				// contenteditable nodes use `innerHTML` instead of `nodeValue`.
				editable.innerHTML = data
			} else {
				// was a trusted string
				if (nodes[0].nodeType === 1 || nodes.length > 1 ||
						(nodes[0].nodeValue.trim &&
							!nodes[0].nodeValue.trim())) {
					clear(cached.nodes, cached)
					nodes = [$document.createTextNode(data)]
				}

				injectTextNode(parentElement, nodes[0], index, data)
			}
		}
		cached = new data.constructor(data)
		cached.nodes = nodes
		return cached
	}

	function handleTextNode(
		cached,
		data,
		index,
		parentElement,
		shouldReattach,
		editable,
		parentTag
	) {
		if (!cached.nodes.length) {
			return handleNonexistentNodes(data, parentElement, index)
		} else if (cached.valueOf() !== data.valueOf() || shouldReattach) {
			return reattachNodes(data, cached, parentElement, editable, index,
				parentTag)
		} else {
			return (cached.nodes.intact = true, cached)
		}
	}

	function getSubArrayCount(item) {
		if (item.$trusted) {
			// fix offset of next element if item was a trusted string w/ more
			// than one html element
			// the first clause in the regexp matches elements
			// the second clause (after the pipe) matches text nodes
			var match = item.match(/<[^\/]|\>\s*[^<]/g)
			if (match != null) return match.length
		} else if (isArray(item)) {
			return item.length
		}
		return 1
	}

	function buildArray(
		data,
		cached,
		parentElement,
		index,
		parentTag,
		shouldReattach,
		editable,
		namespace,
		configs
	) {
		data = flatten(data)
		var nodes = []
		var intact = cached.length === data.length
		var subArrayCount = 0

		// keys algorithm: sort elements without recreating them if keys are
		// present
		//
		// 1) create a map of all existing keys, and mark all for deletion
		// 2) add new keys to map and mark them for addition
		// 3) if key exists in new list, change action from deletion to a move
		// 4) for each key, handle its corresponding action as marked in
		//    previous steps

		var existing = {}
		var shouldMaintainIdentities = false

		forKeys(cached, function (attrs, i) {
			shouldMaintainIdentities = true
			existing[cached[i].attrs.key] = {action: DELETION, index: i}
		})

		buildArrayKeys(data)
		if (shouldMaintainIdentities) {
			cached = diffKeys(data, cached, existing, parentElement)
		}
		// end key algorithm

		var cacheCount = 0
		// faster explicitly written
		for (var i = 0, len = data.length; i < len; i++) {
			// diff each item in the array
			var item = build(
				parentElement,
				parentTag,
				cached,
				index,
				data[i],
				cached[cacheCount],
				shouldReattach,
				index + subArrayCount || subArrayCount,
				editable,
				namespace,
				configs)

			if (item !== undefined) {
				intact = intact && item.nodes.intact
				subArrayCount += getSubArrayCount(item)
				cached[cacheCount++] = item
			}
		}

		if (!intact) diffArray(data, cached, nodes)
		return cached
	}

	function makeCache(data, cached, index, parentIndex, parentCache) {
		if (cached != null) {
			if (type.call(cached) === type.call(data)) return cached

			if (parentCache && parentCache.nodes) {
				var offset = index - parentIndex
				var end = offset + (isArray(data) ? data : cached.nodes).length
				clear(
					parentCache.nodes.slice(offset, end),
					parentCache.slice(offset, end))
			} else if (cached.nodes) {
				clear(cached.nodes, cached)
			}
		}

		cached = new data.constructor()
		// if constructor creates a virtual dom element, use a blank object as
		// the base cached node instead of copying the virtual el (#277)
		if (cached.tag) cached = {}
		cached.nodes = []
		return cached
	}

	function constructNode(data, namespace) {
		if (data.attrs.is) {
			if (namespace == null) {
				return $document.createElement(data.tag, data.attrs.is)
			} else {
				return $document.createElementNS(namespace, data.tag,
					data.attrs.is)
			}
		} else if (namespace == null) {
			return $document.createElement(data.tag)
		} else {
			return $document.createElementNS(namespace, data.tag)
		}
	}

	function constructAttrs(data, node, namespace, hasKeys) {
		if (hasKeys) {
			return setAttributes(node, data.tag, data.attrs, {}, namespace)
		} else {
			return data.attrs
		}
	}

	function constructChildren(
		data,
		node,
		cached,
		editable,
		namespace,
		configs
	) {
		if (data.children != null && data.children.length > 0) {
			return build(
				node,
				data.tag,
				undefined,
				undefined,
				data.children,
				cached.children,
				true,
				0,
				data.attrs.contenteditable ? node : editable,
				namespace,
				configs)
		} else {
			return data.children
		}
	}

	function reconstructCached(
		data,
		attrs,
		children,
		node,
		namespace,
		views,
		controllers
	) {
		var cached = {
			tag: data.tag,
			attrs: attrs,
			children: children,
			nodes: [node]
		}

		unloadCachedControllers(cached, views, controllers)

		if (cached.children && !cached.children.nodes) {
			cached.children.nodes = []
		}

		// edge case: setting value on <select> doesn't work before children
		// exist, so set it again after children have been created
		if (data.tag === "select" && "value" in data.attrs) {
			setAttributes(node, data.tag, {value: data.attrs.value}, {},
				namespace)
		}

		return cached
	}

	function getController(views, view, cachedControllers, controller) {
		var controllerIndex

		if (m.redraw.strategy() === "diff" && views) {
			controllerIndex = views.indexOf(view)
		} else {
			controllerIndex = -1
		}

		if (controllerIndex > -1) {
			return cachedControllers[controllerIndex]
		} else if (isFunction(controller)) {
			return new controller()
		} else {
			return {}
		}
	}

	var unloaders = []

	function updateLists(views, controllers, view, controller) {
		if (controller.onunload != null &&
				unloaders.map(function (u) { return u.handler })
					.indexOf(controller.onunload) < 0) {
			unloaders.push({
				controller: controller,
				handler: controller.onunload
			})
		}

		views.push(view)
		controllers.push(controller)
	}

	var forcing = false
	function checkView(
		data,
		view,
		cached,
		cachedControllers,
		controllers,
		views
	) {
		var controller = getController(
			cached.views,
			view,
			cachedControllers,
			data.controller)

		var key = data && data.attrs && data.attrs.key

		if (pendingRequests === 0 ||
				forcing ||
				cachedControllers &&
					cachedControllers.indexOf(controller) > -1) {
			data = data.view(controller)
		} else {
			data = {tag: "placeholder"}
		}

		if (data.subtree === "retain") return data
		data.attrs = data.attrs || {}
		data.attrs.key = key
		updateLists(views, controllers, view, controller)
		return data
	}

	function markViews(data, cached, views, controllers) {
		var cachedControllers = cached && cached.controllers

		while (data.view != null) {
			data = checkView(
				data,
				data.view.$original || data.view,
				cached,
				cachedControllers,
				controllers,
				views)
		}

		return data
	}

	function buildObject( // eslint-disable-line max-statements
		data,
		cached,
		editable,
		parentElement,
		index,
		shouldReattach,
		namespace,
		configs
	) {
		var views = []
		var controllers = []

		data = markViews(data, cached, views, controllers)

		if (data.subtree === "retain") return cached

		if (!data.tag && controllers.length) {
			throw new Error("Component template must return a virtual " +
				"element, not an array, string, etc.")
		}

		data.attrs = data.attrs || {}
		cached.attrs = cached.attrs || {}

		var dataAttrKeys = Object.keys(data.attrs)
		var hasKeys = dataAttrKeys.length > ("key" in data.attrs ? 1 : 0)

		maybeRecreateObject(data, cached, dataAttrKeys)

		if (!isString(data.tag)) return

		var isNew = cached.nodes.length === 0

		namespace = getObjectNamespace(data, namespace)

		var node
		if (isNew) {
			node = constructNode(data, namespace)
			// set attributes first, then create children
			var attrs = constructAttrs(data, node, namespace, hasKeys)

			// add the node to its parent before attaching children to it
			insertNode(parentElement, node, index)

			var children = constructChildren(data, node, cached, editable,
				namespace, configs)

			cached = reconstructCached(
				data,
				attrs,
				children,
				node,
				namespace,
				views,
				controllers)
		} else {
			node = buildUpdatedNode(
				cached,
				data,
				editable,
				hasKeys,
				namespace,
				views,
				configs,
				controllers)
		}

		if (!isNew && shouldReattach === true && node != null) {
			insertNode(parentElement, node, index)
		}

		// The configs are called after `build` finishes running
		scheduleConfigsToBeCalled(configs, data, node, isNew, cached)

		return cached
	}

	function build(
		parentElement,
		parentTag,
		parentCache,
		parentIndex,
		data,
		cached,
		shouldReattach,
		index,
		editable,
		namespace,
		configs
	) {
		/*
		 * `build` is a recursive function that manages creation/diffing/removal
		 * of DOM elements based on comparison between `data` and `cached` the
		 * diff algorithm can be summarized as this:
		 *
		 * 1 - compare `data` and `cached`
		 * 2 - if they are different, copy `data` to `cached` and update the DOM
		 *     based on what the difference is
		 * 3 - recursively apply this algorithm for every array and for the
		 *     children of every virtual element
		 *
		 * The `cached` data structure is essentially the same as the previous
		 * redraw's `data` data structure, with a few additions:
		 * - `cached` always has a property called `nodes`, which is a list of
		 *    DOM elements that correspond to the data represented by the
		 *    respective virtual element
		 * - in order to support attaching `nodes` as a property of `cached`,
		 *    `cached` is *always* a non-primitive object, i.e. if the data was
		 *    a string, then cached is a String instance. If data was `null` or
		 *    `undefined`, cached is `new String("")`
		 * - `cached also has a `configContext` property, which is the state
		 *    storage object exposed by config(element, isInitialized, context)
		 * - when `cached` is an Object, it represents a virtual element; when
		 *    it's an Array, it represents a list of elements; when it's a
		 *    String, Number or Boolean, it represents a text node
		 *
		 * `parentElement` is a DOM element used for W3C DOM API calls
		 * `parentTag` is only used for handling a corner case for textarea
		 * values
		 * `parentCache` is used to remove nodes in some multi-node cases
		 * `parentIndex` and `index` are used to figure out the offset of nodes.
		 * They're artifacts from before arrays started being flattened and are
		 * likely refactorable
		 * `data` and `cached` are, respectively, the new and old nodes being
		 * diffed
		 * `shouldReattach` is a flag indicating whether a parent node was
		 * recreated (if so, and if this node is reused, then this node must
		 * reattach itself to the new parent)
		 * `editable` is a flag that indicates whether an ancestor is
		 * contenteditable
		 * `namespace` indicates the closest HTML namespace as it cascades down
		 * from an ancestor
		 * `configs` is a list of config functions to run after the topmost
		 * `build` call finishes running
		 *
		 * there's logic that relies on the assumption that null and undefined
		 * data are equivalent to empty strings
		 * - this prevents lifecycle surprises from procedural helpers that mix
		 *   implicit and explicit return statements (e.g.
		 *   function foo() {if (cond) return m("div")}
		 * - it simplifies diffing code
		 */
		data = dataToString(data)
		if (data.subtree === "retain") return cached
		cached = makeCache(data, cached, index, parentIndex, parentCache)

		if (isArray(data)) {
			return buildArray(
				data,
				cached,
				parentElement,
				index,
				parentTag,
				shouldReattach,
				editable,
				namespace,
				configs)
		} else if (data != null && isObject(data)) {
			return buildObject(
				data,
				cached,
				editable,
				parentElement,
				index,
				shouldReattach,
				namespace,
				configs)
		} else if (!isFunction(data)) {
			return handleTextNode(
				cached,
				data,
				index,
				parentElement,
				shouldReattach,
				editable,
				parentTag)
		} else {
			return cached
		}
	}

	function sortChanges(a, b) {
		return a.action - b.action || a.index - b.index
	}

	function copyStyleAttrs(node, dataAttr, cachedAttr) {
		for (var rule in dataAttr) {
			if (hasOwn.call(dataAttr, rule)) {
				if (cachedAttr == null || cachedAttr[rule] !== dataAttr[rule]) {
					node.style[rule] = dataAttr[rule]
				}
			}
		}

		for (rule in cachedAttr) {
			if (hasOwn.call(cachedAttr, rule)) {
				if (!hasOwn.call(dataAttr, rule)) node.style[rule] = ""
			}
		}
	}

	var shouldUseSetAttribute = {
		list: 1,
		style: 1,
		form: 1,
		type: 1,
		width: 1,
		height: 1
	}

	function setSingleAttr(
		node,
		attrName,
		dataAttr,
		cachedAttr,
		tag,
		namespace
	) {
		if (attrName === "config" || attrName === "key") {
			// `config` isn't a real attribute, so ignore it
			return true
		} else if (isFunction(dataAttr) && attrName.slice(0, 2) === "on") {
			// hook event handlers to the auto-redrawing system
			node[attrName] = autoredraw(dataAttr, node)
		} else if (attrName === "style" && dataAttr != null &&
				isObject(dataAttr)) {
			// handle `style: {...}`
			copyStyleAttrs(node, dataAttr, cachedAttr)
		} else if (namespace != null) {
			// handle SVG
			if (attrName === "href") {
				node.setAttributeNS("http://www.w3.org/1999/xlink",
					"href", dataAttr)
			} else {
				node.setAttribute(
					attrName === "className" ? "class" : attrName,
					dataAttr)
			}
		} else if (attrName in node && !shouldUseSetAttribute[attrName]) {
			// handle cases that are properties (but ignore cases where we
			// should use setAttribute instead)
			//
			// - list and form are typically used as strings, but are DOM
			//   element references in js
			//
			// - when using CSS selectors (e.g. `m("[style='']")`), style is
			//   used as a string, but it's an object in js
			//
			// #348 don't set the value if not needed - otherwise, cursor
			// placement breaks in Chrome
			try {
				if (tag !== "input" || node[attrName] !== dataAttr) {
					node[attrName] = dataAttr
				}
			} catch (e) {
				node.setAttribute(attrName, dataAttr)
			}
		}
		else node.setAttribute(attrName, dataAttr)
	}

	function trySetAttr(
		node,
		attrName,
		dataAttr,
		cachedAttr,
		cachedAttrs,
		tag,
		namespace
	) {
		if (!(attrName in cachedAttrs) || (cachedAttr !== dataAttr) || ($document.activeElement === node)) {
			cachedAttrs[attrName] = dataAttr
			try {
				return setSingleAttr(
					node,
					attrName,
					dataAttr,
					cachedAttr,
					tag,
					namespace)
			} catch (e) {
				// swallow IE's invalid argument errors to mimic HTML's
				// fallback-to-doing-nothing-on-invalid-attributes behavior
				if (e.message.indexOf("Invalid argument") < 0) throw e
			}
		} else if (attrName === "value" && tag === "input" &&
				node.value !== dataAttr) {
			// #348 dataAttr may not be a string, so use loose comparison
			node.value = dataAttr
		}
	}

	function setAttributes(node, tag, dataAttrs, cachedAttrs, namespace) {
		for (var attrName in dataAttrs) {
			if (hasOwn.call(dataAttrs, attrName)) {
				if (trySetAttr(
						node,
						attrName,
						dataAttrs[attrName],
						cachedAttrs[attrName],
						cachedAttrs,
						tag,
						namespace)) {
					continue
				}
			}
		}
		return cachedAttrs
	}

	function clear(nodes, cached) {
		for (var i = nodes.length - 1; i > -1; i--) {
			if (nodes[i] && nodes[i].parentNode) {
				try {
					nodes[i].parentNode.removeChild(nodes[i])
				} catch (e) {
					/* eslint-disable max-len */
					// ignore if this fails due to order of events (see
					// http://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node)
					/* eslint-enable max-len */
				}
				cached = [].concat(cached)
				if (cached[i]) unload(cached[i])
			}
		}
		// release memory if nodes is an array. This check should fail if nodes
		// is a NodeList (see loop above)
		if (nodes.length) {
			nodes.length = 0
		}
	}

	function unload(cached) {
		if (cached.configContext && isFunction(cached.configContext.onunload)) {
			cached.configContext.onunload()
			cached.configContext.onunload = null
		}
		if (cached.controllers) {
			forEach(cached.controllers, function (controller) {
				if (isFunction(controller.onunload)) {
					controller.onunload({preventDefault: noop})
				}
			})
		}
		if (cached.children) {
			if (isArray(cached.children)) forEach(cached.children, unload)
			else if (cached.children.tag) unload(cached.children)
		}
	}

	function appendTextFragment(parentElement, data) {
		try {
			parentElement.appendChild(
				$document.createRange().createContextualFragment(data))
		} catch (e) {
			parentElement.insertAdjacentHTML("beforeend", data)
			replaceScriptNodes(parentElement)
		}
	}

	// Replace script tags inside given DOM element with executable ones.
	// Will also check children recursively and replace any found script
	// tags in same manner.
	function replaceScriptNodes(node) {
		if (node.tagName === "SCRIPT") {
			node.parentNode.replaceChild(buildExecutableNode(node), node)
		} else {
			var children = node.childNodes
			if (children && children.length) {
				for (var i = 0; i < children.length; i++) {
					replaceScriptNodes(children[i])
				}
			}
		}

		return node
	}

	// Replace script element with one whose contents are executable.
	function buildExecutableNode(node){
		var scriptEl = document.createElement("script")
		var attrs = node.attributes

		for (var i = 0; i < attrs.length; i++) {
			scriptEl.setAttribute(attrs[i].name, attrs[i].value)
		}

		scriptEl.text = node.innerHTML
		return scriptEl
	}

	function injectHTML(parentElement, index, data) {
		var nextSibling = parentElement.childNodes[index]
		if (nextSibling) {
			var isElement = nextSibling.nodeType !== 1
			var placeholder = $document.createElement("span")
			if (isElement) {
				parentElement.insertBefore(placeholder, nextSibling || null)
				placeholder.insertAdjacentHTML("beforebegin", data)
				parentElement.removeChild(placeholder)
			} else {
				nextSibling.insertAdjacentHTML("beforebegin", data)
			}
		} else {
			appendTextFragment(parentElement, data)
		}

		var nodes = []

		while (parentElement.childNodes[index] !== nextSibling) {
			nodes.push(parentElement.childNodes[index])
			index++
		}

		return nodes
	}

	function autoredraw(callback, object) {
		return function (e) {
			e = e || event
			m.redraw.strategy("diff")
			m.startComputation()
			try {
				return callback.call(object, e)
			} finally {
				endFirstComputation()
			}
		}
	}

	var html
	var documentNode = {
		appendChild: function (node) {
			if (html === undefined) html = $document.createElement("html")
			if ($document.documentElement &&
					$document.documentElement !== node) {
				$document.replaceChild(node, $document.documentElement)
			} else {
				$document.appendChild(node)
			}

			this.childNodes = $document.childNodes
		},

		insertBefore: function (node) {
			this.appendChild(node)
		},

		childNodes: []
	}

	var nodeCache = []
	var cellCache = {}

	m.render = function (root, cell, forceRecreation) {
		if (!root) {
			throw new Error("Ensure the DOM element being passed to " +
				"m.route/m.mount/m.render is not undefined.")
		}
		var configs = []
		var id = getCellCacheKey(root)
		var isDocumentRoot = root === $document
		var node

		if (isDocumentRoot || root === $document.documentElement) {
			node = documentNode
		} else {
			node = root
		}

		if (isDocumentRoot && cell.tag !== "html") {
			cell = {tag: "html", attrs: {}, children: cell}
		}

		if (cellCache[id] === undefined) clear(node.childNodes)
		if (forceRecreation === true) reset(root)

		cellCache[id] = build(
			node,
			null,
			undefined,
			undefined,
			cell,
			cellCache[id],
			false,
			0,
			null,
			undefined,
			configs)

		forEach(configs, function (config) { config() })
	}

	function getCellCacheKey(element) {
		var index = nodeCache.indexOf(element)
		return index < 0 ? nodeCache.push(element) - 1 : index
	}

	m.trust = function (value) {
		value = new String(value) // eslint-disable-line no-new-wrappers
		value.$trusted = true
		return value
	}

	function gettersetter(store) {
		function prop() {
			if (arguments.length) store = arguments[0]
			return store
		}

		prop.toJSON = function () {
			return store
		}

		return prop
	}

	m.prop = function (store) {
		if ((store != null && (isObject(store) || isFunction(store)) || ((typeof Promise !== "undefined") && (store instanceof Promise))) &&
				isFunction(store.then)) {
			return propify(store)
		}

		return gettersetter(store)
	}

	var roots = []
	var components = []
	var controllers = []
	var lastRedrawId = null
	var lastRedrawCallTime = 0
	var computePreRedrawHook = null
	var computePostRedrawHook = null
	var topComponent
	var FRAME_BUDGET = 16 // 60 frames per second = 1 call per 16 ms

	function parameterize(component, args) {
		function controller() {
			/* eslint-disable no-invalid-this */
			return (component.controller || noop).apply(this, args) || this
			/* eslint-enable no-invalid-this */
		}

		if (component.controller) {
			controller.prototype = component.controller.prototype
		}

		function view(ctrl) {
			var currentArgs = [ctrl].concat(args)
			for (var i = 1; i < arguments.length; i++) {
				currentArgs.push(arguments[i])
			}

			return component.view.apply(component, currentArgs)
		}

		view.$original = component.view
		var output = {controller: controller, view: view}
		if (args[0] && args[0].key != null) output.attrs = {key: args[0].key}
		return output
	}

	m.component = function (component) {
		var args = new Array(arguments.length - 1)

		for (var i = 1; i < arguments.length; i++) {
			args[i - 1] = arguments[i]
		}

		return parameterize(component, args)
	}

	function checkPrevented(component, root, index, isPrevented) {
		if (!isPrevented) {
			m.redraw.strategy("all")
			m.startComputation()
			roots[index] = root
			var currentComponent

			if (component) {
				currentComponent = topComponent = component
			} else {
				currentComponent = topComponent = component = {controller: noop}
			}

			var controller = new (component.controller || noop)()

			// controllers may call m.mount recursively (via m.route redirects,
			// for example)
			// this conditional ensures only the last recursive m.mount call is
			// applied
			if (currentComponent === topComponent) {
				controllers[index] = controller
				components[index] = component
			}
			endFirstComputation()
			if (component === null) {
				removeRootElement(root, index)
			}
			return controllers[index]
		} else if (component == null) {
			removeRootElement(root, index)
		}
	}

	m.mount = m.module = function (root, component) {
		if (!root) {
			throw new Error("Please ensure the DOM element exists before " +
				"rendering a template into it.")
		}

		var index = roots.indexOf(root)
		if (index < 0) index = roots.length

		var isPrevented = false
		var event = {
			preventDefault: function () {
				isPrevented = true
				computePreRedrawHook = computePostRedrawHook = null
			}
		}

		forEach(unloaders, function (unloader) {
			unloader.handler.call(unloader.controller, event)
			unloader.controller.onunload = null
		})

		if (isPrevented) {
			forEach(unloaders, function (unloader) {
				unloader.controller.onunload = unloader.handler
			})
		} else {
			unloaders = []
		}

		if (controllers[index] && isFunction(controllers[index].onunload)) {
			controllers[index].onunload(event)
		}

		return checkPrevented(component, root, index, isPrevented)
	}

	function removeRootElement(root, index) {
		roots.splice(index, 1)
		controllers.splice(index, 1)
		components.splice(index, 1)
		reset(root)
		nodeCache.splice(getCellCacheKey(root), 1)
	}

	var redrawing = false
	m.redraw = function (force) {
		if (redrawing) return
		redrawing = true
		if (force) forcing = true

		try {
			// lastRedrawId is a positive number if a second redraw is requested
			// before the next animation frame
			// lastRedrawId is null if it's the first redraw and not an event
			// handler
			if (lastRedrawId && !force) {
				// when setTimeout: only reschedule redraw if time between now
				// and previous redraw is bigger than a frame, otherwise keep
				// currently scheduled timeout
				// when rAF: always reschedule redraw
				if ($requestAnimationFrame === global.requestAnimationFrame ||
						new Date() - lastRedrawCallTime > FRAME_BUDGET) {
					if (lastRedrawId > 0) $cancelAnimationFrame(lastRedrawId)
					lastRedrawId = $requestAnimationFrame(redraw, FRAME_BUDGET)
				}
			} else {
				redraw()
				lastRedrawId = $requestAnimationFrame(function () {
					lastRedrawId = null
				}, FRAME_BUDGET)
			}
		} finally {
			redrawing = forcing = false
		}
	}

	m.redraw.strategy = m.prop()
	function redraw() {
		if (computePreRedrawHook) {
			computePreRedrawHook()
			computePreRedrawHook = null
		}
		forEach(roots, function (root, i) {
			var component = components[i]
			if (controllers[i]) {
				var args = [controllers[i]]
				m.render(root,
					component.view ? component.view(controllers[i], args) : "")
			}
		})
		// after rendering within a routed context, we need to scroll back to
		// the top, and fetch the document title for history.pushState
		if (computePostRedrawHook) {
			computePostRedrawHook()
			computePostRedrawHook = null
		}
		lastRedrawId = null
		lastRedrawCallTime = new Date()
		m.redraw.strategy("diff")
	}

	function endFirstComputation() {
		if (m.redraw.strategy() === "none") {
			pendingRequests--
			m.redraw.strategy("diff")
		} else {
			m.endComputation()
		}
	}

	m.withAttr = function (prop, withAttrCallback, callbackThis) {
		return function (e) {
			e = e || window.event
			/* eslint-disable no-invalid-this */
			var currentTarget = e.currentTarget || this
			var _this = callbackThis || this
			/* eslint-enable no-invalid-this */
			var target = prop in currentTarget ?
				currentTarget[prop] :
				currentTarget.getAttribute(prop)
			withAttrCallback.call(_this, target)
		}
	}

	// routing
	var modes = {pathname: "", hash: "#", search: "?"}
	var redirect = noop
	var isDefaultRoute = false
	var routeParams, currentRoute

	m.route = function (root, arg1, arg2, vdom) { // eslint-disable-line
		// m.route()
		if (arguments.length === 0) return currentRoute
		// m.route(el, defaultRoute, routes)
		if (arguments.length === 3 && isString(arg1)) {
			redirect = function (source) {
				var path = currentRoute = normalizeRoute(source)
				if (!routeByValue(root, arg2, path)) {
					if (isDefaultRoute) {
						throw new Error("Ensure the default route matches " +
							"one of the routes defined in m.route")
					}

					isDefaultRoute = true
					m.route(arg1, true)
					isDefaultRoute = false
				}
			}

			var listener = m.route.mode === "hash" ?
				"onhashchange" :
				"onpopstate"

			global[listener] = function () {
				var path = $location[m.route.mode]
				if (m.route.mode === "pathname") path += $location.search
				if (currentRoute !== normalizeRoute(path)) redirect(path)
			}

			computePreRedrawHook = setScroll
			global[listener]()

			return
		}

		// config: m.route
		if (root.addEventListener || root.attachEvent) {
			var base = m.route.mode !== "pathname" ? $location.pathname : ""
			root.href = base + modes[m.route.mode] + vdom.attrs.href
			if (root.addEventListener) {
				root.removeEventListener("click", routeUnobtrusive)
				root.addEventListener("click", routeUnobtrusive)
			} else {
				root.detachEvent("onclick", routeUnobtrusive)
				root.attachEvent("onclick", routeUnobtrusive)
			}

			return
		}
		// m.route(route, params, shouldReplaceHistoryEntry)
		if (isString(root)) {
			var oldRoute = currentRoute
			currentRoute = root

			var args = arg1 || {}
			var queryIndex = currentRoute.indexOf("?")
			var params

			if (queryIndex > -1) {
				params = parseQueryString(currentRoute.slice(queryIndex + 1))
			} else {
				params = {}
			}

			for (var i in args) {
				if (hasOwn.call(args, i)) {
					params[i] = args[i]
				}
			}

			var querystring = buildQueryString(params)
			var currentPath

			if (queryIndex > -1) {
				currentPath = currentRoute.slice(0, queryIndex)
			} else {
				currentPath = currentRoute
			}

			if (querystring) {
				currentRoute = currentPath +
					(currentPath.indexOf("?") === -1 ? "?" : "&") +
					querystring
			}

			var replaceHistory =
				(arguments.length === 3 ? arg2 : arg1) === true ||
				oldRoute === root

			if (global.history.pushState) {
				var method = replaceHistory ? "replaceState" : "pushState"
				computePreRedrawHook = setScroll
				computePostRedrawHook = function () {
					try {
						global.history[method](null, $document.title,
							modes[m.route.mode] + currentRoute)
					} catch (err) {
						// In the event of a pushState or replaceState failure,
						// fallback to a standard redirect. This is specifically
						// to address a Safari security error when attempting to
						// call pushState more than 100 times.
						$location[m.route.mode] = currentRoute
					}
				}
				redirect(modes[m.route.mode] + currentRoute)
			} else {
				$location[m.route.mode] = currentRoute
				redirect(modes[m.route.mode] + currentRoute)
			}
		}
	}

	m.route.param = function (key) {
		if (!routeParams) {
			throw new Error("You must call m.route(element, defaultRoute, " +
				"routes) before calling m.route.param()")
		}

		if (!key) {
			return routeParams
		}

		return routeParams[key]
	}

	m.route.mode = "search"

	function normalizeRoute(route) {
		return route.slice(modes[m.route.mode].length)
	}

	function routeByValue(root, router, path) {
		routeParams = {}

		var queryStart = path.indexOf("?")
		if (queryStart !== -1) {
			routeParams = parseQueryString(
				path.substr(queryStart + 1, path.length))
			path = path.substr(0, queryStart)
		}

		// Get all routes and check if there's
		// an exact match for the current path
		var keys = Object.keys(router)
		var index = keys.indexOf(path)

		if (index !== -1){
			m.mount(root, router[keys [index]])
			return true
		}

		for (var route in router) {
			if (hasOwn.call(router, route)) {
				if (route === path) {
					m.mount(root, router[route])
					return true
				}

				var matcher = new RegExp("^" + route
					.replace(/:[^\/]+?\.{3}/g, "(.*?)")
					.replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$")

				if (matcher.test(path)) {
					/* eslint-disable no-loop-func */
					path.replace(matcher, function () {
						var keys = route.match(/:[^\/]+/g) || []
						var values = [].slice.call(arguments, 1, -2)
						forEach(keys, function (key, i) {
							routeParams[key.replace(/:|\./g, "")] =
								decodeURIComponent(values[i])
						})
						m.mount(root, router[route])
					})
					/* eslint-enable no-loop-func */
					return true
				}
			}
		}
	}

	function routeUnobtrusive(e) {
		e = e || event
		if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2) return

		if (e.preventDefault) {
			e.preventDefault()
		} else {
			e.returnValue = false
		}

		var currentTarget = e.currentTarget || e.srcElement
		var args

		if (m.route.mode === "pathname" && currentTarget.search) {
			args = parseQueryString(currentTarget.search.slice(1))
		} else {
			args = {}
		}

		while (currentTarget && !/a/i.test(currentTarget.nodeName)) {
			currentTarget = currentTarget.parentNode
		}

		// clear pendingRequests because we want an immediate route change
		pendingRequests = 0
		m.route(currentTarget[m.route.mode]
			.slice(modes[m.route.mode].length), args)
	}

	function setScroll() {
		if (m.route.mode !== "hash" && $location.hash) {
			$location.hash = $location.hash
		} else {
			global.scrollTo(0, 0)
		}
	}

	function buildQueryString(object, prefix) {
		var duplicates = {}
		var str = []

		for (var prop in object) {
			if (hasOwn.call(object, prop)) {
				var key = prefix ? prefix + "[" + prop + "]" : prop
				var value = object[prop]

				if (value === null) {
					str.push(encodeURIComponent(key))
				} else if (isObject(value)) {
					str.push(buildQueryString(value, key))
				} else if (isArray(value)) {
					var keys = []
					duplicates[key] = duplicates[key] || {}
					/* eslint-disable no-loop-func */
					forEach(value, function (item) {
						/* eslint-enable no-loop-func */
						if (!duplicates[key][item]) {
							duplicates[key][item] = true
							keys.push(encodeURIComponent(key) + "=" +
								encodeURIComponent(item))
						}
					})
					str.push(keys.join("&"))
				} else if (value !== undefined) {
					str.push(encodeURIComponent(key) + "=" +
						encodeURIComponent(value))
				}
			}
		}

		return str.join("&")
	}

	function parseQueryString(str) {
		if (str === "" || str == null) return {}
		if (str.charAt(0) === "?") str = str.slice(1)

		var pairs = str.split("&")
		var params = {}

		forEach(pairs, function (string) {
			var pair = string.split("=")
			var key = decodeURIComponent(pair[0])
			var value = pair.length === 2 ? decodeURIComponent(pair[1]) : null
			if (params[key] != null) {
				if (!isArray(params[key])) params[key] = [params[key]]
				params[key].push(value)
			}
			else params[key] = value
		})

		return params
	}

	m.route.buildQueryString = buildQueryString
	m.route.parseQueryString = parseQueryString

	function reset(root) {
		var cacheKey = getCellCacheKey(root)
		clear(root.childNodes, cellCache[cacheKey])
		cellCache[cacheKey] = undefined
	}

	m.deferred = function () {
		var deferred = new Deferred()
		deferred.promise = propify(deferred.promise)
		return deferred
	}

	function propify(promise, initialValue) {
		var prop = m.prop(initialValue)
		promise.then(prop)
		prop.then = function (resolve, reject) {
			return propify(promise.then(resolve, reject), initialValue)
		}

		prop.catch = prop.then.bind(null, null)
		return prop
	}
	// Promiz.mithril.js | Zolmeister | MIT
	// a modified version of Promiz.js, which does not conform to Promises/A+
	// for two reasons:
	//
	// 1) `then` callbacks are called synchronously (because setTimeout is too
	//    slow, and the setImmediate polyfill is too big
	//
	// 2) throwing subclasses of Error cause the error to be bubbled up instead
	//    of triggering rejection (because the spec does not account for the
	//    important use case of default browser error handling, i.e. message w/
	//    line number)

	var RESOLVING = 1
	var REJECTING = 2
	var RESOLVED = 3
	var REJECTED = 4

	function Deferred(onSuccess, onFailure) {
		var self = this
		var state = 0
		var promiseValue = 0
		var next = []

		self.promise = {}

		self.resolve = function (value) {
			if (!state) {
				promiseValue = value
				state = RESOLVING

				fire()
			}

			return self
		}

		self.reject = function (value) {
			if (!state) {
				promiseValue = value
				state = REJECTING

				fire()
			}

			return self
		}

		self.promise.then = function (onSuccess, onFailure) {
			var deferred = new Deferred(onSuccess, onFailure)

			if (state === RESOLVED) {
				deferred.resolve(promiseValue)
			} else if (state === REJECTED) {
				deferred.reject(promiseValue)
			} else {
				next.push(deferred)
			}

			return deferred.promise
		}

		function finish(type) {
			state = type || REJECTED
			next.map(function (deferred) {
				if (state === RESOLVED) {
					deferred.resolve(promiseValue)
				} else {
					deferred.reject(promiseValue)
				}
			})
		}

		function thennable(then, success, failure, notThennable) {
			if (((promiseValue != null && isObject(promiseValue)) ||
					isFunction(promiseValue)) && isFunction(then)) {
				try {
					// count protects against abuse calls from spec checker
					var count = 0
					then.call(promiseValue, function (value) {
						if (count++) return
						promiseValue = value
						success()
					}, function (value) {
						if (count++) return
						promiseValue = value
						failure()
					})
				} catch (e) {
					m.deferred.onerror(e)
					promiseValue = e
					failure()
				}
			} else {
				notThennable()
			}
		}

		function fire() {
			// check if it's a thenable
			var then
			try {
				then = promiseValue && promiseValue.then
			} catch (e) {
				m.deferred.onerror(e)
				promiseValue = e
				state = REJECTING
				return fire()
			}

			if (state === REJECTING) {
				m.deferred.onerror(promiseValue)
			}

			thennable(then, function () {
				state = RESOLVING
				fire()
			}, function () {
				state = REJECTING
				fire()
			}, function () {
				try {
					if (state === RESOLVING && isFunction(onSuccess)) {
						promiseValue = onSuccess(promiseValue)
					} else if (state === REJECTING && isFunction(onFailure)) {
						promiseValue = onFailure(promiseValue)
						state = RESOLVING
					}
				} catch (e) {
					m.deferred.onerror(e)
					promiseValue = e
					return finish()
				}

				if (promiseValue === self) {
					promiseValue = TypeError()
					finish()
				} else {
					thennable(then, function () {
						finish(RESOLVED)
					}, finish, function () {
						finish(state === RESOLVING && RESOLVED)
					})
				}
			})
		}
	}

	m.deferred.onerror = function (e) {
		if (type.call(e) === "[object Error]" &&
				!/ Error/.test(e.constructor.toString())) {
			pendingRequests = 0
			throw e
		}
	}

	m.sync = function (args) {
		var deferred = m.deferred()
		var outstanding = args.length
		var results = []
		var method = "resolve"

		function synchronizer(pos, resolved) {
			return function (value) {
				results[pos] = value
				if (!resolved) method = "reject"
				if (--outstanding === 0) {
					deferred.promise(results)
					deferred[method](results)
				}
				return value
			}
		}

		if (args.length > 0) {
			forEach(args, function (arg, i) {
				arg.then(synchronizer(i, true), synchronizer(i, false))
			})
		} else {
			deferred.resolve([])
		}

		return deferred.promise
	}

	function identity(value) { return value }

	function handleJsonp(options) {
		var callbackKey = options.callbackName || "mithril_callback_" +
			new Date().getTime() + "_" +
			(Math.round(Math.random() * 1e16)).toString(36)

		var script = $document.createElement("script")

		global[callbackKey] = function (resp) {
			script.parentNode.removeChild(script)
			options.onload({
				type: "load",
				target: {
					responseText: resp
				}
			})
			global[callbackKey] = undefined
		}

		script.onerror = function () {
			script.parentNode.removeChild(script)

			options.onerror({
				type: "error",
				target: {
					status: 500,
					responseText: JSON.stringify({
						error: "Error making jsonp request"
					})
				}
			})
			global[callbackKey] = undefined

			return false
		}

		script.onload = function () {
			return false
		}

		script.src = options.url +
			(options.url.indexOf("?") > 0 ? "&" : "?") +
			(options.callbackKey ? options.callbackKey : "callback") +
			"=" + callbackKey +
			"&" + buildQueryString(options.data || {})

		$document.body.appendChild(script)
	}

	function createXhr(options) {
		var xhr = new global.XMLHttpRequest()
		xhr.open(options.method, options.url, true, options.user,
			options.password)

		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status >= 200 && xhr.status < 300) {
					options.onload({type: "load", target: xhr})
				} else {
					options.onerror({type: "error", target: xhr})
				}
			}
		}

		if (options.serialize === JSON.stringify &&
				options.data &&
				options.method !== "GET") {
			xhr.setRequestHeader("Content-Type",
				"application/json; charset=utf-8")
		}

		if (options.deserialize === JSON.parse) {
			xhr.setRequestHeader("Accept", "application/json, text/*")
		}

		if (isFunction(options.config)) {
			var maybeXhr = options.config(xhr, options)
			if (maybeXhr != null) xhr = maybeXhr
		}

		var data = options.method === "GET" || !options.data ? "" : options.data

		if (data && !isString(data) && data.constructor !== global.FormData) {
			throw new Error("Request data should be either be a string or " +
				"FormData. Check the `serialize` option in `m.request`")
		}

		xhr.send(data)
		return xhr
	}

	function ajax(options) {
		if (options.dataType && options.dataType.toLowerCase() === "jsonp") {
			return handleJsonp(options)
		} else {
			return createXhr(options)
		}
	}

	function bindData(options, data, serialize) {
		if (options.method === "GET" && options.dataType !== "jsonp") {
			var prefix = options.url.indexOf("?") < 0 ? "?" : "&"
			var querystring = buildQueryString(data)
			options.url += (querystring ? prefix + querystring : "")
		} else {
			options.data = serialize(data)
		}
	}

	function parameterizeUrl(url, data) {
		if (data) {
			url = url.replace(/:[a-z]\w+/gi, function (token){
				var key = token.slice(1)
				var value = data[key] || token
				delete data[key]
				return value
			})
		}
		return url
	}

	m.request = function (options) {
		if (options.background !== true) m.startComputation()
		var deferred = new Deferred()
		var isJSONP = options.dataType &&
			options.dataType.toLowerCase() === "jsonp"

		var serialize, deserialize, extract

		if (isJSONP) {
			serialize = options.serialize =
			deserialize = options.deserialize = identity

			extract = function (jsonp) { return jsonp.responseText }
		} else {
			serialize = options.serialize = options.serialize || JSON.stringify

			deserialize = options.deserialize =
				options.deserialize || JSON.parse
			extract = options.extract || function (xhr) {
				if (xhr.responseText.length || deserialize !== JSON.parse) {
					return xhr.responseText
				} else {
					return null
				}
			}
		}

		options.method = (options.method || "GET").toUpperCase()
		options.url = parameterizeUrl(options.url, options.data)
		bindData(options, options.data, serialize)
		options.onload = options.onerror = function (ev) {
			try {
				ev = ev || event
				var response = deserialize(extract(ev.target, options))
				if (ev.type === "load") {
					if (options.unwrapSuccess) {
						response = options.unwrapSuccess(response, ev.target)
					}

					if (isArray(response) && options.type) {
						forEach(response, function (res, i) {
							response[i] = new options.type(res)
						})
					} else if (options.type) {
						response = new options.type(response)
					}

					deferred.resolve(response)
				} else {
					if (options.unwrapError) {
						response = options.unwrapError(response, ev.target)
					}

					deferred.reject(response)
				}
			} catch (e) {
				deferred.reject(e)
				m.deferred.onerror(e)
			} finally {
				if (options.background !== true) m.endComputation()
			}
		}

		ajax(options)
		deferred.promise = propify(deferred.promise, options.initialValue)
		return deferred.promise
	}

	return m
}); // eslint-disable-line

},{}],2:[function(require,module,exports){
module.exports = {
    "wrapper": "mc0c5a3576_wrapper",
    "carousel-container": "mc0c5a3576_carousel-container",
    "carousel-slide": "mc0c5a3576_carousel-slide",
    "carousel-wrapper": "mc0c5a3576_carousel-wrapper"
};
},{}],3:[function(require,module,exports){
module.exports = {
    "wrapper": "mcb77ca922_wrapper",
    "carousel-container": "mcb77ca922_carousel-container",
    "carousel-slide": "mcb77ca922_carousel-slide",
    "carousel-wrapper": "mcb77ca922_carousel-wrapper"
};
},{}],4:[function(require,module,exports){
(function (global){
var m = require('mithril');
var C = require('./js/carousel')

/*
   This CSS is now scoped to the things in this module via file-hash
   and accessible via css.your_class_name;

   This will output to site.css in dist/css as a bunch of classes with
   unique prefixes (jkfjei32jlsd_example) (so they target whichever element you want perfectly)
 */
var css = require('./css/carousel.css');

/*
  We require global CSS here without assigning because
  it allows browserify to run the 'modular-css' plugin.
  That plugin, while running, outputs a file that we link to through our site

  This will output to site.css in dist/css as is
  (no unique prefixes since it's required but unused)
  modular-css sees this and it just gets placed into site.css untouched.
*/
require('./css/global.css');

/*
  Explanation of stackpack that appears in browser.
  Note that this explanation is being rendered in a v-dom library
  known as 'Mithril', If you're using another vdom library, they
  should have similar paradigms for you to assign classes to a
  virtual dom element.

  You're free to do dot or bracket! No biggie! Just make sure You
  have ESLINT agree with you about it.

*/

var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    slides  = numbers.map(function(number) {
      return m("div", {class: css["carousel-slide"] + ' carousel-slide'}, "Slide " + number);
    })

m.mount(global.document.getElementById('mount'), {
  view: function() {
    return m("div", {
      config: function(element, initialized) {
        C(element);
      },
      class: css["wrapper"]
    }, [
      m('div', {class: css["carousel-container"] + ' carousel-container'}, [
        m("div", {class: css["carousel-wrapper"] + ' carousel-wrapper'}, slides)
      ])
    ]);
  }
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./css/carousel.css":2,"./css/global.css":3,"./js/carousel":6,"mithril":1}],5:[function(require,module,exports){
function translate(element, distance) {
  var translation = 'translate3d(' + distance + 'px, 0, 0)'
  var style = element.style; 

  style.WebkitTransform = translation;
  style.MozTransform = translation;
  style.OTransform = translation;
  style.msTransform = translation;
  style.transform = translation;
}

module.exports = translate; 


},{}],6:[function(require,module,exports){
var dom = require('./utilities/dom');
var translate = require('./animation/translate');
var listeners = require('./event-logic/carousel-event-listeners');
var round = require('./utilities/round-number');


var defaults = {
  slidesPerView: 3,
  spacing: {
    between: 30
  },
  classes: {
    container: '.carousel-container',
    items: '.carousel-slide',
    wrapper: '.carousel-wrapper',
  }
};

function Carousel(root, opts) {
  var C = this;

  C.options = Object.assign({}, defaults, opts);

  C.dom = {
    root: root,
    wrapper: dom.find(root, C.options.classes.wrapper),
    items: dom.find(root, C.options.classes.items),
  }

  C.state = {
    dragging: false,
    drag: {
      /** At what position in the carousel did we begin to drag **/
      startpos: 0,

      /** how far did we move after starting the drag */
      movedpos: 0,

      /** what's the offset introduced via translation */
      offset: 0,
    }
  }

  init(C, C.dom.items);
  listeners(C);
}

function init(Carousel, items) {
  var count   = items.length,
      spacing = Carousel.options.spacing.between,
      spv     = Carousel.options.slidesPerView,

      /** Single Carousel Item */
      carouselItem = {
        margin: Carousel.options.spacing.between + "px",
        width: round((Carousel.dom.root.clientWidth - (spv - 1) * spacing) / spv) + "px"
      }

  // Reflow / Resize slide elements based on:
  // - slides per view (need to use the wrapper width to determine width of items based on per-view)
  // - Number of total slides

  // Initialize Event listeners
  // - Need to have state for:
  //    - Drag/mousedown occurring
  //    - Last pixel position translated to (to stop jarring transitions. )


  items.forEach(function(item) {
    var dom = Carousel.dom;

    item.style.marginRight = carouselItem.margin;
    item.style.width = carouselItem.width;
  });

  Carousel.dom.wrapper.style['width'] = ((items[0].clientWidth + spacing) * count) + "px";


}

module.exports = Carousel;

},{"./animation/translate":5,"./event-logic/carousel-event-listeners":7,"./utilities/dom":9,"./utilities/round-number":11}],7:[function(require,module,exports){
var events = require('./normalize-events.js');
var translate = require('../animation/translate');

function listeners(Carousel) {
  var dom = Carousel.dom,
      state = Carousel.state;

  dom.root.addEventListener(events.start, function(e) {
    state.dragging = true;
    state.drag.startpos = e.clientX;
  });

  dom.root.addEventListener(events.move, function(e) {
    if(!state.dragging) return;

    state.movedpos = e.clientX - state.drag.startpos;
    translate(dom.wrapper, state.drag.offset + state.movedpos);
  });

  dom.root.addEventListener(events.end, function(e) {
    state.dragging = false;
    state.offset = state.offset + state.movedpos;
  });

  dom.root.addEventListener('mouseleave', function(e) {
    state.dragging = false;
    state.offset = state.offset + state.movedpos;
  });

}

module.exports = listeners;

},{"../animation/translate":5,"./normalize-events.js":8}],8:[function(require,module,exports){

/** Event Normalization */

/**
 * 1. Normalize Desktop events between mouseup/mousemove/mousedown
 * 2. If pointer / MSPointer enabled, use those instead.
 */

//TODO: put in a support module
var supports = {
    touch: !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch),
};

/**
 * Retrieve Desktop events that enable drag in a standard object format
 * fallback to using the AWFUL AND DEAD pointer events if we're in IE. 
 */
function _nontouch() {
  var pointers = window.navigator.pointerEnabled;
  var mspointers = window.navigator.pointerEnabled;

  var standard = {
    start: 'mousedown',
    move: 'mousemove',
    end: 'mouseup'
  },

  pointer = {
    start: mspointers ? 'pointerdown' : 'MSPointerDown',
    move: mspointers ? 'pointermove' : 'MSPointerMove',
    end: mspointers ? 'pointerup' : 'MSPointerUp'
  };

  return pointers ? pointer : standard;
}

function _touch() {
    return {
        start: 'touchstart',
        move: 'touchmove',
        end: 'touchend',
    }
}

/**
 * Retrieve Touchscreen events that enable drag in a standard object format. 
 */
function normalize() {
    return supports.touch ? _touch() : _nontouch(); 
}

module.exports = normalize(); 

},{}],9:[function(require,module,exports){
/**
 * @module DOM
 */
var helpers = require("./helpers");

var _elements = helpers.elements,
    _exclude  = helpers.exclude,
    _unwrap   = helpers.unwrap;

/**
 * Finds an element by selector within a context. If child elements in 
 * element match selector, they are added to the return result
 * 
 * @param {Node} element - The element to search for children inside of
 * @param {string} selector - The CSS selector to match elements against
 * 
 * @returns {array|Node} A single element or collection of elements that match the query
 */
function find(element, selector) {
  return _unwrap(_elements(element.querySelectorAll(selector)));
}

/**
 * Finds an element by selector within the context of context (document.body 
 * if no context is supplied). This is a bare-bones analog of jQuery's `$()`
 * 
 * @param {string} selector - The CSS selector to match elements against
 * @param {Node} context - The element to search inside of
 * 
 * @returns {array|Node} A single element or collection of elements that match the query
 */
function query(selector, context = document.body) {
  return (selector === "body") ? context : find(context, selector);
}

// find the closest element that matches (includes self)
/**
 * Finds the closest parent element of element that matches selector
 * starting with the element this function was passed
 * 
 * @param {Node} element - The element from which to begin the search
 * @param {string} selector - The CSS selector to match elements against
 * 
 * @returns {Node} The first ancestor element that matches the query
 */
function closest(element, selector) {
  var current  = element;

  // Keep looking up the DOM if our current element doesn't match, stop at <html>
  while(current.matches && !current.matches(selector) && current.tagName !== "HTML") {
    current = parent(current);
  }

  return (current.matches(selector)) ? current : [];
}

/**
 * Returns the immediate parent of a given node
 * 
 * @param {Node} element - The element from which to return a parent
 * 
 * @return {Node} element - The parent element of the element passed in
 */
function parent(element) {
  return element.parentNode;
}

/**
 * Returns an array of children of the passed in element. Will return a single element
 * if the array contains only one child. 
 * 
 * @param {Node} element - The element from which to retrieve children
 * 
 * @return {array|Node} element - The children of element
 */
function children(element) {
  return _unwrap(_elements(element.childNodes));
}

/**
 * Returns siblings of a given node. If a selector is specified, it will
 * return only the siblings that match that selector. 
 * 
 * @param {Node} element - The element from which to return a parent
 * @param {string} selector - the selector to match elements against
 * 
 * @return {array|Node} element - The sibling(s) of the element passed in. 
 */
function siblings(element, selector) {
  var result = selector ? _exclude(find(parent(element), selector), element) :
                          _exclude(children(parent(element)), element);
  
  return _unwrap(result);
}

module.exports = {
  query: query, 
  find: find,
  closest: closest,
  parent: parent,
  children: children,
  siblings: siblings
};

},{"./helpers":10}],10:[function(require,module,exports){
/**
 * A for-each loop type function that can be run on arrays, it begins from the end of the list for the 
 * reason that it makes the burden on duplicate removal using indexOf far lighter. IE8 doesn't support Array.forEach
 * so this fulfills that functionality. 
 * 
 * @param {array} collection - The array to run `fn` against
 * @param {function} fn - The function that accepts each element, index, and the collection itself. 
 * 
 * @return {undefined} undefined. 
 */
function _each(collection, fn) {
  var i,
      size = collection.length;

  for(i = size - 1; i >= 0; i--) {
    fn(collection[i], i, collection);
  }

  return undefined; 
}

/**
 * A function that runs along an array and returns only unique values
 * 
 * @param {array} collection - The array to filter for uniques
 * 
 * @return {array} A new array containing the unique elements from `collection`. 
 */
function _uniques(collection) {
  var at;

  _each(collection, function(item, index, items) {
    at = items.indexOf(item);

    if(at !== index) {
      collection.splice(index, 1);
    }
  });

  return collection; 
}

/**
 * Excludes an element from an array
 * 
 * @param {array} collection - The array to search through for exclusions
 * @param {any} item - The function that accepts each element, index, and the collection itself. 
 * 
 * @return {array} the collection without the specified item
 */
function _exclude(collection, item) {
  var at = collection.indexOf(item);

  if(at > -1) {
    collection.splice(at, 1);
  }

  return collection;  
}

/**
 * Unwraps an element from an array if it's the only element in the array. This was created
 * to allow selectors that match to only a single DOM element to be interactive without having to
 * grab the first element of the returned collection array. 
 * 
 * @param {array} collection - The array of data
 * 
 * @return {any|array} the item as-is or an array of items
 */
function _unwrap(collection) {
  return collection.length === 1 ? collection[0] : collection; 
}

/**
 * Returns all nodes of an array collection. This function can also be used generically for 
 * almost any data type, but it should only be used with DOM elements. 
 * 
 * @param {array} collection - The array to search through for child Nodes
 * 
 * @return {array} the collection of all Nodes. 
 */
function _nodes(collection) {
  var nodes = [];

  _each(collection, function(node) {
    nodes.unshift(node);
  });

  return nodes; 
}

/**
 * Filters Element nodes of an array of Nodes. This filters out every node that is NOT and element node
 * (e.g. TextNode, CommentNode, AttributeNode, etc.) 
 * 
 * @param {array} collection - The array to search through for elements
 * 
 * @return {array} a new array containing only elements
 */
function _elements(collection) {
  var nodes    = _nodes(collection),
      elements = [],
      ELEMENT  = 1; // Element node ID.   

  _each(nodes, function(node) {
    if(node.nodeType === ELEMENT) {
      elements.unshift(node);
    }
  });

  return elements;
}

module.exports = {
  each     : _each,
  uniques  : _uniques,
  exclude  : _exclude,
  unwrap   : _unwrap,
  nodes    : _nodes,
  elements : _elements
};

},{}],11:[function(require,module,exports){
function round(number) {
  return Math.floor(number);
} 

module.exports = round; 
},{}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvbWl0aHJpbC9taXRocmlsLmpzIiwic3JjL2Nzcy9jYXJvdXNlbC5jc3MiLCJzcmMvY3NzL2dsb2JhbC5jc3MiLCJzcmMvZW50cnkuanMiLCJzcmMvanMvYW5pbWF0aW9uL3RyYW5zbGF0ZS5qcyIsInNyYy9qcy9jYXJvdXNlbC5qcyIsInNyYy9qcy9ldmVudC1sb2dpYy9jYXJvdXNlbC1ldmVudC1saXN0ZW5lcnMuanMiLCJzcmMvanMvZXZlbnQtbG9naWMvbm9ybWFsaXplLWV2ZW50cy5qcyIsInNyYy9qcy91dGlsaXRpZXMvZG9tLmpzIiwic3JjL2pzL3V0aWxpdGllcy9oZWxwZXJzLmpzIiwic3JjL2pzL3V0aWxpdGllcy9yb3VuZC1udW1iZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIjsoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXHJcblx0XCJ1c2Ugc3RyaWN0XCJcclxuXHQvKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlZiAqL1xyXG5cdHZhciBtID0gZmFjdG9yeShnbG9iYWwpXHJcblx0aWYgKHR5cGVvZiBtb2R1bGUgPT09IFwib2JqZWN0XCIgJiYgbW9kdWxlICE9IG51bGwgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuXHRcdG1vZHVsZS5leHBvcnRzID0gbVxyXG5cdH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcclxuXHRcdGRlZmluZShmdW5jdGlvbiAoKSB7IHJldHVybiBtIH0pXHJcblx0fSBlbHNlIHtcclxuXHRcdGdsb2JhbC5tID0gbVxyXG5cdH1cclxuXHQvKiBlc2xpbnQtZW5hYmxlIG5vLXVuZGVmICovXHJcbn0pKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB0aGlzLCBmdW5jdGlvbiAoZ2xvYmFsLCB1bmRlZmluZWQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxyXG5cdFwidXNlIHN0cmljdFwiXHJcblxyXG5cdG0udmVyc2lvbiA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiBcInYwLjIuNVwiXHJcblx0fVxyXG5cclxuXHR2YXIgaGFzT3duID0ge30uaGFzT3duUHJvcGVydHlcclxuXHR2YXIgdHlwZSA9IHt9LnRvU3RyaW5nXHJcblxyXG5cdGZ1bmN0aW9uIGlzRnVuY3Rpb24ob2JqZWN0KSB7XHJcblx0XHRyZXR1cm4gdHlwZW9mIG9iamVjdCA9PT0gXCJmdW5jdGlvblwiXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBpc09iamVjdChvYmplY3QpIHtcclxuXHRcdHJldHVybiB0eXBlLmNhbGwob2JqZWN0KSA9PT0gXCJbb2JqZWN0IE9iamVjdF1cIlxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaXNTdHJpbmcob2JqZWN0KSB7XHJcblx0XHRyZXR1cm4gdHlwZS5jYWxsKG9iamVjdCkgPT09IFwiW29iamVjdCBTdHJpbmddXCJcclxuXHR9XHJcblxyXG5cdHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAob2JqZWN0KSB7XHJcblx0XHRyZXR1cm4gdHlwZS5jYWxsKG9iamVjdCkgPT09IFwiW29iamVjdCBBcnJheV1cIlxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gbm9vcCgpIHt9XHJcblxyXG5cdHZhciB2b2lkRWxlbWVudHMgPSB7XHJcblx0XHRBUkVBOiAxLFxyXG5cdFx0QkFTRTogMSxcclxuXHRcdEJSOiAxLFxyXG5cdFx0Q09MOiAxLFxyXG5cdFx0Q09NTUFORDogMSxcclxuXHRcdEVNQkVEOiAxLFxyXG5cdFx0SFI6IDEsXHJcblx0XHRJTUc6IDEsXHJcblx0XHRJTlBVVDogMSxcclxuXHRcdEtFWUdFTjogMSxcclxuXHRcdExJTks6IDEsXHJcblx0XHRNRVRBOiAxLFxyXG5cdFx0UEFSQU06IDEsXHJcblx0XHRTT1VSQ0U6IDEsXHJcblx0XHRUUkFDSzogMSxcclxuXHRcdFdCUjogMVxyXG5cdH1cclxuXHJcblx0Ly8gY2FjaGluZyBjb21tb25seSB1c2VkIHZhcmlhYmxlc1xyXG5cdHZhciAkZG9jdW1lbnQsICRsb2NhdGlvbiwgJHJlcXVlc3RBbmltYXRpb25GcmFtZSwgJGNhbmNlbEFuaW1hdGlvbkZyYW1lXHJcblxyXG5cdC8vIHNlbGYgaW52b2tpbmcgZnVuY3Rpb24gbmVlZGVkIGJlY2F1c2Ugb2YgdGhlIHdheSBtb2NrcyB3b3JrXHJcblx0ZnVuY3Rpb24gaW5pdGlhbGl6ZShtb2NrKSB7XHJcblx0XHQkZG9jdW1lbnQgPSBtb2NrLmRvY3VtZW50XHJcblx0XHQkbG9jYXRpb24gPSBtb2NrLmxvY2F0aW9uXHJcblx0XHQkY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBtb2NrLmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IG1vY2suY2xlYXJUaW1lb3V0XHJcblx0XHQkcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gbW9jay5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgbW9jay5zZXRUaW1lb3V0XHJcblx0fVxyXG5cclxuXHQvLyB0ZXN0aW5nIEFQSVxyXG5cdG0uZGVwcyA9IGZ1bmN0aW9uIChtb2NrKSB7XHJcblx0XHRpbml0aWFsaXplKGdsb2JhbCA9IG1vY2sgfHwgd2luZG93KVxyXG5cdFx0cmV0dXJuIGdsb2JhbFxyXG5cdH1cclxuXHJcblx0bS5kZXBzKGdsb2JhbClcclxuXHJcblx0LyoqXHJcblx0ICogQHR5cGVkZWYge1N0cmluZ30gVGFnXHJcblx0ICogQSBzdHJpbmcgdGhhdCBsb29rcyBsaWtlIC0+IGRpdi5jbGFzc25hbWUjaWRbcGFyYW09b25lXVtwYXJhbTI9dHdvXVxyXG5cdCAqIFdoaWNoIGRlc2NyaWJlcyBhIERPTSBub2RlXHJcblx0ICovXHJcblxyXG5cdGZ1bmN0aW9uIHBhcnNlVGFnQXR0cnMoY2VsbCwgdGFnKSB7XHJcblx0XHR2YXIgY2xhc3NlcyA9IFtdXHJcblx0XHR2YXIgcGFyc2VyID0gLyg/OihefCN8XFwuKShbXiNcXC5cXFtcXF1dKykpfChcXFsuKz9cXF0pL2dcclxuXHRcdHZhciBtYXRjaFxyXG5cclxuXHRcdHdoaWxlICgobWF0Y2ggPSBwYXJzZXIuZXhlYyh0YWcpKSkge1xyXG5cdFx0XHRpZiAobWF0Y2hbMV0gPT09IFwiXCIgJiYgbWF0Y2hbMl0pIHtcclxuXHRcdFx0XHRjZWxsLnRhZyA9IG1hdGNoWzJdXHJcblx0XHRcdH0gZWxzZSBpZiAobWF0Y2hbMV0gPT09IFwiI1wiKSB7XHJcblx0XHRcdFx0Y2VsbC5hdHRycy5pZCA9IG1hdGNoWzJdXHJcblx0XHRcdH0gZWxzZSBpZiAobWF0Y2hbMV0gPT09IFwiLlwiKSB7XHJcblx0XHRcdFx0Y2xhc3Nlcy5wdXNoKG1hdGNoWzJdKVxyXG5cdFx0XHR9IGVsc2UgaWYgKG1hdGNoWzNdWzBdID09PSBcIltcIikge1xyXG5cdFx0XHRcdHZhciBwYWlyID0gL1xcWyguKz8pKD86PShcInwnfCkoLio/KVxcMik/XFxdLy5leGVjKG1hdGNoWzNdKVxyXG5cdFx0XHRcdGNlbGwuYXR0cnNbcGFpclsxXV0gPSBwYWlyWzNdIHx8IFwiXCJcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBjbGFzc2VzXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRWaXJ0dWFsQ2hpbGRyZW4oYXJncywgaGFzQXR0cnMpIHtcclxuXHRcdHZhciBjaGlsZHJlbiA9IGhhc0F0dHJzID8gYXJncy5zbGljZSgxKSA6IGFyZ3NcclxuXHJcblx0XHRpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAxICYmIGlzQXJyYXkoY2hpbGRyZW5bMF0pKSB7XHJcblx0XHRcdHJldHVybiBjaGlsZHJlblswXVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIGNoaWxkcmVuXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBhc3NpZ25BdHRycyh0YXJnZXQsIGF0dHJzLCBjbGFzc2VzKSB7XHJcblx0XHR2YXIgY2xhc3NBdHRyID0gXCJjbGFzc1wiIGluIGF0dHJzID8gXCJjbGFzc1wiIDogXCJjbGFzc05hbWVcIlxyXG5cclxuXHRcdGZvciAodmFyIGF0dHJOYW1lIGluIGF0dHJzKSB7XHJcblx0XHRcdGlmIChoYXNPd24uY2FsbChhdHRycywgYXR0ck5hbWUpKSB7XHJcblx0XHRcdFx0aWYgKGF0dHJOYW1lID09PSBjbGFzc0F0dHIgJiZcclxuXHRcdFx0XHRcdFx0YXR0cnNbYXR0ck5hbWVdICE9IG51bGwgJiZcclxuXHRcdFx0XHRcdFx0YXR0cnNbYXR0ck5hbWVdICE9PSBcIlwiKSB7XHJcblx0XHRcdFx0XHRjbGFzc2VzLnB1c2goYXR0cnNbYXR0ck5hbWVdKVxyXG5cdFx0XHRcdFx0Ly8gY3JlYXRlIGtleSBpbiBjb3JyZWN0IGl0ZXJhdGlvbiBvcmRlclxyXG5cdFx0XHRcdFx0dGFyZ2V0W2F0dHJOYW1lXSA9IFwiXCJcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGFyZ2V0W2F0dHJOYW1lXSA9IGF0dHJzW2F0dHJOYW1lXVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChjbGFzc2VzLmxlbmd0aCkgdGFyZ2V0W2NsYXNzQXR0cl0gPSBjbGFzc2VzLmpvaW4oXCIgXCIpXHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB7VGFnfSBUaGUgRE9NIG5vZGUgdGFnXHJcblx0ICogQHBhcmFtIHtPYmplY3Q9W119IG9wdGlvbmFsIGtleS12YWx1ZSBwYWlycyB0byBiZSBtYXBwZWQgdG8gRE9NIGF0dHJzXHJcblx0ICogQHBhcmFtIHsuLi5tTm9kZT1bXX0gWmVybyBvciBtb3JlIE1pdGhyaWwgY2hpbGQgbm9kZXMuIENhbiBiZSBhbiBhcnJheSxcclxuXHQgKiAgICAgICAgICAgICAgICAgICAgICBvciBzcGxhdCAob3B0aW9uYWwpXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gbSh0YWcsIHBhaXJzKSB7XHJcblx0XHR2YXIgYXJncyA9IFtdXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDEsIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xyXG5cdFx0XHRhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChpc09iamVjdCh0YWcpKSByZXR1cm4gcGFyYW1ldGVyaXplKHRhZywgYXJncylcclxuXHJcblx0XHRpZiAoIWlzU3RyaW5nKHRhZykpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwic2VsZWN0b3IgaW4gbShzZWxlY3RvciwgYXR0cnMsIGNoaWxkcmVuKSBzaG91bGQgXCIgK1xyXG5cdFx0XHRcdFwiYmUgYSBzdHJpbmdcIilcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgaGFzQXR0cnMgPSBwYWlycyAhPSBudWxsICYmIGlzT2JqZWN0KHBhaXJzKSAmJlxyXG5cdFx0XHQhKFwidGFnXCIgaW4gcGFpcnMgfHwgXCJ2aWV3XCIgaW4gcGFpcnMgfHwgXCJzdWJ0cmVlXCIgaW4gcGFpcnMpXHJcblxyXG5cdFx0dmFyIGF0dHJzID0gaGFzQXR0cnMgPyBwYWlycyA6IHt9XHJcblx0XHR2YXIgY2VsbCA9IHtcclxuXHRcdFx0dGFnOiBcImRpdlwiLFxyXG5cdFx0XHRhdHRyczoge30sXHJcblx0XHRcdGNoaWxkcmVuOiBnZXRWaXJ0dWFsQ2hpbGRyZW4oYXJncywgaGFzQXR0cnMpXHJcblx0XHR9XHJcblxyXG5cdFx0YXNzaWduQXR0cnMoY2VsbC5hdHRycywgYXR0cnMsIHBhcnNlVGFnQXR0cnMoY2VsbCwgdGFnKSlcclxuXHRcdHJldHVybiBjZWxsXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBmb3JFYWNoKGxpc3QsIGYpIHtcclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGggJiYgIWYobGlzdFtpXSwgaSsrKTspIHtcclxuXHRcdFx0Ly8gZnVuY3Rpb24gY2FsbGVkIGluIGNvbmRpdGlvblxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZm9yS2V5cyhsaXN0LCBmKSB7XHJcblx0XHRmb3JFYWNoKGxpc3QsIGZ1bmN0aW9uIChhdHRycywgaSkge1xyXG5cdFx0XHRyZXR1cm4gKGF0dHJzID0gYXR0cnMgJiYgYXR0cnMuYXR0cnMpICYmXHJcblx0XHRcdFx0YXR0cnMua2V5ICE9IG51bGwgJiZcclxuXHRcdFx0XHRmKGF0dHJzLCBpKVxyXG5cdFx0fSlcclxuXHR9XHJcblx0Ly8gVGhpcyBmdW5jdGlvbiB3YXMgY2F1c2luZyBkZW9wdHMgaW4gQ2hyb21lLlxyXG5cdGZ1bmN0aW9uIGRhdGFUb1N0cmluZyhkYXRhKSB7XHJcblx0XHQvLyBkYXRhLnRvU3RyaW5nKCkgbWlnaHQgdGhyb3cgb3IgcmV0dXJuIG51bGwgaWYgZGF0YSBpcyB0aGUgcmV0dXJuXHJcblx0XHQvLyB2YWx1ZSBvZiBDb25zb2xlLmxvZyBpbiBzb21lIHZlcnNpb25zIG9mIEZpcmVmb3ggKGJlaGF2aW9yIGRlcGVuZHMgb25cclxuXHRcdC8vIHZlcnNpb24pXHJcblx0XHR0cnkge1xyXG5cdFx0XHRpZiAoZGF0YSAhPSBudWxsICYmIGRhdGEudG9TdHJpbmcoKSAhPSBudWxsKSByZXR1cm4gZGF0YVxyXG5cdFx0fSBjYXRjaCAoZSkge1xyXG5cdFx0XHQvLyBzaWxlbnRseSBpZ25vcmUgZXJyb3JzXHJcblx0XHR9XHJcblx0XHRyZXR1cm4gXCJcIlxyXG5cdH1cclxuXHJcblx0Ly8gVGhpcyBmdW5jdGlvbiB3YXMgY2F1c2luZyBkZW9wdHMgaW4gQ2hyb21lLlxyXG5cdGZ1bmN0aW9uIGluamVjdFRleHROb2RlKHBhcmVudEVsZW1lbnQsIGZpcnN0LCBpbmRleCwgZGF0YSkge1xyXG5cdFx0dHJ5IHtcclxuXHRcdFx0aW5zZXJ0Tm9kZShwYXJlbnRFbGVtZW50LCBmaXJzdCwgaW5kZXgpXHJcblx0XHRcdGZpcnN0Lm5vZGVWYWx1ZSA9IGRhdGFcclxuXHRcdH0gY2F0Y2ggKGUpIHtcclxuXHRcdFx0Ly8gSUUgZXJyb25lb3VzbHkgdGhyb3dzIGVycm9yIHdoZW4gYXBwZW5kaW5nIGFuIGVtcHR5IHRleHQgbm9kZVxyXG5cdFx0XHQvLyBhZnRlciBhIG51bGxcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGZsYXR0ZW4obGlzdCkge1xyXG5cdFx0Ly8gcmVjdXJzaXZlbHkgZmxhdHRlbiBhcnJheVxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdGlmIChpc0FycmF5KGxpc3RbaV0pKSB7XHJcblx0XHRcdFx0bGlzdCA9IGxpc3QuY29uY2F0LmFwcGx5KFtdLCBsaXN0KVxyXG5cdFx0XHRcdC8vIGNoZWNrIGN1cnJlbnQgaW5kZXggYWdhaW4gYW5kIGZsYXR0ZW4gdW50aWwgdGhlcmUgYXJlIG5vIG1vcmVcclxuXHRcdFx0XHQvLyBuZXN0ZWQgYXJyYXlzIGF0IHRoYXQgaW5kZXhcclxuXHRcdFx0XHRpLS1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGxpc3RcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGluc2VydE5vZGUocGFyZW50RWxlbWVudCwgbm9kZSwgaW5kZXgpIHtcclxuXHRcdHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKG5vZGUsXHJcblx0XHRcdHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0gfHwgbnVsbClcclxuXHR9XHJcblxyXG5cdHZhciBERUxFVElPTiA9IDFcclxuXHR2YXIgSU5TRVJUSU9OID0gMlxyXG5cdHZhciBNT1ZFID0gM1xyXG5cclxuXHRmdW5jdGlvbiBoYW5kbGVLZXlzRGlmZmVyKGRhdGEsIGV4aXN0aW5nLCBjYWNoZWQsIHBhcmVudEVsZW1lbnQpIHtcclxuXHRcdGZvcktleXMoZGF0YSwgZnVuY3Rpb24gKGtleSwgaSkge1xyXG5cdFx0XHRleGlzdGluZ1trZXkgPSBrZXkua2V5XSA9IGV4aXN0aW5nW2tleV0gPyB7XHJcblx0XHRcdFx0YWN0aW9uOiBNT1ZFLFxyXG5cdFx0XHRcdGluZGV4OiBpLFxyXG5cdFx0XHRcdGZyb206IGV4aXN0aW5nW2tleV0uaW5kZXgsXHJcblx0XHRcdFx0ZWxlbWVudDogY2FjaGVkLm5vZGVzW2V4aXN0aW5nW2tleV0uaW5kZXhdIHx8XHJcblx0XHRcdFx0XHQkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxyXG5cdFx0XHR9IDoge2FjdGlvbjogSU5TRVJUSU9OLCBpbmRleDogaX1cclxuXHRcdH0pXHJcblxyXG5cdFx0dmFyIGFjdGlvbnMgPSBbXVxyXG5cdFx0Zm9yICh2YXIgcHJvcCBpbiBleGlzdGluZykge1xyXG5cdFx0XHRpZiAoaGFzT3duLmNhbGwoZXhpc3RpbmcsIHByb3ApKSB7XHJcblx0XHRcdFx0YWN0aW9ucy5wdXNoKGV4aXN0aW5nW3Byb3BdKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGNoYW5nZXMgPSBhY3Rpb25zLnNvcnQoc29ydENoYW5nZXMpXHJcblx0XHR2YXIgbmV3Q2FjaGVkID0gbmV3IEFycmF5KGNhY2hlZC5sZW5ndGgpXHJcblxyXG5cdFx0bmV3Q2FjaGVkLm5vZGVzID0gY2FjaGVkLm5vZGVzLnNsaWNlKClcclxuXHJcblx0XHRmb3JFYWNoKGNoYW5nZXMsIGZ1bmN0aW9uIChjaGFuZ2UpIHtcclxuXHRcdFx0dmFyIGluZGV4ID0gY2hhbmdlLmluZGV4XHJcblx0XHRcdGlmIChjaGFuZ2UuYWN0aW9uID09PSBERUxFVElPTikge1xyXG5cdFx0XHRcdGNsZWFyKGNhY2hlZFtpbmRleF0ubm9kZXMsIGNhY2hlZFtpbmRleF0pXHJcblx0XHRcdFx0bmV3Q2FjaGVkLnNwbGljZShpbmRleCwgMSlcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoY2hhbmdlLmFjdGlvbiA9PT0gSU5TRVJUSU9OKSB7XHJcblx0XHRcdFx0dmFyIGR1bW15ID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcclxuXHRcdFx0XHRkdW1teS5rZXkgPSBkYXRhW2luZGV4XS5hdHRycy5rZXlcclxuXHRcdFx0XHRpbnNlcnROb2RlKHBhcmVudEVsZW1lbnQsIGR1bW15LCBpbmRleClcclxuXHRcdFx0XHRuZXdDYWNoZWQuc3BsaWNlKGluZGV4LCAwLCB7XHJcblx0XHRcdFx0XHRhdHRyczoge2tleTogZGF0YVtpbmRleF0uYXR0cnMua2V5fSxcclxuXHRcdFx0XHRcdG5vZGVzOiBbZHVtbXldXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0XHRuZXdDYWNoZWQubm9kZXNbaW5kZXhdID0gZHVtbXlcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKGNoYW5nZS5hY3Rpb24gPT09IE1PVkUpIHtcclxuXHRcdFx0XHR2YXIgY2hhbmdlRWxlbWVudCA9IGNoYW5nZS5lbGVtZW50XHJcblx0XHRcdFx0dmFyIG1heWJlQ2hhbmdlZCA9IHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF1cclxuXHRcdFx0XHRpZiAobWF5YmVDaGFuZ2VkICE9PSBjaGFuZ2VFbGVtZW50ICYmIGNoYW5nZUVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNoYW5nZUVsZW1lbnQsXHJcblx0XHRcdFx0XHRcdG1heWJlQ2hhbmdlZCB8fCBudWxsKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRuZXdDYWNoZWRbaW5kZXhdID0gY2FjaGVkW2NoYW5nZS5mcm9tXVxyXG5cdFx0XHRcdG5ld0NhY2hlZC5ub2Rlc1tpbmRleF0gPSBjaGFuZ2VFbGVtZW50XHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblxyXG5cdFx0cmV0dXJuIG5ld0NhY2hlZFxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZGlmZktleXMoZGF0YSwgY2FjaGVkLCBleGlzdGluZywgcGFyZW50RWxlbWVudCkge1xyXG5cdFx0dmFyIGtleXNEaWZmZXIgPSBkYXRhLmxlbmd0aCAhPT0gY2FjaGVkLmxlbmd0aFxyXG5cclxuXHRcdGlmICgha2V5c0RpZmZlcikge1xyXG5cdFx0XHRmb3JLZXlzKGRhdGEsIGZ1bmN0aW9uIChhdHRycywgaSkge1xyXG5cdFx0XHRcdHZhciBjYWNoZWRDZWxsID0gY2FjaGVkW2ldXHJcblx0XHRcdFx0cmV0dXJuIGtleXNEaWZmZXIgPSBjYWNoZWRDZWxsICYmXHJcblx0XHRcdFx0XHRjYWNoZWRDZWxsLmF0dHJzICYmXHJcblx0XHRcdFx0XHRjYWNoZWRDZWxsLmF0dHJzLmtleSAhPT0gYXR0cnMua2V5XHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGtleXNEaWZmZXIpIHtcclxuXHRcdFx0cmV0dXJuIGhhbmRsZUtleXNEaWZmZXIoZGF0YSwgZXhpc3RpbmcsIGNhY2hlZCwgcGFyZW50RWxlbWVudClcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiBjYWNoZWRcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGRpZmZBcnJheShkYXRhLCBjYWNoZWQsIG5vZGVzKSB7XHJcblx0XHQvLyBkaWZmIHRoZSBhcnJheSBpdHNlbGZcclxuXHJcblx0XHQvLyB1cGRhdGUgdGhlIGxpc3Qgb2YgRE9NIG5vZGVzIGJ5IGNvbGxlY3RpbmcgdGhlIG5vZGVzIGZyb20gZWFjaCBpdGVtXHJcblx0XHRmb3JFYWNoKGRhdGEsIGZ1bmN0aW9uIChfLCBpKSB7XHJcblx0XHRcdGlmIChjYWNoZWRbaV0gIT0gbnVsbCkgbm9kZXMucHVzaC5hcHBseShub2RlcywgY2FjaGVkW2ldLm5vZGVzKVxyXG5cdFx0fSlcclxuXHRcdC8vIHJlbW92ZSBpdGVtcyBmcm9tIHRoZSBlbmQgb2YgdGhlIGFycmF5IGlmIHRoZSBuZXcgYXJyYXkgaXMgc2hvcnRlclxyXG5cdFx0Ly8gdGhhbiB0aGUgb2xkIG9uZS4gaWYgZXJyb3JzIGV2ZXIgaGFwcGVuIGhlcmUsIHRoZSBpc3N1ZSBpcyBtb3N0XHJcblx0XHQvLyBsaWtlbHkgYSBidWcgaW4gdGhlIGNvbnN0cnVjdGlvbiBvZiB0aGUgYGNhY2hlZGAgZGF0YSBzdHJ1Y3R1cmVcclxuXHRcdC8vIHNvbWV3aGVyZSBlYXJsaWVyIGluIHRoZSBwcm9ncmFtXHJcblx0XHRmb3JFYWNoKGNhY2hlZC5ub2RlcywgZnVuY3Rpb24gKG5vZGUsIGkpIHtcclxuXHRcdFx0aWYgKG5vZGUucGFyZW50Tm9kZSAhPSBudWxsICYmIG5vZGVzLmluZGV4T2Yobm9kZSkgPCAwKSB7XHJcblx0XHRcdFx0Y2xlYXIoW25vZGVdLCBbY2FjaGVkW2ldXSlcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHJcblx0XHRpZiAoZGF0YS5sZW5ndGggPCBjYWNoZWQubGVuZ3RoKSBjYWNoZWQubGVuZ3RoID0gZGF0YS5sZW5ndGhcclxuXHRcdGNhY2hlZC5ub2RlcyA9IG5vZGVzXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBidWlsZEFycmF5S2V5cyhkYXRhKSB7XHJcblx0XHR2YXIgZ3VpZCA9IDBcclxuXHRcdGZvcktleXMoZGF0YSwgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRmb3JFYWNoKGRhdGEsIGZ1bmN0aW9uIChhdHRycykge1xyXG5cdFx0XHRcdGlmICgoYXR0cnMgPSBhdHRycyAmJiBhdHRycy5hdHRycykgJiYgYXR0cnMua2V5ID09IG51bGwpIHtcclxuXHRcdFx0XHRcdGF0dHJzLmtleSA9IFwiX19taXRocmlsX19cIiArIGd1aWQrK1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdFx0cmV0dXJuIDFcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBpc0RpZmZlcmVudEVub3VnaChkYXRhLCBjYWNoZWQsIGRhdGFBdHRyS2V5cykge1xyXG5cdFx0aWYgKGRhdGEudGFnICE9PSBjYWNoZWQudGFnKSByZXR1cm4gdHJ1ZVxyXG5cclxuXHRcdGlmIChkYXRhQXR0cktleXMuc29ydCgpLmpvaW4oKSAhPT1cclxuXHRcdFx0XHRPYmplY3Qua2V5cyhjYWNoZWQuYXR0cnMpLnNvcnQoKS5qb2luKCkpIHtcclxuXHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoZGF0YS5hdHRycy5pZCAhPT0gY2FjaGVkLmF0dHJzLmlkKSB7XHJcblx0XHRcdHJldHVybiB0cnVlXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGRhdGEuYXR0cnMua2V5ICE9PSBjYWNoZWQuYXR0cnMua2V5KSB7XHJcblx0XHRcdHJldHVybiB0cnVlXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKG0ucmVkcmF3LnN0cmF0ZWd5KCkgPT09IFwiYWxsXCIpIHtcclxuXHRcdFx0cmV0dXJuICFjYWNoZWQuY29uZmlnQ29udGV4dCB8fCBjYWNoZWQuY29uZmlnQ29udGV4dC5yZXRhaW4gIT09IHRydWVcclxuXHRcdH1cclxuXHJcblx0XHRpZiAobS5yZWRyYXcuc3RyYXRlZ3koKSA9PT0gXCJkaWZmXCIpIHtcclxuXHRcdFx0cmV0dXJuIGNhY2hlZC5jb25maWdDb250ZXh0ICYmIGNhY2hlZC5jb25maWdDb250ZXh0LnJldGFpbiA9PT0gZmFsc2VcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gZmFsc2VcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIG1heWJlUmVjcmVhdGVPYmplY3QoZGF0YSwgY2FjaGVkLCBkYXRhQXR0cktleXMpIHtcclxuXHRcdC8vIGlmIGFuIGVsZW1lbnQgaXMgZGlmZmVyZW50IGVub3VnaCBmcm9tIHRoZSBvbmUgaW4gY2FjaGUsIHJlY3JlYXRlIGl0XHJcblx0XHRpZiAoaXNEaWZmZXJlbnRFbm91Z2goZGF0YSwgY2FjaGVkLCBkYXRhQXR0cktleXMpKSB7XHJcblx0XHRcdGlmIChjYWNoZWQubm9kZXMubGVuZ3RoKSBjbGVhcihjYWNoZWQubm9kZXMpXHJcblxyXG5cdFx0XHRpZiAoY2FjaGVkLmNvbmZpZ0NvbnRleHQgJiZcclxuXHRcdFx0XHRcdGlzRnVuY3Rpb24oY2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQpKSB7XHJcblx0XHRcdFx0Y2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQoKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoY2FjaGVkLmNvbnRyb2xsZXJzKSB7XHJcblx0XHRcdFx0Zm9yRWFjaChjYWNoZWQuY29udHJvbGxlcnMsIGZ1bmN0aW9uIChjb250cm9sbGVyKSB7XHJcblx0XHRcdFx0XHRpZiAoY29udHJvbGxlci5vbnVubG9hZCkge1xyXG5cdFx0XHRcdFx0XHRjb250cm9sbGVyLm9udW5sb2FkKHtwcmV2ZW50RGVmYXVsdDogbm9vcH0pXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZ2V0T2JqZWN0TmFtZXNwYWNlKGRhdGEsIG5hbWVzcGFjZSkge1xyXG5cdFx0aWYgKGRhdGEuYXR0cnMueG1sbnMpIHJldHVybiBkYXRhLmF0dHJzLnhtbG5zXHJcblx0XHRpZiAoZGF0YS50YWcgPT09IFwic3ZnXCIpIHJldHVybiBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcclxuXHRcdGlmIChkYXRhLnRhZyA9PT0gXCJtYXRoXCIpIHJldHVybiBcImh0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aC9NYXRoTUxcIlxyXG5cdFx0cmV0dXJuIG5hbWVzcGFjZVxyXG5cdH1cclxuXHJcblx0dmFyIHBlbmRpbmdSZXF1ZXN0cyA9IDBcclxuXHRtLnN0YXJ0Q29tcHV0YXRpb24gPSBmdW5jdGlvbiAoKSB7IHBlbmRpbmdSZXF1ZXN0cysrIH1cclxuXHRtLmVuZENvbXB1dGF0aW9uID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKHBlbmRpbmdSZXF1ZXN0cyA+IDEpIHtcclxuXHRcdFx0cGVuZGluZ1JlcXVlc3RzLS1cclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHBlbmRpbmdSZXF1ZXN0cyA9IDBcclxuXHRcdFx0bS5yZWRyYXcoKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gdW5sb2FkQ2FjaGVkQ29udHJvbGxlcnMoY2FjaGVkLCB2aWV3cywgY29udHJvbGxlcnMpIHtcclxuXHRcdGlmIChjb250cm9sbGVycy5sZW5ndGgpIHtcclxuXHRcdFx0Y2FjaGVkLnZpZXdzID0gdmlld3NcclxuXHRcdFx0Y2FjaGVkLmNvbnRyb2xsZXJzID0gY29udHJvbGxlcnNcclxuXHRcdFx0Zm9yRWFjaChjb250cm9sbGVycywgZnVuY3Rpb24gKGNvbnRyb2xsZXIpIHtcclxuXHRcdFx0XHRpZiAoY29udHJvbGxlci5vbnVubG9hZCAmJiBjb250cm9sbGVyLm9udW5sb2FkLiRvbGQpIHtcclxuXHRcdFx0XHRcdGNvbnRyb2xsZXIub251bmxvYWQgPSBjb250cm9sbGVyLm9udW5sb2FkLiRvbGRcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmIChwZW5kaW5nUmVxdWVzdHMgJiYgY29udHJvbGxlci5vbnVubG9hZCkge1xyXG5cdFx0XHRcdFx0dmFyIG9udW5sb2FkID0gY29udHJvbGxlci5vbnVubG9hZFxyXG5cdFx0XHRcdFx0Y29udHJvbGxlci5vbnVubG9hZCA9IG5vb3BcclxuXHRcdFx0XHRcdGNvbnRyb2xsZXIub251bmxvYWQuJG9sZCA9IG9udW5sb2FkXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gc2NoZWR1bGVDb25maWdzVG9CZUNhbGxlZChjb25maWdzLCBkYXRhLCBub2RlLCBpc05ldywgY2FjaGVkKSB7XHJcblx0XHQvLyBzY2hlZHVsZSBjb25maWdzIHRvIGJlIGNhbGxlZC4gVGhleSBhcmUgY2FsbGVkIGFmdGVyIGBidWlsZGAgZmluaXNoZXNcclxuXHRcdC8vIHJ1bm5pbmdcclxuXHRcdGlmIChpc0Z1bmN0aW9uKGRhdGEuYXR0cnMuY29uZmlnKSkge1xyXG5cdFx0XHR2YXIgY29udGV4dCA9IGNhY2hlZC5jb25maWdDb250ZXh0ID0gY2FjaGVkLmNvbmZpZ0NvbnRleHQgfHwge31cclxuXHJcblx0XHRcdC8vIGJpbmRcclxuXHRcdFx0Y29uZmlncy5wdXNoKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRyZXR1cm4gZGF0YS5hdHRycy5jb25maWcuY2FsbChkYXRhLCBub2RlLCAhaXNOZXcsIGNvbnRleHQsXHJcblx0XHRcdFx0XHRjYWNoZWQpXHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBidWlsZFVwZGF0ZWROb2RlKFxyXG5cdFx0Y2FjaGVkLFxyXG5cdFx0ZGF0YSxcclxuXHRcdGVkaXRhYmxlLFxyXG5cdFx0aGFzS2V5cyxcclxuXHRcdG5hbWVzcGFjZSxcclxuXHRcdHZpZXdzLFxyXG5cdFx0Y29uZmlncyxcclxuXHRcdGNvbnRyb2xsZXJzXHJcblx0KSB7XHJcblx0XHR2YXIgbm9kZSA9IGNhY2hlZC5ub2Rlc1swXVxyXG5cclxuXHRcdGlmIChoYXNLZXlzKSB7XHJcblx0XHRcdHNldEF0dHJpYnV0ZXMobm9kZSwgZGF0YS50YWcsIGRhdGEuYXR0cnMsIGNhY2hlZC5hdHRycywgbmFtZXNwYWNlKVxyXG5cdFx0fVxyXG5cclxuXHRcdGNhY2hlZC5jaGlsZHJlbiA9IGJ1aWxkKFxyXG5cdFx0XHRub2RlLFxyXG5cdFx0XHRkYXRhLnRhZyxcclxuXHRcdFx0dW5kZWZpbmVkLFxyXG5cdFx0XHR1bmRlZmluZWQsXHJcblx0XHRcdGRhdGEuY2hpbGRyZW4sXHJcblx0XHRcdGNhY2hlZC5jaGlsZHJlbixcclxuXHRcdFx0ZmFsc2UsXHJcblx0XHRcdDAsXHJcblx0XHRcdGRhdGEuYXR0cnMuY29udGVudGVkaXRhYmxlID8gbm9kZSA6IGVkaXRhYmxlLFxyXG5cdFx0XHRuYW1lc3BhY2UsXHJcblx0XHRcdGNvbmZpZ3NcclxuXHRcdClcclxuXHJcblx0XHRjYWNoZWQubm9kZXMuaW50YWN0ID0gdHJ1ZVxyXG5cclxuXHRcdGlmIChjb250cm9sbGVycy5sZW5ndGgpIHtcclxuXHRcdFx0Y2FjaGVkLnZpZXdzID0gdmlld3NcclxuXHRcdFx0Y2FjaGVkLmNvbnRyb2xsZXJzID0gY29udHJvbGxlcnNcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gbm9kZVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaGFuZGxlTm9uZXhpc3RlbnROb2RlcyhkYXRhLCBwYXJlbnRFbGVtZW50LCBpbmRleCkge1xyXG5cdFx0dmFyIG5vZGVzXHJcblx0XHRpZiAoZGF0YS4kdHJ1c3RlZCkge1xyXG5cdFx0XHRub2RlcyA9IGluamVjdEhUTUwocGFyZW50RWxlbWVudCwgaW5kZXgsIGRhdGEpXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRub2RlcyA9IFskZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YSldXHJcblx0XHRcdGlmICghKHBhcmVudEVsZW1lbnQubm9kZU5hbWUgaW4gdm9pZEVsZW1lbnRzKSkge1xyXG5cdFx0XHRcdGluc2VydE5vZGUocGFyZW50RWxlbWVudCwgbm9kZXNbMF0sIGluZGV4KVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGNhY2hlZFxyXG5cclxuXHRcdGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIiB8fFxyXG5cdFx0XHRcdHR5cGVvZiBkYXRhID09PSBcIm51bWJlclwiIHx8XHJcblx0XHRcdFx0dHlwZW9mIGRhdGEgPT09IFwiYm9vbGVhblwiKSB7XHJcblx0XHRcdGNhY2hlZCA9IG5ldyBkYXRhLmNvbnN0cnVjdG9yKGRhdGEpXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjYWNoZWQgPSBkYXRhXHJcblx0XHR9XHJcblxyXG5cdFx0Y2FjaGVkLm5vZGVzID0gbm9kZXNcclxuXHRcdHJldHVybiBjYWNoZWRcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHJlYXR0YWNoTm9kZXMoXHJcblx0XHRkYXRhLFxyXG5cdFx0Y2FjaGVkLFxyXG5cdFx0cGFyZW50RWxlbWVudCxcclxuXHRcdGVkaXRhYmxlLFxyXG5cdFx0aW5kZXgsXHJcblx0XHRwYXJlbnRUYWdcclxuXHQpIHtcclxuXHRcdHZhciBub2RlcyA9IGNhY2hlZC5ub2Rlc1xyXG5cdFx0aWYgKCFlZGl0YWJsZSB8fCBlZGl0YWJsZSAhPT0gJGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpIHtcclxuXHRcdFx0aWYgKGRhdGEuJHRydXN0ZWQpIHtcclxuXHRcdFx0XHRjbGVhcihub2RlcywgY2FjaGVkKVxyXG5cdFx0XHRcdG5vZGVzID0gaW5qZWN0SFRNTChwYXJlbnRFbGVtZW50LCBpbmRleCwgZGF0YSlcclxuXHRcdFx0fSBlbHNlIGlmIChwYXJlbnRUYWcgPT09IFwidGV4dGFyZWFcIikge1xyXG5cdFx0XHRcdC8vIDx0ZXh0YXJlYT4gdXNlcyBgdmFsdWVgIGluc3RlYWQgb2YgYG5vZGVWYWx1ZWAuXHJcblx0XHRcdFx0cGFyZW50RWxlbWVudC52YWx1ZSA9IGRhdGFcclxuXHRcdFx0fSBlbHNlIGlmIChlZGl0YWJsZSkge1xyXG5cdFx0XHRcdC8vIGNvbnRlbnRlZGl0YWJsZSBub2RlcyB1c2UgYGlubmVySFRNTGAgaW5zdGVhZCBvZiBgbm9kZVZhbHVlYC5cclxuXHRcdFx0XHRlZGl0YWJsZS5pbm5lckhUTUwgPSBkYXRhXHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0Ly8gd2FzIGEgdHJ1c3RlZCBzdHJpbmdcclxuXHRcdFx0XHRpZiAobm9kZXNbMF0ubm9kZVR5cGUgPT09IDEgfHwgbm9kZXMubGVuZ3RoID4gMSB8fFxyXG5cdFx0XHRcdFx0XHQobm9kZXNbMF0ubm9kZVZhbHVlLnRyaW0gJiZcclxuXHRcdFx0XHRcdFx0XHQhbm9kZXNbMF0ubm9kZVZhbHVlLnRyaW0oKSkpIHtcclxuXHRcdFx0XHRcdGNsZWFyKGNhY2hlZC5ub2RlcywgY2FjaGVkKVxyXG5cdFx0XHRcdFx0bm9kZXMgPSBbJGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEpXVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0aW5qZWN0VGV4dE5vZGUocGFyZW50RWxlbWVudCwgbm9kZXNbMF0sIGluZGV4LCBkYXRhKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRjYWNoZWQgPSBuZXcgZGF0YS5jb25zdHJ1Y3RvcihkYXRhKVxyXG5cdFx0Y2FjaGVkLm5vZGVzID0gbm9kZXNcclxuXHRcdHJldHVybiBjYWNoZWRcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGhhbmRsZVRleHROb2RlKFxyXG5cdFx0Y2FjaGVkLFxyXG5cdFx0ZGF0YSxcclxuXHRcdGluZGV4LFxyXG5cdFx0cGFyZW50RWxlbWVudCxcclxuXHRcdHNob3VsZFJlYXR0YWNoLFxyXG5cdFx0ZWRpdGFibGUsXHJcblx0XHRwYXJlbnRUYWdcclxuXHQpIHtcclxuXHRcdGlmICghY2FjaGVkLm5vZGVzLmxlbmd0aCkge1xyXG5cdFx0XHRyZXR1cm4gaGFuZGxlTm9uZXhpc3RlbnROb2RlcyhkYXRhLCBwYXJlbnRFbGVtZW50LCBpbmRleClcclxuXHRcdH0gZWxzZSBpZiAoY2FjaGVkLnZhbHVlT2YoKSAhPT0gZGF0YS52YWx1ZU9mKCkgfHwgc2hvdWxkUmVhdHRhY2gpIHtcclxuXHRcdFx0cmV0dXJuIHJlYXR0YWNoTm9kZXMoZGF0YSwgY2FjaGVkLCBwYXJlbnRFbGVtZW50LCBlZGl0YWJsZSwgaW5kZXgsXHJcblx0XHRcdFx0cGFyZW50VGFnKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIChjYWNoZWQubm9kZXMuaW50YWN0ID0gdHJ1ZSwgY2FjaGVkKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZ2V0U3ViQXJyYXlDb3VudChpdGVtKSB7XHJcblx0XHRpZiAoaXRlbS4kdHJ1c3RlZCkge1xyXG5cdFx0XHQvLyBmaXggb2Zmc2V0IG9mIG5leHQgZWxlbWVudCBpZiBpdGVtIHdhcyBhIHRydXN0ZWQgc3RyaW5nIHcvIG1vcmVcclxuXHRcdFx0Ly8gdGhhbiBvbmUgaHRtbCBlbGVtZW50XHJcblx0XHRcdC8vIHRoZSBmaXJzdCBjbGF1c2UgaW4gdGhlIHJlZ2V4cCBtYXRjaGVzIGVsZW1lbnRzXHJcblx0XHRcdC8vIHRoZSBzZWNvbmQgY2xhdXNlIChhZnRlciB0aGUgcGlwZSkgbWF0Y2hlcyB0ZXh0IG5vZGVzXHJcblx0XHRcdHZhciBtYXRjaCA9IGl0ZW0ubWF0Y2goLzxbXlxcL118XFw+XFxzKltePF0vZylcclxuXHRcdFx0aWYgKG1hdGNoICE9IG51bGwpIHJldHVybiBtYXRjaC5sZW5ndGhcclxuXHRcdH0gZWxzZSBpZiAoaXNBcnJheShpdGVtKSkge1xyXG5cdFx0XHRyZXR1cm4gaXRlbS5sZW5ndGhcclxuXHRcdH1cclxuXHRcdHJldHVybiAxXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBidWlsZEFycmF5KFxyXG5cdFx0ZGF0YSxcclxuXHRcdGNhY2hlZCxcclxuXHRcdHBhcmVudEVsZW1lbnQsXHJcblx0XHRpbmRleCxcclxuXHRcdHBhcmVudFRhZyxcclxuXHRcdHNob3VsZFJlYXR0YWNoLFxyXG5cdFx0ZWRpdGFibGUsXHJcblx0XHRuYW1lc3BhY2UsXHJcblx0XHRjb25maWdzXHJcblx0KSB7XHJcblx0XHRkYXRhID0gZmxhdHRlbihkYXRhKVxyXG5cdFx0dmFyIG5vZGVzID0gW11cclxuXHRcdHZhciBpbnRhY3QgPSBjYWNoZWQubGVuZ3RoID09PSBkYXRhLmxlbmd0aFxyXG5cdFx0dmFyIHN1YkFycmF5Q291bnQgPSAwXHJcblxyXG5cdFx0Ly8ga2V5cyBhbGdvcml0aG06IHNvcnQgZWxlbWVudHMgd2l0aG91dCByZWNyZWF0aW5nIHRoZW0gaWYga2V5cyBhcmVcclxuXHRcdC8vIHByZXNlbnRcclxuXHRcdC8vXHJcblx0XHQvLyAxKSBjcmVhdGUgYSBtYXAgb2YgYWxsIGV4aXN0aW5nIGtleXMsIGFuZCBtYXJrIGFsbCBmb3IgZGVsZXRpb25cclxuXHRcdC8vIDIpIGFkZCBuZXcga2V5cyB0byBtYXAgYW5kIG1hcmsgdGhlbSBmb3IgYWRkaXRpb25cclxuXHRcdC8vIDMpIGlmIGtleSBleGlzdHMgaW4gbmV3IGxpc3QsIGNoYW5nZSBhY3Rpb24gZnJvbSBkZWxldGlvbiB0byBhIG1vdmVcclxuXHRcdC8vIDQpIGZvciBlYWNoIGtleSwgaGFuZGxlIGl0cyBjb3JyZXNwb25kaW5nIGFjdGlvbiBhcyBtYXJrZWQgaW5cclxuXHRcdC8vICAgIHByZXZpb3VzIHN0ZXBzXHJcblxyXG5cdFx0dmFyIGV4aXN0aW5nID0ge31cclxuXHRcdHZhciBzaG91bGRNYWludGFpbklkZW50aXRpZXMgPSBmYWxzZVxyXG5cclxuXHRcdGZvcktleXMoY2FjaGVkLCBmdW5jdGlvbiAoYXR0cnMsIGkpIHtcclxuXHRcdFx0c2hvdWxkTWFpbnRhaW5JZGVudGl0aWVzID0gdHJ1ZVxyXG5cdFx0XHRleGlzdGluZ1tjYWNoZWRbaV0uYXR0cnMua2V5XSA9IHthY3Rpb246IERFTEVUSU9OLCBpbmRleDogaX1cclxuXHRcdH0pXHJcblxyXG5cdFx0YnVpbGRBcnJheUtleXMoZGF0YSlcclxuXHRcdGlmIChzaG91bGRNYWludGFpbklkZW50aXRpZXMpIHtcclxuXHRcdFx0Y2FjaGVkID0gZGlmZktleXMoZGF0YSwgY2FjaGVkLCBleGlzdGluZywgcGFyZW50RWxlbWVudClcclxuXHRcdH1cclxuXHRcdC8vIGVuZCBrZXkgYWxnb3JpdGhtXHJcblxyXG5cdFx0dmFyIGNhY2hlQ291bnQgPSAwXHJcblx0XHQvLyBmYXN0ZXIgZXhwbGljaXRseSB3cml0dGVuXHJcblx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHQvLyBkaWZmIGVhY2ggaXRlbSBpbiB0aGUgYXJyYXlcclxuXHRcdFx0dmFyIGl0ZW0gPSBidWlsZChcclxuXHRcdFx0XHRwYXJlbnRFbGVtZW50LFxyXG5cdFx0XHRcdHBhcmVudFRhZyxcclxuXHRcdFx0XHRjYWNoZWQsXHJcblx0XHRcdFx0aW5kZXgsXHJcblx0XHRcdFx0ZGF0YVtpXSxcclxuXHRcdFx0XHRjYWNoZWRbY2FjaGVDb3VudF0sXHJcblx0XHRcdFx0c2hvdWxkUmVhdHRhY2gsXHJcblx0XHRcdFx0aW5kZXggKyBzdWJBcnJheUNvdW50IHx8IHN1YkFycmF5Q291bnQsXHJcblx0XHRcdFx0ZWRpdGFibGUsXHJcblx0XHRcdFx0bmFtZXNwYWNlLFxyXG5cdFx0XHRcdGNvbmZpZ3MpXHJcblxyXG5cdFx0XHRpZiAoaXRlbSAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0aW50YWN0ID0gaW50YWN0ICYmIGl0ZW0ubm9kZXMuaW50YWN0XHJcblx0XHRcdFx0c3ViQXJyYXlDb3VudCArPSBnZXRTdWJBcnJheUNvdW50KGl0ZW0pXHJcblx0XHRcdFx0Y2FjaGVkW2NhY2hlQ291bnQrK10gPSBpdGVtXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIWludGFjdCkgZGlmZkFycmF5KGRhdGEsIGNhY2hlZCwgbm9kZXMpXHJcblx0XHRyZXR1cm4gY2FjaGVkXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBtYWtlQ2FjaGUoZGF0YSwgY2FjaGVkLCBpbmRleCwgcGFyZW50SW5kZXgsIHBhcmVudENhY2hlKSB7XHJcblx0XHRpZiAoY2FjaGVkICE9IG51bGwpIHtcclxuXHRcdFx0aWYgKHR5cGUuY2FsbChjYWNoZWQpID09PSB0eXBlLmNhbGwoZGF0YSkpIHJldHVybiBjYWNoZWRcclxuXHJcblx0XHRcdGlmIChwYXJlbnRDYWNoZSAmJiBwYXJlbnRDYWNoZS5ub2Rlcykge1xyXG5cdFx0XHRcdHZhciBvZmZzZXQgPSBpbmRleCAtIHBhcmVudEluZGV4XHJcblx0XHRcdFx0dmFyIGVuZCA9IG9mZnNldCArIChpc0FycmF5KGRhdGEpID8gZGF0YSA6IGNhY2hlZC5ub2RlcykubGVuZ3RoXHJcblx0XHRcdFx0Y2xlYXIoXHJcblx0XHRcdFx0XHRwYXJlbnRDYWNoZS5ub2Rlcy5zbGljZShvZmZzZXQsIGVuZCksXHJcblx0XHRcdFx0XHRwYXJlbnRDYWNoZS5zbGljZShvZmZzZXQsIGVuZCkpXHJcblx0XHRcdH0gZWxzZSBpZiAoY2FjaGVkLm5vZGVzKSB7XHJcblx0XHRcdFx0Y2xlYXIoY2FjaGVkLm5vZGVzLCBjYWNoZWQpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRjYWNoZWQgPSBuZXcgZGF0YS5jb25zdHJ1Y3RvcigpXHJcblx0XHQvLyBpZiBjb25zdHJ1Y3RvciBjcmVhdGVzIGEgdmlydHVhbCBkb20gZWxlbWVudCwgdXNlIGEgYmxhbmsgb2JqZWN0IGFzXHJcblx0XHQvLyB0aGUgYmFzZSBjYWNoZWQgbm9kZSBpbnN0ZWFkIG9mIGNvcHlpbmcgdGhlIHZpcnR1YWwgZWwgKCMyNzcpXHJcblx0XHRpZiAoY2FjaGVkLnRhZykgY2FjaGVkID0ge31cclxuXHRcdGNhY2hlZC5ub2RlcyA9IFtdXHJcblx0XHRyZXR1cm4gY2FjaGVkXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBjb25zdHJ1Y3ROb2RlKGRhdGEsIG5hbWVzcGFjZSkge1xyXG5cdFx0aWYgKGRhdGEuYXR0cnMuaXMpIHtcclxuXHRcdFx0aWYgKG5hbWVzcGFjZSA9PSBudWxsKSB7XHJcblx0XHRcdFx0cmV0dXJuICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KGRhdGEudGFnLCBkYXRhLmF0dHJzLmlzKVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgZGF0YS50YWcsXHJcblx0XHRcdFx0XHRkYXRhLmF0dHJzLmlzKVxyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2UgaWYgKG5hbWVzcGFjZSA9PSBudWxsKSB7XHJcblx0XHRcdHJldHVybiAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChkYXRhLnRhZylcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgZGF0YS50YWcpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBjb25zdHJ1Y3RBdHRycyhkYXRhLCBub2RlLCBuYW1lc3BhY2UsIGhhc0tleXMpIHtcclxuXHRcdGlmIChoYXNLZXlzKSB7XHJcblx0XHRcdHJldHVybiBzZXRBdHRyaWJ1dGVzKG5vZGUsIGRhdGEudGFnLCBkYXRhLmF0dHJzLCB7fSwgbmFtZXNwYWNlKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIGRhdGEuYXR0cnNcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGNvbnN0cnVjdENoaWxkcmVuKFxyXG5cdFx0ZGF0YSxcclxuXHRcdG5vZGUsXHJcblx0XHRjYWNoZWQsXHJcblx0XHRlZGl0YWJsZSxcclxuXHRcdG5hbWVzcGFjZSxcclxuXHRcdGNvbmZpZ3NcclxuXHQpIHtcclxuXHRcdGlmIChkYXRhLmNoaWxkcmVuICE9IG51bGwgJiYgZGF0YS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XHJcblx0XHRcdHJldHVybiBidWlsZChcclxuXHRcdFx0XHRub2RlLFxyXG5cdFx0XHRcdGRhdGEudGFnLFxyXG5cdFx0XHRcdHVuZGVmaW5lZCxcclxuXHRcdFx0XHR1bmRlZmluZWQsXHJcblx0XHRcdFx0ZGF0YS5jaGlsZHJlbixcclxuXHRcdFx0XHRjYWNoZWQuY2hpbGRyZW4sXHJcblx0XHRcdFx0dHJ1ZSxcclxuXHRcdFx0XHQwLFxyXG5cdFx0XHRcdGRhdGEuYXR0cnMuY29udGVudGVkaXRhYmxlID8gbm9kZSA6IGVkaXRhYmxlLFxyXG5cdFx0XHRcdG5hbWVzcGFjZSxcclxuXHRcdFx0XHRjb25maWdzKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIGRhdGEuY2hpbGRyZW5cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHJlY29uc3RydWN0Q2FjaGVkKFxyXG5cdFx0ZGF0YSxcclxuXHRcdGF0dHJzLFxyXG5cdFx0Y2hpbGRyZW4sXHJcblx0XHRub2RlLFxyXG5cdFx0bmFtZXNwYWNlLFxyXG5cdFx0dmlld3MsXHJcblx0XHRjb250cm9sbGVyc1xyXG5cdCkge1xyXG5cdFx0dmFyIGNhY2hlZCA9IHtcclxuXHRcdFx0dGFnOiBkYXRhLnRhZyxcclxuXHRcdFx0YXR0cnM6IGF0dHJzLFxyXG5cdFx0XHRjaGlsZHJlbjogY2hpbGRyZW4sXHJcblx0XHRcdG5vZGVzOiBbbm9kZV1cclxuXHRcdH1cclxuXHJcblx0XHR1bmxvYWRDYWNoZWRDb250cm9sbGVycyhjYWNoZWQsIHZpZXdzLCBjb250cm9sbGVycylcclxuXHJcblx0XHRpZiAoY2FjaGVkLmNoaWxkcmVuICYmICFjYWNoZWQuY2hpbGRyZW4ubm9kZXMpIHtcclxuXHRcdFx0Y2FjaGVkLmNoaWxkcmVuLm5vZGVzID0gW11cclxuXHRcdH1cclxuXHJcblx0XHQvLyBlZGdlIGNhc2U6IHNldHRpbmcgdmFsdWUgb24gPHNlbGVjdD4gZG9lc24ndCB3b3JrIGJlZm9yZSBjaGlsZHJlblxyXG5cdFx0Ly8gZXhpc3QsIHNvIHNldCBpdCBhZ2FpbiBhZnRlciBjaGlsZHJlbiBoYXZlIGJlZW4gY3JlYXRlZFxyXG5cdFx0aWYgKGRhdGEudGFnID09PSBcInNlbGVjdFwiICYmIFwidmFsdWVcIiBpbiBkYXRhLmF0dHJzKSB7XHJcblx0XHRcdHNldEF0dHJpYnV0ZXMobm9kZSwgZGF0YS50YWcsIHt2YWx1ZTogZGF0YS5hdHRycy52YWx1ZX0sIHt9LFxyXG5cdFx0XHRcdG5hbWVzcGFjZSlcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gY2FjaGVkXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRDb250cm9sbGVyKHZpZXdzLCB2aWV3LCBjYWNoZWRDb250cm9sbGVycywgY29udHJvbGxlcikge1xyXG5cdFx0dmFyIGNvbnRyb2xsZXJJbmRleFxyXG5cclxuXHRcdGlmIChtLnJlZHJhdy5zdHJhdGVneSgpID09PSBcImRpZmZcIiAmJiB2aWV3cykge1xyXG5cdFx0XHRjb250cm9sbGVySW5kZXggPSB2aWV3cy5pbmRleE9mKHZpZXcpXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjb250cm9sbGVySW5kZXggPSAtMVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChjb250cm9sbGVySW5kZXggPiAtMSkge1xyXG5cdFx0XHRyZXR1cm4gY2FjaGVkQ29udHJvbGxlcnNbY29udHJvbGxlckluZGV4XVxyXG5cdFx0fSBlbHNlIGlmIChpc0Z1bmN0aW9uKGNvbnRyb2xsZXIpKSB7XHJcblx0XHRcdHJldHVybiBuZXcgY29udHJvbGxlcigpXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4ge31cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhciB1bmxvYWRlcnMgPSBbXVxyXG5cclxuXHRmdW5jdGlvbiB1cGRhdGVMaXN0cyh2aWV3cywgY29udHJvbGxlcnMsIHZpZXcsIGNvbnRyb2xsZXIpIHtcclxuXHRcdGlmIChjb250cm9sbGVyLm9udW5sb2FkICE9IG51bGwgJiZcclxuXHRcdFx0XHR1bmxvYWRlcnMubWFwKGZ1bmN0aW9uICh1KSB7IHJldHVybiB1LmhhbmRsZXIgfSlcclxuXHRcdFx0XHRcdC5pbmRleE9mKGNvbnRyb2xsZXIub251bmxvYWQpIDwgMCkge1xyXG5cdFx0XHR1bmxvYWRlcnMucHVzaCh7XHJcblx0XHRcdFx0Y29udHJvbGxlcjogY29udHJvbGxlcixcclxuXHRcdFx0XHRoYW5kbGVyOiBjb250cm9sbGVyLm9udW5sb2FkXHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblxyXG5cdFx0dmlld3MucHVzaCh2aWV3KVxyXG5cdFx0Y29udHJvbGxlcnMucHVzaChjb250cm9sbGVyKVxyXG5cdH1cclxuXHJcblx0dmFyIGZvcmNpbmcgPSBmYWxzZVxyXG5cdGZ1bmN0aW9uIGNoZWNrVmlldyhcclxuXHRcdGRhdGEsXHJcblx0XHR2aWV3LFxyXG5cdFx0Y2FjaGVkLFxyXG5cdFx0Y2FjaGVkQ29udHJvbGxlcnMsXHJcblx0XHRjb250cm9sbGVycyxcclxuXHRcdHZpZXdzXHJcblx0KSB7XHJcblx0XHR2YXIgY29udHJvbGxlciA9IGdldENvbnRyb2xsZXIoXHJcblx0XHRcdGNhY2hlZC52aWV3cyxcclxuXHRcdFx0dmlldyxcclxuXHRcdFx0Y2FjaGVkQ29udHJvbGxlcnMsXHJcblx0XHRcdGRhdGEuY29udHJvbGxlcilcclxuXHJcblx0XHR2YXIga2V5ID0gZGF0YSAmJiBkYXRhLmF0dHJzICYmIGRhdGEuYXR0cnMua2V5XHJcblxyXG5cdFx0aWYgKHBlbmRpbmdSZXF1ZXN0cyA9PT0gMCB8fFxyXG5cdFx0XHRcdGZvcmNpbmcgfHxcclxuXHRcdFx0XHRjYWNoZWRDb250cm9sbGVycyAmJlxyXG5cdFx0XHRcdFx0Y2FjaGVkQ29udHJvbGxlcnMuaW5kZXhPZihjb250cm9sbGVyKSA+IC0xKSB7XHJcblx0XHRcdGRhdGEgPSBkYXRhLnZpZXcoY29udHJvbGxlcilcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGRhdGEgPSB7dGFnOiBcInBsYWNlaG9sZGVyXCJ9XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGRhdGEuc3VidHJlZSA9PT0gXCJyZXRhaW5cIikgcmV0dXJuIGRhdGFcclxuXHRcdGRhdGEuYXR0cnMgPSBkYXRhLmF0dHJzIHx8IHt9XHJcblx0XHRkYXRhLmF0dHJzLmtleSA9IGtleVxyXG5cdFx0dXBkYXRlTGlzdHModmlld3MsIGNvbnRyb2xsZXJzLCB2aWV3LCBjb250cm9sbGVyKVxyXG5cdFx0cmV0dXJuIGRhdGFcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIG1hcmtWaWV3cyhkYXRhLCBjYWNoZWQsIHZpZXdzLCBjb250cm9sbGVycykge1xyXG5cdFx0dmFyIGNhY2hlZENvbnRyb2xsZXJzID0gY2FjaGVkICYmIGNhY2hlZC5jb250cm9sbGVyc1xyXG5cclxuXHRcdHdoaWxlIChkYXRhLnZpZXcgIT0gbnVsbCkge1xyXG5cdFx0XHRkYXRhID0gY2hlY2tWaWV3KFxyXG5cdFx0XHRcdGRhdGEsXHJcblx0XHRcdFx0ZGF0YS52aWV3LiRvcmlnaW5hbCB8fCBkYXRhLnZpZXcsXHJcblx0XHRcdFx0Y2FjaGVkLFxyXG5cdFx0XHRcdGNhY2hlZENvbnRyb2xsZXJzLFxyXG5cdFx0XHRcdGNvbnRyb2xsZXJzLFxyXG5cdFx0XHRcdHZpZXdzKVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBkYXRhXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBidWlsZE9iamVjdCggLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtc3RhdGVtZW50c1xyXG5cdFx0ZGF0YSxcclxuXHRcdGNhY2hlZCxcclxuXHRcdGVkaXRhYmxlLFxyXG5cdFx0cGFyZW50RWxlbWVudCxcclxuXHRcdGluZGV4LFxyXG5cdFx0c2hvdWxkUmVhdHRhY2gsXHJcblx0XHRuYW1lc3BhY2UsXHJcblx0XHRjb25maWdzXHJcblx0KSB7XHJcblx0XHR2YXIgdmlld3MgPSBbXVxyXG5cdFx0dmFyIGNvbnRyb2xsZXJzID0gW11cclxuXHJcblx0XHRkYXRhID0gbWFya1ZpZXdzKGRhdGEsIGNhY2hlZCwgdmlld3MsIGNvbnRyb2xsZXJzKVxyXG5cclxuXHRcdGlmIChkYXRhLnN1YnRyZWUgPT09IFwicmV0YWluXCIpIHJldHVybiBjYWNoZWRcclxuXHJcblx0XHRpZiAoIWRhdGEudGFnICYmIGNvbnRyb2xsZXJzLmxlbmd0aCkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJDb21wb25lbnQgdGVtcGxhdGUgbXVzdCByZXR1cm4gYSB2aXJ0dWFsIFwiICtcclxuXHRcdFx0XHRcImVsZW1lbnQsIG5vdCBhbiBhcnJheSwgc3RyaW5nLCBldGMuXCIpXHJcblx0XHR9XHJcblxyXG5cdFx0ZGF0YS5hdHRycyA9IGRhdGEuYXR0cnMgfHwge31cclxuXHRcdGNhY2hlZC5hdHRycyA9IGNhY2hlZC5hdHRycyB8fCB7fVxyXG5cclxuXHRcdHZhciBkYXRhQXR0cktleXMgPSBPYmplY3Qua2V5cyhkYXRhLmF0dHJzKVxyXG5cdFx0dmFyIGhhc0tleXMgPSBkYXRhQXR0cktleXMubGVuZ3RoID4gKFwia2V5XCIgaW4gZGF0YS5hdHRycyA/IDEgOiAwKVxyXG5cclxuXHRcdG1heWJlUmVjcmVhdGVPYmplY3QoZGF0YSwgY2FjaGVkLCBkYXRhQXR0cktleXMpXHJcblxyXG5cdFx0aWYgKCFpc1N0cmluZyhkYXRhLnRhZykpIHJldHVyblxyXG5cclxuXHRcdHZhciBpc05ldyA9IGNhY2hlZC5ub2Rlcy5sZW5ndGggPT09IDBcclxuXHJcblx0XHRuYW1lc3BhY2UgPSBnZXRPYmplY3ROYW1lc3BhY2UoZGF0YSwgbmFtZXNwYWNlKVxyXG5cclxuXHRcdHZhciBub2RlXHJcblx0XHRpZiAoaXNOZXcpIHtcclxuXHRcdFx0bm9kZSA9IGNvbnN0cnVjdE5vZGUoZGF0YSwgbmFtZXNwYWNlKVxyXG5cdFx0XHQvLyBzZXQgYXR0cmlidXRlcyBmaXJzdCwgdGhlbiBjcmVhdGUgY2hpbGRyZW5cclxuXHRcdFx0dmFyIGF0dHJzID0gY29uc3RydWN0QXR0cnMoZGF0YSwgbm9kZSwgbmFtZXNwYWNlLCBoYXNLZXlzKVxyXG5cclxuXHRcdFx0Ly8gYWRkIHRoZSBub2RlIHRvIGl0cyBwYXJlbnQgYmVmb3JlIGF0dGFjaGluZyBjaGlsZHJlbiB0byBpdFxyXG5cdFx0XHRpbnNlcnROb2RlKHBhcmVudEVsZW1lbnQsIG5vZGUsIGluZGV4KVxyXG5cclxuXHRcdFx0dmFyIGNoaWxkcmVuID0gY29uc3RydWN0Q2hpbGRyZW4oZGF0YSwgbm9kZSwgY2FjaGVkLCBlZGl0YWJsZSxcclxuXHRcdFx0XHRuYW1lc3BhY2UsIGNvbmZpZ3MpXHJcblxyXG5cdFx0XHRjYWNoZWQgPSByZWNvbnN0cnVjdENhY2hlZChcclxuXHRcdFx0XHRkYXRhLFxyXG5cdFx0XHRcdGF0dHJzLFxyXG5cdFx0XHRcdGNoaWxkcmVuLFxyXG5cdFx0XHRcdG5vZGUsXHJcblx0XHRcdFx0bmFtZXNwYWNlLFxyXG5cdFx0XHRcdHZpZXdzLFxyXG5cdFx0XHRcdGNvbnRyb2xsZXJzKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0bm9kZSA9IGJ1aWxkVXBkYXRlZE5vZGUoXHJcblx0XHRcdFx0Y2FjaGVkLFxyXG5cdFx0XHRcdGRhdGEsXHJcblx0XHRcdFx0ZWRpdGFibGUsXHJcblx0XHRcdFx0aGFzS2V5cyxcclxuXHRcdFx0XHRuYW1lc3BhY2UsXHJcblx0XHRcdFx0dmlld3MsXHJcblx0XHRcdFx0Y29uZmlncyxcclxuXHRcdFx0XHRjb250cm9sbGVycylcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIWlzTmV3ICYmIHNob3VsZFJlYXR0YWNoID09PSB0cnVlICYmIG5vZGUgIT0gbnVsbCkge1xyXG5cdFx0XHRpbnNlcnROb2RlKHBhcmVudEVsZW1lbnQsIG5vZGUsIGluZGV4KVxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIFRoZSBjb25maWdzIGFyZSBjYWxsZWQgYWZ0ZXIgYGJ1aWxkYCBmaW5pc2hlcyBydW5uaW5nXHJcblx0XHRzY2hlZHVsZUNvbmZpZ3NUb0JlQ2FsbGVkKGNvbmZpZ3MsIGRhdGEsIG5vZGUsIGlzTmV3LCBjYWNoZWQpXHJcblxyXG5cdFx0cmV0dXJuIGNhY2hlZFxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYnVpbGQoXHJcblx0XHRwYXJlbnRFbGVtZW50LFxyXG5cdFx0cGFyZW50VGFnLFxyXG5cdFx0cGFyZW50Q2FjaGUsXHJcblx0XHRwYXJlbnRJbmRleCxcclxuXHRcdGRhdGEsXHJcblx0XHRjYWNoZWQsXHJcblx0XHRzaG91bGRSZWF0dGFjaCxcclxuXHRcdGluZGV4LFxyXG5cdFx0ZWRpdGFibGUsXHJcblx0XHRuYW1lc3BhY2UsXHJcblx0XHRjb25maWdzXHJcblx0KSB7XHJcblx0XHQvKlxyXG5cdFx0ICogYGJ1aWxkYCBpcyBhIHJlY3Vyc2l2ZSBmdW5jdGlvbiB0aGF0IG1hbmFnZXMgY3JlYXRpb24vZGlmZmluZy9yZW1vdmFsXHJcblx0XHQgKiBvZiBET00gZWxlbWVudHMgYmFzZWQgb24gY29tcGFyaXNvbiBiZXR3ZWVuIGBkYXRhYCBhbmQgYGNhY2hlZGAgdGhlXHJcblx0XHQgKiBkaWZmIGFsZ29yaXRobSBjYW4gYmUgc3VtbWFyaXplZCBhcyB0aGlzOlxyXG5cdFx0ICpcclxuXHRcdCAqIDEgLSBjb21wYXJlIGBkYXRhYCBhbmQgYGNhY2hlZGBcclxuXHRcdCAqIDIgLSBpZiB0aGV5IGFyZSBkaWZmZXJlbnQsIGNvcHkgYGRhdGFgIHRvIGBjYWNoZWRgIGFuZCB1cGRhdGUgdGhlIERPTVxyXG5cdFx0ICogICAgIGJhc2VkIG9uIHdoYXQgdGhlIGRpZmZlcmVuY2UgaXNcclxuXHRcdCAqIDMgLSByZWN1cnNpdmVseSBhcHBseSB0aGlzIGFsZ29yaXRobSBmb3IgZXZlcnkgYXJyYXkgYW5kIGZvciB0aGVcclxuXHRcdCAqICAgICBjaGlsZHJlbiBvZiBldmVyeSB2aXJ0dWFsIGVsZW1lbnRcclxuXHRcdCAqXHJcblx0XHQgKiBUaGUgYGNhY2hlZGAgZGF0YSBzdHJ1Y3R1cmUgaXMgZXNzZW50aWFsbHkgdGhlIHNhbWUgYXMgdGhlIHByZXZpb3VzXHJcblx0XHQgKiByZWRyYXcncyBgZGF0YWAgZGF0YSBzdHJ1Y3R1cmUsIHdpdGggYSBmZXcgYWRkaXRpb25zOlxyXG5cdFx0ICogLSBgY2FjaGVkYCBhbHdheXMgaGFzIGEgcHJvcGVydHkgY2FsbGVkIGBub2Rlc2AsIHdoaWNoIGlzIGEgbGlzdCBvZlxyXG5cdFx0ICogICAgRE9NIGVsZW1lbnRzIHRoYXQgY29ycmVzcG9uZCB0byB0aGUgZGF0YSByZXByZXNlbnRlZCBieSB0aGVcclxuXHRcdCAqICAgIHJlc3BlY3RpdmUgdmlydHVhbCBlbGVtZW50XHJcblx0XHQgKiAtIGluIG9yZGVyIHRvIHN1cHBvcnQgYXR0YWNoaW5nIGBub2Rlc2AgYXMgYSBwcm9wZXJ0eSBvZiBgY2FjaGVkYCxcclxuXHRcdCAqICAgIGBjYWNoZWRgIGlzICphbHdheXMqIGEgbm9uLXByaW1pdGl2ZSBvYmplY3QsIGkuZS4gaWYgdGhlIGRhdGEgd2FzXHJcblx0XHQgKiAgICBhIHN0cmluZywgdGhlbiBjYWNoZWQgaXMgYSBTdHJpbmcgaW5zdGFuY2UuIElmIGRhdGEgd2FzIGBudWxsYCBvclxyXG5cdFx0ICogICAgYHVuZGVmaW5lZGAsIGNhY2hlZCBpcyBgbmV3IFN0cmluZyhcIlwiKWBcclxuXHRcdCAqIC0gYGNhY2hlZCBhbHNvIGhhcyBhIGBjb25maWdDb250ZXh0YCBwcm9wZXJ0eSwgd2hpY2ggaXMgdGhlIHN0YXRlXHJcblx0XHQgKiAgICBzdG9yYWdlIG9iamVjdCBleHBvc2VkIGJ5IGNvbmZpZyhlbGVtZW50LCBpc0luaXRpYWxpemVkLCBjb250ZXh0KVxyXG5cdFx0ICogLSB3aGVuIGBjYWNoZWRgIGlzIGFuIE9iamVjdCwgaXQgcmVwcmVzZW50cyBhIHZpcnR1YWwgZWxlbWVudDsgd2hlblxyXG5cdFx0ICogICAgaXQncyBhbiBBcnJheSwgaXQgcmVwcmVzZW50cyBhIGxpc3Qgb2YgZWxlbWVudHM7IHdoZW4gaXQncyBhXHJcblx0XHQgKiAgICBTdHJpbmcsIE51bWJlciBvciBCb29sZWFuLCBpdCByZXByZXNlbnRzIGEgdGV4dCBub2RlXHJcblx0XHQgKlxyXG5cdFx0ICogYHBhcmVudEVsZW1lbnRgIGlzIGEgRE9NIGVsZW1lbnQgdXNlZCBmb3IgVzNDIERPTSBBUEkgY2FsbHNcclxuXHRcdCAqIGBwYXJlbnRUYWdgIGlzIG9ubHkgdXNlZCBmb3IgaGFuZGxpbmcgYSBjb3JuZXIgY2FzZSBmb3IgdGV4dGFyZWFcclxuXHRcdCAqIHZhbHVlc1xyXG5cdFx0ICogYHBhcmVudENhY2hlYCBpcyB1c2VkIHRvIHJlbW92ZSBub2RlcyBpbiBzb21lIG11bHRpLW5vZGUgY2FzZXNcclxuXHRcdCAqIGBwYXJlbnRJbmRleGAgYW5kIGBpbmRleGAgYXJlIHVzZWQgdG8gZmlndXJlIG91dCB0aGUgb2Zmc2V0IG9mIG5vZGVzLlxyXG5cdFx0ICogVGhleSdyZSBhcnRpZmFjdHMgZnJvbSBiZWZvcmUgYXJyYXlzIHN0YXJ0ZWQgYmVpbmcgZmxhdHRlbmVkIGFuZCBhcmVcclxuXHRcdCAqIGxpa2VseSByZWZhY3RvcmFibGVcclxuXHRcdCAqIGBkYXRhYCBhbmQgYGNhY2hlZGAgYXJlLCByZXNwZWN0aXZlbHksIHRoZSBuZXcgYW5kIG9sZCBub2RlcyBiZWluZ1xyXG5cdFx0ICogZGlmZmVkXHJcblx0XHQgKiBgc2hvdWxkUmVhdHRhY2hgIGlzIGEgZmxhZyBpbmRpY2F0aW5nIHdoZXRoZXIgYSBwYXJlbnQgbm9kZSB3YXNcclxuXHRcdCAqIHJlY3JlYXRlZCAoaWYgc28sIGFuZCBpZiB0aGlzIG5vZGUgaXMgcmV1c2VkLCB0aGVuIHRoaXMgbm9kZSBtdXN0XHJcblx0XHQgKiByZWF0dGFjaCBpdHNlbGYgdG8gdGhlIG5ldyBwYXJlbnQpXHJcblx0XHQgKiBgZWRpdGFibGVgIGlzIGEgZmxhZyB0aGF0IGluZGljYXRlcyB3aGV0aGVyIGFuIGFuY2VzdG9yIGlzXHJcblx0XHQgKiBjb250ZW50ZWRpdGFibGVcclxuXHRcdCAqIGBuYW1lc3BhY2VgIGluZGljYXRlcyB0aGUgY2xvc2VzdCBIVE1MIG5hbWVzcGFjZSBhcyBpdCBjYXNjYWRlcyBkb3duXHJcblx0XHQgKiBmcm9tIGFuIGFuY2VzdG9yXHJcblx0XHQgKiBgY29uZmlnc2AgaXMgYSBsaXN0IG9mIGNvbmZpZyBmdW5jdGlvbnMgdG8gcnVuIGFmdGVyIHRoZSB0b3Btb3N0XHJcblx0XHQgKiBgYnVpbGRgIGNhbGwgZmluaXNoZXMgcnVubmluZ1xyXG5cdFx0ICpcclxuXHRcdCAqIHRoZXJlJ3MgbG9naWMgdGhhdCByZWxpZXMgb24gdGhlIGFzc3VtcHRpb24gdGhhdCBudWxsIGFuZCB1bmRlZmluZWRcclxuXHRcdCAqIGRhdGEgYXJlIGVxdWl2YWxlbnQgdG8gZW1wdHkgc3RyaW5nc1xyXG5cdFx0ICogLSB0aGlzIHByZXZlbnRzIGxpZmVjeWNsZSBzdXJwcmlzZXMgZnJvbSBwcm9jZWR1cmFsIGhlbHBlcnMgdGhhdCBtaXhcclxuXHRcdCAqICAgaW1wbGljaXQgYW5kIGV4cGxpY2l0IHJldHVybiBzdGF0ZW1lbnRzIChlLmcuXHJcblx0XHQgKiAgIGZ1bmN0aW9uIGZvbygpIHtpZiAoY29uZCkgcmV0dXJuIG0oXCJkaXZcIil9XHJcblx0XHQgKiAtIGl0IHNpbXBsaWZpZXMgZGlmZmluZyBjb2RlXHJcblx0XHQgKi9cclxuXHRcdGRhdGEgPSBkYXRhVG9TdHJpbmcoZGF0YSlcclxuXHRcdGlmIChkYXRhLnN1YnRyZWUgPT09IFwicmV0YWluXCIpIHJldHVybiBjYWNoZWRcclxuXHRcdGNhY2hlZCA9IG1ha2VDYWNoZShkYXRhLCBjYWNoZWQsIGluZGV4LCBwYXJlbnRJbmRleCwgcGFyZW50Q2FjaGUpXHJcblxyXG5cdFx0aWYgKGlzQXJyYXkoZGF0YSkpIHtcclxuXHRcdFx0cmV0dXJuIGJ1aWxkQXJyYXkoXHJcblx0XHRcdFx0ZGF0YSxcclxuXHRcdFx0XHRjYWNoZWQsXHJcblx0XHRcdFx0cGFyZW50RWxlbWVudCxcclxuXHRcdFx0XHRpbmRleCxcclxuXHRcdFx0XHRwYXJlbnRUYWcsXHJcblx0XHRcdFx0c2hvdWxkUmVhdHRhY2gsXHJcblx0XHRcdFx0ZWRpdGFibGUsXHJcblx0XHRcdFx0bmFtZXNwYWNlLFxyXG5cdFx0XHRcdGNvbmZpZ3MpXHJcblx0XHR9IGVsc2UgaWYgKGRhdGEgIT0gbnVsbCAmJiBpc09iamVjdChkYXRhKSkge1xyXG5cdFx0XHRyZXR1cm4gYnVpbGRPYmplY3QoXHJcblx0XHRcdFx0ZGF0YSxcclxuXHRcdFx0XHRjYWNoZWQsXHJcblx0XHRcdFx0ZWRpdGFibGUsXHJcblx0XHRcdFx0cGFyZW50RWxlbWVudCxcclxuXHRcdFx0XHRpbmRleCxcclxuXHRcdFx0XHRzaG91bGRSZWF0dGFjaCxcclxuXHRcdFx0XHRuYW1lc3BhY2UsXHJcblx0XHRcdFx0Y29uZmlncylcclxuXHRcdH0gZWxzZSBpZiAoIWlzRnVuY3Rpb24oZGF0YSkpIHtcclxuXHRcdFx0cmV0dXJuIGhhbmRsZVRleHROb2RlKFxyXG5cdFx0XHRcdGNhY2hlZCxcclxuXHRcdFx0XHRkYXRhLFxyXG5cdFx0XHRcdGluZGV4LFxyXG5cdFx0XHRcdHBhcmVudEVsZW1lbnQsXHJcblx0XHRcdFx0c2hvdWxkUmVhdHRhY2gsXHJcblx0XHRcdFx0ZWRpdGFibGUsXHJcblx0XHRcdFx0cGFyZW50VGFnKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIGNhY2hlZFxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gc29ydENoYW5nZXMoYSwgYikge1xyXG5cdFx0cmV0dXJuIGEuYWN0aW9uIC0gYi5hY3Rpb24gfHwgYS5pbmRleCAtIGIuaW5kZXhcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGNvcHlTdHlsZUF0dHJzKG5vZGUsIGRhdGFBdHRyLCBjYWNoZWRBdHRyKSB7XHJcblx0XHRmb3IgKHZhciBydWxlIGluIGRhdGFBdHRyKSB7XHJcblx0XHRcdGlmIChoYXNPd24uY2FsbChkYXRhQXR0ciwgcnVsZSkpIHtcclxuXHRcdFx0XHRpZiAoY2FjaGVkQXR0ciA9PSBudWxsIHx8IGNhY2hlZEF0dHJbcnVsZV0gIT09IGRhdGFBdHRyW3J1bGVdKSB7XHJcblx0XHRcdFx0XHRub2RlLnN0eWxlW3J1bGVdID0gZGF0YUF0dHJbcnVsZV1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRmb3IgKHJ1bGUgaW4gY2FjaGVkQXR0cikge1xyXG5cdFx0XHRpZiAoaGFzT3duLmNhbGwoY2FjaGVkQXR0ciwgcnVsZSkpIHtcclxuXHRcdFx0XHRpZiAoIWhhc093bi5jYWxsKGRhdGFBdHRyLCBydWxlKSkgbm9kZS5zdHlsZVtydWxlXSA9IFwiXCJcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFyIHNob3VsZFVzZVNldEF0dHJpYnV0ZSA9IHtcclxuXHRcdGxpc3Q6IDEsXHJcblx0XHRzdHlsZTogMSxcclxuXHRcdGZvcm06IDEsXHJcblx0XHR0eXBlOiAxLFxyXG5cdFx0d2lkdGg6IDEsXHJcblx0XHRoZWlnaHQ6IDFcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNldFNpbmdsZUF0dHIoXHJcblx0XHRub2RlLFxyXG5cdFx0YXR0ck5hbWUsXHJcblx0XHRkYXRhQXR0cixcclxuXHRcdGNhY2hlZEF0dHIsXHJcblx0XHR0YWcsXHJcblx0XHRuYW1lc3BhY2VcclxuXHQpIHtcclxuXHRcdGlmIChhdHRyTmFtZSA9PT0gXCJjb25maWdcIiB8fCBhdHRyTmFtZSA9PT0gXCJrZXlcIikge1xyXG5cdFx0XHQvLyBgY29uZmlnYCBpc24ndCBhIHJlYWwgYXR0cmlidXRlLCBzbyBpZ25vcmUgaXRcclxuXHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdH0gZWxzZSBpZiAoaXNGdW5jdGlvbihkYXRhQXR0cikgJiYgYXR0ck5hbWUuc2xpY2UoMCwgMikgPT09IFwib25cIikge1xyXG5cdFx0XHQvLyBob29rIGV2ZW50IGhhbmRsZXJzIHRvIHRoZSBhdXRvLXJlZHJhd2luZyBzeXN0ZW1cclxuXHRcdFx0bm9kZVthdHRyTmFtZV0gPSBhdXRvcmVkcmF3KGRhdGFBdHRyLCBub2RlKVxyXG5cdFx0fSBlbHNlIGlmIChhdHRyTmFtZSA9PT0gXCJzdHlsZVwiICYmIGRhdGFBdHRyICE9IG51bGwgJiZcclxuXHRcdFx0XHRpc09iamVjdChkYXRhQXR0cikpIHtcclxuXHRcdFx0Ly8gaGFuZGxlIGBzdHlsZTogey4uLn1gXHJcblx0XHRcdGNvcHlTdHlsZUF0dHJzKG5vZGUsIGRhdGFBdHRyLCBjYWNoZWRBdHRyKVxyXG5cdFx0fSBlbHNlIGlmIChuYW1lc3BhY2UgIT0gbnVsbCkge1xyXG5cdFx0XHQvLyBoYW5kbGUgU1ZHXHJcblx0XHRcdGlmIChhdHRyTmFtZSA9PT0gXCJocmVmXCIpIHtcclxuXHRcdFx0XHRub2RlLnNldEF0dHJpYnV0ZU5TKFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiLFxyXG5cdFx0XHRcdFx0XCJocmVmXCIsIGRhdGFBdHRyKVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdG5vZGUuc2V0QXR0cmlidXRlKFxyXG5cdFx0XHRcdFx0YXR0ck5hbWUgPT09IFwiY2xhc3NOYW1lXCIgPyBcImNsYXNzXCIgOiBhdHRyTmFtZSxcclxuXHRcdFx0XHRcdGRhdGFBdHRyKVxyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2UgaWYgKGF0dHJOYW1lIGluIG5vZGUgJiYgIXNob3VsZFVzZVNldEF0dHJpYnV0ZVthdHRyTmFtZV0pIHtcclxuXHRcdFx0Ly8gaGFuZGxlIGNhc2VzIHRoYXQgYXJlIHByb3BlcnRpZXMgKGJ1dCBpZ25vcmUgY2FzZXMgd2hlcmUgd2VcclxuXHRcdFx0Ly8gc2hvdWxkIHVzZSBzZXRBdHRyaWJ1dGUgaW5zdGVhZClcclxuXHRcdFx0Ly9cclxuXHRcdFx0Ly8gLSBsaXN0IGFuZCBmb3JtIGFyZSB0eXBpY2FsbHkgdXNlZCBhcyBzdHJpbmdzLCBidXQgYXJlIERPTVxyXG5cdFx0XHQvLyAgIGVsZW1lbnQgcmVmZXJlbmNlcyBpbiBqc1xyXG5cdFx0XHQvL1xyXG5cdFx0XHQvLyAtIHdoZW4gdXNpbmcgQ1NTIHNlbGVjdG9ycyAoZS5nLiBgbShcIltzdHlsZT0nJ11cIilgKSwgc3R5bGUgaXNcclxuXHRcdFx0Ly8gICB1c2VkIGFzIGEgc3RyaW5nLCBidXQgaXQncyBhbiBvYmplY3QgaW4ganNcclxuXHRcdFx0Ly9cclxuXHRcdFx0Ly8gIzM0OCBkb24ndCBzZXQgdGhlIHZhbHVlIGlmIG5vdCBuZWVkZWQgLSBvdGhlcndpc2UsIGN1cnNvclxyXG5cdFx0XHQvLyBwbGFjZW1lbnQgYnJlYWtzIGluIENocm9tZVxyXG5cdFx0XHR0cnkge1xyXG5cdFx0XHRcdGlmICh0YWcgIT09IFwiaW5wdXRcIiB8fCBub2RlW2F0dHJOYW1lXSAhPT0gZGF0YUF0dHIpIHtcclxuXHRcdFx0XHRcdG5vZGVbYXR0ck5hbWVdID0gZGF0YUF0dHJcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gY2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRub2RlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgZGF0YUF0dHIpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGVsc2Ugbm9kZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGRhdGFBdHRyKVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gdHJ5U2V0QXR0cihcclxuXHRcdG5vZGUsXHJcblx0XHRhdHRyTmFtZSxcclxuXHRcdGRhdGFBdHRyLFxyXG5cdFx0Y2FjaGVkQXR0cixcclxuXHRcdGNhY2hlZEF0dHJzLFxyXG5cdFx0dGFnLFxyXG5cdFx0bmFtZXNwYWNlXHJcblx0KSB7XHJcblx0XHRpZiAoIShhdHRyTmFtZSBpbiBjYWNoZWRBdHRycykgfHwgKGNhY2hlZEF0dHIgIT09IGRhdGFBdHRyKSB8fCAoJGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IG5vZGUpKSB7XHJcblx0XHRcdGNhY2hlZEF0dHJzW2F0dHJOYW1lXSA9IGRhdGFBdHRyXHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0cmV0dXJuIHNldFNpbmdsZUF0dHIoXHJcblx0XHRcdFx0XHRub2RlLFxyXG5cdFx0XHRcdFx0YXR0ck5hbWUsXHJcblx0XHRcdFx0XHRkYXRhQXR0cixcclxuXHRcdFx0XHRcdGNhY2hlZEF0dHIsXHJcblx0XHRcdFx0XHR0YWcsXHJcblx0XHRcdFx0XHRuYW1lc3BhY2UpXHJcblx0XHRcdH0gY2F0Y2ggKGUpIHtcclxuXHRcdFx0XHQvLyBzd2FsbG93IElFJ3MgaW52YWxpZCBhcmd1bWVudCBlcnJvcnMgdG8gbWltaWMgSFRNTCdzXHJcblx0XHRcdFx0Ly8gZmFsbGJhY2stdG8tZG9pbmctbm90aGluZy1vbi1pbnZhbGlkLWF0dHJpYnV0ZXMgYmVoYXZpb3JcclxuXHRcdFx0XHRpZiAoZS5tZXNzYWdlLmluZGV4T2YoXCJJbnZhbGlkIGFyZ3VtZW50XCIpIDwgMCkgdGhyb3cgZVxyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2UgaWYgKGF0dHJOYW1lID09PSBcInZhbHVlXCIgJiYgdGFnID09PSBcImlucHV0XCIgJiZcclxuXHRcdFx0XHRub2RlLnZhbHVlICE9PSBkYXRhQXR0cikge1xyXG5cdFx0XHQvLyAjMzQ4IGRhdGFBdHRyIG1heSBub3QgYmUgYSBzdHJpbmcsIHNvIHVzZSBsb29zZSBjb21wYXJpc29uXHJcblx0XHRcdG5vZGUudmFsdWUgPSBkYXRhQXR0clxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gc2V0QXR0cmlidXRlcyhub2RlLCB0YWcsIGRhdGFBdHRycywgY2FjaGVkQXR0cnMsIG5hbWVzcGFjZSkge1xyXG5cdFx0Zm9yICh2YXIgYXR0ck5hbWUgaW4gZGF0YUF0dHJzKSB7XHJcblx0XHRcdGlmIChoYXNPd24uY2FsbChkYXRhQXR0cnMsIGF0dHJOYW1lKSkge1xyXG5cdFx0XHRcdGlmICh0cnlTZXRBdHRyKFxyXG5cdFx0XHRcdFx0XHRub2RlLFxyXG5cdFx0XHRcdFx0XHRhdHRyTmFtZSxcclxuXHRcdFx0XHRcdFx0ZGF0YUF0dHJzW2F0dHJOYW1lXSxcclxuXHRcdFx0XHRcdFx0Y2FjaGVkQXR0cnNbYXR0ck5hbWVdLFxyXG5cdFx0XHRcdFx0XHRjYWNoZWRBdHRycyxcclxuXHRcdFx0XHRcdFx0dGFnLFxyXG5cdFx0XHRcdFx0XHRuYW1lc3BhY2UpKSB7XHJcblx0XHRcdFx0XHRjb250aW51ZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGNhY2hlZEF0dHJzXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBjbGVhcihub2RlcywgY2FjaGVkKSB7XHJcblx0XHRmb3IgKHZhciBpID0gbm9kZXMubGVuZ3RoIC0gMTsgaSA+IC0xOyBpLS0pIHtcclxuXHRcdFx0aWYgKG5vZGVzW2ldICYmIG5vZGVzW2ldLnBhcmVudE5vZGUpIHtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0bm9kZXNbaV0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2Rlc1tpXSlcclxuXHRcdFx0XHR9IGNhdGNoIChlKSB7XHJcblx0XHRcdFx0XHQvKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXHJcblx0XHRcdFx0XHQvLyBpZ25vcmUgaWYgdGhpcyBmYWlscyBkdWUgdG8gb3JkZXIgb2YgZXZlbnRzIChzZWVcclxuXHRcdFx0XHRcdC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjE5MjYwODMvZmFpbGVkLXRvLWV4ZWN1dGUtcmVtb3ZlY2hpbGQtb24tbm9kZSlcclxuXHRcdFx0XHRcdC8qIGVzbGludC1lbmFibGUgbWF4LWxlbiAqL1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYWNoZWQgPSBbXS5jb25jYXQoY2FjaGVkKVxyXG5cdFx0XHRcdGlmIChjYWNoZWRbaV0pIHVubG9hZChjYWNoZWRbaV0pXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdC8vIHJlbGVhc2UgbWVtb3J5IGlmIG5vZGVzIGlzIGFuIGFycmF5LiBUaGlzIGNoZWNrIHNob3VsZCBmYWlsIGlmIG5vZGVzXHJcblx0XHQvLyBpcyBhIE5vZGVMaXN0IChzZWUgbG9vcCBhYm92ZSlcclxuXHRcdGlmIChub2Rlcy5sZW5ndGgpIHtcclxuXHRcdFx0bm9kZXMubGVuZ3RoID0gMFxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gdW5sb2FkKGNhY2hlZCkge1xyXG5cdFx0aWYgKGNhY2hlZC5jb25maWdDb250ZXh0ICYmIGlzRnVuY3Rpb24oY2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQpKSB7XHJcblx0XHRcdGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkKClcclxuXHRcdFx0Y2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQgPSBudWxsXHJcblx0XHR9XHJcblx0XHRpZiAoY2FjaGVkLmNvbnRyb2xsZXJzKSB7XHJcblx0XHRcdGZvckVhY2goY2FjaGVkLmNvbnRyb2xsZXJzLCBmdW5jdGlvbiAoY29udHJvbGxlcikge1xyXG5cdFx0XHRcdGlmIChpc0Z1bmN0aW9uKGNvbnRyb2xsZXIub251bmxvYWQpKSB7XHJcblx0XHRcdFx0XHRjb250cm9sbGVyLm9udW5sb2FkKHtwcmV2ZW50RGVmYXVsdDogbm9vcH0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cdFx0aWYgKGNhY2hlZC5jaGlsZHJlbikge1xyXG5cdFx0XHRpZiAoaXNBcnJheShjYWNoZWQuY2hpbGRyZW4pKSBmb3JFYWNoKGNhY2hlZC5jaGlsZHJlbiwgdW5sb2FkKVxyXG5cdFx0XHRlbHNlIGlmIChjYWNoZWQuY2hpbGRyZW4udGFnKSB1bmxvYWQoY2FjaGVkLmNoaWxkcmVuKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYXBwZW5kVGV4dEZyYWdtZW50KHBhcmVudEVsZW1lbnQsIGRhdGEpIHtcclxuXHRcdHRyeSB7XHJcblx0XHRcdHBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQoXHJcblx0XHRcdFx0JGRvY3VtZW50LmNyZWF0ZVJhbmdlKCkuY3JlYXRlQ29udGV4dHVhbEZyYWdtZW50KGRhdGEpKVxyXG5cdFx0fSBjYXRjaCAoZSkge1xyXG5cdFx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEFkamFjZW50SFRNTChcImJlZm9yZWVuZFwiLCBkYXRhKVxyXG5cdFx0XHRyZXBsYWNlU2NyaXB0Tm9kZXMocGFyZW50RWxlbWVudClcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIFJlcGxhY2Ugc2NyaXB0IHRhZ3MgaW5zaWRlIGdpdmVuIERPTSBlbGVtZW50IHdpdGggZXhlY3V0YWJsZSBvbmVzLlxyXG5cdC8vIFdpbGwgYWxzbyBjaGVjayBjaGlsZHJlbiByZWN1cnNpdmVseSBhbmQgcmVwbGFjZSBhbnkgZm91bmQgc2NyaXB0XHJcblx0Ly8gdGFncyBpbiBzYW1lIG1hbm5lci5cclxuXHRmdW5jdGlvbiByZXBsYWNlU2NyaXB0Tm9kZXMobm9kZSkge1xyXG5cdFx0aWYgKG5vZGUudGFnTmFtZSA9PT0gXCJTQ1JJUFRcIikge1xyXG5cdFx0XHRub2RlLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGJ1aWxkRXhlY3V0YWJsZU5vZGUobm9kZSksIG5vZGUpXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR2YXIgY2hpbGRyZW4gPSBub2RlLmNoaWxkTm9kZXNcclxuXHRcdFx0aWYgKGNoaWxkcmVuICYmIGNoaWxkcmVuLmxlbmd0aCkge1xyXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRcdHJlcGxhY2VTY3JpcHROb2RlcyhjaGlsZHJlbltpXSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gbm9kZVxyXG5cdH1cclxuXHJcblx0Ly8gUmVwbGFjZSBzY3JpcHQgZWxlbWVudCB3aXRoIG9uZSB3aG9zZSBjb250ZW50cyBhcmUgZXhlY3V0YWJsZS5cclxuXHRmdW5jdGlvbiBidWlsZEV4ZWN1dGFibGVOb2RlKG5vZGUpe1xyXG5cdFx0dmFyIHNjcmlwdEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKVxyXG5cdFx0dmFyIGF0dHJzID0gbm9kZS5hdHRyaWJ1dGVzXHJcblxyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRzY3JpcHRFbC5zZXRBdHRyaWJ1dGUoYXR0cnNbaV0ubmFtZSwgYXR0cnNbaV0udmFsdWUpXHJcblx0XHR9XHJcblxyXG5cdFx0c2NyaXB0RWwudGV4dCA9IG5vZGUuaW5uZXJIVE1MXHJcblx0XHRyZXR1cm4gc2NyaXB0RWxcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGluamVjdEhUTUwocGFyZW50RWxlbWVudCwgaW5kZXgsIGRhdGEpIHtcclxuXHRcdHZhciBuZXh0U2libGluZyA9IHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF1cclxuXHRcdGlmIChuZXh0U2libGluZykge1xyXG5cdFx0XHR2YXIgaXNFbGVtZW50ID0gbmV4dFNpYmxpbmcubm9kZVR5cGUgIT09IDFcclxuXHRcdFx0dmFyIHBsYWNlaG9sZGVyID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpXHJcblx0XHRcdGlmIChpc0VsZW1lbnQpIHtcclxuXHRcdFx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlciwgbmV4dFNpYmxpbmcgfHwgbnVsbClcclxuXHRcdFx0XHRwbGFjZWhvbGRlci5pbnNlcnRBZGphY2VudEhUTUwoXCJiZWZvcmViZWdpblwiLCBkYXRhKVxyXG5cdFx0XHRcdHBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQocGxhY2Vob2xkZXIpXHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0bmV4dFNpYmxpbmcuaW5zZXJ0QWRqYWNlbnRIVE1MKFwiYmVmb3JlYmVnaW5cIiwgZGF0YSlcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0YXBwZW5kVGV4dEZyYWdtZW50KHBhcmVudEVsZW1lbnQsIGRhdGEpXHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIG5vZGVzID0gW11cclxuXHJcblx0XHR3aGlsZSAocGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSAhPT0gbmV4dFNpYmxpbmcpIHtcclxuXHRcdFx0bm9kZXMucHVzaChwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdKVxyXG5cdFx0XHRpbmRleCsrXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIG5vZGVzXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBhdXRvcmVkcmF3KGNhbGxiYWNrLCBvYmplY3QpIHtcclxuXHRcdHJldHVybiBmdW5jdGlvbiAoZSkge1xyXG5cdFx0XHRlID0gZSB8fCBldmVudFxyXG5cdFx0XHRtLnJlZHJhdy5zdHJhdGVneShcImRpZmZcIilcclxuXHRcdFx0bS5zdGFydENvbXB1dGF0aW9uKClcclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRyZXR1cm4gY2FsbGJhY2suY2FsbChvYmplY3QsIGUpXHJcblx0XHRcdH0gZmluYWxseSB7XHJcblx0XHRcdFx0ZW5kRmlyc3RDb21wdXRhdGlvbigpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhciBodG1sXHJcblx0dmFyIGRvY3VtZW50Tm9kZSA9IHtcclxuXHRcdGFwcGVuZENoaWxkOiBmdW5jdGlvbiAobm9kZSkge1xyXG5cdFx0XHRpZiAoaHRtbCA9PT0gdW5kZWZpbmVkKSBodG1sID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJodG1sXCIpXHJcblx0XHRcdGlmICgkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmXHJcblx0XHRcdFx0XHQkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICE9PSBub2RlKSB7XHJcblx0XHRcdFx0JGRvY3VtZW50LnJlcGxhY2VDaGlsZChub2RlLCAkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdCRkb2N1bWVudC5hcHBlbmRDaGlsZChub2RlKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLmNoaWxkTm9kZXMgPSAkZG9jdW1lbnQuY2hpbGROb2Rlc1xyXG5cdFx0fSxcclxuXHJcblx0XHRpbnNlcnRCZWZvcmU6IGZ1bmN0aW9uIChub2RlKSB7XHJcblx0XHRcdHRoaXMuYXBwZW5kQ2hpbGQobm9kZSlcclxuXHRcdH0sXHJcblxyXG5cdFx0Y2hpbGROb2RlczogW11cclxuXHR9XHJcblxyXG5cdHZhciBub2RlQ2FjaGUgPSBbXVxyXG5cdHZhciBjZWxsQ2FjaGUgPSB7fVxyXG5cclxuXHRtLnJlbmRlciA9IGZ1bmN0aW9uIChyb290LCBjZWxsLCBmb3JjZVJlY3JlYXRpb24pIHtcclxuXHRcdGlmICghcm9vdCkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJFbnN1cmUgdGhlIERPTSBlbGVtZW50IGJlaW5nIHBhc3NlZCB0byBcIiArXHJcblx0XHRcdFx0XCJtLnJvdXRlL20ubW91bnQvbS5yZW5kZXIgaXMgbm90IHVuZGVmaW5lZC5cIilcclxuXHRcdH1cclxuXHRcdHZhciBjb25maWdzID0gW11cclxuXHRcdHZhciBpZCA9IGdldENlbGxDYWNoZUtleShyb290KVxyXG5cdFx0dmFyIGlzRG9jdW1lbnRSb290ID0gcm9vdCA9PT0gJGRvY3VtZW50XHJcblx0XHR2YXIgbm9kZVxyXG5cclxuXHRcdGlmIChpc0RvY3VtZW50Um9vdCB8fCByb290ID09PSAkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KSB7XHJcblx0XHRcdG5vZGUgPSBkb2N1bWVudE5vZGVcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdG5vZGUgPSByb290XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGlzRG9jdW1lbnRSb290ICYmIGNlbGwudGFnICE9PSBcImh0bWxcIikge1xyXG5cdFx0XHRjZWxsID0ge3RhZzogXCJodG1sXCIsIGF0dHJzOiB7fSwgY2hpbGRyZW46IGNlbGx9XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGNlbGxDYWNoZVtpZF0gPT09IHVuZGVmaW5lZCkgY2xlYXIobm9kZS5jaGlsZE5vZGVzKVxyXG5cdFx0aWYgKGZvcmNlUmVjcmVhdGlvbiA9PT0gdHJ1ZSkgcmVzZXQocm9vdClcclxuXHJcblx0XHRjZWxsQ2FjaGVbaWRdID0gYnVpbGQoXHJcblx0XHRcdG5vZGUsXHJcblx0XHRcdG51bGwsXHJcblx0XHRcdHVuZGVmaW5lZCxcclxuXHRcdFx0dW5kZWZpbmVkLFxyXG5cdFx0XHRjZWxsLFxyXG5cdFx0XHRjZWxsQ2FjaGVbaWRdLFxyXG5cdFx0XHRmYWxzZSxcclxuXHRcdFx0MCxcclxuXHRcdFx0bnVsbCxcclxuXHRcdFx0dW5kZWZpbmVkLFxyXG5cdFx0XHRjb25maWdzKVxyXG5cclxuXHRcdGZvckVhY2goY29uZmlncywgZnVuY3Rpb24gKGNvbmZpZykgeyBjb25maWcoKSB9KVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZ2V0Q2VsbENhY2hlS2V5KGVsZW1lbnQpIHtcclxuXHRcdHZhciBpbmRleCA9IG5vZGVDYWNoZS5pbmRleE9mKGVsZW1lbnQpXHJcblx0XHRyZXR1cm4gaW5kZXggPCAwID8gbm9kZUNhY2hlLnB1c2goZWxlbWVudCkgLSAxIDogaW5kZXhcclxuXHR9XHJcblxyXG5cdG0udHJ1c3QgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuXHRcdHZhbHVlID0gbmV3IFN0cmluZyh2YWx1ZSkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1uZXctd3JhcHBlcnNcclxuXHRcdHZhbHVlLiR0cnVzdGVkID0gdHJ1ZVxyXG5cdFx0cmV0dXJuIHZhbHVlXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXR0ZXJzZXR0ZXIoc3RvcmUpIHtcclxuXHRcdGZ1bmN0aW9uIHByb3AoKSB7XHJcblx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoKSBzdG9yZSA9IGFyZ3VtZW50c1swXVxyXG5cdFx0XHRyZXR1cm4gc3RvcmVcclxuXHRcdH1cclxuXHJcblx0XHRwcm9wLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0cmV0dXJuIHN0b3JlXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHByb3BcclxuXHR9XHJcblxyXG5cdG0ucHJvcCA9IGZ1bmN0aW9uIChzdG9yZSkge1xyXG5cdFx0aWYgKChzdG9yZSAhPSBudWxsICYmIChpc09iamVjdChzdG9yZSkgfHwgaXNGdW5jdGlvbihzdG9yZSkpIHx8ICgodHlwZW9mIFByb21pc2UgIT09IFwidW5kZWZpbmVkXCIpICYmIChzdG9yZSBpbnN0YW5jZW9mIFByb21pc2UpKSkgJiZcclxuXHRcdFx0XHRpc0Z1bmN0aW9uKHN0b3JlLnRoZW4pKSB7XHJcblx0XHRcdHJldHVybiBwcm9waWZ5KHN0b3JlKVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBnZXR0ZXJzZXR0ZXIoc3RvcmUpXHJcblx0fVxyXG5cclxuXHR2YXIgcm9vdHMgPSBbXVxyXG5cdHZhciBjb21wb25lbnRzID0gW11cclxuXHR2YXIgY29udHJvbGxlcnMgPSBbXVxyXG5cdHZhciBsYXN0UmVkcmF3SWQgPSBudWxsXHJcblx0dmFyIGxhc3RSZWRyYXdDYWxsVGltZSA9IDBcclxuXHR2YXIgY29tcHV0ZVByZVJlZHJhd0hvb2sgPSBudWxsXHJcblx0dmFyIGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IG51bGxcclxuXHR2YXIgdG9wQ29tcG9uZW50XHJcblx0dmFyIEZSQU1FX0JVREdFVCA9IDE2IC8vIDYwIGZyYW1lcyBwZXIgc2Vjb25kID0gMSBjYWxsIHBlciAxNiBtc1xyXG5cclxuXHRmdW5jdGlvbiBwYXJhbWV0ZXJpemUoY29tcG9uZW50LCBhcmdzKSB7XHJcblx0XHRmdW5jdGlvbiBjb250cm9sbGVyKCkge1xyXG5cdFx0XHQvKiBlc2xpbnQtZGlzYWJsZSBuby1pbnZhbGlkLXRoaXMgKi9cclxuXHRcdFx0cmV0dXJuIChjb21wb25lbnQuY29udHJvbGxlciB8fCBub29wKS5hcHBseSh0aGlzLCBhcmdzKSB8fCB0aGlzXHJcblx0XHRcdC8qIGVzbGludC1lbmFibGUgbm8taW52YWxpZC10aGlzICovXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGNvbXBvbmVudC5jb250cm9sbGVyKSB7XHJcblx0XHRcdGNvbnRyb2xsZXIucHJvdG90eXBlID0gY29tcG9uZW50LmNvbnRyb2xsZXIucHJvdG90eXBlXHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gdmlldyhjdHJsKSB7XHJcblx0XHRcdHZhciBjdXJyZW50QXJncyA9IFtjdHJsXS5jb25jYXQoYXJncylcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRjdXJyZW50QXJncy5wdXNoKGFyZ3VtZW50c1tpXSlcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIGNvbXBvbmVudC52aWV3LmFwcGx5KGNvbXBvbmVudCwgY3VycmVudEFyZ3MpXHJcblx0XHR9XHJcblxyXG5cdFx0dmlldy4kb3JpZ2luYWwgPSBjb21wb25lbnQudmlld1xyXG5cdFx0dmFyIG91dHB1dCA9IHtjb250cm9sbGVyOiBjb250cm9sbGVyLCB2aWV3OiB2aWV3fVxyXG5cdFx0aWYgKGFyZ3NbMF0gJiYgYXJnc1swXS5rZXkgIT0gbnVsbCkgb3V0cHV0LmF0dHJzID0ge2tleTogYXJnc1swXS5rZXl9XHJcblx0XHRyZXR1cm4gb3V0cHV0XHJcblx0fVxyXG5cclxuXHRtLmNvbXBvbmVudCA9IGZ1bmN0aW9uIChjb21wb25lbnQpIHtcclxuXHRcdHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKVxyXG5cclxuXHRcdGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHBhcmFtZXRlcml6ZShjb21wb25lbnQsIGFyZ3MpXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBjaGVja1ByZXZlbnRlZChjb21wb25lbnQsIHJvb3QsIGluZGV4LCBpc1ByZXZlbnRlZCkge1xyXG5cdFx0aWYgKCFpc1ByZXZlbnRlZCkge1xyXG5cdFx0XHRtLnJlZHJhdy5zdHJhdGVneShcImFsbFwiKVxyXG5cdFx0XHRtLnN0YXJ0Q29tcHV0YXRpb24oKVxyXG5cdFx0XHRyb290c1tpbmRleF0gPSByb290XHJcblx0XHRcdHZhciBjdXJyZW50Q29tcG9uZW50XHJcblxyXG5cdFx0XHRpZiAoY29tcG9uZW50KSB7XHJcblx0XHRcdFx0Y3VycmVudENvbXBvbmVudCA9IHRvcENvbXBvbmVudCA9IGNvbXBvbmVudFxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGN1cnJlbnRDb21wb25lbnQgPSB0b3BDb21wb25lbnQgPSBjb21wb25lbnQgPSB7Y29udHJvbGxlcjogbm9vcH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIGNvbnRyb2xsZXIgPSBuZXcgKGNvbXBvbmVudC5jb250cm9sbGVyIHx8IG5vb3ApKClcclxuXHJcblx0XHRcdC8vIGNvbnRyb2xsZXJzIG1heSBjYWxsIG0ubW91bnQgcmVjdXJzaXZlbHkgKHZpYSBtLnJvdXRlIHJlZGlyZWN0cyxcclxuXHRcdFx0Ly8gZm9yIGV4YW1wbGUpXHJcblx0XHRcdC8vIHRoaXMgY29uZGl0aW9uYWwgZW5zdXJlcyBvbmx5IHRoZSBsYXN0IHJlY3Vyc2l2ZSBtLm1vdW50IGNhbGwgaXNcclxuXHRcdFx0Ly8gYXBwbGllZFxyXG5cdFx0XHRpZiAoY3VycmVudENvbXBvbmVudCA9PT0gdG9wQ29tcG9uZW50KSB7XHJcblx0XHRcdFx0Y29udHJvbGxlcnNbaW5kZXhdID0gY29udHJvbGxlclxyXG5cdFx0XHRcdGNvbXBvbmVudHNbaW5kZXhdID0gY29tcG9uZW50XHJcblx0XHRcdH1cclxuXHRcdFx0ZW5kRmlyc3RDb21wdXRhdGlvbigpXHJcblx0XHRcdGlmIChjb21wb25lbnQgPT09IG51bGwpIHtcclxuXHRcdFx0XHRyZW1vdmVSb290RWxlbWVudChyb290LCBpbmRleClcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gY29udHJvbGxlcnNbaW5kZXhdXHJcblx0XHR9IGVsc2UgaWYgKGNvbXBvbmVudCA9PSBudWxsKSB7XHJcblx0XHRcdHJlbW92ZVJvb3RFbGVtZW50KHJvb3QsIGluZGV4KVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0bS5tb3VudCA9IG0ubW9kdWxlID0gZnVuY3Rpb24gKHJvb3QsIGNvbXBvbmVudCkge1xyXG5cdFx0aWYgKCFyb290KSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlBsZWFzZSBlbnN1cmUgdGhlIERPTSBlbGVtZW50IGV4aXN0cyBiZWZvcmUgXCIgK1xyXG5cdFx0XHRcdFwicmVuZGVyaW5nIGEgdGVtcGxhdGUgaW50byBpdC5cIilcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgaW5kZXggPSByb290cy5pbmRleE9mKHJvb3QpXHJcblx0XHRpZiAoaW5kZXggPCAwKSBpbmRleCA9IHJvb3RzLmxlbmd0aFxyXG5cclxuXHRcdHZhciBpc1ByZXZlbnRlZCA9IGZhbHNlXHJcblx0XHR2YXIgZXZlbnQgPSB7XHJcblx0XHRcdHByZXZlbnREZWZhdWx0OiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0aXNQcmV2ZW50ZWQgPSB0cnVlXHJcblx0XHRcdFx0Y29tcHV0ZVByZVJlZHJhd0hvb2sgPSBjb21wdXRlUG9zdFJlZHJhd0hvb2sgPSBudWxsXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRmb3JFYWNoKHVubG9hZGVycywgZnVuY3Rpb24gKHVubG9hZGVyKSB7XHJcblx0XHRcdHVubG9hZGVyLmhhbmRsZXIuY2FsbCh1bmxvYWRlci5jb250cm9sbGVyLCBldmVudClcclxuXHRcdFx0dW5sb2FkZXIuY29udHJvbGxlci5vbnVubG9hZCA9IG51bGxcclxuXHRcdH0pXHJcblxyXG5cdFx0aWYgKGlzUHJldmVudGVkKSB7XHJcblx0XHRcdGZvckVhY2godW5sb2FkZXJzLCBmdW5jdGlvbiAodW5sb2FkZXIpIHtcclxuXHRcdFx0XHR1bmxvYWRlci5jb250cm9sbGVyLm9udW5sb2FkID0gdW5sb2FkZXIuaGFuZGxlclxyXG5cdFx0XHR9KVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dW5sb2FkZXJzID0gW11cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoY29udHJvbGxlcnNbaW5kZXhdICYmIGlzRnVuY3Rpb24oY29udHJvbGxlcnNbaW5kZXhdLm9udW5sb2FkKSkge1xyXG5cdFx0XHRjb250cm9sbGVyc1tpbmRleF0ub251bmxvYWQoZXZlbnQpXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGNoZWNrUHJldmVudGVkKGNvbXBvbmVudCwgcm9vdCwgaW5kZXgsIGlzUHJldmVudGVkKVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcmVtb3ZlUm9vdEVsZW1lbnQocm9vdCwgaW5kZXgpIHtcclxuXHRcdHJvb3RzLnNwbGljZShpbmRleCwgMSlcclxuXHRcdGNvbnRyb2xsZXJzLnNwbGljZShpbmRleCwgMSlcclxuXHRcdGNvbXBvbmVudHMuc3BsaWNlKGluZGV4LCAxKVxyXG5cdFx0cmVzZXQocm9vdClcclxuXHRcdG5vZGVDYWNoZS5zcGxpY2UoZ2V0Q2VsbENhY2hlS2V5KHJvb3QpLCAxKVxyXG5cdH1cclxuXHJcblx0dmFyIHJlZHJhd2luZyA9IGZhbHNlXHJcblx0bS5yZWRyYXcgPSBmdW5jdGlvbiAoZm9yY2UpIHtcclxuXHRcdGlmIChyZWRyYXdpbmcpIHJldHVyblxyXG5cdFx0cmVkcmF3aW5nID0gdHJ1ZVxyXG5cdFx0aWYgKGZvcmNlKSBmb3JjaW5nID0gdHJ1ZVxyXG5cclxuXHRcdHRyeSB7XHJcblx0XHRcdC8vIGxhc3RSZWRyYXdJZCBpcyBhIHBvc2l0aXZlIG51bWJlciBpZiBhIHNlY29uZCByZWRyYXcgaXMgcmVxdWVzdGVkXHJcblx0XHRcdC8vIGJlZm9yZSB0aGUgbmV4dCBhbmltYXRpb24gZnJhbWVcclxuXHRcdFx0Ly8gbGFzdFJlZHJhd0lkIGlzIG51bGwgaWYgaXQncyB0aGUgZmlyc3QgcmVkcmF3IGFuZCBub3QgYW4gZXZlbnRcclxuXHRcdFx0Ly8gaGFuZGxlclxyXG5cdFx0XHRpZiAobGFzdFJlZHJhd0lkICYmICFmb3JjZSkge1xyXG5cdFx0XHRcdC8vIHdoZW4gc2V0VGltZW91dDogb25seSByZXNjaGVkdWxlIHJlZHJhdyBpZiB0aW1lIGJldHdlZW4gbm93XHJcblx0XHRcdFx0Ly8gYW5kIHByZXZpb3VzIHJlZHJhdyBpcyBiaWdnZXIgdGhhbiBhIGZyYW1lLCBvdGhlcndpc2Uga2VlcFxyXG5cdFx0XHRcdC8vIGN1cnJlbnRseSBzY2hlZHVsZWQgdGltZW91dFxyXG5cdFx0XHRcdC8vIHdoZW4gckFGOiBhbHdheXMgcmVzY2hlZHVsZSByZWRyYXdcclxuXHRcdFx0XHRpZiAoJHJlcXVlc3RBbmltYXRpb25GcmFtZSA9PT0gZ2xvYmFsLnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdFx0XHRcdFx0XHRuZXcgRGF0ZSgpIC0gbGFzdFJlZHJhd0NhbGxUaW1lID4gRlJBTUVfQlVER0VUKSB7XHJcblx0XHRcdFx0XHRpZiAobGFzdFJlZHJhd0lkID4gMCkgJGNhbmNlbEFuaW1hdGlvbkZyYW1lKGxhc3RSZWRyYXdJZClcclxuXHRcdFx0XHRcdGxhc3RSZWRyYXdJZCA9ICRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVkcmF3LCBGUkFNRV9CVURHRVQpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJlZHJhdygpXHJcblx0XHRcdFx0bGFzdFJlZHJhd0lkID0gJHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRsYXN0UmVkcmF3SWQgPSBudWxsXHJcblx0XHRcdFx0fSwgRlJBTUVfQlVER0VUKVxyXG5cdFx0XHR9XHJcblx0XHR9IGZpbmFsbHkge1xyXG5cdFx0XHRyZWRyYXdpbmcgPSBmb3JjaW5nID0gZmFsc2VcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdG0ucmVkcmF3LnN0cmF0ZWd5ID0gbS5wcm9wKClcclxuXHRmdW5jdGlvbiByZWRyYXcoKSB7XHJcblx0XHRpZiAoY29tcHV0ZVByZVJlZHJhd0hvb2spIHtcclxuXHRcdFx0Y29tcHV0ZVByZVJlZHJhd0hvb2soKVxyXG5cdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vayA9IG51bGxcclxuXHRcdH1cclxuXHRcdGZvckVhY2gocm9vdHMsIGZ1bmN0aW9uIChyb290LCBpKSB7XHJcblx0XHRcdHZhciBjb21wb25lbnQgPSBjb21wb25lbnRzW2ldXHJcblx0XHRcdGlmIChjb250cm9sbGVyc1tpXSkge1xyXG5cdFx0XHRcdHZhciBhcmdzID0gW2NvbnRyb2xsZXJzW2ldXVxyXG5cdFx0XHRcdG0ucmVuZGVyKHJvb3QsXHJcblx0XHRcdFx0XHRjb21wb25lbnQudmlldyA/IGNvbXBvbmVudC52aWV3KGNvbnRyb2xsZXJzW2ldLCBhcmdzKSA6IFwiXCIpXHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblx0XHQvLyBhZnRlciByZW5kZXJpbmcgd2l0aGluIGEgcm91dGVkIGNvbnRleHQsIHdlIG5lZWQgdG8gc2Nyb2xsIGJhY2sgdG9cclxuXHRcdC8vIHRoZSB0b3AsIGFuZCBmZXRjaCB0aGUgZG9jdW1lbnQgdGl0bGUgZm9yIGhpc3RvcnkucHVzaFN0YXRlXHJcblx0XHRpZiAoY29tcHV0ZVBvc3RSZWRyYXdIb29rKSB7XHJcblx0XHRcdGNvbXB1dGVQb3N0UmVkcmF3SG9vaygpXHJcblx0XHRcdGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IG51bGxcclxuXHRcdH1cclxuXHRcdGxhc3RSZWRyYXdJZCA9IG51bGxcclxuXHRcdGxhc3RSZWRyYXdDYWxsVGltZSA9IG5ldyBEYXRlKClcclxuXHRcdG0ucmVkcmF3LnN0cmF0ZWd5KFwiZGlmZlwiKVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZW5kRmlyc3RDb21wdXRhdGlvbigpIHtcclxuXHRcdGlmIChtLnJlZHJhdy5zdHJhdGVneSgpID09PSBcIm5vbmVcIikge1xyXG5cdFx0XHRwZW5kaW5nUmVxdWVzdHMtLVxyXG5cdFx0XHRtLnJlZHJhdy5zdHJhdGVneShcImRpZmZcIilcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdG0uZW5kQ29tcHV0YXRpb24oKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0bS53aXRoQXR0ciA9IGZ1bmN0aW9uIChwcm9wLCB3aXRoQXR0ckNhbGxiYWNrLCBjYWxsYmFja1RoaXMpIHtcclxuXHRcdHJldHVybiBmdW5jdGlvbiAoZSkge1xyXG5cdFx0XHRlID0gZSB8fCB3aW5kb3cuZXZlbnRcclxuXHRcdFx0LyogZXNsaW50LWRpc2FibGUgbm8taW52YWxpZC10aGlzICovXHJcblx0XHRcdHZhciBjdXJyZW50VGFyZ2V0ID0gZS5jdXJyZW50VGFyZ2V0IHx8IHRoaXNcclxuXHRcdFx0dmFyIF90aGlzID0gY2FsbGJhY2tUaGlzIHx8IHRoaXNcclxuXHRcdFx0LyogZXNsaW50LWVuYWJsZSBuby1pbnZhbGlkLXRoaXMgKi9cclxuXHRcdFx0dmFyIHRhcmdldCA9IHByb3AgaW4gY3VycmVudFRhcmdldCA/XHJcblx0XHRcdFx0Y3VycmVudFRhcmdldFtwcm9wXSA6XHJcblx0XHRcdFx0Y3VycmVudFRhcmdldC5nZXRBdHRyaWJ1dGUocHJvcClcclxuXHRcdFx0d2l0aEF0dHJDYWxsYmFjay5jYWxsKF90aGlzLCB0YXJnZXQpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyByb3V0aW5nXHJcblx0dmFyIG1vZGVzID0ge3BhdGhuYW1lOiBcIlwiLCBoYXNoOiBcIiNcIiwgc2VhcmNoOiBcIj9cIn1cclxuXHR2YXIgcmVkaXJlY3QgPSBub29wXHJcblx0dmFyIGlzRGVmYXVsdFJvdXRlID0gZmFsc2VcclxuXHR2YXIgcm91dGVQYXJhbXMsIGN1cnJlbnRSb3V0ZVxyXG5cclxuXHRtLnJvdXRlID0gZnVuY3Rpb24gKHJvb3QsIGFyZzEsIGFyZzIsIHZkb20pIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxyXG5cdFx0Ly8gbS5yb3V0ZSgpXHJcblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGN1cnJlbnRSb3V0ZVxyXG5cdFx0Ly8gbS5yb3V0ZShlbCwgZGVmYXVsdFJvdXRlLCByb3V0ZXMpXHJcblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMyAmJiBpc1N0cmluZyhhcmcxKSkge1xyXG5cdFx0XHRyZWRpcmVjdCA9IGZ1bmN0aW9uIChzb3VyY2UpIHtcclxuXHRcdFx0XHR2YXIgcGF0aCA9IGN1cnJlbnRSb3V0ZSA9IG5vcm1hbGl6ZVJvdXRlKHNvdXJjZSlcclxuXHRcdFx0XHRpZiAoIXJvdXRlQnlWYWx1ZShyb290LCBhcmcyLCBwYXRoKSkge1xyXG5cdFx0XHRcdFx0aWYgKGlzRGVmYXVsdFJvdXRlKSB7XHJcblx0XHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIkVuc3VyZSB0aGUgZGVmYXVsdCByb3V0ZSBtYXRjaGVzIFwiICtcclxuXHRcdFx0XHRcdFx0XHRcIm9uZSBvZiB0aGUgcm91dGVzIGRlZmluZWQgaW4gbS5yb3V0ZVwiKVxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGlzRGVmYXVsdFJvdXRlID0gdHJ1ZVxyXG5cdFx0XHRcdFx0bS5yb3V0ZShhcmcxLCB0cnVlKVxyXG5cdFx0XHRcdFx0aXNEZWZhdWx0Um91dGUgPSBmYWxzZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIGxpc3RlbmVyID0gbS5yb3V0ZS5tb2RlID09PSBcImhhc2hcIiA/XHJcblx0XHRcdFx0XCJvbmhhc2hjaGFuZ2VcIiA6XHJcblx0XHRcdFx0XCJvbnBvcHN0YXRlXCJcclxuXHJcblx0XHRcdGdsb2JhbFtsaXN0ZW5lcl0gPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0dmFyIHBhdGggPSAkbG9jYXRpb25bbS5yb3V0ZS5tb2RlXVxyXG5cdFx0XHRcdGlmIChtLnJvdXRlLm1vZGUgPT09IFwicGF0aG5hbWVcIikgcGF0aCArPSAkbG9jYXRpb24uc2VhcmNoXHJcblx0XHRcdFx0aWYgKGN1cnJlbnRSb3V0ZSAhPT0gbm9ybWFsaXplUm91dGUocGF0aCkpIHJlZGlyZWN0KHBhdGgpXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rID0gc2V0U2Nyb2xsXHJcblx0XHRcdGdsb2JhbFtsaXN0ZW5lcl0oKVxyXG5cclxuXHRcdFx0cmV0dXJuXHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gY29uZmlnOiBtLnJvdXRlXHJcblx0XHRpZiAocm9vdC5hZGRFdmVudExpc3RlbmVyIHx8IHJvb3QuYXR0YWNoRXZlbnQpIHtcclxuXHRcdFx0dmFyIGJhc2UgPSBtLnJvdXRlLm1vZGUgIT09IFwicGF0aG5hbWVcIiA/ICRsb2NhdGlvbi5wYXRobmFtZSA6IFwiXCJcclxuXHRcdFx0cm9vdC5ocmVmID0gYmFzZSArIG1vZGVzW20ucm91dGUubW9kZV0gKyB2ZG9tLmF0dHJzLmhyZWZcclxuXHRcdFx0aWYgKHJvb3QuYWRkRXZlbnRMaXN0ZW5lcikge1xyXG5cdFx0XHRcdHJvb3QucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHJvdXRlVW5vYnRydXNpdmUpXHJcblx0XHRcdFx0cm9vdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgcm91dGVVbm9idHJ1c2l2ZSlcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyb290LmRldGFjaEV2ZW50KFwib25jbGlja1wiLCByb3V0ZVVub2J0cnVzaXZlKVxyXG5cdFx0XHRcdHJvb3QuYXR0YWNoRXZlbnQoXCJvbmNsaWNrXCIsIHJvdXRlVW5vYnRydXNpdmUpXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVyblxyXG5cdFx0fVxyXG5cdFx0Ly8gbS5yb3V0ZShyb3V0ZSwgcGFyYW1zLCBzaG91bGRSZXBsYWNlSGlzdG9yeUVudHJ5KVxyXG5cdFx0aWYgKGlzU3RyaW5nKHJvb3QpKSB7XHJcblx0XHRcdHZhciBvbGRSb3V0ZSA9IGN1cnJlbnRSb3V0ZVxyXG5cdFx0XHRjdXJyZW50Um91dGUgPSByb290XHJcblxyXG5cdFx0XHR2YXIgYXJncyA9IGFyZzEgfHwge31cclxuXHRcdFx0dmFyIHF1ZXJ5SW5kZXggPSBjdXJyZW50Um91dGUuaW5kZXhPZihcIj9cIilcclxuXHRcdFx0dmFyIHBhcmFtc1xyXG5cclxuXHRcdFx0aWYgKHF1ZXJ5SW5kZXggPiAtMSkge1xyXG5cdFx0XHRcdHBhcmFtcyA9IHBhcnNlUXVlcnlTdHJpbmcoY3VycmVudFJvdXRlLnNsaWNlKHF1ZXJ5SW5kZXggKyAxKSlcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRwYXJhbXMgPSB7fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmb3IgKHZhciBpIGluIGFyZ3MpIHtcclxuXHRcdFx0XHRpZiAoaGFzT3duLmNhbGwoYXJncywgaSkpIHtcclxuXHRcdFx0XHRcdHBhcmFtc1tpXSA9IGFyZ3NbaV1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhciBxdWVyeXN0cmluZyA9IGJ1aWxkUXVlcnlTdHJpbmcocGFyYW1zKVxyXG5cdFx0XHR2YXIgY3VycmVudFBhdGhcclxuXHJcblx0XHRcdGlmIChxdWVyeUluZGV4ID4gLTEpIHtcclxuXHRcdFx0XHRjdXJyZW50UGF0aCA9IGN1cnJlbnRSb3V0ZS5zbGljZSgwLCBxdWVyeUluZGV4KVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGN1cnJlbnRQYXRoID0gY3VycmVudFJvdXRlXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChxdWVyeXN0cmluZykge1xyXG5cdFx0XHRcdGN1cnJlbnRSb3V0ZSA9IGN1cnJlbnRQYXRoICtcclxuXHRcdFx0XHRcdChjdXJyZW50UGF0aC5pbmRleE9mKFwiP1wiKSA9PT0gLTEgPyBcIj9cIiA6IFwiJlwiKSArXHJcblx0XHRcdFx0XHRxdWVyeXN0cmluZ1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgcmVwbGFjZUhpc3RvcnkgPVxyXG5cdFx0XHRcdChhcmd1bWVudHMubGVuZ3RoID09PSAzID8gYXJnMiA6IGFyZzEpID09PSB0cnVlIHx8XHJcblx0XHRcdFx0b2xkUm91dGUgPT09IHJvb3RcclxuXHJcblx0XHRcdGlmIChnbG9iYWwuaGlzdG9yeS5wdXNoU3RhdGUpIHtcclxuXHRcdFx0XHR2YXIgbWV0aG9kID0gcmVwbGFjZUhpc3RvcnkgPyBcInJlcGxhY2VTdGF0ZVwiIDogXCJwdXNoU3RhdGVcIlxyXG5cdFx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rID0gc2V0U2Nyb2xsXHJcblx0XHRcdFx0Y29tcHV0ZVBvc3RSZWRyYXdIb29rID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdFx0Z2xvYmFsLmhpc3RvcnlbbWV0aG9kXShudWxsLCAkZG9jdW1lbnQudGl0bGUsXHJcblx0XHRcdFx0XHRcdFx0bW9kZXNbbS5yb3V0ZS5tb2RlXSArIGN1cnJlbnRSb3V0ZSlcclxuXHRcdFx0XHRcdH0gY2F0Y2ggKGVycikge1xyXG5cdFx0XHRcdFx0XHQvLyBJbiB0aGUgZXZlbnQgb2YgYSBwdXNoU3RhdGUgb3IgcmVwbGFjZVN0YXRlIGZhaWx1cmUsXHJcblx0XHRcdFx0XHRcdC8vIGZhbGxiYWNrIHRvIGEgc3RhbmRhcmQgcmVkaXJlY3QuIFRoaXMgaXMgc3BlY2lmaWNhbGx5XHJcblx0XHRcdFx0XHRcdC8vIHRvIGFkZHJlc3MgYSBTYWZhcmkgc2VjdXJpdHkgZXJyb3Igd2hlbiBhdHRlbXB0aW5nIHRvXHJcblx0XHRcdFx0XHRcdC8vIGNhbGwgcHVzaFN0YXRlIG1vcmUgdGhhbiAxMDAgdGltZXMuXHJcblx0XHRcdFx0XHRcdCRsb2NhdGlvblttLnJvdXRlLm1vZGVdID0gY3VycmVudFJvdXRlXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJlZGlyZWN0KG1vZGVzW20ucm91dGUubW9kZV0gKyBjdXJyZW50Um91dGUpXHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0JGxvY2F0aW9uW20ucm91dGUubW9kZV0gPSBjdXJyZW50Um91dGVcclxuXHRcdFx0XHRyZWRpcmVjdChtb2Rlc1ttLnJvdXRlLm1vZGVdICsgY3VycmVudFJvdXRlKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRtLnJvdXRlLnBhcmFtID0gZnVuY3Rpb24gKGtleSkge1xyXG5cdFx0aWYgKCFyb3V0ZVBhcmFtcykge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJZb3UgbXVzdCBjYWxsIG0ucm91dGUoZWxlbWVudCwgZGVmYXVsdFJvdXRlLCBcIiArXHJcblx0XHRcdFx0XCJyb3V0ZXMpIGJlZm9yZSBjYWxsaW5nIG0ucm91dGUucGFyYW0oKVwiKVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICgha2V5KSB7XHJcblx0XHRcdHJldHVybiByb3V0ZVBhcmFtc1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiByb3V0ZVBhcmFtc1trZXldXHJcblx0fVxyXG5cclxuXHRtLnJvdXRlLm1vZGUgPSBcInNlYXJjaFwiXHJcblxyXG5cdGZ1bmN0aW9uIG5vcm1hbGl6ZVJvdXRlKHJvdXRlKSB7XHJcblx0XHRyZXR1cm4gcm91dGUuc2xpY2UobW9kZXNbbS5yb3V0ZS5tb2RlXS5sZW5ndGgpXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByb3V0ZUJ5VmFsdWUocm9vdCwgcm91dGVyLCBwYXRoKSB7XHJcblx0XHRyb3V0ZVBhcmFtcyA9IHt9XHJcblxyXG5cdFx0dmFyIHF1ZXJ5U3RhcnQgPSBwYXRoLmluZGV4T2YoXCI/XCIpXHJcblx0XHRpZiAocXVlcnlTdGFydCAhPT0gLTEpIHtcclxuXHRcdFx0cm91dGVQYXJhbXMgPSBwYXJzZVF1ZXJ5U3RyaW5nKFxyXG5cdFx0XHRcdHBhdGguc3Vic3RyKHF1ZXJ5U3RhcnQgKyAxLCBwYXRoLmxlbmd0aCkpXHJcblx0XHRcdHBhdGggPSBwYXRoLnN1YnN0cigwLCBxdWVyeVN0YXJ0KVxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIEdldCBhbGwgcm91dGVzIGFuZCBjaGVjayBpZiB0aGVyZSdzXHJcblx0XHQvLyBhbiBleGFjdCBtYXRjaCBmb3IgdGhlIGN1cnJlbnQgcGF0aFxyXG5cdFx0dmFyIGtleXMgPSBPYmplY3Qua2V5cyhyb3V0ZXIpXHJcblx0XHR2YXIgaW5kZXggPSBrZXlzLmluZGV4T2YocGF0aClcclxuXHJcblx0XHRpZiAoaW5kZXggIT09IC0xKXtcclxuXHRcdFx0bS5tb3VudChyb290LCByb3V0ZXJba2V5cyBbaW5kZXhdXSlcclxuXHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdH1cclxuXHJcblx0XHRmb3IgKHZhciByb3V0ZSBpbiByb3V0ZXIpIHtcclxuXHRcdFx0aWYgKGhhc093bi5jYWxsKHJvdXRlciwgcm91dGUpKSB7XHJcblx0XHRcdFx0aWYgKHJvdXRlID09PSBwYXRoKSB7XHJcblx0XHRcdFx0XHRtLm1vdW50KHJvb3QsIHJvdXRlcltyb3V0ZV0pXHJcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0dmFyIG1hdGNoZXIgPSBuZXcgUmVnRXhwKFwiXlwiICsgcm91dGVcclxuXHRcdFx0XHRcdC5yZXBsYWNlKC86W15cXC9dKz9cXC57M30vZywgXCIoLio/KVwiKVxyXG5cdFx0XHRcdFx0LnJlcGxhY2UoLzpbXlxcL10rL2csIFwiKFteXFxcXC9dKylcIikgKyBcIlxcLz8kXCIpXHJcblxyXG5cdFx0XHRcdGlmIChtYXRjaGVyLnRlc3QocGF0aCkpIHtcclxuXHRcdFx0XHRcdC8qIGVzbGludC1kaXNhYmxlIG5vLWxvb3AtZnVuYyAqL1xyXG5cdFx0XHRcdFx0cGF0aC5yZXBsYWNlKG1hdGNoZXIsIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGtleXMgPSByb3V0ZS5tYXRjaCgvOlteXFwvXSsvZykgfHwgW11cclxuXHRcdFx0XHRcdFx0dmFyIHZhbHVlcyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxLCAtMilcclxuXHRcdFx0XHRcdFx0Zm9yRWFjaChrZXlzLCBmdW5jdGlvbiAoa2V5LCBpKSB7XHJcblx0XHRcdFx0XHRcdFx0cm91dGVQYXJhbXNba2V5LnJlcGxhY2UoLzp8XFwuL2csIFwiXCIpXSA9XHJcblx0XHRcdFx0XHRcdFx0XHRkZWNvZGVVUklDb21wb25lbnQodmFsdWVzW2ldKVxyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0XHRtLm1vdW50KHJvb3QsIHJvdXRlcltyb3V0ZV0pXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0LyogZXNsaW50LWVuYWJsZSBuby1sb29wLWZ1bmMgKi9cclxuXHRcdFx0XHRcdHJldHVybiB0cnVlXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByb3V0ZVVub2J0cnVzaXZlKGUpIHtcclxuXHRcdGUgPSBlIHx8IGV2ZW50XHJcblx0XHRpZiAoZS5jdHJsS2V5IHx8IGUubWV0YUtleSB8fCBlLnNoaWZ0S2V5IHx8IGUud2hpY2ggPT09IDIpIHJldHVyblxyXG5cclxuXHRcdGlmIChlLnByZXZlbnREZWZhdWx0KSB7XHJcblx0XHRcdGUucHJldmVudERlZmF1bHQoKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0ZS5yZXR1cm5WYWx1ZSA9IGZhbHNlXHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGN1cnJlbnRUYXJnZXQgPSBlLmN1cnJlbnRUYXJnZXQgfHwgZS5zcmNFbGVtZW50XHJcblx0XHR2YXIgYXJnc1xyXG5cclxuXHRcdGlmIChtLnJvdXRlLm1vZGUgPT09IFwicGF0aG5hbWVcIiAmJiBjdXJyZW50VGFyZ2V0LnNlYXJjaCkge1xyXG5cdFx0XHRhcmdzID0gcGFyc2VRdWVyeVN0cmluZyhjdXJyZW50VGFyZ2V0LnNlYXJjaC5zbGljZSgxKSlcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGFyZ3MgPSB7fVxyXG5cdFx0fVxyXG5cclxuXHRcdHdoaWxlIChjdXJyZW50VGFyZ2V0ICYmICEvYS9pLnRlc3QoY3VycmVudFRhcmdldC5ub2RlTmFtZSkpIHtcclxuXHRcdFx0Y3VycmVudFRhcmdldCA9IGN1cnJlbnRUYXJnZXQucGFyZW50Tm9kZVxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIGNsZWFyIHBlbmRpbmdSZXF1ZXN0cyBiZWNhdXNlIHdlIHdhbnQgYW4gaW1tZWRpYXRlIHJvdXRlIGNoYW5nZVxyXG5cdFx0cGVuZGluZ1JlcXVlc3RzID0gMFxyXG5cdFx0bS5yb3V0ZShjdXJyZW50VGFyZ2V0W20ucm91dGUubW9kZV1cclxuXHRcdFx0LnNsaWNlKG1vZGVzW20ucm91dGUubW9kZV0ubGVuZ3RoKSwgYXJncylcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNldFNjcm9sbCgpIHtcclxuXHRcdGlmIChtLnJvdXRlLm1vZGUgIT09IFwiaGFzaFwiICYmICRsb2NhdGlvbi5oYXNoKSB7XHJcblx0XHRcdCRsb2NhdGlvbi5oYXNoID0gJGxvY2F0aW9uLmhhc2hcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGdsb2JhbC5zY3JvbGxUbygwLCAwKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYnVpbGRRdWVyeVN0cmluZyhvYmplY3QsIHByZWZpeCkge1xyXG5cdFx0dmFyIGR1cGxpY2F0ZXMgPSB7fVxyXG5cdFx0dmFyIHN0ciA9IFtdXHJcblxyXG5cdFx0Zm9yICh2YXIgcHJvcCBpbiBvYmplY3QpIHtcclxuXHRcdFx0aWYgKGhhc093bi5jYWxsKG9iamVjdCwgcHJvcCkpIHtcclxuXHRcdFx0XHR2YXIga2V5ID0gcHJlZml4ID8gcHJlZml4ICsgXCJbXCIgKyBwcm9wICsgXCJdXCIgOiBwcm9wXHJcblx0XHRcdFx0dmFyIHZhbHVlID0gb2JqZWN0W3Byb3BdXHJcblxyXG5cdFx0XHRcdGlmICh2YWx1ZSA9PT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0c3RyLnB1c2goZW5jb2RlVVJJQ29tcG9uZW50KGtleSkpXHJcblx0XHRcdFx0fSBlbHNlIGlmIChpc09iamVjdCh2YWx1ZSkpIHtcclxuXHRcdFx0XHRcdHN0ci5wdXNoKGJ1aWxkUXVlcnlTdHJpbmcodmFsdWUsIGtleSkpXHJcblx0XHRcdFx0fSBlbHNlIGlmIChpc0FycmF5KHZhbHVlKSkge1xyXG5cdFx0XHRcdFx0dmFyIGtleXMgPSBbXVxyXG5cdFx0XHRcdFx0ZHVwbGljYXRlc1trZXldID0gZHVwbGljYXRlc1trZXldIHx8IHt9XHJcblx0XHRcdFx0XHQvKiBlc2xpbnQtZGlzYWJsZSBuby1sb29wLWZ1bmMgKi9cclxuXHRcdFx0XHRcdGZvckVhY2godmFsdWUsIGZ1bmN0aW9uIChpdGVtKSB7XHJcblx0XHRcdFx0XHRcdC8qIGVzbGludC1lbmFibGUgbm8tbG9vcC1mdW5jICovXHJcblx0XHRcdFx0XHRcdGlmICghZHVwbGljYXRlc1trZXldW2l0ZW1dKSB7XHJcblx0XHRcdFx0XHRcdFx0ZHVwbGljYXRlc1trZXldW2l0ZW1dID0gdHJ1ZVxyXG5cdFx0XHRcdFx0XHRcdGtleXMucHVzaChlbmNvZGVVUklDb21wb25lbnQoa2V5KSArIFwiPVwiICtcclxuXHRcdFx0XHRcdFx0XHRcdGVuY29kZVVSSUNvbXBvbmVudChpdGVtKSlcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdHN0ci5wdXNoKGtleXMuam9pbihcIiZcIikpXHJcblx0XHRcdFx0fSBlbHNlIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRzdHIucHVzaChlbmNvZGVVUklDb21wb25lbnQoa2V5KSArIFwiPVwiICtcclxuXHRcdFx0XHRcdFx0ZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gc3RyLmpvaW4oXCImXCIpXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBwYXJzZVF1ZXJ5U3RyaW5nKHN0cikge1xyXG5cdFx0aWYgKHN0ciA9PT0gXCJcIiB8fCBzdHIgPT0gbnVsbCkgcmV0dXJuIHt9XHJcblx0XHRpZiAoc3RyLmNoYXJBdCgwKSA9PT0gXCI/XCIpIHN0ciA9IHN0ci5zbGljZSgxKVxyXG5cclxuXHRcdHZhciBwYWlycyA9IHN0ci5zcGxpdChcIiZcIilcclxuXHRcdHZhciBwYXJhbXMgPSB7fVxyXG5cclxuXHRcdGZvckVhY2gocGFpcnMsIGZ1bmN0aW9uIChzdHJpbmcpIHtcclxuXHRcdFx0dmFyIHBhaXIgPSBzdHJpbmcuc3BsaXQoXCI9XCIpXHJcblx0XHRcdHZhciBrZXkgPSBkZWNvZGVVUklDb21wb25lbnQocGFpclswXSlcclxuXHRcdFx0dmFyIHZhbHVlID0gcGFpci5sZW5ndGggPT09IDIgPyBkZWNvZGVVUklDb21wb25lbnQocGFpclsxXSkgOiBudWxsXHJcblx0XHRcdGlmIChwYXJhbXNba2V5XSAhPSBudWxsKSB7XHJcblx0XHRcdFx0aWYgKCFpc0FycmF5KHBhcmFtc1trZXldKSkgcGFyYW1zW2tleV0gPSBbcGFyYW1zW2tleV1dXHJcblx0XHRcdFx0cGFyYW1zW2tleV0ucHVzaCh2YWx1ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHBhcmFtc1trZXldID0gdmFsdWVcclxuXHRcdH0pXHJcblxyXG5cdFx0cmV0dXJuIHBhcmFtc1xyXG5cdH1cclxuXHJcblx0bS5yb3V0ZS5idWlsZFF1ZXJ5U3RyaW5nID0gYnVpbGRRdWVyeVN0cmluZ1xyXG5cdG0ucm91dGUucGFyc2VRdWVyeVN0cmluZyA9IHBhcnNlUXVlcnlTdHJpbmdcclxuXHJcblx0ZnVuY3Rpb24gcmVzZXQocm9vdCkge1xyXG5cdFx0dmFyIGNhY2hlS2V5ID0gZ2V0Q2VsbENhY2hlS2V5KHJvb3QpXHJcblx0XHRjbGVhcihyb290LmNoaWxkTm9kZXMsIGNlbGxDYWNoZVtjYWNoZUtleV0pXHJcblx0XHRjZWxsQ2FjaGVbY2FjaGVLZXldID0gdW5kZWZpbmVkXHJcblx0fVxyXG5cclxuXHRtLmRlZmVycmVkID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIGRlZmVycmVkID0gbmV3IERlZmVycmVkKClcclxuXHRcdGRlZmVycmVkLnByb21pc2UgPSBwcm9waWZ5KGRlZmVycmVkLnByb21pc2UpXHJcblx0XHRyZXR1cm4gZGVmZXJyZWRcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHByb3BpZnkocHJvbWlzZSwgaW5pdGlhbFZhbHVlKSB7XHJcblx0XHR2YXIgcHJvcCA9IG0ucHJvcChpbml0aWFsVmFsdWUpXHJcblx0XHRwcm9taXNlLnRoZW4ocHJvcClcclxuXHRcdHByb3AudGhlbiA9IGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuXHRcdFx0cmV0dXJuIHByb3BpZnkocHJvbWlzZS50aGVuKHJlc29sdmUsIHJlamVjdCksIGluaXRpYWxWYWx1ZSlcclxuXHRcdH1cclxuXHJcblx0XHRwcm9wLmNhdGNoID0gcHJvcC50aGVuLmJpbmQobnVsbCwgbnVsbClcclxuXHRcdHJldHVybiBwcm9wXHJcblx0fVxyXG5cdC8vIFByb21pei5taXRocmlsLmpzIHwgWm9sbWVpc3RlciB8IE1JVFxyXG5cdC8vIGEgbW9kaWZpZWQgdmVyc2lvbiBvZiBQcm9taXouanMsIHdoaWNoIGRvZXMgbm90IGNvbmZvcm0gdG8gUHJvbWlzZXMvQStcclxuXHQvLyBmb3IgdHdvIHJlYXNvbnM6XHJcblx0Ly9cclxuXHQvLyAxKSBgdGhlbmAgY2FsbGJhY2tzIGFyZSBjYWxsZWQgc3luY2hyb25vdXNseSAoYmVjYXVzZSBzZXRUaW1lb3V0IGlzIHRvb1xyXG5cdC8vICAgIHNsb3csIGFuZCB0aGUgc2V0SW1tZWRpYXRlIHBvbHlmaWxsIGlzIHRvbyBiaWdcclxuXHQvL1xyXG5cdC8vIDIpIHRocm93aW5nIHN1YmNsYXNzZXMgb2YgRXJyb3IgY2F1c2UgdGhlIGVycm9yIHRvIGJlIGJ1YmJsZWQgdXAgaW5zdGVhZFxyXG5cdC8vICAgIG9mIHRyaWdnZXJpbmcgcmVqZWN0aW9uIChiZWNhdXNlIHRoZSBzcGVjIGRvZXMgbm90IGFjY291bnQgZm9yIHRoZVxyXG5cdC8vICAgIGltcG9ydGFudCB1c2UgY2FzZSBvZiBkZWZhdWx0IGJyb3dzZXIgZXJyb3IgaGFuZGxpbmcsIGkuZS4gbWVzc2FnZSB3L1xyXG5cdC8vICAgIGxpbmUgbnVtYmVyKVxyXG5cclxuXHR2YXIgUkVTT0xWSU5HID0gMVxyXG5cdHZhciBSRUpFQ1RJTkcgPSAyXHJcblx0dmFyIFJFU09MVkVEID0gM1xyXG5cdHZhciBSRUpFQ1RFRCA9IDRcclxuXHJcblx0ZnVuY3Rpb24gRGVmZXJyZWQob25TdWNjZXNzLCBvbkZhaWx1cmUpIHtcclxuXHRcdHZhciBzZWxmID0gdGhpc1xyXG5cdFx0dmFyIHN0YXRlID0gMFxyXG5cdFx0dmFyIHByb21pc2VWYWx1ZSA9IDBcclxuXHRcdHZhciBuZXh0ID0gW11cclxuXHJcblx0XHRzZWxmLnByb21pc2UgPSB7fVxyXG5cclxuXHRcdHNlbGYucmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG5cdFx0XHRpZiAoIXN0YXRlKSB7XHJcblx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWVcclxuXHRcdFx0XHRzdGF0ZSA9IFJFU09MVklOR1xyXG5cclxuXHRcdFx0XHRmaXJlKClcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIHNlbGZcclxuXHRcdH1cclxuXHJcblx0XHRzZWxmLnJlamVjdCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG5cdFx0XHRpZiAoIXN0YXRlKSB7XHJcblx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWVcclxuXHRcdFx0XHRzdGF0ZSA9IFJFSkVDVElOR1xyXG5cclxuXHRcdFx0XHRmaXJlKClcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIHNlbGZcclxuXHRcdH1cclxuXHJcblx0XHRzZWxmLnByb21pc2UudGhlbiA9IGZ1bmN0aW9uIChvblN1Y2Nlc3MsIG9uRmFpbHVyZSkge1xyXG5cdFx0XHR2YXIgZGVmZXJyZWQgPSBuZXcgRGVmZXJyZWQob25TdWNjZXNzLCBvbkZhaWx1cmUpXHJcblxyXG5cdFx0XHRpZiAoc3RhdGUgPT09IFJFU09MVkVEKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlVmFsdWUpXHJcblx0XHRcdH0gZWxzZSBpZiAoc3RhdGUgPT09IFJFSkVDVEVEKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KHByb21pc2VWYWx1ZSlcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRuZXh0LnB1c2goZGVmZXJyZWQpXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlXHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gZmluaXNoKHR5cGUpIHtcclxuXHRcdFx0c3RhdGUgPSB0eXBlIHx8IFJFSkVDVEVEXHJcblx0XHRcdG5leHQubWFwKGZ1bmN0aW9uIChkZWZlcnJlZCkge1xyXG5cdFx0XHRcdGlmIChzdGF0ZSA9PT0gUkVTT0xWRUQpIHtcclxuXHRcdFx0XHRcdGRlZmVycmVkLnJlc29sdmUocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRkZWZlcnJlZC5yZWplY3QocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiB0aGVubmFibGUodGhlbiwgc3VjY2VzcywgZmFpbHVyZSwgbm90VGhlbm5hYmxlKSB7XHJcblx0XHRcdGlmICgoKHByb21pc2VWYWx1ZSAhPSBudWxsICYmIGlzT2JqZWN0KHByb21pc2VWYWx1ZSkpIHx8XHJcblx0XHRcdFx0XHRpc0Z1bmN0aW9uKHByb21pc2VWYWx1ZSkpICYmIGlzRnVuY3Rpb24odGhlbikpIHtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0Ly8gY291bnQgcHJvdGVjdHMgYWdhaW5zdCBhYnVzZSBjYWxscyBmcm9tIHNwZWMgY2hlY2tlclxyXG5cdFx0XHRcdFx0dmFyIGNvdW50ID0gMFxyXG5cdFx0XHRcdFx0dGhlbi5jYWxsKHByb21pc2VWYWx1ZSwgZnVuY3Rpb24gKHZhbHVlKSB7XHJcblx0XHRcdFx0XHRcdGlmIChjb3VudCsrKSByZXR1cm5cclxuXHRcdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWVcclxuXHRcdFx0XHRcdFx0c3VjY2VzcygpXHJcblx0XHRcdFx0XHR9LCBmdW5jdGlvbiAodmFsdWUpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGNvdW50KyspIHJldHVyblxyXG5cdFx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSB2YWx1ZVxyXG5cdFx0XHRcdFx0XHRmYWlsdXJlKClcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xyXG5cdFx0XHRcdFx0bS5kZWZlcnJlZC5vbmVycm9yKGUpXHJcblx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBlXHJcblx0XHRcdFx0XHRmYWlsdXJlKClcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0bm90VGhlbm5hYmxlKClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGZpcmUoKSB7XHJcblx0XHRcdC8vIGNoZWNrIGlmIGl0J3MgYSB0aGVuYWJsZVxyXG5cdFx0XHR2YXIgdGhlblxyXG5cdFx0XHR0cnkge1xyXG5cdFx0XHRcdHRoZW4gPSBwcm9taXNlVmFsdWUgJiYgcHJvbWlzZVZhbHVlLnRoZW5cclxuXHRcdFx0fSBjYXRjaCAoZSkge1xyXG5cdFx0XHRcdG0uZGVmZXJyZWQub25lcnJvcihlKVxyXG5cdFx0XHRcdHByb21pc2VWYWx1ZSA9IGVcclxuXHRcdFx0XHRzdGF0ZSA9IFJFSkVDVElOR1xyXG5cdFx0XHRcdHJldHVybiBmaXJlKClcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKHN0YXRlID09PSBSRUpFQ1RJTkcpIHtcclxuXHRcdFx0XHRtLmRlZmVycmVkLm9uZXJyb3IocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGVubmFibGUodGhlbiwgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdHN0YXRlID0gUkVTT0xWSU5HXHJcblx0XHRcdFx0ZmlyZSgpXHJcblx0XHRcdH0sIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFSkVDVElOR1xyXG5cdFx0XHRcdGZpcmUoKVxyXG5cdFx0XHR9LCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdGlmIChzdGF0ZSA9PT0gUkVTT0xWSU5HICYmIGlzRnVuY3Rpb24ob25TdWNjZXNzKSkge1xyXG5cdFx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBvblN1Y2Nlc3MocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHRcdFx0fSBlbHNlIGlmIChzdGF0ZSA9PT0gUkVKRUNUSU5HICYmIGlzRnVuY3Rpb24ob25GYWlsdXJlKSkge1xyXG5cdFx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBvbkZhaWx1cmUocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHRcdFx0XHRzdGF0ZSA9IFJFU09MVklOR1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRcdG0uZGVmZXJyZWQub25lcnJvcihlKVxyXG5cdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gZVxyXG5cdFx0XHRcdFx0cmV0dXJuIGZpbmlzaCgpXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpZiAocHJvbWlzZVZhbHVlID09PSBzZWxmKSB7XHJcblx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBUeXBlRXJyb3IoKVxyXG5cdFx0XHRcdFx0ZmluaXNoKClcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhlbm5hYmxlKHRoZW4sIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0ZmluaXNoKFJFU09MVkVEKVxyXG5cdFx0XHRcdFx0fSwgZmluaXNoLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdGZpbmlzaChzdGF0ZSA9PT0gUkVTT0xWSU5HICYmIFJFU09MVkVEKVxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRtLmRlZmVycmVkLm9uZXJyb3IgPSBmdW5jdGlvbiAoZSkge1xyXG5cdFx0aWYgKHR5cGUuY2FsbChlKSA9PT0gXCJbb2JqZWN0IEVycm9yXVwiICYmXHJcblx0XHRcdFx0IS8gRXJyb3IvLnRlc3QoZS5jb25zdHJ1Y3Rvci50b1N0cmluZygpKSkge1xyXG5cdFx0XHRwZW5kaW5nUmVxdWVzdHMgPSAwXHJcblx0XHRcdHRocm93IGVcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdG0uc3luYyA9IGZ1bmN0aW9uIChhcmdzKSB7XHJcblx0XHR2YXIgZGVmZXJyZWQgPSBtLmRlZmVycmVkKClcclxuXHRcdHZhciBvdXRzdGFuZGluZyA9IGFyZ3MubGVuZ3RoXHJcblx0XHR2YXIgcmVzdWx0cyA9IFtdXHJcblx0XHR2YXIgbWV0aG9kID0gXCJyZXNvbHZlXCJcclxuXHJcblx0XHRmdW5jdGlvbiBzeW5jaHJvbml6ZXIocG9zLCByZXNvbHZlZCkge1xyXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XHJcblx0XHRcdFx0cmVzdWx0c1twb3NdID0gdmFsdWVcclxuXHRcdFx0XHRpZiAoIXJlc29sdmVkKSBtZXRob2QgPSBcInJlamVjdFwiXHJcblx0XHRcdFx0aWYgKC0tb3V0c3RhbmRpbmcgPT09IDApIHtcclxuXHRcdFx0XHRcdGRlZmVycmVkLnByb21pc2UocmVzdWx0cylcclxuXHRcdFx0XHRcdGRlZmVycmVkW21ldGhvZF0ocmVzdWx0cylcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHZhbHVlXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoYXJncy5sZW5ndGggPiAwKSB7XHJcblx0XHRcdGZvckVhY2goYXJncywgZnVuY3Rpb24gKGFyZywgaSkge1xyXG5cdFx0XHRcdGFyZy50aGVuKHN5bmNocm9uaXplcihpLCB0cnVlKSwgc3luY2hyb25pemVyKGksIGZhbHNlKSlcclxuXHRcdFx0fSlcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGRlZmVycmVkLnJlc29sdmUoW10pXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2VcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGlkZW50aXR5KHZhbHVlKSB7IHJldHVybiB2YWx1ZSB9XHJcblxyXG5cdGZ1bmN0aW9uIGhhbmRsZUpzb25wKG9wdGlvbnMpIHtcclxuXHRcdHZhciBjYWxsYmFja0tleSA9IG9wdGlvbnMuY2FsbGJhY2tOYW1lIHx8IFwibWl0aHJpbF9jYWxsYmFja19cIiArXHJcblx0XHRcdG5ldyBEYXRlKCkuZ2V0VGltZSgpICsgXCJfXCIgK1xyXG5cdFx0XHQoTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMWUxNikpLnRvU3RyaW5nKDM2KVxyXG5cclxuXHRcdHZhciBzY3JpcHQgPSAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKVxyXG5cclxuXHRcdGdsb2JhbFtjYWxsYmFja0tleV0gPSBmdW5jdGlvbiAocmVzcCkge1xyXG5cdFx0XHRzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpXHJcblx0XHRcdG9wdGlvbnMub25sb2FkKHtcclxuXHRcdFx0XHR0eXBlOiBcImxvYWRcIixcclxuXHRcdFx0XHR0YXJnZXQ6IHtcclxuXHRcdFx0XHRcdHJlc3BvbnNlVGV4dDogcmVzcFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdFx0Z2xvYmFsW2NhbGxiYWNrS2V5XSA9IHVuZGVmaW5lZFxyXG5cdFx0fVxyXG5cclxuXHRcdHNjcmlwdC5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpXHJcblxyXG5cdFx0XHRvcHRpb25zLm9uZXJyb3Ioe1xyXG5cdFx0XHRcdHR5cGU6IFwiZXJyb3JcIixcclxuXHRcdFx0XHR0YXJnZXQ6IHtcclxuXHRcdFx0XHRcdHN0YXR1czogNTAwLFxyXG5cdFx0XHRcdFx0cmVzcG9uc2VUZXh0OiBKU09OLnN0cmluZ2lmeSh7XHJcblx0XHRcdFx0XHRcdGVycm9yOiBcIkVycm9yIG1ha2luZyBqc29ucCByZXF1ZXN0XCJcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cdFx0XHRnbG9iYWxbY2FsbGJhY2tLZXldID0gdW5kZWZpbmVkXHJcblxyXG5cdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdH1cclxuXHJcblx0XHRzY3JpcHQub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdH1cclxuXHJcblx0XHRzY3JpcHQuc3JjID0gb3B0aW9ucy51cmwgK1xyXG5cdFx0XHQob3B0aW9ucy51cmwuaW5kZXhPZihcIj9cIikgPiAwID8gXCImXCIgOiBcIj9cIikgK1xyXG5cdFx0XHQob3B0aW9ucy5jYWxsYmFja0tleSA/IG9wdGlvbnMuY2FsbGJhY2tLZXkgOiBcImNhbGxiYWNrXCIpICtcclxuXHRcdFx0XCI9XCIgKyBjYWxsYmFja0tleSArXHJcblx0XHRcdFwiJlwiICsgYnVpbGRRdWVyeVN0cmluZyhvcHRpb25zLmRhdGEgfHwge30pXHJcblxyXG5cdFx0JGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2NyaXB0KVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gY3JlYXRlWGhyKG9wdGlvbnMpIHtcclxuXHRcdHZhciB4aHIgPSBuZXcgZ2xvYmFsLlhNTEh0dHBSZXF1ZXN0KClcclxuXHRcdHhoci5vcGVuKG9wdGlvbnMubWV0aG9kLCBvcHRpb25zLnVybCwgdHJ1ZSwgb3B0aW9ucy51c2VyLFxyXG5cdFx0XHRvcHRpb25zLnBhc3N3b3JkKVxyXG5cclxuXHRcdHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xyXG5cdFx0XHRcdGlmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwKSB7XHJcblx0XHRcdFx0XHRvcHRpb25zLm9ubG9hZCh7dHlwZTogXCJsb2FkXCIsIHRhcmdldDogeGhyfSlcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0b3B0aW9ucy5vbmVycm9yKHt0eXBlOiBcImVycm9yXCIsIHRhcmdldDogeGhyfSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAob3B0aW9ucy5zZXJpYWxpemUgPT09IEpTT04uc3RyaW5naWZ5ICYmXHJcblx0XHRcdFx0b3B0aW9ucy5kYXRhICYmXHJcblx0XHRcdFx0b3B0aW9ucy5tZXRob2QgIT09IFwiR0VUXCIpIHtcclxuXHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIixcclxuXHRcdFx0XHRcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIilcclxuXHRcdH1cclxuXHJcblx0XHRpZiAob3B0aW9ucy5kZXNlcmlhbGl6ZSA9PT0gSlNPTi5wYXJzZSkge1xyXG5cdFx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcihcIkFjY2VwdFwiLCBcImFwcGxpY2F0aW9uL2pzb24sIHRleHQvKlwiKVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChpc0Z1bmN0aW9uKG9wdGlvbnMuY29uZmlnKSkge1xyXG5cdFx0XHR2YXIgbWF5YmVYaHIgPSBvcHRpb25zLmNvbmZpZyh4aHIsIG9wdGlvbnMpXHJcblx0XHRcdGlmIChtYXliZVhociAhPSBudWxsKSB4aHIgPSBtYXliZVhoclxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBkYXRhID0gb3B0aW9ucy5tZXRob2QgPT09IFwiR0VUXCIgfHwgIW9wdGlvbnMuZGF0YSA/IFwiXCIgOiBvcHRpb25zLmRhdGFcclxuXHJcblx0XHRpZiAoZGF0YSAmJiAhaXNTdHJpbmcoZGF0YSkgJiYgZGF0YS5jb25zdHJ1Y3RvciAhPT0gZ2xvYmFsLkZvcm1EYXRhKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlJlcXVlc3QgZGF0YSBzaG91bGQgYmUgZWl0aGVyIGJlIGEgc3RyaW5nIG9yIFwiICtcclxuXHRcdFx0XHRcIkZvcm1EYXRhLiBDaGVjayB0aGUgYHNlcmlhbGl6ZWAgb3B0aW9uIGluIGBtLnJlcXVlc3RgXCIpXHJcblx0XHR9XHJcblxyXG5cdFx0eGhyLnNlbmQoZGF0YSlcclxuXHRcdHJldHVybiB4aHJcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGFqYXgob3B0aW9ucykge1xyXG5cdFx0aWYgKG9wdGlvbnMuZGF0YVR5cGUgJiYgb3B0aW9ucy5kYXRhVHlwZS50b0xvd2VyQ2FzZSgpID09PSBcImpzb25wXCIpIHtcclxuXHRcdFx0cmV0dXJuIGhhbmRsZUpzb25wKG9wdGlvbnMpXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gY3JlYXRlWGhyKG9wdGlvbnMpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBiaW5kRGF0YShvcHRpb25zLCBkYXRhLCBzZXJpYWxpemUpIHtcclxuXHRcdGlmIChvcHRpb25zLm1ldGhvZCA9PT0gXCJHRVRcIiAmJiBvcHRpb25zLmRhdGFUeXBlICE9PSBcImpzb25wXCIpIHtcclxuXHRcdFx0dmFyIHByZWZpeCA9IG9wdGlvbnMudXJsLmluZGV4T2YoXCI/XCIpIDwgMCA/IFwiP1wiIDogXCImXCJcclxuXHRcdFx0dmFyIHF1ZXJ5c3RyaW5nID0gYnVpbGRRdWVyeVN0cmluZyhkYXRhKVxyXG5cdFx0XHRvcHRpb25zLnVybCArPSAocXVlcnlzdHJpbmcgPyBwcmVmaXggKyBxdWVyeXN0cmluZyA6IFwiXCIpXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRvcHRpb25zLmRhdGEgPSBzZXJpYWxpemUoZGF0YSlcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHBhcmFtZXRlcml6ZVVybCh1cmwsIGRhdGEpIHtcclxuXHRcdGlmIChkYXRhKSB7XHJcblx0XHRcdHVybCA9IHVybC5yZXBsYWNlKC86W2Etel1cXHcrL2dpLCBmdW5jdGlvbiAodG9rZW4pe1xyXG5cdFx0XHRcdHZhciBrZXkgPSB0b2tlbi5zbGljZSgxKVxyXG5cdFx0XHRcdHZhciB2YWx1ZSA9IGRhdGFba2V5XSB8fCB0b2tlblxyXG5cdFx0XHRcdGRlbGV0ZSBkYXRhW2tleV1cclxuXHRcdFx0XHRyZXR1cm4gdmFsdWVcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHRcdHJldHVybiB1cmxcclxuXHR9XHJcblxyXG5cdG0ucmVxdWVzdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblx0XHRpZiAob3B0aW9ucy5iYWNrZ3JvdW5kICE9PSB0cnVlKSBtLnN0YXJ0Q29tcHV0YXRpb24oKVxyXG5cdFx0dmFyIGRlZmVycmVkID0gbmV3IERlZmVycmVkKClcclxuXHRcdHZhciBpc0pTT05QID0gb3B0aW9ucy5kYXRhVHlwZSAmJlxyXG5cdFx0XHRvcHRpb25zLmRhdGFUeXBlLnRvTG93ZXJDYXNlKCkgPT09IFwianNvbnBcIlxyXG5cclxuXHRcdHZhciBzZXJpYWxpemUsIGRlc2VyaWFsaXplLCBleHRyYWN0XHJcblxyXG5cdFx0aWYgKGlzSlNPTlApIHtcclxuXHRcdFx0c2VyaWFsaXplID0gb3B0aW9ucy5zZXJpYWxpemUgPVxyXG5cdFx0XHRkZXNlcmlhbGl6ZSA9IG9wdGlvbnMuZGVzZXJpYWxpemUgPSBpZGVudGl0eVxyXG5cclxuXHRcdFx0ZXh0cmFjdCA9IGZ1bmN0aW9uIChqc29ucCkgeyByZXR1cm4ganNvbnAucmVzcG9uc2VUZXh0IH1cclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHNlcmlhbGl6ZSA9IG9wdGlvbnMuc2VyaWFsaXplID0gb3B0aW9ucy5zZXJpYWxpemUgfHwgSlNPTi5zdHJpbmdpZnlcclxuXHJcblx0XHRcdGRlc2VyaWFsaXplID0gb3B0aW9ucy5kZXNlcmlhbGl6ZSA9XHJcblx0XHRcdFx0b3B0aW9ucy5kZXNlcmlhbGl6ZSB8fCBKU09OLnBhcnNlXHJcblx0XHRcdGV4dHJhY3QgPSBvcHRpb25zLmV4dHJhY3QgfHwgZnVuY3Rpb24gKHhocikge1xyXG5cdFx0XHRcdGlmICh4aHIucmVzcG9uc2VUZXh0Lmxlbmd0aCB8fCBkZXNlcmlhbGl6ZSAhPT0gSlNPTi5wYXJzZSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHhoci5yZXNwb25zZVRleHRcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0cmV0dXJuIG51bGxcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRvcHRpb25zLm1ldGhvZCA9IChvcHRpb25zLm1ldGhvZCB8fCBcIkdFVFwiKS50b1VwcGVyQ2FzZSgpXHJcblx0XHRvcHRpb25zLnVybCA9IHBhcmFtZXRlcml6ZVVybChvcHRpb25zLnVybCwgb3B0aW9ucy5kYXRhKVxyXG5cdFx0YmluZERhdGEob3B0aW9ucywgb3B0aW9ucy5kYXRhLCBzZXJpYWxpemUpXHJcblx0XHRvcHRpb25zLm9ubG9hZCA9IG9wdGlvbnMub25lcnJvciA9IGZ1bmN0aW9uIChldikge1xyXG5cdFx0XHR0cnkge1xyXG5cdFx0XHRcdGV2ID0gZXYgfHwgZXZlbnRcclxuXHRcdFx0XHR2YXIgcmVzcG9uc2UgPSBkZXNlcmlhbGl6ZShleHRyYWN0KGV2LnRhcmdldCwgb3B0aW9ucykpXHJcblx0XHRcdFx0aWYgKGV2LnR5cGUgPT09IFwibG9hZFwiKSB7XHJcblx0XHRcdFx0XHRpZiAob3B0aW9ucy51bndyYXBTdWNjZXNzKSB7XHJcblx0XHRcdFx0XHRcdHJlc3BvbnNlID0gb3B0aW9ucy51bndyYXBTdWNjZXNzKHJlc3BvbnNlLCBldi50YXJnZXQpXHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0aWYgKGlzQXJyYXkocmVzcG9uc2UpICYmIG9wdGlvbnMudHlwZSkge1xyXG5cdFx0XHRcdFx0XHRmb3JFYWNoKHJlc3BvbnNlLCBmdW5jdGlvbiAocmVzLCBpKSB7XHJcblx0XHRcdFx0XHRcdFx0cmVzcG9uc2VbaV0gPSBuZXcgb3B0aW9ucy50eXBlKHJlcylcclxuXHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdH0gZWxzZSBpZiAob3B0aW9ucy50eXBlKSB7XHJcblx0XHRcdFx0XHRcdHJlc3BvbnNlID0gbmV3IG9wdGlvbnMudHlwZShyZXNwb25zZSlcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKHJlc3BvbnNlKVxyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRpZiAob3B0aW9ucy51bndyYXBFcnJvcikge1xyXG5cdFx0XHRcdFx0XHRyZXNwb25zZSA9IG9wdGlvbnMudW53cmFwRXJyb3IocmVzcG9uc2UsIGV2LnRhcmdldClcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRkZWZlcnJlZC5yZWplY3QocmVzcG9uc2UpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGNhdGNoIChlKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KGUpXHJcblx0XHRcdFx0bS5kZWZlcnJlZC5vbmVycm9yKGUpXHJcblx0XHRcdH0gZmluYWxseSB7XHJcblx0XHRcdFx0aWYgKG9wdGlvbnMuYmFja2dyb3VuZCAhPT0gdHJ1ZSkgbS5lbmRDb21wdXRhdGlvbigpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRhamF4KG9wdGlvbnMpXHJcblx0XHRkZWZlcnJlZC5wcm9taXNlID0gcHJvcGlmeShkZWZlcnJlZC5wcm9taXNlLCBvcHRpb25zLmluaXRpYWxWYWx1ZSlcclxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlXHJcblx0fVxyXG5cclxuXHRyZXR1cm4gbVxyXG59KTsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBcIndyYXBwZXJcIjogXCJtYzBjNWEzNTc2X3dyYXBwZXJcIixcbiAgICBcImNhcm91c2VsLWNvbnRhaW5lclwiOiBcIm1jMGM1YTM1NzZfY2Fyb3VzZWwtY29udGFpbmVyXCIsXG4gICAgXCJjYXJvdXNlbC1zbGlkZVwiOiBcIm1jMGM1YTM1NzZfY2Fyb3VzZWwtc2xpZGVcIixcbiAgICBcImNhcm91c2VsLXdyYXBwZXJcIjogXCJtYzBjNWEzNTc2X2Nhcm91c2VsLXdyYXBwZXJcIlxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBcIndyYXBwZXJcIjogXCJtY2I3N2NhOTIyX3dyYXBwZXJcIixcbiAgICBcImNhcm91c2VsLWNvbnRhaW5lclwiOiBcIm1jYjc3Y2E5MjJfY2Fyb3VzZWwtY29udGFpbmVyXCIsXG4gICAgXCJjYXJvdXNlbC1zbGlkZVwiOiBcIm1jYjc3Y2E5MjJfY2Fyb3VzZWwtc2xpZGVcIixcbiAgICBcImNhcm91c2VsLXdyYXBwZXJcIjogXCJtY2I3N2NhOTIyX2Nhcm91c2VsLXdyYXBwZXJcIlxufTsiLCJ2YXIgbSA9IHJlcXVpcmUoJ21pdGhyaWwnKTtcbnZhciBDID0gcmVxdWlyZSgnLi9qcy9jYXJvdXNlbCcpXG5cbi8qXG4gICBUaGlzIENTUyBpcyBub3cgc2NvcGVkIHRvIHRoZSB0aGluZ3MgaW4gdGhpcyBtb2R1bGUgdmlhIGZpbGUtaGFzaFxuICAgYW5kIGFjY2Vzc2libGUgdmlhIGNzcy55b3VyX2NsYXNzX25hbWU7XG5cbiAgIFRoaXMgd2lsbCBvdXRwdXQgdG8gc2l0ZS5jc3MgaW4gZGlzdC9jc3MgYXMgYSBidW5jaCBvZiBjbGFzc2VzIHdpdGhcbiAgIHVuaXF1ZSBwcmVmaXhlcyAoamtmamVpMzJqbHNkX2V4YW1wbGUpIChzbyB0aGV5IHRhcmdldCB3aGljaGV2ZXIgZWxlbWVudCB5b3Ugd2FudCBwZXJmZWN0bHkpXG4gKi9cbnZhciBjc3MgPSByZXF1aXJlKCcuL2Nzcy9jYXJvdXNlbC5jc3MnKTtcblxuLypcbiAgV2UgcmVxdWlyZSBnbG9iYWwgQ1NTIGhlcmUgd2l0aG91dCBhc3NpZ25pbmcgYmVjYXVzZVxuICBpdCBhbGxvd3MgYnJvd3NlcmlmeSB0byBydW4gdGhlICdtb2R1bGFyLWNzcycgcGx1Z2luLlxuICBUaGF0IHBsdWdpbiwgd2hpbGUgcnVubmluZywgb3V0cHV0cyBhIGZpbGUgdGhhdCB3ZSBsaW5rIHRvIHRocm91Z2ggb3VyIHNpdGVcblxuICBUaGlzIHdpbGwgb3V0cHV0IHRvIHNpdGUuY3NzIGluIGRpc3QvY3NzIGFzIGlzXG4gIChubyB1bmlxdWUgcHJlZml4ZXMgc2luY2UgaXQncyByZXF1aXJlZCBidXQgdW51c2VkKVxuICBtb2R1bGFyLWNzcyBzZWVzIHRoaXMgYW5kIGl0IGp1c3QgZ2V0cyBwbGFjZWQgaW50byBzaXRlLmNzcyB1bnRvdWNoZWQuXG4qL1xucmVxdWlyZSgnLi9jc3MvZ2xvYmFsLmNzcycpO1xuXG4vKlxuICBFeHBsYW5hdGlvbiBvZiBzdGFja3BhY2sgdGhhdCBhcHBlYXJzIGluIGJyb3dzZXIuXG4gIE5vdGUgdGhhdCB0aGlzIGV4cGxhbmF0aW9uIGlzIGJlaW5nIHJlbmRlcmVkIGluIGEgdi1kb20gbGlicmFyeVxuICBrbm93biBhcyAnTWl0aHJpbCcsIElmIHlvdSdyZSB1c2luZyBhbm90aGVyIHZkb20gbGlicmFyeSwgdGhleVxuICBzaG91bGQgaGF2ZSBzaW1pbGFyIHBhcmFkaWdtcyBmb3IgeW91IHRvIGFzc2lnbiBjbGFzc2VzIHRvIGFcbiAgdmlydHVhbCBkb20gZWxlbWVudC5cblxuICBZb3UncmUgZnJlZSB0byBkbyBkb3Qgb3IgYnJhY2tldCEgTm8gYmlnZ2llISBKdXN0IG1ha2Ugc3VyZSBZb3VcbiAgaGF2ZSBFU0xJTlQgYWdyZWUgd2l0aCB5b3UgYWJvdXQgaXQuXG5cbiovXG5cbnZhciBudW1iZXJzID0gWzEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwXSxcbiAgICBzbGlkZXMgID0gbnVtYmVycy5tYXAoZnVuY3Rpb24obnVtYmVyKSB7XG4gICAgICByZXR1cm4gbShcImRpdlwiLCB7Y2xhc3M6IGNzc1tcImNhcm91c2VsLXNsaWRlXCJdICsgJyBjYXJvdXNlbC1zbGlkZSd9LCBcIlNsaWRlIFwiICsgbnVtYmVyKTtcbiAgICB9KVxuXG5tLm1vdW50KGdsb2JhbC5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW91bnQnKSwge1xuICB2aWV3OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbShcImRpdlwiLCB7XG4gICAgICBjb25maWc6IGZ1bmN0aW9uKGVsZW1lbnQsIGluaXRpYWxpemVkKSB7XG4gICAgICAgIEMoZWxlbWVudCk7XG4gICAgICB9LFxuICAgICAgY2xhc3M6IGNzc1tcIndyYXBwZXJcIl1cbiAgICB9LCBbXG4gICAgICBtKCdkaXYnLCB7Y2xhc3M6IGNzc1tcImNhcm91c2VsLWNvbnRhaW5lclwiXSArICcgY2Fyb3VzZWwtY29udGFpbmVyJ30sIFtcbiAgICAgICAgbShcImRpdlwiLCB7Y2xhc3M6IGNzc1tcImNhcm91c2VsLXdyYXBwZXJcIl0gKyAnIGNhcm91c2VsLXdyYXBwZXInfSwgc2xpZGVzKVxuICAgICAgXSlcbiAgICBdKTtcbiAgfVxufSk7XG4iLCJmdW5jdGlvbiB0cmFuc2xhdGUoZWxlbWVudCwgZGlzdGFuY2UpIHtcbiAgdmFyIHRyYW5zbGF0aW9uID0gJ3RyYW5zbGF0ZTNkKCcgKyBkaXN0YW5jZSArICdweCwgMCwgMCknXG4gIHZhciBzdHlsZSA9IGVsZW1lbnQuc3R5bGU7IFxuXG4gIHN0eWxlLldlYmtpdFRyYW5zZm9ybSA9IHRyYW5zbGF0aW9uO1xuICBzdHlsZS5Nb3pUcmFuc2Zvcm0gPSB0cmFuc2xhdGlvbjtcbiAgc3R5bGUuT1RyYW5zZm9ybSA9IHRyYW5zbGF0aW9uO1xuICBzdHlsZS5tc1RyYW5zZm9ybSA9IHRyYW5zbGF0aW9uO1xuICBzdHlsZS50cmFuc2Zvcm0gPSB0cmFuc2xhdGlvbjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0cmFuc2xhdGU7IFxuXG4iLCJ2YXIgZG9tID0gcmVxdWlyZSgnLi91dGlsaXRpZXMvZG9tJyk7XG52YXIgdHJhbnNsYXRlID0gcmVxdWlyZSgnLi9hbmltYXRpb24vdHJhbnNsYXRlJyk7XG52YXIgbGlzdGVuZXJzID0gcmVxdWlyZSgnLi9ldmVudC1sb2dpYy9jYXJvdXNlbC1ldmVudC1saXN0ZW5lcnMnKTtcbnZhciByb3VuZCA9IHJlcXVpcmUoJy4vdXRpbGl0aWVzL3JvdW5kLW51bWJlcicpO1xuXG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgc2xpZGVzUGVyVmlldzogMyxcbiAgc3BhY2luZzoge1xuICAgIGJldHdlZW46IDMwXG4gIH0sXG4gIGNsYXNzZXM6IHtcbiAgICBjb250YWluZXI6ICcuY2Fyb3VzZWwtY29udGFpbmVyJyxcbiAgICBpdGVtczogJy5jYXJvdXNlbC1zbGlkZScsXG4gICAgd3JhcHBlcjogJy5jYXJvdXNlbC13cmFwcGVyJyxcbiAgfVxufTtcblxuZnVuY3Rpb24gQ2Fyb3VzZWwocm9vdCwgb3B0cykge1xuICB2YXIgQyA9IHRoaXM7XG5cbiAgQy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdHMsIG9wdHMpO1xuXG4gIEMuZG9tID0ge1xuICAgIHJvb3Q6IHJvb3QsXG4gICAgd3JhcHBlcjogZG9tLmZpbmQocm9vdCwgQy5vcHRpb25zLmNsYXNzZXMud3JhcHBlciksXG4gICAgaXRlbXM6IGRvbS5maW5kKHJvb3QsIEMub3B0aW9ucy5jbGFzc2VzLml0ZW1zKSxcbiAgfVxuXG4gIEMuc3RhdGUgPSB7XG4gICAgZHJhZ2dpbmc6IGZhbHNlLFxuICAgIGRyYWc6IHtcbiAgICAgIC8qKiBBdCB3aGF0IHBvc2l0aW9uIGluIHRoZSBjYXJvdXNlbCBkaWQgd2UgYmVnaW4gdG8gZHJhZyAqKi9cbiAgICAgIHN0YXJ0cG9zOiAwLFxuXG4gICAgICAvKiogaG93IGZhciBkaWQgd2UgbW92ZSBhZnRlciBzdGFydGluZyB0aGUgZHJhZyAqL1xuICAgICAgbW92ZWRwb3M6IDAsXG5cbiAgICAgIC8qKiB3aGF0J3MgdGhlIG9mZnNldCBpbnRyb2R1Y2VkIHZpYSB0cmFuc2xhdGlvbiAqL1xuICAgICAgb2Zmc2V0OiAwLFxuICAgIH1cbiAgfVxuXG4gIGluaXQoQywgQy5kb20uaXRlbXMpO1xuICBsaXN0ZW5lcnMoQyk7XG59XG5cbmZ1bmN0aW9uIGluaXQoQ2Fyb3VzZWwsIGl0ZW1zKSB7XG4gIHZhciBjb3VudCAgID0gaXRlbXMubGVuZ3RoLFxuICAgICAgc3BhY2luZyA9IENhcm91c2VsLm9wdGlvbnMuc3BhY2luZy5iZXR3ZWVuLFxuICAgICAgc3B2ICAgICA9IENhcm91c2VsLm9wdGlvbnMuc2xpZGVzUGVyVmlldyxcblxuICAgICAgLyoqIFNpbmdsZSBDYXJvdXNlbCBJdGVtICovXG4gICAgICBjYXJvdXNlbEl0ZW0gPSB7XG4gICAgICAgIG1hcmdpbjogQ2Fyb3VzZWwub3B0aW9ucy5zcGFjaW5nLmJldHdlZW4gKyBcInB4XCIsXG4gICAgICAgIHdpZHRoOiByb3VuZCgoQ2Fyb3VzZWwuZG9tLnJvb3QuY2xpZW50V2lkdGggLSAoc3B2IC0gMSkgKiBzcGFjaW5nKSAvIHNwdikgKyBcInB4XCJcbiAgICAgIH1cblxuICAvLyBSZWZsb3cgLyBSZXNpemUgc2xpZGUgZWxlbWVudHMgYmFzZWQgb246XG4gIC8vIC0gc2xpZGVzIHBlciB2aWV3IChuZWVkIHRvIHVzZSB0aGUgd3JhcHBlciB3aWR0aCB0byBkZXRlcm1pbmUgd2lkdGggb2YgaXRlbXMgYmFzZWQgb24gcGVyLXZpZXcpXG4gIC8vIC0gTnVtYmVyIG9mIHRvdGFsIHNsaWRlc1xuXG4gIC8vIEluaXRpYWxpemUgRXZlbnQgbGlzdGVuZXJzXG4gIC8vIC0gTmVlZCB0byBoYXZlIHN0YXRlIGZvcjpcbiAgLy8gICAgLSBEcmFnL21vdXNlZG93biBvY2N1cnJpbmdcbiAgLy8gICAgLSBMYXN0IHBpeGVsIHBvc2l0aW9uIHRyYW5zbGF0ZWQgdG8gKHRvIHN0b3AgamFycmluZyB0cmFuc2l0aW9ucy4gKVxuXG5cbiAgaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgdmFyIGRvbSA9IENhcm91c2VsLmRvbTtcblxuICAgIGl0ZW0uc3R5bGUubWFyZ2luUmlnaHQgPSBjYXJvdXNlbEl0ZW0ubWFyZ2luO1xuICAgIGl0ZW0uc3R5bGUud2lkdGggPSBjYXJvdXNlbEl0ZW0ud2lkdGg7XG4gIH0pO1xuXG4gIENhcm91c2VsLmRvbS53cmFwcGVyLnN0eWxlWyd3aWR0aCddID0gKChpdGVtc1swXS5jbGllbnRXaWR0aCArIHNwYWNpbmcpICogY291bnQpICsgXCJweFwiO1xuXG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDYXJvdXNlbDtcbiIsInZhciBldmVudHMgPSByZXF1aXJlKCcuL25vcm1hbGl6ZS1ldmVudHMuanMnKTtcbnZhciB0cmFuc2xhdGUgPSByZXF1aXJlKCcuLi9hbmltYXRpb24vdHJhbnNsYXRlJyk7XG5cbmZ1bmN0aW9uIGxpc3RlbmVycyhDYXJvdXNlbCkge1xuICB2YXIgZG9tID0gQ2Fyb3VzZWwuZG9tLFxuICAgICAgc3RhdGUgPSBDYXJvdXNlbC5zdGF0ZTtcblxuICBkb20ucm9vdC5hZGRFdmVudExpc3RlbmVyKGV2ZW50cy5zdGFydCwgZnVuY3Rpb24oZSkge1xuICAgIHN0YXRlLmRyYWdnaW5nID0gdHJ1ZTtcbiAgICBzdGF0ZS5kcmFnLnN0YXJ0cG9zID0gZS5jbGllbnRYO1xuICB9KTtcblxuICBkb20ucm9vdC5hZGRFdmVudExpc3RlbmVyKGV2ZW50cy5tb3ZlLCBmdW5jdGlvbihlKSB7XG4gICAgaWYoIXN0YXRlLmRyYWdnaW5nKSByZXR1cm47XG5cbiAgICBzdGF0ZS5tb3ZlZHBvcyA9IGUuY2xpZW50WCAtIHN0YXRlLmRyYWcuc3RhcnRwb3M7XG4gICAgdHJhbnNsYXRlKGRvbS53cmFwcGVyLCBzdGF0ZS5kcmFnLm9mZnNldCArIHN0YXRlLm1vdmVkcG9zKTtcbiAgfSk7XG5cbiAgZG9tLnJvb3QuYWRkRXZlbnRMaXN0ZW5lcihldmVudHMuZW5kLCBmdW5jdGlvbihlKSB7XG4gICAgc3RhdGUuZHJhZ2dpbmcgPSBmYWxzZTtcbiAgICBzdGF0ZS5vZmZzZXQgPSBzdGF0ZS5vZmZzZXQgKyBzdGF0ZS5tb3ZlZHBvcztcbiAgfSk7XG5cbiAgZG9tLnJvb3QuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIGZ1bmN0aW9uKGUpIHtcbiAgICBzdGF0ZS5kcmFnZ2luZyA9IGZhbHNlO1xuICAgIHN0YXRlLm9mZnNldCA9IHN0YXRlLm9mZnNldCArIHN0YXRlLm1vdmVkcG9zO1xuICB9KTtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxpc3RlbmVycztcbiIsIlxuLyoqIEV2ZW50IE5vcm1hbGl6YXRpb24gKi9cblxuLyoqXG4gKiAxLiBOb3JtYWxpemUgRGVza3RvcCBldmVudHMgYmV0d2VlbiBtb3VzZXVwL21vdXNlbW92ZS9tb3VzZWRvd25cbiAqIDIuIElmIHBvaW50ZXIgLyBNU1BvaW50ZXIgZW5hYmxlZCwgdXNlIHRob3NlIGluc3RlYWQuXG4gKi9cblxuLy9UT0RPOiBwdXQgaW4gYSBzdXBwb3J0IG1vZHVsZVxudmFyIHN1cHBvcnRzID0ge1xuICAgIHRvdWNoOiAhISgoJ29udG91Y2hzdGFydCcgaW4gd2luZG93KSB8fCB3aW5kb3cuRG9jdW1lbnRUb3VjaCAmJiBkb2N1bWVudCBpbnN0YW5jZW9mIERvY3VtZW50VG91Y2gpLFxufTtcblxuLyoqXG4gKiBSZXRyaWV2ZSBEZXNrdG9wIGV2ZW50cyB0aGF0IGVuYWJsZSBkcmFnIGluIGEgc3RhbmRhcmQgb2JqZWN0IGZvcm1hdFxuICogZmFsbGJhY2sgdG8gdXNpbmcgdGhlIEFXRlVMIEFORCBERUFEIHBvaW50ZXIgZXZlbnRzIGlmIHdlJ3JlIGluIElFLiBcbiAqL1xuZnVuY3Rpb24gX25vbnRvdWNoKCkge1xuICB2YXIgcG9pbnRlcnMgPSB3aW5kb3cubmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkO1xuICB2YXIgbXNwb2ludGVycyA9IHdpbmRvdy5uYXZpZ2F0b3IucG9pbnRlckVuYWJsZWQ7XG5cbiAgdmFyIHN0YW5kYXJkID0ge1xuICAgIHN0YXJ0OiAnbW91c2Vkb3duJyxcbiAgICBtb3ZlOiAnbW91c2Vtb3ZlJyxcbiAgICBlbmQ6ICdtb3VzZXVwJ1xuICB9LFxuXG4gIHBvaW50ZXIgPSB7XG4gICAgc3RhcnQ6IG1zcG9pbnRlcnMgPyAncG9pbnRlcmRvd24nIDogJ01TUG9pbnRlckRvd24nLFxuICAgIG1vdmU6IG1zcG9pbnRlcnMgPyAncG9pbnRlcm1vdmUnIDogJ01TUG9pbnRlck1vdmUnLFxuICAgIGVuZDogbXNwb2ludGVycyA/ICdwb2ludGVydXAnIDogJ01TUG9pbnRlclVwJ1xuICB9O1xuXG4gIHJldHVybiBwb2ludGVycyA/IHBvaW50ZXIgOiBzdGFuZGFyZDtcbn1cblxuZnVuY3Rpb24gX3RvdWNoKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHN0YXJ0OiAndG91Y2hzdGFydCcsXG4gICAgICAgIG1vdmU6ICd0b3VjaG1vdmUnLFxuICAgICAgICBlbmQ6ICd0b3VjaGVuZCcsXG4gICAgfVxufVxuXG4vKipcbiAqIFJldHJpZXZlIFRvdWNoc2NyZWVuIGV2ZW50cyB0aGF0IGVuYWJsZSBkcmFnIGluIGEgc3RhbmRhcmQgb2JqZWN0IGZvcm1hdC4gXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZSgpIHtcbiAgICByZXR1cm4gc3VwcG9ydHMudG91Y2ggPyBfdG91Y2goKSA6IF9ub250b3VjaCgpOyBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBub3JtYWxpemUoKTsgXG4iLCIvKipcbiAqIEBtb2R1bGUgRE9NXG4gKi9cbnZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKTtcblxudmFyIF9lbGVtZW50cyA9IGhlbHBlcnMuZWxlbWVudHMsXG4gICAgX2V4Y2x1ZGUgID0gaGVscGVycy5leGNsdWRlLFxuICAgIF91bndyYXAgICA9IGhlbHBlcnMudW53cmFwO1xuXG4vKipcbiAqIEZpbmRzIGFuIGVsZW1lbnQgYnkgc2VsZWN0b3Igd2l0aGluIGEgY29udGV4dC4gSWYgY2hpbGQgZWxlbWVudHMgaW4gXG4gKiBlbGVtZW50IG1hdGNoIHNlbGVjdG9yLCB0aGV5IGFyZSBhZGRlZCB0byB0aGUgcmV0dXJuIHJlc3VsdFxuICogXG4gKiBAcGFyYW0ge05vZGV9IGVsZW1lbnQgLSBUaGUgZWxlbWVudCB0byBzZWFyY2ggZm9yIGNoaWxkcmVuIGluc2lkZSBvZlxuICogQHBhcmFtIHtzdHJpbmd9IHNlbGVjdG9yIC0gVGhlIENTUyBzZWxlY3RvciB0byBtYXRjaCBlbGVtZW50cyBhZ2FpbnN0XG4gKiBcbiAqIEByZXR1cm5zIHthcnJheXxOb2RlfSBBIHNpbmdsZSBlbGVtZW50IG9yIGNvbGxlY3Rpb24gb2YgZWxlbWVudHMgdGhhdCBtYXRjaCB0aGUgcXVlcnlcbiAqL1xuZnVuY3Rpb24gZmluZChlbGVtZW50LCBzZWxlY3Rvcikge1xuICByZXR1cm4gX3Vud3JhcChfZWxlbWVudHMoZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSkpO1xufVxuXG4vKipcbiAqIEZpbmRzIGFuIGVsZW1lbnQgYnkgc2VsZWN0b3Igd2l0aGluIHRoZSBjb250ZXh0IG9mIGNvbnRleHQgKGRvY3VtZW50LmJvZHkgXG4gKiBpZiBubyBjb250ZXh0IGlzIHN1cHBsaWVkKS4gVGhpcyBpcyBhIGJhcmUtYm9uZXMgYW5hbG9nIG9mIGpRdWVyeSdzIGAkKClgXG4gKiBcbiAqIEBwYXJhbSB7c3RyaW5nfSBzZWxlY3RvciAtIFRoZSBDU1Mgc2VsZWN0b3IgdG8gbWF0Y2ggZWxlbWVudHMgYWdhaW5zdFxuICogQHBhcmFtIHtOb2RlfSBjb250ZXh0IC0gVGhlIGVsZW1lbnQgdG8gc2VhcmNoIGluc2lkZSBvZlxuICogXG4gKiBAcmV0dXJucyB7YXJyYXl8Tm9kZX0gQSBzaW5nbGUgZWxlbWVudCBvciBjb2xsZWN0aW9uIG9mIGVsZW1lbnRzIHRoYXQgbWF0Y2ggdGhlIHF1ZXJ5XG4gKi9cbmZ1bmN0aW9uIHF1ZXJ5KHNlbGVjdG9yLCBjb250ZXh0ID0gZG9jdW1lbnQuYm9keSkge1xuICByZXR1cm4gKHNlbGVjdG9yID09PSBcImJvZHlcIikgPyBjb250ZXh0IDogZmluZChjb250ZXh0LCBzZWxlY3Rvcik7XG59XG5cbi8vIGZpbmQgdGhlIGNsb3Nlc3QgZWxlbWVudCB0aGF0IG1hdGNoZXMgKGluY2x1ZGVzIHNlbGYpXG4vKipcbiAqIEZpbmRzIHRoZSBjbG9zZXN0IHBhcmVudCBlbGVtZW50IG9mIGVsZW1lbnQgdGhhdCBtYXRjaGVzIHNlbGVjdG9yXG4gKiBzdGFydGluZyB3aXRoIHRoZSBlbGVtZW50IHRoaXMgZnVuY3Rpb24gd2FzIHBhc3NlZFxuICogXG4gKiBAcGFyYW0ge05vZGV9IGVsZW1lbnQgLSBUaGUgZWxlbWVudCBmcm9tIHdoaWNoIHRvIGJlZ2luIHRoZSBzZWFyY2hcbiAqIEBwYXJhbSB7c3RyaW5nfSBzZWxlY3RvciAtIFRoZSBDU1Mgc2VsZWN0b3IgdG8gbWF0Y2ggZWxlbWVudHMgYWdhaW5zdFxuICogXG4gKiBAcmV0dXJucyB7Tm9kZX0gVGhlIGZpcnN0IGFuY2VzdG9yIGVsZW1lbnQgdGhhdCBtYXRjaGVzIHRoZSBxdWVyeVxuICovXG5mdW5jdGlvbiBjbG9zZXN0KGVsZW1lbnQsIHNlbGVjdG9yKSB7XG4gIHZhciBjdXJyZW50ICA9IGVsZW1lbnQ7XG5cbiAgLy8gS2VlcCBsb29raW5nIHVwIHRoZSBET00gaWYgb3VyIGN1cnJlbnQgZWxlbWVudCBkb2Vzbid0IG1hdGNoLCBzdG9wIGF0IDxodG1sPlxuICB3aGlsZShjdXJyZW50Lm1hdGNoZXMgJiYgIWN1cnJlbnQubWF0Y2hlcyhzZWxlY3RvcikgJiYgY3VycmVudC50YWdOYW1lICE9PSBcIkhUTUxcIikge1xuICAgIGN1cnJlbnQgPSBwYXJlbnQoY3VycmVudCk7XG4gIH1cblxuICByZXR1cm4gKGN1cnJlbnQubWF0Y2hlcyhzZWxlY3RvcikpID8gY3VycmVudCA6IFtdO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGltbWVkaWF0ZSBwYXJlbnQgb2YgYSBnaXZlbiBub2RlXG4gKiBcbiAqIEBwYXJhbSB7Tm9kZX0gZWxlbWVudCAtIFRoZSBlbGVtZW50IGZyb20gd2hpY2ggdG8gcmV0dXJuIGEgcGFyZW50XG4gKiBcbiAqIEByZXR1cm4ge05vZGV9IGVsZW1lbnQgLSBUaGUgcGFyZW50IGVsZW1lbnQgb2YgdGhlIGVsZW1lbnQgcGFzc2VkIGluXG4gKi9cbmZ1bmN0aW9uIHBhcmVudChlbGVtZW50KSB7XG4gIHJldHVybiBlbGVtZW50LnBhcmVudE5vZGU7XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBhcnJheSBvZiBjaGlsZHJlbiBvZiB0aGUgcGFzc2VkIGluIGVsZW1lbnQuIFdpbGwgcmV0dXJuIGEgc2luZ2xlIGVsZW1lbnRcbiAqIGlmIHRoZSBhcnJheSBjb250YWlucyBvbmx5IG9uZSBjaGlsZC4gXG4gKiBcbiAqIEBwYXJhbSB7Tm9kZX0gZWxlbWVudCAtIFRoZSBlbGVtZW50IGZyb20gd2hpY2ggdG8gcmV0cmlldmUgY2hpbGRyZW5cbiAqIFxuICogQHJldHVybiB7YXJyYXl8Tm9kZX0gZWxlbWVudCAtIFRoZSBjaGlsZHJlbiBvZiBlbGVtZW50XG4gKi9cbmZ1bmN0aW9uIGNoaWxkcmVuKGVsZW1lbnQpIHtcbiAgcmV0dXJuIF91bndyYXAoX2VsZW1lbnRzKGVsZW1lbnQuY2hpbGROb2RlcykpO1xufVxuXG4vKipcbiAqIFJldHVybnMgc2libGluZ3Mgb2YgYSBnaXZlbiBub2RlLiBJZiBhIHNlbGVjdG9yIGlzIHNwZWNpZmllZCwgaXQgd2lsbFxuICogcmV0dXJuIG9ubHkgdGhlIHNpYmxpbmdzIHRoYXQgbWF0Y2ggdGhhdCBzZWxlY3Rvci4gXG4gKiBcbiAqIEBwYXJhbSB7Tm9kZX0gZWxlbWVudCAtIFRoZSBlbGVtZW50IGZyb20gd2hpY2ggdG8gcmV0dXJuIGEgcGFyZW50XG4gKiBAcGFyYW0ge3N0cmluZ30gc2VsZWN0b3IgLSB0aGUgc2VsZWN0b3IgdG8gbWF0Y2ggZWxlbWVudHMgYWdhaW5zdFxuICogXG4gKiBAcmV0dXJuIHthcnJheXxOb2RlfSBlbGVtZW50IC0gVGhlIHNpYmxpbmcocykgb2YgdGhlIGVsZW1lbnQgcGFzc2VkIGluLiBcbiAqL1xuZnVuY3Rpb24gc2libGluZ3MoZWxlbWVudCwgc2VsZWN0b3IpIHtcbiAgdmFyIHJlc3VsdCA9IHNlbGVjdG9yID8gX2V4Y2x1ZGUoZmluZChwYXJlbnQoZWxlbWVudCksIHNlbGVjdG9yKSwgZWxlbWVudCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICBfZXhjbHVkZShjaGlsZHJlbihwYXJlbnQoZWxlbWVudCkpLCBlbGVtZW50KTtcbiAgXG4gIHJldHVybiBfdW53cmFwKHJlc3VsdCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBxdWVyeTogcXVlcnksIFxuICBmaW5kOiBmaW5kLFxuICBjbG9zZXN0OiBjbG9zZXN0LFxuICBwYXJlbnQ6IHBhcmVudCxcbiAgY2hpbGRyZW46IGNoaWxkcmVuLFxuICBzaWJsaW5nczogc2libGluZ3Ncbn07XG4iLCIvKipcbiAqIEEgZm9yLWVhY2ggbG9vcCB0eXBlIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHJ1biBvbiBhcnJheXMsIGl0IGJlZ2lucyBmcm9tIHRoZSBlbmQgb2YgdGhlIGxpc3QgZm9yIHRoZSBcbiAqIHJlYXNvbiB0aGF0IGl0IG1ha2VzIHRoZSBidXJkZW4gb24gZHVwbGljYXRlIHJlbW92YWwgdXNpbmcgaW5kZXhPZiBmYXIgbGlnaHRlci4gSUU4IGRvZXNuJ3Qgc3VwcG9ydCBBcnJheS5mb3JFYWNoXG4gKiBzbyB0aGlzIGZ1bGZpbGxzIHRoYXQgZnVuY3Rpb25hbGl0eS4gXG4gKiBcbiAqIEBwYXJhbSB7YXJyYXl9IGNvbGxlY3Rpb24gLSBUaGUgYXJyYXkgdG8gcnVuIGBmbmAgYWdhaW5zdFxuICogQHBhcmFtIHtmdW5jdGlvbn0gZm4gLSBUaGUgZnVuY3Rpb24gdGhhdCBhY2NlcHRzIGVhY2ggZWxlbWVudCwgaW5kZXgsIGFuZCB0aGUgY29sbGVjdGlvbiBpdHNlbGYuIFxuICogXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZC4gXG4gKi9cbmZ1bmN0aW9uIF9lYWNoKGNvbGxlY3Rpb24sIGZuKSB7XG4gIHZhciBpLFxuICAgICAgc2l6ZSA9IGNvbGxlY3Rpb24ubGVuZ3RoO1xuXG4gIGZvcihpID0gc2l6ZSAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgZm4oY29sbGVjdGlvbltpXSwgaSwgY29sbGVjdGlvbik7XG4gIH1cblxuICByZXR1cm4gdW5kZWZpbmVkOyBcbn1cblxuLyoqXG4gKiBBIGZ1bmN0aW9uIHRoYXQgcnVucyBhbG9uZyBhbiBhcnJheSBhbmQgcmV0dXJucyBvbmx5IHVuaXF1ZSB2YWx1ZXNcbiAqIFxuICogQHBhcmFtIHthcnJheX0gY29sbGVjdGlvbiAtIFRoZSBhcnJheSB0byBmaWx0ZXIgZm9yIHVuaXF1ZXNcbiAqIFxuICogQHJldHVybiB7YXJyYXl9IEEgbmV3IGFycmF5IGNvbnRhaW5pbmcgdGhlIHVuaXF1ZSBlbGVtZW50cyBmcm9tIGBjb2xsZWN0aW9uYC4gXG4gKi9cbmZ1bmN0aW9uIF91bmlxdWVzKGNvbGxlY3Rpb24pIHtcbiAgdmFyIGF0O1xuXG4gIF9lYWNoKGNvbGxlY3Rpb24sIGZ1bmN0aW9uKGl0ZW0sIGluZGV4LCBpdGVtcykge1xuICAgIGF0ID0gaXRlbXMuaW5kZXhPZihpdGVtKTtcblxuICAgIGlmKGF0ICE9PSBpbmRleCkge1xuICAgICAgY29sbGVjdGlvbi5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGNvbGxlY3Rpb247IFxufVxuXG4vKipcbiAqIEV4Y2x1ZGVzIGFuIGVsZW1lbnQgZnJvbSBhbiBhcnJheVxuICogXG4gKiBAcGFyYW0ge2FycmF5fSBjb2xsZWN0aW9uIC0gVGhlIGFycmF5IHRvIHNlYXJjaCB0aHJvdWdoIGZvciBleGNsdXNpb25zXG4gKiBAcGFyYW0ge2FueX0gaXRlbSAtIFRoZSBmdW5jdGlvbiB0aGF0IGFjY2VwdHMgZWFjaCBlbGVtZW50LCBpbmRleCwgYW5kIHRoZSBjb2xsZWN0aW9uIGl0c2VsZi4gXG4gKiBcbiAqIEByZXR1cm4ge2FycmF5fSB0aGUgY29sbGVjdGlvbiB3aXRob3V0IHRoZSBzcGVjaWZpZWQgaXRlbVxuICovXG5mdW5jdGlvbiBfZXhjbHVkZShjb2xsZWN0aW9uLCBpdGVtKSB7XG4gIHZhciBhdCA9IGNvbGxlY3Rpb24uaW5kZXhPZihpdGVtKTtcblxuICBpZihhdCA+IC0xKSB7XG4gICAgY29sbGVjdGlvbi5zcGxpY2UoYXQsIDEpO1xuICB9XG5cbiAgcmV0dXJuIGNvbGxlY3Rpb247ICBcbn1cblxuLyoqXG4gKiBVbndyYXBzIGFuIGVsZW1lbnQgZnJvbSBhbiBhcnJheSBpZiBpdCdzIHRoZSBvbmx5IGVsZW1lbnQgaW4gdGhlIGFycmF5LiBUaGlzIHdhcyBjcmVhdGVkXG4gKiB0byBhbGxvdyBzZWxlY3RvcnMgdGhhdCBtYXRjaCB0byBvbmx5IGEgc2luZ2xlIERPTSBlbGVtZW50IHRvIGJlIGludGVyYWN0aXZlIHdpdGhvdXQgaGF2aW5nIHRvXG4gKiBncmFiIHRoZSBmaXJzdCBlbGVtZW50IG9mIHRoZSByZXR1cm5lZCBjb2xsZWN0aW9uIGFycmF5LiBcbiAqIFxuICogQHBhcmFtIHthcnJheX0gY29sbGVjdGlvbiAtIFRoZSBhcnJheSBvZiBkYXRhXG4gKiBcbiAqIEByZXR1cm4ge2FueXxhcnJheX0gdGhlIGl0ZW0gYXMtaXMgb3IgYW4gYXJyYXkgb2YgaXRlbXNcbiAqL1xuZnVuY3Rpb24gX3Vud3JhcChjb2xsZWN0aW9uKSB7XG4gIHJldHVybiBjb2xsZWN0aW9uLmxlbmd0aCA9PT0gMSA/IGNvbGxlY3Rpb25bMF0gOiBjb2xsZWN0aW9uOyBcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFsbCBub2RlcyBvZiBhbiBhcnJheSBjb2xsZWN0aW9uLiBUaGlzIGZ1bmN0aW9uIGNhbiBhbHNvIGJlIHVzZWQgZ2VuZXJpY2FsbHkgZm9yIFxuICogYWxtb3N0IGFueSBkYXRhIHR5cGUsIGJ1dCBpdCBzaG91bGQgb25seSBiZSB1c2VkIHdpdGggRE9NIGVsZW1lbnRzLiBcbiAqIFxuICogQHBhcmFtIHthcnJheX0gY29sbGVjdGlvbiAtIFRoZSBhcnJheSB0byBzZWFyY2ggdGhyb3VnaCBmb3IgY2hpbGQgTm9kZXNcbiAqIFxuICogQHJldHVybiB7YXJyYXl9IHRoZSBjb2xsZWN0aW9uIG9mIGFsbCBOb2Rlcy4gXG4gKi9cbmZ1bmN0aW9uIF9ub2Rlcyhjb2xsZWN0aW9uKSB7XG4gIHZhciBub2RlcyA9IFtdO1xuXG4gIF9lYWNoKGNvbGxlY3Rpb24sIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICBub2Rlcy51bnNoaWZ0KG5vZGUpO1xuICB9KTtcblxuICByZXR1cm4gbm9kZXM7IFxufVxuXG4vKipcbiAqIEZpbHRlcnMgRWxlbWVudCBub2RlcyBvZiBhbiBhcnJheSBvZiBOb2Rlcy4gVGhpcyBmaWx0ZXJzIG91dCBldmVyeSBub2RlIHRoYXQgaXMgTk9UIGFuZCBlbGVtZW50IG5vZGVcbiAqIChlLmcuIFRleHROb2RlLCBDb21tZW50Tm9kZSwgQXR0cmlidXRlTm9kZSwgZXRjLikgXG4gKiBcbiAqIEBwYXJhbSB7YXJyYXl9IGNvbGxlY3Rpb24gLSBUaGUgYXJyYXkgdG8gc2VhcmNoIHRocm91Z2ggZm9yIGVsZW1lbnRzXG4gKiBcbiAqIEByZXR1cm4ge2FycmF5fSBhIG5ldyBhcnJheSBjb250YWluaW5nIG9ubHkgZWxlbWVudHNcbiAqL1xuZnVuY3Rpb24gX2VsZW1lbnRzKGNvbGxlY3Rpb24pIHtcbiAgdmFyIG5vZGVzICAgID0gX25vZGVzKGNvbGxlY3Rpb24pLFxuICAgICAgZWxlbWVudHMgPSBbXSxcbiAgICAgIEVMRU1FTlQgID0gMTsgLy8gRWxlbWVudCBub2RlIElELiAgIFxuXG4gIF9lYWNoKG5vZGVzLCBmdW5jdGlvbihub2RlKSB7XG4gICAgaWYobm9kZS5ub2RlVHlwZSA9PT0gRUxFTUVOVCkge1xuICAgICAgZWxlbWVudHMudW5zaGlmdChub2RlKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBlbGVtZW50cztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGVhY2ggICAgIDogX2VhY2gsXG4gIHVuaXF1ZXMgIDogX3VuaXF1ZXMsXG4gIGV4Y2x1ZGUgIDogX2V4Y2x1ZGUsXG4gIHVud3JhcCAgIDogX3Vud3JhcCxcbiAgbm9kZXMgICAgOiBfbm9kZXMsXG4gIGVsZW1lbnRzIDogX2VsZW1lbnRzXG59O1xuIiwiZnVuY3Rpb24gcm91bmQobnVtYmVyKSB7XG4gIHJldHVybiBNYXRoLmZsb29yKG51bWJlcik7XG59IFxuXG5tb2R1bGUuZXhwb3J0cyA9IHJvdW5kOyAiXX0=
