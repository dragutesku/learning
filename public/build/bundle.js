
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_svg_attributes(node, attributes) {
        for (const key in attributes) {
            attr(node, key, attributes[key]);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function claim_element(nodes, name, attributes, svg) {
        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            if (node.nodeName === name) {
                let j = 0;
                const remove = [];
                while (j < node.attributes.length) {
                    const attribute = node.attributes[j++];
                    if (!attributes[attribute.name]) {
                        remove.push(attribute.name);
                    }
                }
                for (let k = 0; k < remove.length; k++) {
                    node.removeAttribute(remove[k]);
                }
                return nodes.splice(i, 1)[0];
            }
        }
        return svg ? svg_element(name) : element(name);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.4' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/static/svg/svelte-logo.svg generated by Svelte v3.29.4 */

    function create_fragment(ctx) {
    	let svg;
    	let g;
    	let path0;
    	let path1;

    	let svg_levels = [
    		{ width: "256px" },
    		{ height: "308px" },
    		{ viewBox: "0 0 256 308" },
    		{ version: "1.1" },
    		{ xmlns: "http://www.w3.org/2000/svg" },
    		{
    			"xmlns:xlink": "http://www.w3.org/1999/xlink"
    		},
    		{ preserveAspectRatio: "xMidYMid" },
    		/*$$props*/ ctx[0]
    	];

    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	return {
    		c() {
    			svg = svg_element("svg");
    			g = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			this.h();
    		},
    		l(nodes) {
    			svg = claim_element(
    				nodes,
    				"svg",
    				{
    					width: true,
    					height: true,
    					viewBox: true,
    					version: true,
    					xmlns: true,
    					"xmlns:xlink": true,
    					preserveAspectRatio: true
    				},
    				1
    			);

    			var svg_nodes = children(svg);
    			g = claim_element(svg_nodes, "g", {}, 1);
    			var g_nodes = children(g);
    			path0 = claim_element(g_nodes, "path", { d: true, fill: true }, 1);
    			children(path0).forEach(detach);
    			path1 = claim_element(g_nodes, "path", { d: true, fill: true }, 1);
    			children(path1).forEach(detach);
    			g_nodes.forEach(detach);
    			svg_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(path0, "d", "M239.681566,40.706757 C211.113272,-0.181889366 154.69089,-12.301439 113.894816,13.6910393 L42.2469062,59.3555354 C22.6760042,71.6680028 9.1958152,91.6538543 5.11196889,114.412133 C1.69420521,133.371174 4.6982178,152.928576 13.6483951,169.987905 C7.51549676,179.291145 3.33259428,189.7413 1.3524912,200.706787 C-2.77083771,223.902098 2.62286977,247.780539 16.3159596,266.951444 C44.8902975,307.843936 101.312954,319.958266 142.10271,293.967161 L213.75062,248.302665 C233.322905,235.991626 246.803553,216.005094 250.885557,193.246067 C254.302867,174.287249 251.30121,154.730228 242.355449,137.668922 C248.486748,128.365895 252.667894,117.916162 254.646134,106.951413 C258.772188,83.7560394 253.378243,59.8765465 239.682665,40.706757");
    			attr(path0, "fill", "#FF3E00");
    			attr(path1, "d", "M106.888658,270.841265 C83.7871855,276.848065 59.3915045,267.805346 45.7864111,248.192566 C37.5477583,236.66102 34.3023491,222.296573 36.7830958,208.343155 C37.1989333,206.075414 37.7711933,203.839165 38.4957755,201.650433 L39.845476,197.534835 L43.5173097,200.231763 C51.9971301,206.462491 61.4784803,211.199728 71.5527203,214.239302 L74.2164003,215.047419 L73.9710252,217.705878 C73.6455499,221.487851 74.6696022,225.262925 76.8616703,228.361972 C80.9560313,234.269749 88.3011363,236.995968 95.2584831,235.190159 C96.8160691,234.773852 98.3006859,234.121384 99.6606718,233.25546 L171.331634,187.582718 C174.877468,185.349963 177.321139,181.729229 178.065299,177.605596 C178.808171,173.400048 177.830501,169.072361 175.351884,165.594581 C171.255076,159.685578 163.908134,156.9582 156.947927,158.762547 C155.392392,159.178888 153.90975,159.83088 152.551509,160.695872 L125.202489,178.130144 C120.705281,180.989558 115.797437,183.144784 110.64897,184.521162 C87.547692,190.527609 63.1523949,181.484801 49.5475471,161.872188 C41.3085624,150.340895 38.0631179,135.976391 40.5442317,122.023052 C43.0002744,108.333716 51.1099574,96.3125326 62.8835328,88.9089537 L134.548175,43.2323647 C139.047294,40.3682559 143.958644,38.21032 149.111311,36.8336525 C172.21244,30.8273594 196.607527,39.8700206 210.212459,59.4823515 C218.451112,71.013898 221.696522,85.3783452 219.215775,99.3317627 C218.798144,101.59911 218.225915,103.835236 217.503095,106.024485 L216.153395,110.140083 L212.483484,107.447276 C204.004261,101.212984 194.522,96.4735732 184.44615,93.4336926 L181.78247,92.6253012 L182.027845,89.9668419 C182.350522,86.1852063 181.326723,82.4111645 179.1372,79.3110228 C175.042839,73.4032457 167.697734,70.677026 160.740387,72.4828355 C159.182801,72.8991426 157.698185,73.5516104 156.338199,74.4175344 L84.6672364,120.0922 C81.1218886,122.323199 78.6795938,125.943704 77.9387928,130.066574 C77.1913232,134.271925 78.1673502,138.601163 80.6469865,142.078963 C84.7438467,147.987899 92.0907405,150.71526 99.0509435,148.910997 C100.608143,148.493836 102.092543,147.841423 103.452857,146.976298 L130.798305,129.548621 C135.293566,126.685437 140.201191,124.528302 145.350175,123.152382 C168.451453,117.145935 192.846751,126.188743 206.451598,145.801356 C214.690583,157.332649 217.936027,171.697153 215.454914,185.650492 C212.997261,199.340539 204.888162,211.362752 193.115613,218.769811 L121.450695,264.442553 C116.951576,267.306662 112.040226,269.464598 106.887559,270.841265");
    			attr(path1, "fill", "#FFFFFF");
    			set_svg_attributes(svg, svg_data);
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, g);
    			append(g, path0);
    			append(g, path1);
    		},
    		p(ctx, [dirty]) {
    			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
    				{ width: "256px" },
    				{ height: "308px" },
    				{ viewBox: "0 0 256 308" },
    				{ version: "1.1" },
    				{ xmlns: "http://www.w3.org/2000/svg" },
    				{
    					"xmlns:xlink": "http://www.w3.org/1999/xlink"
    				},
    				{ preserveAspectRatio: "xMidYMid" },
    				dirty & /*$$props*/ 1 && /*$$props*/ ctx[0]
    			]));
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	$$self.$$set = $$new_props => {
    		$$invalidate(0, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    	};

    	$$props = exclude_internal_props($$props);
    	return [$$props];
    }

    class SvelteLogo extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, {});
    	}
    }

    /* src/components/css-icons/icon.svelte generated by Svelte v3.29.4 */

    const file = "src/components/css-icons/icon.svelte";

    function create_fragment$1(ctx) {
    	let i;
    	let i_class_value;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", i_class_value = "" + (null_to_empty(/*iClass*/ ctx[0]) + " svelte-1ato9so"));
    			add_location(i, file, 10, 0, 256);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*iClass*/ 1 && i_class_value !== (i_class_value = "" + (null_to_empty(/*iClass*/ ctx[0]) + " svelte-1ato9so"))) {
    				attr_dev(i, "class", i_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Icon", slots, []);
    	let { iClass = "gg-arrows-scroll-v" } = $$props;
    	let { size = ".6rem" } = $$props;
    	let { color = "#000" } = $$props;
    	const writable_props = ["iClass", "size", "color"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Icon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("iClass" in $$props) $$invalidate(0, iClass = $$props.iClass);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({ iClass, size, color });

    	$$self.$inject_state = $$props => {
    		if ("iClass" in $$props) $$invalidate(0, iClass = $$props.iClass);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size*/ 2) {
    			 document.documentElement.style.setProperty("--size", size);
    		}

    		if ($$self.$$.dirty & /*color*/ 4) {
    			 document.documentElement.style.setProperty("--color", color);
    		}
    	};

    	return [iClass, size, color];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { iClass: 0, size: 1, color: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get iClass() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iClass(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/buttons/toggler.svelte generated by Svelte v3.29.4 */
    const file$1 = "src/components/buttons/toggler.svelte";

    function create_fragment$2(ctx) {
    	let button;
    	let span;
    	let t0;
    	let t1;
    	let icon;
    	let button_class_value;
    	let current;
    	let mounted;
    	let dispose;

    	icon = new Icon({
    			props: {
    				iClass: "gg-arrows-scroll-v gg-arrows-scroll-down",
    				size: ".7rem",
    				color: "#000"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			button = element("button");
    			span = element("span");
    			t0 = text(/*title*/ ctx[1]);
    			t1 = space();
    			create_component(icon.$$.fragment);
    			attr_dev(span, "class", "svelte-1j2tkc0");
    			add_location(span, file$1, 32, 2, 891);
    			attr_dev(button, "class", button_class_value = "button " + /*customClass*/ ctx[0] + " svelte-1j2tkc0");
    			add_location(button, file$1, 28, 0, 820);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span);
    			append_dev(span, t0);
    			append_dev(button, t1);
    			mount_component(icon, button, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*toggleHandler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 2) set_data_dev(t0, /*title*/ ctx[1]);

    			if (!current || dirty & /*customClass*/ 1 && button_class_value !== (button_class_value = "button " + /*customClass*/ ctx[0] + " svelte-1j2tkc0")) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			destroy_component(icon);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Toggler", slots, []);
    	const dispatch = createEventDispatcher();

    	// when the handler is triggered in on:click
    	// can subscribe to the on:close message in our App.svelte
    	// and do what's needed
    	const toggleHandler = () => dispatch("toggle");

    	let { customClass = "" } = $$props;
    	let { title = "button" } = $$props;
    	let { padding = "" } = $$props;
    	let { background = "" } = $$props;
    	let { color = "" } = $$props;
    	let { fontSize = "" } = $$props;
    	const writable_props = ["customClass", "title", "padding", "background", "color", "fontSize"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Toggler> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("customClass" in $$props) $$invalidate(0, customClass = $$props.customClass);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("padding" in $$props) $$invalidate(3, padding = $$props.padding);
    		if ("background" in $$props) $$invalidate(4, background = $$props.background);
    		if ("color" in $$props) $$invalidate(5, color = $$props.color);
    		if ("fontSize" in $$props) $$invalidate(6, fontSize = $$props.fontSize);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		Icon,
    		dispatch,
    		toggleHandler,
    		customClass,
    		title,
    		padding,
    		background,
    		color,
    		fontSize
    	});

    	$$self.$inject_state = $$props => {
    		if ("customClass" in $$props) $$invalidate(0, customClass = $$props.customClass);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("padding" in $$props) $$invalidate(3, padding = $$props.padding);
    		if ("background" in $$props) $$invalidate(4, background = $$props.background);
    		if ("color" in $$props) $$invalidate(5, color = $$props.color);
    		if ("fontSize" in $$props) $$invalidate(6, fontSize = $$props.fontSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*padding, background, color, fontSize*/ 120) {
    			 {
    				document.documentElement.style.setProperty("--padding", padding);
    				document.documentElement.style.setProperty("--background", background);
    				document.documentElement.style.setProperty("--color", color);
    				document.documentElement.style.setProperty("--fontSize", fontSize);
    			}
    		}
    	};

    	return [customClass, title, toggleHandler, padding, background, color, fontSize];
    }

    class Toggler extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			customClass: 0,
    			title: 1,
    			padding: 3,
    			background: 4,
    			color: 5,
    			fontSize: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Toggler",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get customClass() {
    		throw new Error("<Toggler>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set customClass(value) {
    		throw new Error("<Toggler>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Toggler>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Toggler>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get padding() {
    		throw new Error("<Toggler>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set padding(value) {
    		throw new Error("<Toggler>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get background() {
    		throw new Error("<Toggler>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set background(value) {
    		throw new Error("<Toggler>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Toggler>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Toggler>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fontSize() {
    		throw new Error("<Toggler>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fontSize(value) {
    		throw new Error("<Toggler>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /** Dispatch event on click outside of node */
    function clickOutside(node) {

      const handleClick = e => {
        if(node && !node.contains(e.target) && !e.defaultPrevented) {
          node.dispatchEvent(
            new CustomEvent('click_outside', node)
          );
        }
      };

      document.addEventListener('click', handleClick, true);

      return {
        destroy() {
          document.removeEventListener('click', handleClick, true);
        }
    	}
    }

    /* src/components/header/navigation-dropdown.svelte generated by Svelte v3.29.4 */
    const file$2 = "src/components/header/navigation-dropdown.svelte";

    // (32:2) {#if show}
    function create_if_block(ctx) {
    	let ul;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let li2;
    	let t5;
    	let li3;
    	let t7;
    	let li4;

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Test content";
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "Test content";
    			t3 = space();
    			li2 = element("li");
    			li2.textContent = "Test content";
    			t5 = space();
    			li3 = element("li");
    			li3.textContent = "Test content";
    			t7 = space();
    			li4 = element("li");
    			li4.textContent = "Test content";
    			attr_dev(li0, "class", "dropdown__item svelte-spmf5f");
    			add_location(li0, file$2, 33, 6, 717);
    			attr_dev(li1, "class", "dropdown__item svelte-spmf5f");
    			add_location(li1, file$2, 34, 6, 768);
    			attr_dev(li2, "class", "dropdown__item svelte-spmf5f");
    			add_location(li2, file$2, 35, 6, 819);
    			attr_dev(li3, "class", "dropdown__item svelte-spmf5f");
    			add_location(li3, file$2, 36, 6, 870);
    			attr_dev(li4, "class", "dropdown__item svelte-spmf5f");
    			add_location(li4, file$2, 37, 6, 921);
    			attr_dev(ul, "class", "dropdown__container svelte-spmf5f");
    			add_location(ul, file$2, 32, 4, 678);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(ul, t5);
    			append_dev(ul, li3);
    			append_dev(ul, t7);
    			append_dev(ul, li4);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(32:2) {#if show}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let toggler;
    	let t;
    	let clickOutside_action;
    	let current;
    	let mounted;
    	let dispose;

    	toggler = new Toggler({
    			props: {
    				title: /*title*/ ctx[4],
    				padding: /*padding*/ ctx[2],
    				background: /*background*/ ctx[0],
    				color: /*color*/ ctx[1],
    				fontSize: /*fontSize*/ ctx[3]
    			},
    			$$inline: true
    		});

    	toggler.$on("toggle", /*toggle_handler*/ ctx[7]);
    	let if_block = /*show*/ ctx[5] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(toggler.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "dropdown svelte-spmf5f");
    			add_location(div, file$2, 18, 0, 410);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(toggler, div, null);
    			append_dev(div, t);
    			if (if_block) if_block.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(clickOutside_action = clickOutside.call(null, div)),
    					listen_dev(div, "click_outside", /*handleClickOutside*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const toggler_changes = {};
    			if (dirty & /*title*/ 16) toggler_changes.title = /*title*/ ctx[4];
    			if (dirty & /*padding*/ 4) toggler_changes.padding = /*padding*/ ctx[2];
    			if (dirty & /*background*/ 1) toggler_changes.background = /*background*/ ctx[0];
    			if (dirty & /*color*/ 2) toggler_changes.color = /*color*/ ctx[1];
    			if (dirty & /*fontSize*/ 8) toggler_changes.fontSize = /*fontSize*/ ctx[3];
    			toggler.$set(toggler_changes);

    			if (/*show*/ ctx[5]) {
    				if (if_block) ; else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toggler.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toggler.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(toggler);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Navigation_dropdown", slots, []);
    	let show = false;
    	let { background = "" } = $$props;
    	let { color = "" } = $$props;
    	let { padding = "" } = $$props;
    	let { fontSize = "" } = $$props;
    	let { title = "Dropdown" } = $$props;

    	// handles outside clicks
    	const handleClickOutside = () => $$invalidate(5, show = false);

    	const writable_props = ["background", "color", "padding", "fontSize", "title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navigation_dropdown> was created with unknown prop '${key}'`);
    	});

    	const toggle_handler = () => $$invalidate(5, show = !show);

    	$$self.$$set = $$props => {
    		if ("background" in $$props) $$invalidate(0, background = $$props.background);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("padding" in $$props) $$invalidate(2, padding = $$props.padding);
    		if ("fontSize" in $$props) $$invalidate(3, fontSize = $$props.fontSize);
    		if ("title" in $$props) $$invalidate(4, title = $$props.title);
    	};

    	$$self.$capture_state = () => ({
    		Toggler,
    		clickOutside,
    		show,
    		background,
    		color,
    		padding,
    		fontSize,
    		title,
    		handleClickOutside
    	});

    	$$self.$inject_state = $$props => {
    		if ("show" in $$props) $$invalidate(5, show = $$props.show);
    		if ("background" in $$props) $$invalidate(0, background = $$props.background);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("padding" in $$props) $$invalidate(2, padding = $$props.padding);
    		if ("fontSize" in $$props) $$invalidate(3, fontSize = $$props.fontSize);
    		if ("title" in $$props) $$invalidate(4, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		background,
    		color,
    		padding,
    		fontSize,
    		title,
    		show,
    		handleClickOutside,
    		toggle_handler
    	];
    }

    class Navigation_dropdown extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			background: 0,
    			color: 1,
    			padding: 2,
    			fontSize: 3,
    			title: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navigation_dropdown",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get background() {
    		throw new Error("<Navigation_dropdown>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set background(value) {
    		throw new Error("<Navigation_dropdown>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Navigation_dropdown>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Navigation_dropdown>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get padding() {
    		throw new Error("<Navigation_dropdown>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set padding(value) {
    		throw new Error("<Navigation_dropdown>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fontSize() {
    		throw new Error("<Navigation_dropdown>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fontSize(value) {
    		throw new Error("<Navigation_dropdown>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Navigation_dropdown>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Navigation_dropdown>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/header/navigation.svelte generated by Svelte v3.29.4 */
    const file$3 = "src/components/header/navigation.svelte";

    function create_fragment$4(ctx) {
    	let nav;
    	let ul;
    	let li0;
    	let a0;
    	let t1;
    	let li1;
    	let navigationdropdown;
    	let t2;
    	let li2;
    	let a1;
    	let t4;
    	let li3;
    	let a2;
    	let current;

    	navigationdropdown = new Navigation_dropdown({
    			props: {
    				title: "Awesome Dropdown",
    				fontSize: "1.6rem"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Home";
    			t1 = space();
    			li1 = element("li");
    			create_component(navigationdropdown.$$.fragment);
    			t2 = space();
    			li2 = element("li");
    			a1 = element("a");
    			a1.textContent = "LINK";
    			t4 = space();
    			li3 = element("li");
    			a2 = element("a");
    			a2.textContent = "LINK";
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "navigation__anchor svelte-12bkki6");
    			add_location(a0, file$3, 7, 6, 191);
    			attr_dev(li0, "class", "navigation__listItem svelte-12bkki6");
    			add_location(li0, file$3, 6, 4, 151);
    			attr_dev(li1, "class", "navigation__listItem navDropdown svelte-12bkki6");
    			add_location(li1, file$3, 9, 4, 253);
    			attr_dev(a1, "href", "/");
    			attr_dev(a1, "class", "navigation__anchor svelte-12bkki6");
    			add_location(a1, file$3, 16, 6, 450);
    			attr_dev(li2, "class", "navigation__listItem svelte-12bkki6");
    			add_location(li2, file$3, 15, 4, 410);
    			attr_dev(a2, "href", "/");
    			attr_dev(a2, "class", "navigation__anchor svelte-12bkki6");
    			add_location(a2, file$3, 19, 6, 552);
    			attr_dev(li3, "class", "navigation__listItem svelte-12bkki6");
    			add_location(li3, file$3, 18, 4, 512);
    			attr_dev(ul, "class", "navigation__container svelte-12bkki6");
    			add_location(ul, file$3, 5, 2, 112);
    			attr_dev(nav, "class", "navigation");
    			add_location(nav, file$3, 4, 0, 85);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			mount_component(navigationdropdown, li1, null);
    			append_dev(ul, t2);
    			append_dev(ul, li2);
    			append_dev(li2, a1);
    			append_dev(ul, t4);
    			append_dev(ul, li3);
    			append_dev(li3, a2);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navigationdropdown.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navigationdropdown.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_component(navigationdropdown);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Navigation", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navigation> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ NavigationDropdown: Navigation_dropdown });
    	return [];
    }

    class Navigation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navigation",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/grid-container.svelte generated by Svelte v3.29.4 */

    const file$4 = "src/components/grid-container.svelte";
    const get_content_slot_changes = dirty => ({});
    const get_content_slot_context = ctx => ({});

    function create_fragment$5(ctx) {
    	let div;
    	let current;
    	const content_slot_template = /*#slots*/ ctx[8].content;
    	const content_slot = create_slot(content_slot_template, ctx, /*$$scope*/ ctx[7], get_content_slot_context);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (content_slot) content_slot.c();
    			attr_dev(div, "class", "stronghold svelte-yh7bbs");
    			add_location(div, file$4, 43, 0, 1043);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (content_slot) {
    				content_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (content_slot) {
    				if (content_slot.p && dirty & /*$$scope*/ 128) {
    					update_slot(content_slot, content_slot_template, ctx, /*$$scope*/ ctx[7], dirty, get_content_slot_changes, get_content_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(content_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(content_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (content_slot) content_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Grid_container", slots, ['content']);
    	let { display = "flex" } = $$props;
    	let { templateColumns = "1fr 1fr" } = $$props;
    	let { templateRows = "auto" } = $$props;
    	let { alignItems = "start" } = $$props;
    	let { justifyItems = "start" } = $$props;
    	let { justifyContent = "start" } = $$props;
    	let { gap = "2" } = $$props;

    	const writable_props = [
    		"display",
    		"templateColumns",
    		"templateRows",
    		"alignItems",
    		"justifyItems",
    		"justifyContent",
    		"gap"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Grid_container> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("display" in $$props) $$invalidate(0, display = $$props.display);
    		if ("templateColumns" in $$props) $$invalidate(1, templateColumns = $$props.templateColumns);
    		if ("templateRows" in $$props) $$invalidate(2, templateRows = $$props.templateRows);
    		if ("alignItems" in $$props) $$invalidate(3, alignItems = $$props.alignItems);
    		if ("justifyItems" in $$props) $$invalidate(4, justifyItems = $$props.justifyItems);
    		if ("justifyContent" in $$props) $$invalidate(5, justifyContent = $$props.justifyContent);
    		if ("gap" in $$props) $$invalidate(6, gap = $$props.gap);
    		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		display,
    		templateColumns,
    		templateRows,
    		alignItems,
    		justifyItems,
    		justifyContent,
    		gap
    	});

    	$$self.$inject_state = $$props => {
    		if ("display" in $$props) $$invalidate(0, display = $$props.display);
    		if ("templateColumns" in $$props) $$invalidate(1, templateColumns = $$props.templateColumns);
    		if ("templateRows" in $$props) $$invalidate(2, templateRows = $$props.templateRows);
    		if ("alignItems" in $$props) $$invalidate(3, alignItems = $$props.alignItems);
    		if ("justifyItems" in $$props) $$invalidate(4, justifyItems = $$props.justifyItems);
    		if ("justifyContent" in $$props) $$invalidate(5, justifyContent = $$props.justifyContent);
    		if ("gap" in $$props) $$invalidate(6, gap = $$props.gap);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*display*/ 1) {
    			 document.documentElement.style.setProperty("--display", display);
    		}

    		if ($$self.$$.dirty & /*templateColumns, templateRows*/ 6) {
    			 {
    				document.documentElement.style.setProperty("--template-columns", templateColumns);
    				document.documentElement.style.setProperty("--template-rows", templateRows);
    			}
    		}

    		if ($$self.$$.dirty & /*alignItems, justifyItems, justifyContent*/ 56) {
    			 {
    				document.documentElement.style.setProperty("--align-items", alignItems);
    				document.documentElement.style.setProperty("--justify-items", justifyItems);
    				document.documentElement.style.setProperty("--justify-content", justifyContent);
    			}
    		}

    		if ($$self.$$.dirty & /*gap*/ 64) {
    			 document.documentElement.style.setProperty("--gap", gap);
    		}
    	};

    	return [
    		display,
    		templateColumns,
    		templateRows,
    		alignItems,
    		justifyItems,
    		justifyContent,
    		gap,
    		$$scope,
    		slots
    	];
    }

    class Grid_container extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			display: 0,
    			templateColumns: 1,
    			templateRows: 2,
    			alignItems: 3,
    			justifyItems: 4,
    			justifyContent: 5,
    			gap: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Grid_container",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get display() {
    		throw new Error("<Grid_container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set display(value) {
    		throw new Error("<Grid_container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get templateColumns() {
    		throw new Error("<Grid_container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set templateColumns(value) {
    		throw new Error("<Grid_container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get templateRows() {
    		throw new Error("<Grid_container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set templateRows(value) {
    		throw new Error("<Grid_container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get alignItems() {
    		throw new Error("<Grid_container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set alignItems(value) {
    		throw new Error("<Grid_container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get justifyItems() {
    		throw new Error("<Grid_container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set justifyItems(value) {
    		throw new Error("<Grid_container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get justifyContent() {
    		throw new Error("<Grid_container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set justifyContent(value) {
    		throw new Error("<Grid_container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gap() {
    		throw new Error("<Grid_container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gap(value) {
    		throw new Error("<Grid_container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/header/header.svelte generated by Svelte v3.29.4 */

    const file$5 = "src/components/header/header.svelte";

    // (19:4) <div class="nav-wrapper" slot="content">
    function create_content_slot(ctx) {
    	let div0;
    	let logo;
    	let div1;
    	let navigation;
    	let current;

    	logo = new SvelteLogo({
    			props: { width: "50", height: "50" },
    			$$inline: true
    		});

    	navigation = new Navigation({ $$inline: true });

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(logo.$$.fragment);
    			div1 = element("div");
    			create_component(navigation.$$.fragment);
    			attr_dev(div0, "class", "logo-wrapper");
    			attr_dev(div0, "slot", "content");
    			add_location(div0, file$5, 15, 4, 340);
    			attr_dev(div1, "class", "nav-wrapper");
    			attr_dev(div1, "slot", "content");
    			add_location(div1, file$5, 18, 4, 435);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(logo, div0, null);
    			insert_dev(target, div1, anchor);
    			mount_component(navigation, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(logo.$$.fragment, local);
    			transition_in(navigation.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(logo.$$.fragment, local);
    			transition_out(navigation.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(logo);
    			if (detaching) detach_dev(div1);
    			destroy_component(navigation);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_content_slot.name,
    		type: "slot",
    		source: "(19:4) <div class=\\\"nav-wrapper\\\" slot=\\\"content\\\">",
    		ctx
    	});

    	return block;
    }

    // (10:2) <Stronghold     display="grid"     templateColumns="auto 1fr"     alignItems="center"     gap="4rem"   >
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(10:2) <Stronghold     display=\\\"grid\\\"     templateColumns=\\\"auto 1fr\\\"     alignItems=\\\"center\\\"     gap=\\\"4rem\\\"   >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let header;
    	let stronghold;
    	let current;

    	stronghold = new Grid_container({
    			props: {
    				display: "grid",
    				templateColumns: "auto 1fr",
    				alignItems: "center",
    				gap: "4rem",
    				$$slots: {
    					default: [create_default_slot],
    					content: [create_content_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			header = element("header");
    			create_component(stronghold.$$.fragment);
    			attr_dev(header, "class", "header svelte-1k7p7f9");
    			add_location(header, file$5, 8, 0, 205);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			mount_component(stronghold, header, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const stronghold_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				stronghold_changes.$$scope = { dirty, ctx };
    			}

    			stronghold.$set(stronghold_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(stronghold.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(stronghold.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(stronghold);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Logo: SvelteLogo, Navigation, Stronghold: Grid_container });
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/title.svelte generated by Svelte v3.29.4 */

    const file$6 = "src/components/title.svelte";

    function create_fragment$7(ctx) {
    	let h2;
    	let t;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t = text(/*text*/ ctx[0]);
    			attr_dev(h2, "class", "title svelte-1s8eru4");
    			add_location(h2, file$6, 6, 0, 75);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 1) set_data_dev(t, /*text*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Title", slots, []);
    	let { text = "You need to specify a title" } = $$props;
    	const writable_props = ["text"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Title> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    	};

    	$$self.$capture_state = () => ({ text });

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text];
    }

    class Title extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { text: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get text() {
    		throw new Error("<Title>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Title>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/static/svg/rocket.svg generated by Svelte v3.29.4 */

    function create_fragment$8(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let path2;
    	let g0;
    	let path3;
    	let path4;
    	let path5;
    	let path6;
    	let path7;
    	let path8;
    	let path9;
    	let path10;
    	let path11;
    	let path12;
    	let path13;
    	let path14;
    	let path15;
    	let g1;
    	let g2;
    	let g3;
    	let g4;
    	let g5;
    	let g6;
    	let g7;
    	let g8;
    	let g9;
    	let g10;
    	let g11;
    	let g12;
    	let g13;
    	let g14;
    	let g15;

    	let svg_levels = [
    		{ version: "1.1" },
    		{ id: "Capa_1" },
    		{ xmlns: "http://www.w3.org/2000/svg" },
    		{
    			"xmlns:xlink": "http://www.w3.org/1999/xlink"
    		},
    		{ x: "0px" },
    		{ y: "0px" },
    		{ viewBox: "0 0 512.001 512.001" },
    		{
    			style: "enable-background:new 0 0 512.001 512.001;"
    		},
    		{ "xml:space": "preserve" },
    		/*$$props*/ ctx[0]
    	];

    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	return {
    		c() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			g0 = svg_element("g");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			path12 = svg_element("path");
    			path13 = svg_element("path");
    			path14 = svg_element("path");
    			path15 = svg_element("path");
    			g1 = svg_element("g");
    			g2 = svg_element("g");
    			g3 = svg_element("g");
    			g4 = svg_element("g");
    			g5 = svg_element("g");
    			g6 = svg_element("g");
    			g7 = svg_element("g");
    			g8 = svg_element("g");
    			g9 = svg_element("g");
    			g10 = svg_element("g");
    			g11 = svg_element("g");
    			g12 = svg_element("g");
    			g13 = svg_element("g");
    			g14 = svg_element("g");
    			g15 = svg_element("g");
    			this.h();
    		},
    		l(nodes) {
    			svg = claim_element(
    				nodes,
    				"svg",
    				{
    					version: true,
    					id: true,
    					xmlns: true,
    					"xmlns:xlink": true,
    					x: true,
    					y: true,
    					viewBox: true,
    					style: true,
    					"xml:space": true
    				},
    				1
    			);

    			var svg_nodes = children(svg);
    			path0 = claim_element(svg_nodes, "path", { style: true, d: true }, 1);
    			children(path0).forEach(detach);
    			path1 = claim_element(svg_nodes, "path", { style: true, d: true }, 1);
    			children(path1).forEach(detach);
    			path2 = claim_element(svg_nodes, "path", { style: true, d: true }, 1);
    			children(path2).forEach(detach);
    			g0 = claim_element(svg_nodes, "g", {}, 1);
    			var g0_nodes = children(g0);
    			path3 = claim_element(g0_nodes, "path", { style: true, d: true }, 1);
    			children(path3).forEach(detach);
    			path4 = claim_element(g0_nodes, "path", { style: true, d: true }, 1);
    			children(path4).forEach(detach);
    			path5 = claim_element(g0_nodes, "path", { style: true, d: true }, 1);
    			children(path5).forEach(detach);
    			g0_nodes.forEach(detach);
    			path6 = claim_element(svg_nodes, "path", { style: true, d: true }, 1);
    			children(path6).forEach(detach);
    			path7 = claim_element(svg_nodes, "path", { d: true }, 1);
    			children(path7).forEach(detach);
    			path8 = claim_element(svg_nodes, "path", { d: true }, 1);
    			children(path8).forEach(detach);
    			path9 = claim_element(svg_nodes, "path", { d: true }, 1);
    			children(path9).forEach(detach);
    			path10 = claim_element(svg_nodes, "path", { d: true }, 1);
    			children(path10).forEach(detach);
    			path11 = claim_element(svg_nodes, "path", { d: true }, 1);
    			children(path11).forEach(detach);
    			path12 = claim_element(svg_nodes, "path", { d: true }, 1);
    			children(path12).forEach(detach);
    			path13 = claim_element(svg_nodes, "path", { d: true }, 1);
    			children(path13).forEach(detach);
    			path14 = claim_element(svg_nodes, "path", { d: true }, 1);
    			children(path14).forEach(detach);
    			path15 = claim_element(svg_nodes, "path", { d: true }, 1);
    			children(path15).forEach(detach);
    			g1 = claim_element(svg_nodes, "g", {}, 1);
    			var g1_nodes = children(g1);
    			g1_nodes.forEach(detach);
    			g2 = claim_element(svg_nodes, "g", {}, 1);
    			var g2_nodes = children(g2);
    			g2_nodes.forEach(detach);
    			g3 = claim_element(svg_nodes, "g", {}, 1);
    			var g3_nodes = children(g3);
    			g3_nodes.forEach(detach);
    			g4 = claim_element(svg_nodes, "g", {}, 1);
    			var g4_nodes = children(g4);
    			g4_nodes.forEach(detach);
    			g5 = claim_element(svg_nodes, "g", {}, 1);
    			var g5_nodes = children(g5);
    			g5_nodes.forEach(detach);
    			g6 = claim_element(svg_nodes, "g", {}, 1);
    			var g6_nodes = children(g6);
    			g6_nodes.forEach(detach);
    			g7 = claim_element(svg_nodes, "g", {}, 1);
    			var g7_nodes = children(g7);
    			g7_nodes.forEach(detach);
    			g8 = claim_element(svg_nodes, "g", {}, 1);
    			var g8_nodes = children(g8);
    			g8_nodes.forEach(detach);
    			g9 = claim_element(svg_nodes, "g", {}, 1);
    			var g9_nodes = children(g9);
    			g9_nodes.forEach(detach);
    			g10 = claim_element(svg_nodes, "g", {}, 1);
    			var g10_nodes = children(g10);
    			g10_nodes.forEach(detach);
    			g11 = claim_element(svg_nodes, "g", {}, 1);
    			var g11_nodes = children(g11);
    			g11_nodes.forEach(detach);
    			g12 = claim_element(svg_nodes, "g", {}, 1);
    			var g12_nodes = children(g12);
    			g12_nodes.forEach(detach);
    			g13 = claim_element(svg_nodes, "g", {}, 1);
    			var g13_nodes = children(g13);
    			g13_nodes.forEach(detach);
    			g14 = claim_element(svg_nodes, "g", {}, 1);
    			var g14_nodes = children(g14);
    			g14_nodes.forEach(detach);
    			g15 = claim_element(svg_nodes, "g", {}, 1);
    			var g15_nodes = children(g15);
    			g15_nodes.forEach(detach);
    			svg_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			set_style(path0, "fill", "#FF5249");
    			attr(path0, "d", "M501.752,10.001c0,0-1.93,53.83-24.3,117.12l-92.82-92.82\r\n\tC447.922,11.931,501.752,10.001,501.752,10.001z");
    			set_style(path1, "fill", "#FFFFFF");
    			attr(path1, "d", "M384.632,34.301l92.82,92.82c-14.54,41.18-37.75,86.36-74.69,123.3\r\n\tc-34.041,34.041-74.993,61.29-117.81,80.18l-103.8-103.8c12.64-28.65,30.28-59.22,53.59-88.17c8.16-10.13,17.01-20.06,26.59-29.64\r\n\tC298.272,72.051,343.452,48.841,384.632,34.301z");
    			set_style(path2, "fill", "#7BD8E8");
    			attr(path2, "d", "M388.612,123.141c15.62,15.62,15.62,40.95,0,56.57s-40.94,15.62-56.57,0\r\n\tc-15.62-15.63-15.62-40.95,0-56.57S372.992,107.521,388.612,123.141z");
    			set_style(path3, "fill", "#FF5249");
    			attr(path3, "d", "M374.472,278.701c51.54,77.31-44.94,127.28-98.99,127.28c28.28-28.28,20.02-64.83,20.02-64.83\r\n\t\tl-10.55-10.55c28.65-12.64,59.22-30.28,88.17-53.59L374.472,278.701z");
    			set_style(path4, "fill", "#FF5249");
    			attr(path4, "d", "M169.532,300.041l-1.62-1.62c-4.78-4.79-7.13-11.73-5.45-18.29c4.17-16.24,10.33-34.36,18.69-53.33\r\n\t\tl103.8,103.8c-18.97,8.36-37.09,14.52-53.33,18.69c-6.56,1.68-13.5-0.67-18.29-5.45l-1.62-1.62L169.532,300.041z");
    			set_style(path5, "fill", "#FF5249");
    			attr(path5, "d", "M233.052,137.281l1.69,1.35c-23.31,28.95-40.95,59.52-53.59,88.17l-10.55-10.55\r\n\t\tc0,0-36.55-8.26-64.83,20.02C105.772,182.221,155.742,85.741,233.052,137.281z");
    			set_style(path6, "fill", "#FFDD78");
    			attr(path6, "d", "M169.532,300.041l42.18,42.18c-3.03,11.99-10.22,24.61-21.09,35.48\r\n\tc-23.43,23.43-84.85,28.28-84.85,28.28s4.85-61.42,28.28-84.85C144.922,310.261,157.542,303.071,169.532,300.041z");
    			attr(path7, "d", "M268.662,257.491c3.9-3.91,3.9-10.24,0-14.14c-3.91-3.91-10.24-3.91-14.15,0c-3.9,3.9-3.9,10.23,0,14.14\r\n\tC258.422,261.391,264.752,261.391,268.662,257.491z");
    			attr(path8, "d", "M395.933,186.782c19.538-19.538,19.542-51.171,0-70.712c-19.54-19.539-51.172-19.54-70.713,0\r\n\tc-19.489,19.489-19.49,51.209,0.003,70.714C344.719,206.268,376.439,206.276,395.933,186.782z M339.363,130.212\r\n\tc11.723-11.723,30.703-11.725,42.428,0c11.723,11.722,11.725,30.703,0,42.427c-11.693,11.694-30.727,11.694-42.426,0.002\r\n\tC327.67,160.939,327.669,141.905,339.363,130.212z");
    			attr(path9, "d", "M102.194,245.509c1.237,0.513,2.537,0.762,3.825,0.762c2.603,0,5.16-1.017,7.073-2.929\r\n\tc20.083-20.083,44.854-18.827,52.946-17.763l3.502,3.502c-6.892,16.4-12.444,32.708-16.516,48.569\r\n\tc-1.47,5.74-0.974,11.814,1.211,17.37c-9.628,4.437-18.917,10.952-27.005,19.04c-25.741,25.742-30.968,88.476-31.178,91.134\r\n\tc-0.23,2.917,0.828,5.789,2.897,7.858c1.883,1.882,4.43,2.929,7.07,2.929c0.262,0,0.525-0.01,0.788-0.031\r\n\tc2.658-0.209,65.394-5.436,91.135-31.177c8.085-8.085,14.599-17.373,19.036-26.999c5.882,2.313,11.936,2.598,17.38,1.203\r\n\tc15.854-4.071,32.16-9.621,48.562-16.514l3.502,3.502c1.063,8.093,2.319,32.864-17.763,52.945c-2.859,2.86-3.715,7.161-2.167,10.897\r\n\tc1.547,3.737,5.193,6.173,9.238,6.173c39.58,0,94.915-23.571,115.295-61.652c8.851-16.537,14.877-42.699-4.341-75.348\r\n\tc8.147-6.886,15.994-14.086,23.396-21.488c33.02-33.02,58.942-75.763,77.048-127.039c22.62-63.998,24.783-117.834,24.864-120.094\r\n\tc0.1-2.775-0.959-5.466-2.922-7.43c-1.964-1.963-4.644-3.027-7.43-2.922c-2.261,0.081-56.096,2.245-120.091,24.864\r\n\tc-51.28,18.106-94.023,44.029-127.042,77.049c-7.399,7.399-14.599,15.245-21.488,23.396c-32.648-19.218-58.81-13.192-75.349-4.341\r\n\tc-38.081,20.38-61.652,75.716-61.652,115.296C96.021,240.315,98.458,243.962,102.194,245.509z M183.8,370.63\r\n\tc-13.75,13.75-46.005,21.002-66.392,23.963c2.962-20.388,10.215-52.642,23.964-66.391c7.7-7.7,16.628-13.538,25.602-16.826\r\n\tl33.652,33.652C197.338,354.002,191.501,362.93,183.8,370.63z M229.39,339.603c-2.894,0.741-6.246-0.347-8.738-2.835\r\n\tc-48.541-48.54,13.77,13.771-45.412-45.412c-2.494-2.499-3.582-5.85-2.843-8.739c3.203-12.474,7.392-25.272,12.486-38.193\r\n\tl82.695,82.695C254.655,332.214,241.859,336.402,229.39,339.603z M373.394,344.891c-13.102,24.479-46.09,42.523-76.152,48.734\r\n\tc9.585-18.037,11.698-40.998,8.196-54.921c-0.813-3.234-2.923-4.86-3.041-5.051c24.233-11.737,47.182-25.818,68.486-42.015\r\n\tC381.29,310.652,382.147,328.535,373.394,344.891z M473.311,108.587l-69.896-69.896c38.081-11.828,71.21-16.257,87.746-17.849\r\n\tC489.568,37.381,485.138,70.51,473.311,108.587z M268.653,116.062c29.625-29.626,67.859-53.204,113.671-70.176l83.792,83.792\r\n\tc-16.97,45.811-40.548,84.045-70.176,113.672c-9.011,9.01-18.714,17.715-28.84,25.872c-24.342,19.6-51.134,36.202-79.718,49.418\r\n\tl-94.02-94.018c13.216-28.586,29.818-55.378,49.416-79.717C250.942,134.772,259.646,125.068,268.653,116.062z M167.111,138.608\r\n\tc16.359-8.754,34.24-7.896,53.252,2.511c-16.197,21.302-30.278,44.252-42.015,68.487c-0.149-0.092-1.949-2.355-5.293-3.109\r\n\tc-1.375-0.311-27.834-6.002-54.679,8.265C124.588,184.699,142.631,151.71,167.111,138.608z");
    			attr(path10, "d", "M212.093,455.481l28.28-28.29c3.904-3.906,3.903-10.238-0.002-14.142c-3.907-3.905-10.239-3.903-14.143,0.002l-28.28,28.29\r\n\tc-3.904,3.906-3.903,10.238,0.002,14.142C201.857,459.387,208.189,459.387,212.093,455.481z");
    			attr(path11, "d", "M70.661,314.053l28.29-28.28c3.906-3.904,3.907-10.236,0.003-14.142s-10.235-3.906-14.142-0.002l-28.29,28.28\r\n\tc-3.906,3.904-3.907,10.236-0.003,14.142C60.422,317.955,66.753,317.959,70.661,314.053z");
    			attr(path12, "d", "M155.521,427.199l-67.74,67.73c-3.906,3.905-3.906,10.237-0.001,14.142c3.903,3.905,10.236,3.907,14.142,0.001l67.74-67.73\r\n\tc3.906-3.905,3.906-10.237,0.001-14.142C165.76,423.295,159.427,423.295,155.521,427.199z");
    			attr(path13, "d", "M75.521,427.199l-67.74,67.73c-3.906,3.905-3.906,10.237-0.001,14.142c3.903,3.905,10.236,3.907,14.142,0.001l67.74-67.73\r\n\tc3.906-3.905,3.906-10.237,0.001-14.142C85.759,423.295,79.426,423.295,75.521,427.199z");
    			attr(path14, "d", "M17.073,424.221l67.73-67.74c3.905-3.906,3.905-10.237-0.001-14.143c-3.904-3.904-10.237-3.904-14.142,0.001l-67.73,67.74\r\n\tc-3.905,3.906-3.905,10.237,0.001,14.143C6.836,428.127,13.168,428.127,17.073,424.221z");
    			attr(path15, "d", "M296.943,229.202l14.14-14.14c3.905-3.905,3.905-10.237,0-14.143c-3.906-3.905-10.236-3.905-14.143,0l-14.14,14.14\r\n\tc-3.905,3.905-3.905,10.237,0,14.143C286.706,233.107,293.037,233.107,296.943,229.202z");
    			set_svg_attributes(svg, svg_data);
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path0);
    			append(svg, path1);
    			append(svg, path2);
    			append(svg, g0);
    			append(g0, path3);
    			append(g0, path4);
    			append(g0, path5);
    			append(svg, path6);
    			append(svg, path7);
    			append(svg, path8);
    			append(svg, path9);
    			append(svg, path10);
    			append(svg, path11);
    			append(svg, path12);
    			append(svg, path13);
    			append(svg, path14);
    			append(svg, path15);
    			append(svg, g1);
    			append(svg, g2);
    			append(svg, g3);
    			append(svg, g4);
    			append(svg, g5);
    			append(svg, g6);
    			append(svg, g7);
    			append(svg, g8);
    			append(svg, g9);
    			append(svg, g10);
    			append(svg, g11);
    			append(svg, g12);
    			append(svg, g13);
    			append(svg, g14);
    			append(svg, g15);
    		},
    		p(ctx, [dirty]) {
    			set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
    				{ version: "1.1" },
    				{ id: "Capa_1" },
    				{ xmlns: "http://www.w3.org/2000/svg" },
    				{
    					"xmlns:xlink": "http://www.w3.org/1999/xlink"
    				},
    				{ x: "0px" },
    				{ y: "0px" },
    				{ viewBox: "0 0 512.001 512.001" },
    				{
    					style: "enable-background:new 0 0 512.001 512.001;"
    				},
    				{ "xml:space": "preserve" },
    				dirty & /*$$props*/ 1 && /*$$props*/ ctx[0]
    			]));
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    function instance$8($$self, $$props, $$invalidate) {
    	$$self.$$set = $$new_props => {
    		$$invalidate(0, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    	};

    	$$props = exclude_internal_props($$props);
    	return [$$props];
    }

    class Rocket extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});
    	}
    }

    /* src/exercises/looping-a-triangle.svelte generated by Svelte v3.29.4 */

    const { console: console_1 } = globals;
    const file$7 = "src/exercises/looping-a-triangle.svelte";

    function create_fragment$9(ctx) {
    	let div;
    	let rocket;
    	let t0;
    	let title;
    	let t1;
    	let t2_value = renderSymbol(/*hash*/ ctx[1]) + "";
    	let t2;
    	let current;
    	rocket = new Rocket({ props: { width: "20" }, $$inline: true });

    	title = new Title({
    			props: { text: /*componentTitle*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(rocket.$$.fragment);
    			t0 = space();
    			create_component(title.$$.fragment);
    			t1 = space();
    			t2 = text(t2_value);
    			attr_dev(div, "class", "foo svelte-13s9fdh");
    			add_location(div, file$7, 33, 0, 738);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(rocket, div, null);
    			append_dev(div, t0);
    			mount_component(title, div, null);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(rocket.$$.fragment, local);
    			transition_in(title.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rocket.$$.fragment, local);
    			transition_out(title.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(rocket);
    			destroy_component(title);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function renderSymbol(symbol) {
    	let result;
    	symbol = symbol;

    	for (let i = 0; i < 7; i++) {
    		result = i === 0 ? symbol = "#" : symbol += "#";
    		console.log(result);
    	}
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Looping_a_triangle", slots, []);
    	let componentTitle = "Looping a trinagle with JS";
    	let hash = "#";
    	
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Looping_a_triangle> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Title,
    		Rocket,
    		componentTitle,
    		hash,
    		renderSymbol
    	});

    	$$self.$inject_state = $$props => {
    		if ("componentTitle" in $$props) $$invalidate(0, componentTitle = $$props.componentTitle);
    		if ("hash" in $$props) $$invalidate(1, hash = $$props.hash);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [componentTitle, hash];
    }

    class Looping_a_triangle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Looping_a_triangle",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/exercises/fizz-buzz.svelte generated by Svelte v3.29.4 */

    const { console: console_1$1 } = globals;
    const file$8 = "src/exercises/fizz-buzz.svelte";

    function create_fragment$a(ctx) {
    	let div;
    	let rocket;
    	let t0;
    	let title;
    	let t1;
    	let p;
    	let t3;
    	let t4_value = render() + "";
    	let t4;
    	let div_class_value;
    	let current;
    	rocket = new Rocket({ props: { width: "20" }, $$inline: true });

    	title = new Title({
    			props: { text: /*componentTitle*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(rocket.$$.fragment);
    			t0 = space();
    			create_component(title.$$.fragment);
    			t1 = space();
    			p = element("p");
    			p.textContent = "Lorem ipson";
    			t3 = space();
    			t4 = text(t4_value);
    			attr_dev(p, "class", "description svelte-5hrkct");
    			add_location(p, file$8, 45, 2, 1341);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*containerClasses*/ ctx[1]) + " svelte-5hrkct"));
    			add_location(div, file$8, 42, 0, 1248);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(rocket, div, null);
    			append_dev(div, t0);
    			mount_component(title, div, null);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(div, t3);
    			append_dev(div, t4);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(rocket.$$.fragment, local);
    			transition_in(title.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rocket.$$.fragment, local);
    			transition_out(title.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(rocket);
    			destroy_component(title);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function render() {
    	for (let i = 1; i <= 100; i++) {
    		if (i % 3 === 0 && i % 5 === 0) {
    			console.log("FizzBuzz");
    		} else {
    			if (i % 3 === 0) {
    				console.log("Fizz");
    			} else if (!i % 3 === 0 && i % 5 === 0) {
    				console.log("Buzz");
    			} else {
    				console.log(i);
    			}
    		}
    	}
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Fizz_buzz", slots, []);
    	let componentTitle = "Fizz Buzz exercise with js";
    	let containerClasses = `foo flex`;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Fizz_buzz> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Title,
    		Rocket,
    		componentTitle,
    		containerClasses,
    		render
    	});

    	$$self.$inject_state = $$props => {
    		if ("componentTitle" in $$props) $$invalidate(0, componentTitle = $$props.componentTitle);
    		if ("containerClasses" in $$props) $$invalidate(1, containerClasses = $$props.containerClasses);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [componentTitle, containerClasses];
    }

    class Fizz_buzz extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Fizz_buzz",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/exercises/chessboard.svelte generated by Svelte v3.29.4 */
    const file$9 = "src/exercises/chessboard.svelte";

    function create_fragment$b(ctx) {
    	let div;
    	let rocket;
    	let t0;
    	let title;
    	let t1;
    	let p;
    	let div_class_value;
    	let current;
    	rocket = new Rocket({ props: { width: "20" }, $$inline: true });

    	title = new Title({
    			props: { text: /*componentTitle*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(rocket.$$.fragment);
    			t0 = space();
    			create_component(title.$$.fragment);
    			t1 = space();
    			p = element("p");
    			p.textContent = "Lorem ipson";
    			attr_dev(p, "class", "description svelte-5hrkct");
    			add_location(p, file$9, 26, 2, 867);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*containerClasses*/ ctx[1]) + " svelte-5hrkct"));
    			add_location(div, file$9, 23, 0, 774);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(rocket, div, null);
    			append_dev(div, t0);
    			mount_component(title, div, null);
    			append_dev(div, t1);
    			append_dev(div, p);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(rocket.$$.fragment, local);
    			transition_in(title.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rocket.$$.fragment, local);
    			transition_out(title.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(rocket);
    			destroy_component(title);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Chessboard", slots, []);
    	let componentTitle = "Chessboard exercise with js";
    	let containerClasses = `foo flex`;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Chessboard> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Title,
    		Rocket,
    		componentTitle,
    		containerClasses
    	});

    	$$self.$inject_state = $$props => {
    		if ("componentTitle" in $$props) $$invalidate(0, componentTitle = $$props.componentTitle);
    		if ("containerClasses" in $$props) $$invalidate(1, containerClasses = $$props.containerClasses);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [componentTitle, containerClasses];
    }

    class Chessboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chessboard",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/exercises/minimum.svelte generated by Svelte v3.29.4 */

    const { console: console_1$2 } = globals;
    const file$a = "src/exercises/minimum.svelte";

    function create_fragment$c(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "I am a banana !";
    			add_location(p, file$a, 16, 0, 370);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Minimum", slots, []);

    	let minFunc = (a, b) => {
    		let result = a < b ? a : b;
    		return result;
    	};

    	console.log("===minimun: ", minFunc(10, 2));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Minimum> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ minFunc });

    	$$self.$inject_state = $$props => {
    		if ("minFunc" in $$props) minFunc = $$props.minFunc;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class Minimum extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Minimum",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/exercises/isEven.svelte generated by Svelte v3.29.4 */

    const { console: console_1$3 } = globals;
    const file$b = "src/exercises/isEven.svelte";

    function create_fragment$d(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Recursion";
    			add_location(p, file$b, 22, 0, 833);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("IsEven", slots, []);
    	let isEven = a => a % 2 === 0 ? true : false;
    	console.log("===is this even :", isEven(30));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<IsEven> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ isEven });

    	$$self.$inject_state = $$props => {
    		if ("isEven" in $$props) isEven = $$props.isEven;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class IsEven extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IsEven",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src/exercises/beanCounting.svelte generated by Svelte v3.29.4 */

    const { console: console_1$4 } = globals;
    const file$c = "src/exercises/beanCounting.svelte";

    function create_fragment$e(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Bean Counting";
    			add_location(p, file$c, 32, 0, 1170);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BeanCounting", slots, []);

    	let countB = (s, c) => {
    		let charToCompare = String(c);
    		let found = [];

    		for (let i = 0; i < s.length; i++) {
    			let char = s[i];

    			if (char === charToCompare) {
    				found.push(char);
    			}
    		}

    		console.log("===show me the char", found.length);
    	};

    	console.log(countB("BbccccbbBBBbb bb cccc bB bbCCbb bbb BBB", "c"));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$4.warn(`<BeanCounting> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ countB });

    	$$self.$inject_state = $$props => {
    		if ("countB" in $$props) countB = $$props.countB;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class BeanCounting extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BeanCounting",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src/components/card/card-logo.svelte generated by Svelte v3.29.4 */

    const file$d = "src/components/card/card-logo.svelte";

    function create_fragment$f(ctx) {
    	let div;
    	let raw_value = /*renderSVG*/ ctx[0]() + "";

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "card-logo svelte-3z9dsd");
    			add_location(div, file$d, 24, 0, 3840);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			div.innerHTML = raw_value;
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Card_logo", slots, []);

    	let defaultSVG = `
      <svg width="300px" viewBox="0 0 256 308" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid">
      <g>
          <path d="M239.681566,40.706757 C211.113272,-0.181889366 154.69089,-12.301439 113.894816,13.6910393 L42.2469062,59.3555354 C22.6760042,71.6680028 9.1958152,91.6538543 5.11196889,114.412133 C1.69420521,133.371174 4.6982178,152.928576 13.6483951,169.987905 C7.51549676,179.291145 3.33259428,189.7413 1.3524912,200.706787 C-2.77083771,223.902098 2.62286977,247.780539 16.3159596,266.951444 C44.8902975,307.843936 101.312954,319.958266 142.10271,293.967161 L213.75062,248.302665 C233.322905,235.991626 246.803553,216.005094 250.885557,193.246067 C254.302867,174.287249 251.30121,154.730228 242.355449,137.668922 C248.486748,128.365895 252.667894,117.916162 254.646134,106.951413 C258.772188,83.7560394 253.378243,59.8765465 239.682665,40.706757" fill="#FF3E00"></path>
          <path d="M106.888658,270.841265 C83.7871855,276.848065 59.3915045,267.805346 45.7864111,248.192566 C37.5477583,236.66102 34.3023491,222.296573 36.7830958,208.343155 C37.1989333,206.075414 37.7711933,203.839165 38.4957755,201.650433 L39.845476,197.534835 L43.5173097,200.231763 C51.9971301,206.462491 61.4784803,211.199728 71.5527203,214.239302 L74.2164003,215.047419 L73.9710252,217.705878 C73.6455499,221.487851 74.6696022,225.262925 76.8616703,228.361972 C80.9560313,234.269749 88.3011363,236.995968 95.2584831,235.190159 C96.8160691,234.773852 98.3006859,234.121384 99.6606718,233.25546 L171.331634,187.582718 C174.877468,185.349963 177.321139,181.729229 178.065299,177.605596 C178.808171,173.400048 177.830501,169.072361 175.351884,165.594581 C171.255076,159.685578 163.908134,156.9582 156.947927,158.762547 C155.392392,159.178888 153.90975,159.83088 152.551509,160.695872 L125.202489,178.130144 C120.705281,180.989558 115.797437,183.144784 110.64897,184.521162 C87.547692,190.527609 63.1523949,181.484801 49.5475471,161.872188 C41.3085624,150.340895 38.0631179,135.976391 40.5442317,122.023052 C43.0002744,108.333716 51.1099574,96.3125326 62.8835328,88.9089537 L134.548175,43.2323647 C139.047294,40.3682559 143.958644,38.21032 149.111311,36.8336525 C172.21244,30.8273594 196.607527,39.8700206 210.212459,59.4823515 C218.451112,71.013898 221.696522,85.3783452 219.215775,99.3317627 C218.798144,101.59911 218.225915,103.835236 217.503095,106.024485 L216.153395,110.140083 L212.483484,107.447276 C204.004261,101.212984 194.522,96.4735732 184.44615,93.4336926 L181.78247,92.6253012 L182.027845,89.9668419 C182.350522,86.1852063 181.326723,82.4111645 179.1372,79.3110228 C175.042839,73.4032457 167.697734,70.677026 160.740387,72.4828355 C159.182801,72.8991426 157.698185,73.5516104 156.338199,74.4175344 L84.6672364,120.0922 C81.1218886,122.323199 78.6795938,125.943704 77.9387928,130.066574 C77.1913232,134.271925 78.1673502,138.601163 80.6469865,142.078963 C84.7438467,147.987899 92.0907405,150.71526 99.0509435,148.910997 C100.608143,148.493836 102.092543,147.841423 103.452857,146.976298 L130.798305,129.548621 C135.293566,126.685437 140.201191,124.528302 145.350175,123.152382 C168.451453,117.145935 192.846751,126.188743 206.451598,145.801356 C214.690583,157.332649 217.936027,171.697153 215.454914,185.650492 C212.997261,199.340539 204.888162,211.362752 193.115613,218.769811 L121.450695,264.442553 C116.951576,267.306662 112.040226,269.464598 106.887559,270.841265" fill="#FFFFFF"></path>
      </g>
    </svg>
    `;

    	let { svg = `` } = $$props;
    	let { width = "" } = $$props;
    	let { height = "" } = $$props;

    	function renderSVG() {
    		return !svg ? defaultSVG : svg;
    	}

    	const writable_props = ["svg", "width", "height"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card_logo> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("svg" in $$props) $$invalidate(1, svg = $$props.svg);
    		if ("width" in $$props) $$invalidate(2, width = $$props.width);
    		if ("height" in $$props) $$invalidate(3, height = $$props.height);
    	};

    	$$self.$capture_state = () => ({
    		defaultSVG,
    		svg,
    		width,
    		height,
    		renderSVG
    	});

    	$$self.$inject_state = $$props => {
    		if ("defaultSVG" in $$props) defaultSVG = $$props.defaultSVG;
    		if ("svg" in $$props) $$invalidate(1, svg = $$props.svg);
    		if ("width" in $$props) $$invalidate(2, width = $$props.width);
    		if ("height" in $$props) $$invalidate(3, height = $$props.height);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*width, height*/ 12) {
    			 {
    				document.documentElement.style.setProperty("--card-logo-width", width);
    				document.documentElement.style.setProperty("--card-logo-height", height);
    			}
    		}
    	};

    	return [renderSVG, svg, width, height];
    }

    class Card_logo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { svg: 1, width: 2, height: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card_logo",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get svg() {
    		throw new Error("<Card_logo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set svg(value) {
    		throw new Error("<Card_logo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Card_logo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Card_logo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Card_logo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Card_logo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/card/card.svelte generated by Svelte v3.29.4 */
    const file$e = "src/components/card/card.svelte";

    function create_fragment$g(ctx) {
    	let article;
    	let cardlogo;
    	let t0;
    	let h2;
    	let t1;
    	let t2;
    	let div;
    	let t3;
    	let current;

    	cardlogo = new Card_logo({
    			props: {
    				svg: /*svg*/ ctx[2],
    				width: "100px",
    				height: "100px"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			article = element("article");
    			create_component(cardlogo.$$.fragment);
    			t0 = space();
    			h2 = element("h2");
    			t1 = text(/*title*/ ctx[0]);
    			t2 = space();
    			div = element("div");
    			t3 = text(/*description*/ ctx[1]);
    			attr_dev(h2, "class", "title svelte-1gu1c8e");
    			add_location(h2, file$e, 15, 2, 324);
    			attr_dev(div, "class", "description svelte-1gu1c8e");
    			add_location(div, file$e, 18, 2, 365);
    			attr_dev(article, "class", "card inline-flex flex-col flex-wrap w-1/6 svelte-1gu1c8e");
    			add_location(article, file$e, 9, 0, 194);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			mount_component(cardlogo, article, null);
    			append_dev(article, t0);
    			append_dev(article, h2);
    			append_dev(h2, t1);
    			append_dev(article, t2);
    			append_dev(article, div);
    			append_dev(div, t3);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const cardlogo_changes = {};
    			if (dirty & /*svg*/ 4) cardlogo_changes.svg = /*svg*/ ctx[2];
    			cardlogo.$set(cardlogo_changes);
    			if (!current || dirty & /*title*/ 1) set_data_dev(t1, /*title*/ ctx[0]);
    			if (!current || dirty & /*description*/ 2) set_data_dev(t3, /*description*/ ctx[1]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cardlogo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cardlogo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			destroy_component(cardlogo);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Card", slots, []);
    	let { title = "Default card title !" } = $$props;
    	let { description = "Lorem ipson dolerem sit amet" } = $$props;
    	let { svg = `` } = $$props;
    	const writable_props = ["title", "description", "svg"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("description" in $$props) $$invalidate(1, description = $$props.description);
    		if ("svg" in $$props) $$invalidate(2, svg = $$props.svg);
    	};

    	$$self.$capture_state = () => ({ CardLogo: Card_logo, title, description, svg });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("description" in $$props) $$invalidate(1, description = $$props.description);
    		if ("svg" in $$props) $$invalidate(2, svg = $$props.svg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, description, svg];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { title: 0, description: 1, svg: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$g.name
    		});
    	}

    	get title() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get svg() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set svg(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.4 */
    const file$f = "src/App.svelte";

    function create_fragment$h(ctx) {
    	let header;
    	let t0;
    	let main;
    	let h1;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let p0;
    	let t5;
    	let a;
    	let t7;
    	let t8;
    	let p1;
    	let t10;
    	let card;
    	let current;
    	header = new Header({ $$inline: true });

    	card = new Card({
    			props: {
    				title: "This is a card with customizable output",
    				description: "This one will be customizable and will have a route attached or be a simple modal"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			main = element("main");
    			h1 = element("h1");
    			t1 = text("Hello ");
    			t2 = text(/*name*/ ctx[0]);
    			t3 = text("!");
    			t4 = space();
    			p0 = element("p");
    			t5 = text("Visit the ");
    			a = element("a");
    			a.textContent = "Svelte tutorial";
    			t7 = text(" to learn how to build Svelte apps.");
    			t8 = space();
    			p1 = element("p");
    			p1.textContent = "A small svelte app for exercises and learning";
    			t10 = space();
    			create_component(card.$$.fragment);
    			attr_dev(h1, "class", "svelte-mkrvqn");
    			add_location(h1, file$f, 19, 1, 553);
    			attr_dev(a, "href", "https://svelte.dev/tutorial");
    			add_location(a, file$f, 20, 14, 590);
    			add_location(p0, file$f, 20, 1, 577);
    			add_location(p1, file$f, 22, 1, 689);
    			attr_dev(main, "class", "svelte-mkrvqn");
    			add_location(main, file$f, 18, 0, 545);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(h1, t3);
    			append_dev(main, t4);
    			append_dev(main, p0);
    			append_dev(p0, t5);
    			append_dev(p0, a);
    			append_dev(p0, t7);
    			append_dev(main, t8);
    			append_dev(main, p1);
    			append_dev(main, t10);
    			mount_component(card, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*name*/ 1) set_data_dev(t2, /*name*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(card);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { name } = $$props;
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		Header,
    		Looping: Looping_a_triangle,
    		FizzBuzz: Fizz_buzz,
    		Chessboard,
    		Minimum,
    		IsEven,
    		BeanCounting,
    		Logo: SvelteLogo,
    		Card,
    		name
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$h.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // Svelte Implementation

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'Svelte'
    	}
    });


    // Custom JS for learning
    let rootNode = document.querySelector('.root-node');

    console.log(rootNode);

    return app;

}());
//# sourceMappingURL=bundle.js.map
