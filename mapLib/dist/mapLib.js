import { Ct as e, Dt as t, Et as n, Ot as r, St as i, Tt as a, _t as o, bt as s, dt as c, gt as l, it as u, kt as ee, mt as te, ot as ne, st as re, ut as ie, vt as ae, wt as oe, xt as d, yt as se } from "./utils-D3SvZA9_.js";
//#region src/utils/assert.ts
var ce = ee(), le = class {
	static assert(e, t = null) {
		if (!e) throw Error(t ?? "condition does not hold");
	}
}, ue = class extends t {
	setAttrProp(e, t, n) {
		let r = this.getAttr(e);
		r && (r[t] = n);
	}
}, de;
(function(e) {
	e[e.None = 0] = "None", e[e.FromAncestor = 1] = "FromAncestor", e[e.ToAncestor = 2] = "ToAncestor";
})(de ||= {});
var fe = class extends ue {
	_id;
	get id() {
		return this._id;
	}
	_lineId;
	_arcId;
	get lineId() {
		return this._lineId;
	}
	get arcId() {
		return this._arcId;
	}
	label;
	source;
	target;
	constructor(e, t, n) {
		super(), this._id = e, this.source = t, this.target = n, t === n ? t.selfEdges.add(this) : (t.outEdges.add(this), n.inEdges.add(this));
	}
	setLineId(e) {
		this._lineId = e;
	}
	setArcId(e) {
		this._arcId = e;
	}
	get data() {
		return this.getAttr(r.EdgeDataIndex);
	}
	setData(e) {
		this.setAttr(r.EdgeDataIndex, e);
	}
	add() {
		this.source === this.target ? this.source.selfEdges.add(this) : (this.source.outEdges.add(this), this.target.inEdges.add(this));
	}
	remove() {
		this.source === this.target ? this.source.selfEdges.delete(this) : (this.source.outEdges.delete(this), this.target.inEdges.delete(this));
	}
	toString() {
		return "(" + this.source.toString() + "->" + this.target.toString() + ")";
	}
	isInterGraphEdge() {
		return this.source.parent !== this.target.parent;
	}
	EdgeToAncestor() {
		return this.source instanceof Ii && this.target.isDescendantOf(this.source) ? de.FromAncestor : this.target instanceof Ii && this.source.isDescendantOf(this.target) ? de.ToAncestor : de.None;
	}
}, f = class extends ue {
	removeOutEdge(e) {
		this.outEdges.delete(e);
	}
	removeInEdge(e) {
		this.inEdges.delete(e);
	}
	_id;
	get id() {
		return this._id;
	}
	set id(e) {
		this._id = e;
	}
	inEdges = /* @__PURE__ */ new Set();
	outEdges = /* @__PURE__ */ new Set();
	selfEdges = /* @__PURE__ */ new Set();
	toString() {
		return this.id;
	}
	constructor(e) {
		super(), this.id = e;
	}
	*_edges() {
		for (let e of this.inEdges) yield e;
		for (let e of this.outEdges) yield e;
		for (let e of this.selfEdges) yield e;
	}
	get edges() {
		return this._edges();
	}
	get outDegree() {
		return this.outEdges.size;
	}
	get inDegree() {
		return this.inEdges.size;
	}
	get selfDegree() {
		return this.selfEdges.size;
	}
	get degree() {
		return this.outDegree + this.inDegree + this.selfDegree;
	}
	get data() {
		return this.getAttr(r.NodeDataIndex);
	}
	setData(e) {
		this.setAttr(r.NodeDataIndex, e);
	}
}, pe = {
	0: "Invalid value for configuration 'enforceActions', expected 'never', 'always' or 'observed'",
	1: function(e, t) {
		return "Cannot apply '" + e + "' to '" + t.toString() + "': Field not found.";
	},
	5: "'keys()' can only be used on observable objects, arrays, sets and maps",
	6: "'values()' can only be used on observable objects, arrays, sets and maps",
	7: "'entries()' can only be used on observable objects, arrays and maps",
	8: "'set()' can only be used on observable objects, arrays and maps",
	9: "'remove()' can only be used on observable objects, arrays and maps",
	10: "'has()' can only be used on observable objects, arrays and maps",
	11: "'get()' can only be used on observable objects, arrays and maps",
	12: "Invalid annotation",
	13: "Dynamic observable objects cannot be frozen. If you're passing observables to 3rd party component/function that calls Object.freeze, pass copy instead: toJS(observable)",
	14: "Intercept handlers should return nothing or a change object",
	15: "Observable arrays cannot be frozen. If you're passing observables to 3rd party component/function that calls Object.freeze, pass copy instead: toJS(observable)",
	16: "Modification exception: the internal structure of an observable array was changed.",
	17: function(e, t) {
		return "[mobx.array] Index out of bounds, " + e + " is larger than " + t;
	},
	18: "mobx.map requires Map polyfill for the current browser. Check babel-polyfill or core-js/es6/map.js",
	19: function(e) {
		return "Cannot initialize from classes that inherit from Map: " + e.constructor.name;
	},
	20: function(e) {
		return "Cannot initialize map from " + e;
	},
	21: function(e) {
		return "Cannot convert to map from '" + e + "'";
	},
	22: "mobx.set requires Set polyfill for the current browser. Check babel-polyfill or core-js/es6/set.js",
	23: "It is not possible to get index atoms from arrays",
	24: function(e) {
		return "Cannot obtain administration from " + e;
	},
	25: function(e, t) {
		return "the entry '" + e + "' does not exist in the observable map '" + t + "'";
	},
	26: "please specify a property",
	27: function(e, t) {
		return "no observable property '" + e.toString() + "' found on the observable object '" + t + "'";
	},
	28: function(e) {
		return "Cannot obtain atom from " + e;
	},
	29: "Expecting some object",
	30: "invalid action stack. did you forget to finish an action?",
	31: "missing option for computed: get",
	32: function(e, t) {
		return "Cycle detected in computation " + e + ": " + t;
	},
	33: function(e) {
		return "The setter of computed value '" + e + "' is trying to update itself. Did you intend to update an _observable_ value, instead of the computed property?";
	},
	34: function(e) {
		return "[ComputedValue '" + e + "'] It is not possible to assign a new value to a computed value.";
	},
	35: "There are multiple, different versions of MobX active. Make sure MobX is loaded only once or use `configure({ isolateGlobalState: true })`",
	36: "isolateGlobalState should be called before MobX is running any reactions",
	37: function(e) {
		return "[mobx] `observableArray." + e + "()` mutates the array in-place, which is not allowed inside a derivation. Use `array.slice()." + e + "()` instead";
	},
	38: "'ownKeys()' can only be used on observable objects",
	39: "'defineProperty()' can only be used on observable objects"
};
function p(e) {
	var t = [...arguments].slice(1), n = typeof e == "string" ? e : pe[e];
	throw typeof n == "function" && (n = n.apply(null, t)), Error("[MobX] " + n);
}
var me = {};
function he() {
	return typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : me;
}
var ge = Object.assign, _e = Object.getOwnPropertyDescriptor, m = Object.defineProperty, h = Object.prototype, g = [];
Object.freeze(g);
var ve = {};
Object.freeze(ve);
var ye = typeof Proxy < "u", be = /* @__PURE__ */ Object.toString();
function xe() {
	ye || p("`Proxy` objects are not available in the current environment. Please configure MobX to enable a fallback implementation.`");
}
function Se(e) {
	F.verifyProxies && p("MobX is currently configured to be able to run in ES5 mode, but in ES5 MobX won't be able to " + e);
}
function _() {
	return ++F.mobxGuid;
}
function Ce(e) {
	var t = !1;
	return function() {
		if (!t) return t = !0, e.apply(this, arguments);
	};
}
var we = function() {};
function v(e) {
	return typeof e == "function";
}
function Te(e) {
	switch (typeof e) {
		case "string":
		case "symbol":
		case "number": return !0;
	}
	return !1;
}
function Ee(e) {
	return typeof e == "object" && !!e;
}
function y(e) {
	if (!Ee(e)) return !1;
	var t = Object.getPrototypeOf(e);
	if (t == null) return !0;
	var n = Object.hasOwnProperty.call(t, "constructor") && t.constructor;
	return typeof n == "function" && n.toString() === be;
}
function De(e) {
	var t = e?.constructor;
	return t ? t.name === "GeneratorFunction" || t.displayName === "GeneratorFunction" : !1;
}
function Oe(e, t, n) {
	m(e, t, {
		enumerable: !1,
		writable: !0,
		configurable: !0,
		value: n
	});
}
function ke(e, t, n) {
	m(e, t, {
		enumerable: !1,
		writable: !1,
		configurable: !0,
		value: n
	});
}
function Ae(e, t) {
	var n = "isMobX" + e;
	return t.prototype[n] = !0, function(e) {
		return Ee(e) && e[n] === !0;
	};
}
function je(e) {
	return e != null && Object.prototype.toString.call(e) === "[object Map]";
}
function Me(e) {
	return Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(e))) === null;
}
function b(e) {
	return e != null && Object.prototype.toString.call(e) === "[object Set]";
}
var Ne = Object.getOwnPropertySymbols !== void 0;
function Pe(e) {
	var t = Object.keys(e);
	if (!Ne) return t;
	var n = Object.getOwnPropertySymbols(e);
	return n.length ? [].concat(t, n.filter(function(t) {
		return h.propertyIsEnumerable.call(e, t);
	})) : t;
}
var Fe = typeof Reflect < "u" && Reflect.ownKeys ? Reflect.ownKeys : Ne ? function(e) {
	return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e));
} : /* istanbul ignore next */ Object.getOwnPropertyNames;
function Ie(e) {
	return typeof e == "string" ? e : typeof e == "symbol" ? e.toString() : new String(e).toString();
}
function Le(e) {
	return e === null ? null : typeof e == "object" ? "" + e : e;
}
function x(e, t) {
	return h.hasOwnProperty.call(e, t);
}
var Re = Object.getOwnPropertyDescriptors || function(e) {
	var t = {};
	return Fe(e).forEach(function(n) {
		t[n] = _e(e, n);
	}), t;
};
function S(e, t) {
	return !!(e & t);
}
function C(e, t, n) {
	return n ? e |= t : e &= ~t, e;
}
function ze(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function Be(e, t) {
	for (var n = 0; n < t.length; n++) {
		var r = t[n];
		r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, Ke(r.key), r);
	}
}
function Ve(e, t, n) {
	return t && Be(e.prototype, t), n && Be(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
}
function He(e, t) {
	var n = typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
	if (n) return (n = n.call(e)).next.bind(n);
	if (Array.isArray(e) || (n = qe(e)) || t && e && typeof e.length == "number") {
		n && (e = n);
		var r = 0;
		return function() {
			return r >= e.length ? { done: !0 } : {
				done: !1,
				value: e[r++]
			};
		};
	}
	throw TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function w() {
	return w = Object.assign ? Object.assign.bind() : function(e) {
		for (var t = 1; t < arguments.length; t++) {
			var n = arguments[t];
			for (var r in n) ({}).hasOwnProperty.call(n, r) && (e[r] = n[r]);
		}
		return e;
	}, w.apply(null, arguments);
}
function Ue(e, t) {
	e.prototype = Object.create(t.prototype), e.prototype.constructor = e, We(e, t);
}
function We(e, t) {
	return We = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e, t) {
		return e.__proto__ = t, e;
	}, We(e, t);
}
function Ge(e, t) {
	if (typeof e != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (typeof r != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function Ke(e) {
	var t = Ge(e, "string");
	return typeof t == "symbol" ? t : t + "";
}
function qe(e, t) {
	if (e) {
		if (typeof e == "string") return ze(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? ze(e, t) : void 0;
	}
}
var T = /* @__PURE__ */ Symbol("mobx-stored-annotations");
function E(e) {
	function t(t, n) {
		if (Ze(n)) return e.decorate_20223_(t, n);
		Je(t, n, e);
	}
	return Object.assign(t, e);
}
function Je(e, t, n) {
	x(e, T) || Oe(e, T, w({}, e[T])), ft(n) && !x(e[T], t) && p("'" + (e.constructor.name + ".prototype." + t.toString()) + "' is decorated with 'override', but no such decorated member was found on prototype."), Ye(e, n, t), ft(n) || (e[T][t] = n);
}
function Ye(e, t, n) {
	if (!ft(t) && x(e[T], n)) {
		var r = e.constructor.name + ".prototype." + n.toString(), i = e[T][n].annotationType_, a = t.annotationType_;
		p("Cannot apply '@" + a + "' to '" + r + "':" + ("\nThe field is already decorated with '@" + i + "'.") + "\nRe-decorating fields is not allowed.\nUse '@override' decorator for methods overridden by subclass.");
	}
}
function Xe(e) {
	return x(e, T) || Oe(e, T, w({}, e[T])), e[T];
}
function Ze(e) {
	return typeof e == "object" && typeof e.kind == "string";
}
function Qe(e, t) {
	t.includes(e.kind) || p("The decorator applied to '" + String(e.name) + "' cannot be used on a " + e.kind + " element");
}
var D = /* @__PURE__ */ Symbol("mobx administration"), $e = /* @__PURE__ */ function() {
	function e(e) {
		e === void 0 && (e = "Atom@" + _()), this.name_ = void 0, this.flags_ = 0, this.observers_ = /* @__PURE__ */ new Set(), this.lastAccessedBy_ = 0, this.lowestObserverState_ = j.NOT_TRACKING_, this.onBOL = void 0, this.onBUOL = void 0, this.name_ = e;
	}
	var t = e.prototype;
	return t.onBO = function() {
		this.onBOL && this.onBOL.forEach(function(e) {
			return e();
		});
	}, t.onBUO = function() {
		this.onBUOL && this.onBUOL.forEach(function(e) {
			return e();
		});
	}, t.reportObserved = function() {
		return zn(this);
	}, t.reportChanged = function() {
		I(), Bn(this), L();
	}, t.toString = function() {
		return this.name_;
	}, Ve(e, [
		{
			key: "isBeingObserved",
			get: function() {
				return S(this.flags_, e.isBeingObservedMask_);
			},
			set: function(t) {
				this.flags_ = C(this.flags_, e.isBeingObservedMask_, t);
			}
		},
		{
			key: "isPendingUnobservation",
			get: function() {
				return S(this.flags_, e.isPendingUnobservationMask_);
			},
			set: function(t) {
				this.flags_ = C(this.flags_, e.isPendingUnobservationMask_, t);
			}
		},
		{
			key: "diffValue",
			get: function() {
				return +!!S(this.flags_, e.diffValueMask_);
			},
			set: function(t) {
				this.flags_ = C(this.flags_, e.diffValueMask_, t === 1);
			}
		}
	]);
}();
$e.isBeingObservedMask_ = 1, $e.isPendingUnobservationMask_ = 2, $e.diffValueMask_ = 4;
var et = /* @__PURE__ */ Ae("Atom", $e);
function tt(e, t, n) {
	t === void 0 && (t = we), n === void 0 && (n = we);
	var r = new $e(e);
	return t !== we && _r(r, t), n !== we && vr(r, n), r;
}
function nt(e, t) {
	return e === t;
}
function rt(e, t) {
	return Oi(e, t);
}
function it(e, t) {
	return Oi(e, t, 1);
}
function at(e, t) {
	return Object.is ? Object.is(e, t) : e === t ? e !== 0 || 1 / e == 1 / t : e !== e && t !== t;
}
var ot = {
	identity: nt,
	structural: rt,
	default: at,
	shallow: it
};
function st(e, t, n) {
	return Mr(e) ? e : Array.isArray(e) ? O.array(e, { name: n }) : y(e) ? O.object(e, void 0, { name: n }) : je(e) ? O.map(e, { name: n }) : b(e) ? O.set(e, { name: n }) : typeof e == "function" && !dr(e) && !Ar(e) ? De(e) ? Or(e) : ur(n, e) : e;
}
function ct(e, t, n) {
	if (e == null || di(e) || Yr(e) || Z(e) || Q(e)) return e;
	if (Array.isArray(e)) return O.array(e, {
		name: n,
		deep: !1
	});
	if (y(e)) return O.object(e, void 0, {
		name: n,
		deep: !1
	});
	if (je(e)) return O.map(e, {
		name: n,
		deep: !1
	});
	if (b(e)) return O.set(e, {
		name: n,
		deep: !1
	});
	p("The shallow modifier / decorator can only used in combination with arrays, objects, maps and sets");
}
function lt(e) {
	return e;
}
function ut(e, t) {
	return Mr(e) && p("observable.struct should not be used with observable values"), Oi(e, t) ? t : e;
}
var dt = "override";
function ft(e) {
	return e.annotationType_ === dt;
}
function pt(e, t) {
	return {
		annotationType_: e,
		options_: t,
		make_: mt,
		extend_: ht,
		decorate_20223_: gt
	};
}
function mt(e, t, n, r) {
	var i;
	return (i = this.options_) != null && i.bound ? this.extend_(e, t, n, !1) === null ? 0 : 1 : r === e.target_ ? this.extend_(e, t, n, !1) === null ? 0 : 2 : dr(n.value) ? 1 : (m(r, t, vt(e, this, t, n, !1)), 2);
}
function ht(e, t, n, r) {
	var i = vt(e, this, t, n);
	return e.defineProperty_(t, i, r);
}
function gt(e, t) {
	Qe(t, ["method", "field"]);
	var n = t.kind, r = t.name, i = t.addInitializer, a = this, o = function(e) {
		return dn(a.options_?.name ?? r.toString(), e, a.options_?.autoAction ?? !1);
	};
	if (n == "field") return function(e) {
		var t, n = e;
		return dr(n) || (n = o(n)), (t = a.options_) != null && t.bound && (n = n.bind(this), n.isMobxAction = !0), n;
	};
	if (n == "method") {
		var s;
		return dr(e) || (e = o(e)), (s = this.options_) != null && s.bound && i(function() {
			var e = this, t = e[r].bind(e);
			t.isMobxAction = !0, e[r] = t;
		}), e;
	}
	p("Cannot apply '" + a.annotationType_ + "' to '" + String(r) + "' (kind: " + n + "):" + ("\n'" + a.annotationType_ + "' can only be used on properties with a function value."));
}
function _t(e, t, n, r) {
	var i = t.annotationType_, a = r.value;
	v(a) || p("Cannot apply '" + i + "' to '" + e.name_ + "." + n.toString() + "':" + ("\n'" + i + "' can only be used on properties with a function value."));
}
function vt(e, t, n, r, i) {
	var a, o;
	i === void 0 && (i = F.safeDescriptors), _t(e, t, n, r);
	var s = r.value;
	return (a = t.options_) != null && a.bound && (s = s.bind(e.proxy_ ?? e.target_)), {
		value: dn(t.options_?.name ?? n.toString(), s, t.options_?.autoAction ?? !1, (o = t.options_) != null && o.bound ? e.proxy_ ?? e.target_ : void 0),
		configurable: i ? e.isPlainObject_ : !0,
		enumerable: !1,
		writable: !i
	};
}
function yt(e, t) {
	return {
		annotationType_: e,
		options_: t,
		make_: bt,
		extend_: xt,
		decorate_20223_: St
	};
}
function bt(e, t, n, r) {
	var i;
	return r === e.target_ ? this.extend_(e, t, n, !1) === null ? 0 : 2 : (i = this.options_) != null && i.bound && (!x(e.target_, t) || !Ar(e.target_[t])) && this.extend_(e, t, n, !1) === null ? 0 : Ar(n.value) ? 1 : (m(r, t, wt(e, this, t, n, !1, !1)), 2);
}
function xt(e, t, n, r) {
	var i = wt(e, this, t, n, this.options_?.bound);
	return e.defineProperty_(t, i, r);
}
function St(e, t) {
	var n;
	Qe(t, ["method"]);
	var r = t.name, i = t.addInitializer;
	return Ar(e) || (e = Or(e)), (n = this.options_) != null && n.bound && i(function() {
		var e = this, t = e[r].bind(e);
		t.isMobXFlow = !0, e[r] = t;
	}), e;
}
function Ct(e, t, n, r) {
	var i = t.annotationType_, a = r.value;
	v(a) || p("Cannot apply '" + i + "' to '" + e.name_ + "." + n.toString() + "':" + ("\n'" + i + "' can only be used on properties with a generator function value."));
}
function wt(e, t, n, r, i, a) {
	a === void 0 && (a = F.safeDescriptors), Ct(e, t, n, r);
	var o = r.value;
	return Ar(o) || (o = Or(o)), i && (o = o.bind(e.proxy_ ?? e.target_), o.isMobXFlow = !0), {
		value: o,
		configurable: a ? e.isPlainObject_ : !0,
		enumerable: !1,
		writable: !a
	};
}
function Tt(e, t) {
	return {
		annotationType_: e,
		options_: t,
		make_: Et,
		extend_: Dt,
		decorate_20223_: Ot
	};
}
function Et(e, t, n) {
	return this.extend_(e, t, n, !1) === null ? 0 : 1;
}
function Dt(e, t, n, r) {
	return kt(e, this, t, n), e.defineComputedProperty_(t, w({}, this.options_, {
		get: n.get,
		set: n.set
	}), r);
}
function Ot(e, t) {
	Qe(t, ["getter"]);
	var n = this, r = t.name, i = t.addInitializer;
	return i(function() {
		var t = ci(this)[D], i = w({}, n.options_, {
			get: e,
			context: this
		});
		i.name ||= t.name_ + "." + r.toString(), t.values_.set(r, new A(i));
	}), function() {
		return this[D].getObservablePropValue_(r);
	};
}
function kt(e, t, n, r) {
	var i = t.annotationType_;
	r.get || p("Cannot apply '" + i + "' to '" + e.name_ + "." + n.toString() + "':" + ("\n'" + i + "' can only be used on getter(+setter) properties."));
}
function At(e, t) {
	return {
		annotationType_: e,
		options_: t,
		make_: jt,
		extend_: Mt,
		decorate_20223_: Nt
	};
}
function jt(e, t, n) {
	return this.extend_(e, t, n, !1) === null ? 0 : 1;
}
function Mt(e, t, n, r) {
	return Pt(e, this, t, n), e.defineObservableProperty_(t, n.value, this.options_?.enhancer ?? st, r);
}
function Nt(e, t) {
	if (t.kind === "field") throw p("Please use `@observable accessor " + String(t.name) + "` instead of `@observable " + String(t.name) + "`");
	Qe(t, ["accessor"]);
	var n = this, r = t.kind, i = t.name, a = /* @__PURE__ */ new WeakSet();
	function o(e, t) {
		var r = ci(e)[D], o = new vn(t, n.options_?.enhancer ?? st, r.name_ + "." + i.toString(), !1);
		r.values_.set(i, o), a.add(e);
	}
	if (r == "accessor") return {
		get: function() {
			return a.has(this) || o(this, e.get.call(this)), this[D].getObservablePropValue_(i);
		},
		set: function(e) {
			return a.has(this) || o(this, e), this[D].setObservablePropValue_(i, e);
		},
		init: function(e) {
			return a.has(this) || o(this, e), e;
		}
	};
}
function Pt(e, t, n, r) {
	var i = t.annotationType_;
	"value" in r || p("Cannot apply '" + i + "' to '" + e.name_ + "." + n.toString() + "':" + ("\n'" + i + "' cannot be used on getter/setter properties"));
}
var Ft = "true", It = /* @__PURE__ */ Lt();
function Lt(e) {
	return {
		annotationType_: Ft,
		options_: e,
		make_: Rt,
		extend_: zt,
		decorate_20223_: Bt
	};
}
function Rt(e, t, n, r) {
	var i;
	if (n.get) return k.make_(e, t, n, r);
	if (n.set) {
		var a = dr(n.set) ? n.set : dn(t.toString(), n.set);
		return r === e.target_ ? e.defineProperty_(t, {
			configurable: F.safeDescriptors ? e.isPlainObject_ : !0,
			set: a
		}) === null ? 0 : 2 : (m(r, t, {
			configurable: !0,
			set: a
		}), 2);
	}
	if (r !== e.target_ && typeof n.value == "function") {
		var o;
		if (De(n.value)) {
			var s;
			return ((s = this.options_) != null && s.autoBind ? Or.bound : Or).make_(e, t, n, r);
		}
		return ((o = this.options_) != null && o.autoBind ? ur.bound : ur).make_(e, t, n, r);
	}
	var c = this.options_?.deep === !1 ? O.ref : O;
	return typeof n.value == "function" && (i = this.options_) != null && i.autoBind && (n.value = n.value.bind(e.proxy_ ?? e.target_)), c.make_(e, t, n, r);
}
function zt(e, t, n, r) {
	var i;
	return n.get ? k.extend_(e, t, n, r) : n.set ? e.defineProperty_(t, {
		configurable: F.safeDescriptors ? e.isPlainObject_ : !0,
		set: dn(t.toString(), n.set)
	}, r) : (typeof n.value == "function" && (i = this.options_) != null && i.autoBind && (n.value = n.value.bind(e.proxy_ ?? e.target_)), (this.options_?.deep === !1 ? O.ref : O).extend_(e, t, n, r));
}
function Bt(e, t) {
	p("'" + this.annotationType_ + "' cannot be used as a decorator");
}
var Vt = "observable", Ht = "observable.ref", Ut = "observable.shallow", Wt = "observable.struct", Gt = {
	deep: !0,
	name: void 0,
	defaultDecorator: void 0,
	proxy: !0
};
Object.freeze(Gt);
function Kt(e) {
	return e || Gt;
}
var qt = /* @__PURE__ */ At(Vt), Jt = /* @__PURE__ */ At(Ht, { enhancer: lt }), Yt = /* @__PURE__ */ At(Ut, { enhancer: ct }), Xt = /* @__PURE__ */ At(Wt, { enhancer: ut }), Zt = /* @__PURE__ */ E(qt);
function Qt(e) {
	return e.deep === !0 ? st : e.deep === !1 ? lt : en(e.defaultDecorator);
}
function $t(e) {
	return e ? e.defaultDecorator ?? Lt(e) : void 0;
}
function en(e) {
	return e ? e.options_?.enhancer ?? st : st;
}
function tn(e, t, n) {
	if (Ze(t)) return qt.decorate_20223_(e, t);
	if (Te(t)) {
		Je(e, t, qt);
		return;
	}
	return Mr(e) ? e : y(e) ? O.object(e, t, n) : Array.isArray(e) ? O.array(e, t) : je(e) ? O.map(e, t) : b(e) ? O.set(e, t) : typeof e == "object" && e ? e : O.box(e, t);
}
ge(tn, Zt);
var O = /* @__PURE__ */ ge(tn, {
	box: function(e, t) {
		var n = Kt(t);
		return new vn(e, Qt(n), n.name, !0, n.equals);
	},
	array: function(e, t) {
		var n = Kt(t);
		return (F.useProxies === !1 || n.proxy === !1 ? Ci : Gr)(e, Qt(n), n.name);
	},
	map: function(e, t) {
		var n = Kt(t);
		return new $r(e, Qt(n), n.name);
	},
	set: function(e, t) {
		var n = Kt(t);
		return new ri(e, Qt(n), n.name);
	},
	object: function(e, t, n) {
		return Ei(function() {
			return br(F.useProxies === !1 || n?.proxy === !1 ? ci({}, n) : Lr({}, n), e, t);
		});
	},
	ref: /* @__PURE__ */ E(Jt),
	shallow: /* @__PURE__ */ E(Yt),
	deep: Zt,
	struct: /* @__PURE__ */ E(Xt)
}), nn = "computed", rn = "computed.struct", an = /* @__PURE__ */ Tt(nn), on = /* @__PURE__ */ Tt(rn, { equals: ot.structural }), k = function(e, t) {
	if (Ze(t)) return an.decorate_20223_(e, t);
	if (Te(t)) return Je(e, t, an);
	if (y(e)) return E(Tt(nn, e));
	v(e) || p("First argument to `computed` should be an expression."), v(t) && p("A setter as second argument is no longer supported, use `{ set: fn }` option instead");
	var n = y(t) ? t : {};
	return n.get = e, n.name ||= e.name || "", new A(n);
};
Object.assign(k, an), k.struct = /* @__PURE__ */ E(on);
var sn = 0, cn = 1, ln = (/* @__PURE__ */ _e(function() {}, "name"))?.configurable ?? !1, un = {
	value: "action",
	configurable: !0,
	writable: !1,
	enumerable: !1
};
function dn(e, t, n, r) {
	n === void 0 && (n = !1), v(t) || p("`action` can only be invoked on functions"), (typeof e != "string" || !e) && p("actions should have valid names, got: '" + e + "'");
	function i() {
		return fn(e, n, t, r || this, arguments);
	}
	return i.isMobxAction = !0, i.toString = function() {
		return t.toString();
	}, ln && (un.value = e, m(i, "name", un)), i;
}
function fn(e, t, n, r, i) {
	var a = pn(e, t, r, i);
	try {
		return n.apply(r, i);
	} catch (e) {
		throw a.error_ = e, e;
	} finally {
		mn(a);
	}
}
function pn(e, t, n, r) {
	var i = R() && !!e, a = 0;
	i && (a = Date.now(), z({
		type: er,
		name: e,
		object: n,
		arguments: r ? Array.from(r) : g
	}));
	var o = F.trackingDerivation, s = !t || !o;
	I();
	var c = F.allowStateChanges;
	s && (kn(), c = hn(!0));
	var l = An(!0), u = {
		runAsAction_: s,
		prevDerivation_: o,
		prevAllowStateChanges_: c,
		prevAllowStateReads_: l,
		notifySpy_: i,
		startTime_: a,
		actionId_: cn++,
		parentActionId_: sn
	};
	return sn = u.actionId_, u;
}
function mn(e) {
	sn !== e.actionId_ && p(30), sn = e.parentActionId_, e.error_ !== void 0 && (F.suppressReactionErrors = !0), gn(e.prevAllowStateChanges_), jn(e.prevAllowStateReads_), L(), e.runAsAction_ && P(e.prevDerivation_), e.notifySpy_ && B({ time: Date.now() - e.startTime_ }), F.suppressReactionErrors = !1;
}
function hn(e) {
	var t = F.allowStateChanges;
	return F.allowStateChanges = e, t;
}
function gn(e) {
	F.allowStateChanges = e;
}
var _n = "create", vn = /* @__PURE__ */ function(e) {
	function t(t, n, r, i, a) {
		var o;
		return r === void 0 && (r = "ObservableValue@" + _()), i === void 0 && (i = !0), a === void 0 && (a = ot.default), o = e.call(this, r) || this, o.enhancer = void 0, o.name_ = void 0, o.equals = void 0, o.hasUnreportedChange_ = !1, o.interceptors_ = void 0, o.changeListeners_ = void 0, o.value_ = void 0, o.dehancer = void 0, o.enhancer = n, o.name_ = r, o.equals = a, o.value_ = n(t, void 0, r), i && R() && Zn({
			type: _n,
			object: o,
			observableKind: "value",
			debugObjectName: o.name_,
			newValue: "" + o.value_?.toString()
		}), o;
	}
	Ue(t, e);
	var n = t.prototype;
	return n.dehanceValue = function(e) {
		return this.dehancer === void 0 ? e : this.dehancer(e);
	}, n.set = function(e) {
		var t = this.value_;
		if (e = this.prepareNewValue_(e), e !== F.UNCHANGED) {
			var n = R();
			n && z({
				type: q,
				object: this,
				observableKind: "value",
				debugObjectName: this.name_,
				newValue: e,
				oldValue: t
			}), this.setNewValue_(e), n && B();
		}
	}, n.prepareNewValue_ = function(e) {
		if (N(this), U(this)) {
			var t = W(this, {
				object: this,
				type: q,
				newValue: e
			});
			if (!t) return F.UNCHANGED;
			e = t.newValue;
		}
		return e = this.enhancer(e, this.value_, this.name_), this.equals(this.value_, e) ? F.UNCHANGED : e;
	}, n.setNewValue_ = function(e) {
		var t = this.value_;
		this.value_ = e, this.reportChanged(), G(this) && K(this, {
			type: q,
			object: this,
			newValue: e,
			oldValue: t
		});
	}, n.get = function() {
		return this.reportObserved(), this.dehanceValue(this.value_);
	}, n.intercept_ = function(e) {
		return Rr(this, e);
	}, n.observe_ = function(e, t) {
		return t && e({
			observableKind: "value",
			debugObjectName: this.name_,
			object: this,
			type: q,
			newValue: this.value_,
			oldValue: void 0
		}), zr(this, e);
	}, n.raw = function() {
		return this.value_;
	}, n.toJSON = function() {
		return this.get();
	}, n.toString = function() {
		return this.name_ + "[" + this.value_ + "]";
	}, n.valueOf = function() {
		return Le(this.get());
	}, n[Symbol.toPrimitive] = function() {
		return this.valueOf();
	}, t;
}($e), A = /* @__PURE__ */ function() {
	function e(e) {
		this.dependenciesState_ = j.NOT_TRACKING_, this.observing_ = [], this.newObserving_ = null, this.observers_ = /* @__PURE__ */ new Set(), this.runId_ = 0, this.lastAccessedBy_ = 0, this.lowestObserverState_ = j.UP_TO_DATE_, this.unboundDepsCount_ = 0, this.value_ = new bn(null), this.name_ = void 0, this.triggeredBy_ = void 0, this.flags_ = 0, this.derivation = void 0, this.setter_ = void 0, this.isTracing_ = M.NONE, this.scope_ = void 0, this.equals_ = void 0, this.requiresReaction_ = void 0, this.keepAlive_ = void 0, this.onBOL = void 0, this.onBUOL = void 0, e.get || p(31), this.derivation = e.get, this.name_ = e.name || "ComputedValue@" + _(), e.set && (this.setter_ = dn(this.name_ + "-setter", e.set)), this.equals_ = e.equals || (e.compareStructural || e.struct ? ot.structural : ot.default), this.scope_ = e.context, this.requiresReaction_ = e.requiresReaction, this.keepAlive_ = !!e.keepAlive;
	}
	var t = e.prototype;
	return t.onBecomeStale_ = function() {
		Hn(this);
	}, t.onBO = function() {
		this.onBOL && this.onBOL.forEach(function(e) {
			return e();
		});
	}, t.onBUO = function() {
		this.onBUOL && this.onBUOL.forEach(function(e) {
			return e();
		});
	}, t.get = function() {
		if (this.isComputing && p(32, this.name_, this.derivation), F.inBatch === 0 && this.observers_.size === 0 && !this.keepAlive_) Sn(this) && (this.warnAboutUntrackedRead_(), I(), this.value_ = this.computeValue_(!1), L());
		else if (zn(this), Sn(this)) {
			var e = F.trackingContext;
			this.keepAlive_ && !e && (F.trackingContext = this), this.trackAndCompute() && Vn(this), F.trackingContext = e;
		}
		var t = this.value_;
		if (xn(t)) throw t.cause;
		return t;
	}, t.set = function(e) {
		if (this.setter_) {
			this.isRunningSetter && p(33, this.name_), this.isRunningSetter = !0;
			try {
				this.setter_.call(this.scope_, e);
			} finally {
				this.isRunningSetter = !1;
			}
		} else p(34, this.name_);
	}, t.trackAndCompute = function() {
		var e = this.value_, t = this.dependenciesState_ === j.NOT_TRACKING_, n = this.computeValue_(!0), r = t || xn(e) || xn(n) || !this.equals_(e, n);
		return r && (this.value_ = n, R() && Zn({
			observableKind: "computed",
			debugObjectName: this.name_,
			object: this.scope_,
			type: "update",
			oldValue: e,
			newValue: n
		})), r;
	}, t.computeValue_ = function(e) {
		this.isComputing = !0;
		var t = hn(!1), n;
		if (e) n = wn(this, this.derivation, this.scope_);
		else if (F.disableErrorBoundaries === !0) n = this.derivation.call(this.scope_);
		else try {
			n = this.derivation.call(this.scope_);
		} catch (e) {
			n = new bn(e);
		}
		return gn(t), this.isComputing = !1, n;
	}, t.suspend_ = function() {
		this.keepAlive_ || (Dn(this), this.value_ = void 0, this.isTracing_ !== M.NONE && console.log("[mobx.trace] Computed value '" + this.name_ + "' was suspended and it will recompute on the next access."));
	}, t.observe_ = function(e, t) {
		var n = this, r = !0, i = void 0;
		return fr(function() {
			var a = n.get();
			if (!r || t) {
				var o = kn();
				e({
					observableKind: "computed",
					debugObjectName: n.name_,
					type: q,
					object: n,
					newValue: a,
					oldValue: i
				}), P(o);
			}
			r = !1, i = a;
		});
	}, t.warnAboutUntrackedRead_ = function() {
		this.isTracing_ !== M.NONE && console.log("[mobx.trace] Computed value '" + this.name_ + "' is being read outside a reactive context. Doing a full recompute."), (typeof this.requiresReaction_ == "boolean" ? this.requiresReaction_ : F.computedRequiresReaction) && console.warn("[mobx] Computed value '" + this.name_ + "' is being read outside a reactive context. Doing a full recompute.");
	}, t.toString = function() {
		return this.name_ + "[" + this.derivation.toString() + "]";
	}, t.valueOf = function() {
		return Le(this.get());
	}, t[Symbol.toPrimitive] = function() {
		return this.valueOf();
	}, Ve(e, [
		{
			key: "isComputing",
			get: function() {
				return S(this.flags_, e.isComputingMask_);
			},
			set: function(t) {
				this.flags_ = C(this.flags_, e.isComputingMask_, t);
			}
		},
		{
			key: "isRunningSetter",
			get: function() {
				return S(this.flags_, e.isRunningSetterMask_);
			},
			set: function(t) {
				this.flags_ = C(this.flags_, e.isRunningSetterMask_, t);
			}
		},
		{
			key: "isBeingObserved",
			get: function() {
				return S(this.flags_, e.isBeingObservedMask_);
			},
			set: function(t) {
				this.flags_ = C(this.flags_, e.isBeingObservedMask_, t);
			}
		},
		{
			key: "isPendingUnobservation",
			get: function() {
				return S(this.flags_, e.isPendingUnobservationMask_);
			},
			set: function(t) {
				this.flags_ = C(this.flags_, e.isPendingUnobservationMask_, t);
			}
		},
		{
			key: "diffValue",
			get: function() {
				return +!!S(this.flags_, e.diffValueMask_);
			},
			set: function(t) {
				this.flags_ = C(this.flags_, e.diffValueMask_, t === 1);
			}
		}
	]);
}();
A.isComputingMask_ = 1, A.isRunningSetterMask_ = 2, A.isBeingObservedMask_ = 4, A.isPendingUnobservationMask_ = 8, A.diffValueMask_ = 16;
var yn = /* @__PURE__ */ Ae("ComputedValue", A), j;
(function(e) {
	e[e.NOT_TRACKING_ = -1] = "NOT_TRACKING_", e[e.UP_TO_DATE_ = 0] = "UP_TO_DATE_", e[e.POSSIBLY_STALE_ = 1] = "POSSIBLY_STALE_", e[e.STALE_ = 2] = "STALE_";
})(j ||= {});
var M;
(function(e) {
	e[e.NONE = 0] = "NONE", e[e.LOG = 1] = "LOG", e[e.BREAK = 2] = "BREAK";
})(M ||= {});
var bn = function(e) {
	this.cause = void 0, this.cause = e;
};
function xn(e) {
	return e instanceof bn;
}
function Sn(e) {
	switch (e.dependenciesState_) {
		case j.UP_TO_DATE_: return !1;
		case j.NOT_TRACKING_:
		case j.STALE_: return !0;
		case j.POSSIBLY_STALE_:
			for (var t = An(!0), n = kn(), r = e.observing_, i = r.length, a = 0; a < i; a++) {
				var o = r[a];
				if (yn(o)) {
					if (F.disableErrorBoundaries) o.get();
					else try {
						o.get();
					} catch {
						return P(n), jn(t), !0;
					}
					if (e.dependenciesState_ === j.STALE_) return P(n), jn(t), !0;
				}
			}
			return Mn(e), P(n), jn(t), !1;
	}
}
function N(e) {
	var t = e.observers_.size > 0;
	!F.allowStateChanges && (t || F.enforceActions === "always") && console.warn("[MobX] " + (F.enforceActions ? "Since strict-mode is enabled, changing (observed) observable values without using an action is not allowed. Tried to modify: " : "Side effects like changing state are not allowed at this point. Are you trying to modify state from, for example, a computed value or the render function of a React component? You can wrap side effects in 'runInAction' (or decorate functions with 'action') if needed. Tried to modify: ") + e.name_);
}
function Cn(e) {
	!F.allowStateReads && F.observableRequiresReaction && console.warn("[mobx] Observable '" + e.name_ + "' being read outside a reactive context.");
}
function wn(e, t, n) {
	var r = An(!0);
	Mn(e), e.newObserving_ = Array(e.runId_ === 0 ? 100 : e.observing_.length), e.unboundDepsCount_ = 0, e.runId_ = ++F.runId;
	var i = F.trackingDerivation;
	F.trackingDerivation = e, F.inBatch++;
	var a;
	if (F.disableErrorBoundaries === !0) a = t.call(n);
	else try {
		a = t.call(n);
	} catch (e) {
		a = new bn(e);
	}
	return F.inBatch--, F.trackingDerivation = i, En(e), Tn(e), jn(r), a;
}
function Tn(e) {
	e.observing_.length === 0 && (typeof e.requiresObservable_ == "boolean" ? e.requiresObservable_ : F.reactionRequiresObservable) && console.warn("[mobx] Derivation '" + e.name_ + "' is created/updated without reading any observable value.");
}
function En(e) {
	for (var t = e.observing_, n = e.observing_ = e.newObserving_, r = j.UP_TO_DATE_, i = 0, a = e.unboundDepsCount_, o = 0; o < a; o++) {
		var s = n[o];
		s.diffValue === 0 && (s.diffValue = 1, i !== o && (n[i] = s), i++), s.dependenciesState_ > r && (r = s.dependenciesState_);
	}
	for (n.length = i, e.newObserving_ = null, a = t.length; a--;) {
		var c = t[a];
		c.diffValue === 0 && Ln(c, e), c.diffValue = 0;
	}
	for (; i--;) {
		var l = n[i];
		l.diffValue === 1 && (l.diffValue = 0, In(l, e));
	}
	r !== j.UP_TO_DATE_ && (e.dependenciesState_ = r, e.onBecomeStale_());
}
function Dn(e) {
	var t = e.observing_;
	e.observing_ = [];
	for (var n = t.length; n--;) Ln(t[n], e);
	e.dependenciesState_ = j.NOT_TRACKING_;
}
function On(e) {
	var t = kn();
	try {
		return e();
	} finally {
		P(t);
	}
}
function kn() {
	var e = F.trackingDerivation;
	return F.trackingDerivation = null, e;
}
function P(e) {
	F.trackingDerivation = e;
}
function An(e) {
	var t = F.allowStateReads;
	return F.allowStateReads = e, t;
}
function jn(e) {
	F.allowStateReads = e;
}
function Mn(e) {
	if (e.dependenciesState_ !== j.UP_TO_DATE_) {
		e.dependenciesState_ = j.UP_TO_DATE_;
		for (var t = e.observing_, n = t.length; n--;) t[n].lowestObserverState_ = j.UP_TO_DATE_;
	}
}
var Nn = function() {
	this.version = 6, this.UNCHANGED = {}, this.trackingDerivation = null, this.trackingContext = null, this.runId = 0, this.mobxGuid = 0, this.inBatch = 0, this.pendingUnobservations = [], this.pendingReactions = [], this.isRunningReactions = !1, this.allowStateChanges = !1, this.allowStateReads = !0, this.enforceActions = !0, this.spyListeners = [], this.globalReactionErrorHandlers = [], this.computedRequiresReaction = !1, this.reactionRequiresObservable = !1, this.observableRequiresReaction = !1, this.disableErrorBoundaries = !1, this.suppressReactionErrors = !1, this.useProxies = !0, this.verifyProxies = !1, this.safeDescriptors = !0;
}, Pn = !0, Fn = !1, F = /* @__PURE__ */ function() {
	var e = /* @__PURE__ */ he();
	return e.__mobxInstanceCount > 0 && !e.__mobxGlobals && (Pn = !1), e.__mobxGlobals && e.__mobxGlobals.version !== new Nn().version && (Pn = !1), Pn ? e.__mobxGlobals ? (e.__mobxInstanceCount += 1, e.__mobxGlobals.UNCHANGED || (e.__mobxGlobals.UNCHANGED = {}), e.__mobxGlobals) : (e.__mobxInstanceCount = 1, e.__mobxGlobals = /* @__PURE__ */ new Nn()) : (setTimeout(function() {
		Fn || p(35);
	}, 1), new Nn());
}();
function In(e, t) {
	e.observers_.add(t), e.lowestObserverState_ > t.dependenciesState_ && (e.lowestObserverState_ = t.dependenciesState_);
}
function Ln(e, t) {
	e.observers_.delete(t), e.observers_.size === 0 && Rn(e);
}
function Rn(e) {
	e.isPendingUnobservation === !1 && (e.isPendingUnobservation = !0, F.pendingUnobservations.push(e));
}
function I() {
	F.inBatch++;
}
function L() {
	if (--F.inBatch === 0) {
		Jn();
		for (var e = F.pendingUnobservations, t = 0; t < e.length; t++) {
			var n = e[t];
			n.isPendingUnobservation = !1, n.observers_.size === 0 && (n.isBeingObserved && (n.isBeingObserved = !1, n.onBUO()), n instanceof A && n.suspend_());
		}
		F.pendingUnobservations = [];
	}
}
function zn(e) {
	Cn(e);
	var t = F.trackingDerivation;
	return t === null ? (e.observers_.size === 0 && F.inBatch > 0 && Rn(e), !1) : (t.runId_ !== e.lastAccessedBy_ && (e.lastAccessedBy_ = t.runId_, t.newObserving_[t.unboundDepsCount_++] = e, !e.isBeingObserved && F.trackingContext && (e.isBeingObserved = !0, e.onBO())), e.isBeingObserved);
}
function Bn(e) {
	e.lowestObserverState_ !== j.STALE_ && (e.lowestObserverState_ = j.STALE_, e.observers_.forEach(function(t) {
		t.dependenciesState_ === j.UP_TO_DATE_ && (t.isTracing_ !== M.NONE && Un(t, e), t.onBecomeStale_()), t.dependenciesState_ = j.STALE_;
	}));
}
function Vn(e) {
	e.lowestObserverState_ !== j.STALE_ && (e.lowestObserverState_ = j.STALE_, e.observers_.forEach(function(t) {
		t.dependenciesState_ === j.POSSIBLY_STALE_ ? (t.dependenciesState_ = j.STALE_, t.isTracing_ !== M.NONE && Un(t, e)) : t.dependenciesState_ === j.UP_TO_DATE_ && (e.lowestObserverState_ = j.UP_TO_DATE_);
	}));
}
function Hn(e) {
	e.lowestObserverState_ === j.UP_TO_DATE_ && (e.lowestObserverState_ = j.POSSIBLY_STALE_, e.observers_.forEach(function(e) {
		e.dependenciesState_ === j.UP_TO_DATE_ && (e.dependenciesState_ = j.POSSIBLY_STALE_, e.onBecomeStale_());
	}));
}
function Un(e, t) {
	if (console.log("[mobx.trace] '" + e.name_ + "' is invalidated due to a change in: '" + t.name_ + "'"), e.isTracing_ === M.BREAK) {
		var n = [];
		Wn(xr(e), n, 1), Function("debugger;\n/*\nTracing '" + e.name_ + "'\n\nYou are entering this break point because derivation '" + e.name_ + "' is being traced and '" + t.name_ + "' is now forcing it to update.\nJust follow the stacktrace you should now see in the devtools to see precisely what piece of your code is causing this update\nThe stackframe you are looking for is at least ~6-8 stack-frames up.\n\n" + (e instanceof A ? e.derivation.toString().replace(/[*]\//g, "/") : "") + "\n\nThe dependencies for this derivation are:\n\n" + n.join("\n") + "\n*/\n    ")();
	}
}
function Wn(e, t, n) {
	if (t.length >= 1e3) {
		t.push("(and many more)");
		return;
	}
	t.push("" + "	".repeat(n - 1) + e.name), e.dependencies && e.dependencies.forEach(function(e) {
		return Wn(e, t, n + 1);
	});
}
var Gn = /* @__PURE__ */ function() {
	function e(e, t, n, r) {
		e === void 0 && (e = "Reaction@" + _()), this.name_ = void 0, this.onInvalidate_ = void 0, this.errorHandler_ = void 0, this.requiresObservable_ = void 0, this.observing_ = [], this.newObserving_ = [], this.dependenciesState_ = j.NOT_TRACKING_, this.runId_ = 0, this.unboundDepsCount_ = 0, this.flags_ = 0, this.isTracing_ = M.NONE, this.name_ = e, this.onInvalidate_ = t, this.errorHandler_ = n, this.requiresObservable_ = r;
	}
	var t = e.prototype;
	return t.onBecomeStale_ = function() {
		this.schedule_();
	}, t.schedule_ = function() {
		this.isScheduled || (this.isScheduled = !0, F.pendingReactions.push(this), Jn());
	}, t.runReaction_ = function() {
		if (!this.isDisposed) {
			I(), this.isScheduled = !1;
			var e = F.trackingContext;
			if (F.trackingContext = this, Sn(this)) {
				this.isTrackPending = !0;
				try {
					this.onInvalidate_(), this.isTrackPending && R() && Zn({
						name: this.name_,
						type: "scheduled-reaction"
					});
				} catch (e) {
					this.reportExceptionInDerivation_(e);
				}
			}
			F.trackingContext = e, L();
		}
	}, t.track = function(e) {
		if (!this.isDisposed) {
			I();
			var t = R(), n;
			t && (n = Date.now(), z({
				name: this.name_,
				type: "reaction"
			})), this.isRunning = !0;
			var r = F.trackingContext;
			F.trackingContext = this;
			var i = wn(this, e, void 0);
			F.trackingContext = r, this.isRunning = !1, this.isTrackPending = !1, this.isDisposed && Dn(this), xn(i) && this.reportExceptionInDerivation_(i.cause), t && B({ time: Date.now() - n }), L();
		}
	}, t.reportExceptionInDerivation_ = function(e) {
		var t = this;
		if (this.errorHandler_) {
			this.errorHandler_(e, this);
			return;
		}
		if (F.disableErrorBoundaries) throw e;
		var n = "[mobx] Encountered an uncaught exception that was thrown by a reaction or observer component, in: '" + this + "'";
		F.suppressReactionErrors ? console.warn("[mobx] (error in reaction '" + this.name_ + "' suppressed, fix error of causing action below)") : console.error(n, e), R() && Zn({
			type: "error",
			name: this.name_,
			message: n,
			error: "" + e
		}), F.globalReactionErrorHandlers.forEach(function(n) {
			return n(e, t);
		});
	}, t.dispose = function() {
		this.isDisposed || (this.isDisposed = !0, this.isRunning || (I(), Dn(this), L()));
	}, t.getDisposer_ = function(e) {
		var t = this, n = function n() {
			t.dispose(), e == null || e.removeEventListener == null || e.removeEventListener("abort", n);
		};
		return e == null || e.addEventListener == null || e.addEventListener("abort", n), n[D] = this, "dispose" in Symbol && typeof Symbol.dispose == "symbol" && (n[Symbol.dispose] = n), n;
	}, t.toString = function() {
		return "Reaction[" + this.name_ + "]";
	}, t.trace = function(e) {
		e === void 0 && (e = !1), Nr(this, e);
	}, Ve(e, [
		{
			key: "isDisposed",
			get: function() {
				return S(this.flags_, e.isDisposedMask_);
			},
			set: function(t) {
				this.flags_ = C(this.flags_, e.isDisposedMask_, t);
			}
		},
		{
			key: "isScheduled",
			get: function() {
				return S(this.flags_, e.isScheduledMask_);
			},
			set: function(t) {
				this.flags_ = C(this.flags_, e.isScheduledMask_, t);
			}
		},
		{
			key: "isTrackPending",
			get: function() {
				return S(this.flags_, e.isTrackPendingMask_);
			},
			set: function(t) {
				this.flags_ = C(this.flags_, e.isTrackPendingMask_, t);
			}
		},
		{
			key: "isRunning",
			get: function() {
				return S(this.flags_, e.isRunningMask_);
			},
			set: function(t) {
				this.flags_ = C(this.flags_, e.isRunningMask_, t);
			}
		},
		{
			key: "diffValue",
			get: function() {
				return +!!S(this.flags_, e.diffValueMask_);
			},
			set: function(t) {
				this.flags_ = C(this.flags_, e.diffValueMask_, t === 1);
			}
		}
	]);
}();
Gn.isDisposedMask_ = 1, Gn.isScheduledMask_ = 2, Gn.isTrackPendingMask_ = 4, Gn.isRunningMask_ = 8, Gn.diffValueMask_ = 16;
var Kn = 100, qn = function(e) {
	return e();
};
function Jn() {
	F.inBatch > 0 || F.isRunningReactions || qn(Yn);
}
function Yn() {
	F.isRunningReactions = !0;
	for (var e = F.pendingReactions, t = 0; e.length > 0;) {
		++t === Kn && (console.error("Reaction doesn't converge to a stable state after " + Kn + " iterations." + (" Probably there is a cycle in the reactive function: " + e[0])), e.splice(0));
		for (var n = e.splice(0), r = 0, i = n.length; r < i; r++) n[r].runReaction_();
	}
	F.isRunningReactions = !1;
}
var Xn = /* @__PURE__ */ Ae("Reaction", Gn);
function R() {
	return !!F.spyListeners.length;
}
function Zn(e) {
	if (F.spyListeners.length) for (var t = F.spyListeners, n = 0, r = t.length; n < r; n++) t[n](e);
}
function z(e) {
	Zn(w({}, e, { spyReportStart: !0 }));
}
var Qn = {
	type: "report-end",
	spyReportEnd: !0
};
function B(e) {
	Zn(e ? w({}, e, {
		type: "report-end",
		spyReportEnd: !0
	}) : Qn);
}
function $n(e) {
	return F.spyListeners.push(e), Ce(function() {
		F.spyListeners = F.spyListeners.filter(function(t) {
			return t !== e;
		});
	});
}
var er = "action", tr = "action.bound", nr = "autoAction", rr = "autoAction.bound", ir = "<unnamed action>", ar = /* @__PURE__ */ pt(er), or = /* @__PURE__ */ pt(tr, { bound: !0 }), sr = /* @__PURE__ */ pt(nr, { autoAction: !0 }), cr = /* @__PURE__ */ pt(rr, {
	autoAction: !0,
	bound: !0
});
function lr(e) {
	return function(t, n) {
		if (v(t)) return dn(t.name || ir, t, e);
		if (v(n)) return dn(t, n, e);
		if (Ze(n)) return (e ? sr : ar).decorate_20223_(t, n);
		if (Te(n)) return Je(t, n, e ? sr : ar);
		if (Te(t)) return E(pt(e ? nr : er, {
			name: t,
			autoAction: e
		}));
		p("Invalid arguments for `action`");
	};
}
var V = /* @__PURE__ */ lr(!1);
Object.assign(V, ar);
var ur = /* @__PURE__ */ lr(!0);
Object.assign(ur, sr), V.bound = /* @__PURE__ */ E(or), ur.bound = /* @__PURE__ */ E(cr);
function dr(e) {
	return v(e) && e.isMobxAction === !0;
}
function fr(e, t) {
	var n;
	t === void 0 && (t = ve), v(e) || p("Autorun expects a function as first argument"), dr(e) && p("Autorun does not accept actions since actions are untrackable");
	var r = t?.name ?? (e.name || "Autorun@" + _()), i = !t.scheduler && !t.delay, a;
	if (i) a = new Gn(r, function() {
		this.track(c);
	}, t.onError, t.requiresObservable);
	else {
		var o = mr(t), s = !1;
		a = new Gn(r, function() {
			s || (s = !0, o(function() {
				s = !1, a.isDisposed || a.track(c);
			}));
		}, t.onError, t.requiresObservable);
	}
	function c() {
		e(a);
	}
	return (n = t) != null && (n = n.signal) != null && n.aborted || a.schedule_(), a.getDisposer_(t?.signal);
}
var pr = function(e) {
	return e();
};
function mr(e) {
	return e.scheduler ? e.scheduler : e.delay ? function(t) {
		return setTimeout(t, e.delay);
	} : pr;
}
var hr = "onBO", gr = "onBUO";
function _r(e, t, n) {
	return yr(hr, e, t, n);
}
function vr(e, t, n) {
	return yr(gr, e, t, n);
}
function yr(e, t, n, r) {
	var i = typeof r == "function" ? $(t, n) : $(t), a = v(r) ? r : n, o = e + "L";
	return i[o] ? i[o].add(a) : i[o] = new Set([a]), function() {
		var e = i[o];
		e && (e.delete(a), e.size === 0 && delete i[o]);
	};
}
function br(e, t, n, r) {
	arguments.length > 4 && p("'extendObservable' expected 2-4 arguments"), typeof e != "object" && p("'extendObservable' expects an object as first argument"), Z(e) && p("'extendObservable' should not be used on maps, use map.merge instead"), y(t) || p("'extendObservable' only accepts plain objects as second argument"), (Mr(t) || Mr(n)) && p("Extending an object with another observable (object) is not supported");
	var i = Re(t);
	return Ei(function() {
		var t = ci(e, r)[D];
		Fe(i).forEach(function(e) {
			t.extend_(e, i[e], n && e in n ? n[e] : !0);
		});
	}), e;
}
function xr(e, t) {
	return Sr($(e, t));
}
function Sr(e) {
	var t = { name: e.name_ };
	return e.observing_ && e.observing_.length > 0 && (t.dependencies = Cr(e.observing_).map(Sr)), t;
}
function Cr(e) {
	return Array.from(new Set(e));
}
var wr = 0;
function Tr() {
	this.message = "FLOW_CANCELLED";
}
Tr.prototype = /* @__PURE__ */ Object.create(Error.prototype);
var Er = /* @__PURE__ */ yt("flow"), Dr = /* @__PURE__ */ yt("flow.bound", { bound: !0 }), Or = /* @__PURE__ */ Object.assign(function(e, t) {
	if (Ze(t)) return Er.decorate_20223_(e, t);
	if (Te(t)) return Je(e, t, Er);
	arguments.length !== 1 && p("Flow expects single argument with generator function");
	var n = e, r = n.name || "<unnamed flow>", i = function() {
		var e = this, t = arguments, i = ++wr, a = V(r + " - runid: " + i + " - init", n).apply(e, t), o, s = void 0, c = new Promise(function(e, t) {
			var n = 0;
			o = t;
			function c(e) {
				s = void 0;
				var o;
				try {
					o = V(r + " - runid: " + i + " - yield " + n++, a.next).call(a, e);
				} catch (e) {
					return t(e);
				}
				u(o);
			}
			function l(e) {
				s = void 0;
				var o;
				try {
					o = V(r + " - runid: " + i + " - yield " + n++, a.throw).call(a, e);
				} catch (e) {
					return t(e);
				}
				u(o);
			}
			function u(n) {
				if (v(n?.then)) {
					n.then(u, t);
					return;
				}
				return n.done ? e(n.value) : (s = Promise.resolve(n.value), s.then(c, l));
			}
			c(void 0);
		});
		return c.cancel = V(r + " - runid: " + i + " - cancel", function() {
			try {
				s && kr(s);
				var e = a.return(void 0), t = Promise.resolve(e.value);
				t.then(we, we), kr(t), o(new Tr());
			} catch (e) {
				o(e);
			}
		}), c;
	};
	return i.isMobXFlow = !0, i;
}, Er);
Or.bound = /* @__PURE__ */ E(Dr);
function kr(e) {
	v(e.cancel) && e.cancel();
}
function Ar(e) {
	return e?.isMobXFlow === !0;
}
function jr(e, t) {
	return e ? t === void 0 ? di(e) || !!e[D] || et(e) || Xn(e) || yn(e) : Z(e) || Yr(e) ? p("isObservable(object, propertyName) is not supported for arrays and maps. Use map.has or array.length instead.") : di(e) ? e[D].values_.has(t) : !1 : !1;
}
function Mr(e) {
	return arguments.length !== 1 && p("isObservable expects only 1 argument. Use isObservableProp to inspect the observability of a property"), jr(e);
}
function Nr() {
	var e = !1, t = [...arguments];
	typeof t[t.length - 1] == "boolean" && (e = t.pop());
	var n = Pr(t);
	if (!n) return p("'trace(break?)' can only be used inside a tracked computed value or a Reaction. Consider passing in the computed value or reaction explicitly");
	n.isTracing_ === M.NONE && console.log("[mobx.trace] '" + n.name_ + "' tracing enabled"), n.isTracing_ = e ? M.BREAK : M.LOG;
}
function Pr(e) {
	switch (e.length) {
		case 0: return F.trackingDerivation;
		case 1: return $(e[0]);
		case 2: return $(e[0], e[1]);
	}
}
function H(e, t) {
	t === void 0 && (t = void 0), I();
	try {
		return e.apply(t);
	} finally {
		L();
	}
}
function Fr(e) {
	return e[D];
}
var Ir = {
	has: function(e, t) {
		return F.trackingDerivation && Se("detect new properties using the 'in' operator. Use 'has' from 'mobx' instead."), Fr(e).has_(t);
	},
	get: function(e, t) {
		return Fr(e).get_(t);
	},
	set: function(e, t, n) {
		return Te(t) ? (Fr(e).values_.has(t) || Se("add a new observable property through direct assignment. Use 'set' from 'mobx' instead."), Fr(e).set_(t, n, !0) ?? !0) : !1;
	},
	deleteProperty: function(e, t) {
		return Se("delete properties from an observable object. Use 'remove' from 'mobx' instead."), Te(t) ? Fr(e).delete_(t, !0) ?? !0 : !1;
	},
	defineProperty: function(e, t, n) {
		return Se("define property on an observable object. Use 'defineProperty' from 'mobx' instead."), Fr(e).defineProperty_(t, n) ?? !0;
	},
	ownKeys: function(e) {
		return F.trackingDerivation && Se("iterate keys to detect added / removed properties. Use 'keys' from 'mobx' instead."), Fr(e).ownKeys_();
	},
	preventExtensions: function(e) {
		p(13);
	}
};
function Lr(e, t) {
	var n;
	return xe(), e = ci(e, t), (n = e[D]).proxy_ ?? (n.proxy_ = new Proxy(e, Ir));
}
function U(e) {
	return e.interceptors_ !== void 0 && e.interceptors_.length > 0;
}
function Rr(e, t) {
	var n = e.interceptors_ ||= [];
	return n.push(t), Ce(function() {
		var e = n.indexOf(t);
		e !== -1 && n.splice(e, 1);
	});
}
function W(e, t) {
	var n = kn();
	try {
		for (var r = [].concat(e.interceptors_ || []), i = 0, a = r.length; i < a && (t = r[i](t), t && !t.type && p(14), t); i++);
		return t;
	} finally {
		P(n);
	}
}
function G(e) {
	return e.changeListeners_ !== void 0 && e.changeListeners_.length > 0;
}
function zr(e, t) {
	var n = e.changeListeners_ ||= [];
	return n.push(t), Ce(function() {
		var e = n.indexOf(t);
		e !== -1 && n.splice(e, 1);
	});
}
function K(e, t) {
	var n = kn(), r = e.changeListeners_;
	if (r) {
		r = r.slice();
		for (var i = 0, a = r.length; i < a; i++) r[i](t);
		P(n);
	}
}
function Br(e, t, n) {
	return Ei(function() {
		var r = ci(e, n)[D];
		t && e[T] && p("makeObservable second arg must be nullish when using decorators. Mixing @decorator syntax with annotations is not supported."), t ??= Xe(e), Fe(t).forEach(function(e) {
			return r.make_(e, t[e]);
		});
	}), e;
}
var Vr = "splice", q = "update", Hr = 1e4, Ur = {
	get: function(e, t) {
		var n = e[D];
		return t === D ? n : t === "length" ? n.getArrayLength_() : typeof t == "string" && !isNaN(t) ? n.get_(parseInt(t)) : x(Kr, t) ? Kr[t] : e[t];
	},
	set: function(e, t, n) {
		var r = e[D];
		return t === "length" && r.setArrayLength_(n), typeof t == "symbol" || isNaN(t) ? e[t] = n : r.set_(parseInt(t), n), !0;
	},
	preventExtensions: function() {
		p(15);
	}
}, Wr = /* @__PURE__ */ function() {
	function e(e, t, n, r) {
		e === void 0 && (e = "ObservableArray@" + _()), this.owned_ = void 0, this.legacyMode_ = void 0, this.atom_ = void 0, this.values_ = [], this.interceptors_ = void 0, this.changeListeners_ = void 0, this.enhancer_ = void 0, this.dehancer = void 0, this.proxy_ = void 0, this.lastKnownLength_ = 0, this.owned_ = n, this.legacyMode_ = r, this.atom_ = new $e(e), this.enhancer_ = function(n, r) {
			return t(n, r, e + "[..]");
		};
	}
	var t = e.prototype;
	return t.dehanceValue_ = function(e) {
		return this.dehancer === void 0 ? e : this.dehancer(e);
	}, t.dehanceValues_ = function(e) {
		return this.dehancer !== void 0 && e.length > 0 ? e.map(this.dehancer) : e;
	}, t.intercept_ = function(e) {
		return Rr(this, e);
	}, t.observe_ = function(e, t) {
		return t === void 0 && (t = !1), t && e({
			observableKind: "array",
			object: this.proxy_,
			debugObjectName: this.atom_.name_,
			type: "splice",
			index: 0,
			added: this.values_.slice(),
			addedCount: this.values_.length,
			removed: [],
			removedCount: 0
		}), zr(this, e);
	}, t.getArrayLength_ = function() {
		return this.atom_.reportObserved(), this.values_.length;
	}, t.setArrayLength_ = function(e) {
		(typeof e != "number" || isNaN(e) || e < 0) && p("Out of range: " + e);
		var t = this.values_.length;
		if (e !== t) if (e > t) {
			for (var n = Array(e - t), r = 0; r < e - t; r++) n[r] = void 0;
			this.spliceWithArray_(t, 0, n);
		} else this.spliceWithArray_(e, t - e);
	}, t.updateArrayLength_ = function(e, t) {
		e !== this.lastKnownLength_ && p(16), this.lastKnownLength_ += t, this.legacyMode_ && t > 0 && Si(e + t + 1);
	}, t.spliceWithArray_ = function(e, t, n) {
		var r = this;
		N(this.atom_);
		var i = this.values_.length;
		if (e === void 0 ? e = 0 : e > i ? e = i : e < 0 && (e = Math.max(0, i + e)), t = arguments.length === 1 ? i - e : t == null ? 0 : Math.max(0, Math.min(t, i - e)), n === void 0 && (n = g), U(this)) {
			var a = W(this, {
				object: this.proxy_,
				type: Vr,
				index: e,
				removedCount: t,
				added: n
			});
			if (!a) return g;
			t = a.removedCount, n = a.added;
		}
		if (n = n.length === 0 ? n : n.map(function(e) {
			return r.enhancer_(e, void 0);
		}), this.legacyMode_ || !0) {
			var o = n.length - t;
			this.updateArrayLength_(i, o);
		}
		var s = this.spliceItemsIntoValues_(e, t, n);
		return (t !== 0 || n.length !== 0) && this.notifyArraySplice_(e, n, s), this.dehanceValues_(s);
	}, t.spliceItemsIntoValues_ = function(e, t, n) {
		if (n.length < Hr) {
			var r;
			return (r = this.values_).splice.apply(r, [e, t].concat(n));
		} else {
			var i = this.values_.slice(e, e + t), a = this.values_.slice(e + t);
			this.values_.length += n.length - t;
			for (var o = 0; o < n.length; o++) this.values_[e + o] = n[o];
			for (var s = 0; s < a.length; s++) this.values_[e + n.length + s] = a[s];
			return i;
		}
	}, t.notifyArrayChildUpdate_ = function(e, t, n) {
		var r = !this.owned_ && R(), i = G(this), a = i || r ? {
			observableKind: "array",
			object: this.proxy_,
			type: q,
			debugObjectName: this.atom_.name_,
			index: e,
			newValue: t,
			oldValue: n
		} : null;
		r && z(a), this.atom_.reportChanged(), i && K(this, a), r && B();
	}, t.notifyArraySplice_ = function(e, t, n) {
		var r = !this.owned_ && R(), i = G(this), a = i || r ? {
			observableKind: "array",
			object: this.proxy_,
			debugObjectName: this.atom_.name_,
			type: Vr,
			index: e,
			removed: n,
			added: t,
			removedCount: n.length,
			addedCount: t.length
		} : null;
		r && z(a), this.atom_.reportChanged(), i && K(this, a), r && B();
	}, t.get_ = function(e) {
		if (this.legacyMode_ && e >= this.values_.length) {
			console.warn("[mobx.array] Attempt to read an array index (" + e + ") that is out of bounds (" + this.values_.length + "). Please check length first. Out of bound indices will not be tracked by MobX");
			return;
		}
		return this.atom_.reportObserved(), this.dehanceValue_(this.values_[e]);
	}, t.set_ = function(e, t) {
		var n = this.values_;
		if (this.legacyMode_ && e > n.length && p(17, e, n.length), e < n.length) {
			N(this.atom_);
			var r = n[e];
			if (U(this)) {
				var i = W(this, {
					type: q,
					object: this.proxy_,
					index: e,
					newValue: t
				});
				if (!i) return;
				t = i.newValue;
			}
			t = this.enhancer_(t, r), t !== r && (n[e] = t, this.notifyArrayChildUpdate_(e, t, r));
		} else {
			for (var a = Array(e + 1 - n.length), o = 0; o < a.length - 1; o++) a[o] = void 0;
			a[a.length - 1] = t, this.spliceWithArray_(n.length, 0, a);
		}
	}, e;
}();
function Gr(e, t, n, r) {
	return n === void 0 && (n = "ObservableArray@" + _()), r === void 0 && (r = !1), xe(), Ei(function() {
		var i = new Wr(n, t, r, !1);
		ke(i.values_, D, i);
		var a = new Proxy(i.values_, Ur);
		return i.proxy_ = a, e && e.length && i.spliceWithArray_(0, 0, e), a;
	});
}
var Kr = {
	clear: function() {
		return this.splice(0);
	},
	replace: function(e) {
		var t = this[D];
		return t.spliceWithArray_(0, t.values_.length, e);
	},
	toJSON: function() {
		return this.slice();
	},
	splice: function(e, t) {
		var n = [...arguments].slice(2), r = this[D];
		switch (arguments.length) {
			case 0: return [];
			case 1: return r.spliceWithArray_(e);
			case 2: return r.spliceWithArray_(e, t);
		}
		return r.spliceWithArray_(e, t, n);
	},
	spliceWithArray: function(e, t, n) {
		return this[D].spliceWithArray_(e, t, n);
	},
	push: function() {
		var e = this[D], t = [...arguments];
		return e.spliceWithArray_(e.values_.length, 0, t), e.values_.length;
	},
	pop: function() {
		return this.splice(Math.max(this[D].values_.length - 1, 0), 1)[0];
	},
	shift: function() {
		return this.splice(0, 1)[0];
	},
	unshift: function() {
		var e = this[D], t = [...arguments];
		return e.spliceWithArray_(0, 0, t), e.values_.length;
	},
	reverse: function() {
		return F.trackingDerivation && p(37, "reverse"), this.replace(this.slice().reverse()), this;
	},
	sort: function() {
		F.trackingDerivation && p(37, "sort");
		var e = this.slice();
		return e.sort.apply(e, arguments), this.replace(e), this;
	},
	remove: function(e) {
		var t = this[D], n = t.dehanceValues_(t.values_).indexOf(e);
		return n > -1 ? (this.splice(n, 1), !0) : !1;
	}
};
J("at", Y), J("concat", Y), J("flat", Y), J("includes", Y), J("indexOf", Y), J("join", Y), J("lastIndexOf", Y), J("slice", Y), J("toString", Y), J("toLocaleString", Y), J("toSorted", Y), J("toSpliced", Y), J("with", Y), J("every", X), J("filter", X), J("find", X), J("findIndex", X), J("findLast", X), J("findLastIndex", X), J("flatMap", X), J("forEach", X), J("map", X), J("some", X), J("toReversed", X), J("reduce", qr), J("reduceRight", qr);
function J(e, t) {
	typeof Array.prototype[e] == "function" && (Kr[e] = t(e));
}
function Y(e) {
	return function() {
		var t = this[D];
		t.atom_.reportObserved();
		var n = t.dehanceValues_(t.values_);
		return n[e].apply(n, arguments);
	};
}
function X(e) {
	return function(t, n) {
		var r = this, i = this[D];
		return i.atom_.reportObserved(), i.dehanceValues_(i.values_)[e](function(e, i) {
			return t.call(n, e, i, r);
		});
	};
}
function qr(e) {
	return function() {
		var t = this, n = this[D];
		n.atom_.reportObserved();
		var r = n.dehanceValues_(n.values_), i = arguments[0];
		return arguments[0] = function(e, n, r) {
			return i(e, n, r, t);
		}, r[e].apply(r, arguments);
	};
}
var Jr = /* @__PURE__ */ Ae("ObservableArrayAdministration", Wr);
function Yr(e) {
	return Ee(e) && Jr(e[D]);
}
var Xr = {}, Zr = "add", Qr = "delete", $r = /* @__PURE__ */ function() {
	function e(e, t, n) {
		var r = this;
		t === void 0 && (t = st), n === void 0 && (n = "ObservableMap@" + _()), this.enhancer_ = void 0, this.name_ = void 0, this[D] = Xr, this.data_ = void 0, this.hasMap_ = void 0, this.keysAtom_ = void 0, this.interceptors_ = void 0, this.changeListeners_ = void 0, this.dehancer = void 0, this.enhancer_ = t, this.name_ = n, v(Map) || p(18), Ei(function() {
			r.keysAtom_ = tt(r.name_ + ".keys()"), r.data_ = /* @__PURE__ */ new Map(), r.hasMap_ = /* @__PURE__ */ new Map(), e && r.merge(e);
		});
	}
	var t = e.prototype;
	return t.has_ = function(e) {
		return this.data_.has(e);
	}, t.has = function(e) {
		var t = this;
		if (!F.trackingDerivation) return this.has_(e);
		var n = this.hasMap_.get(e);
		if (!n) {
			var r = n = new vn(this.has_(e), lt, this.name_ + "." + Ie(e) + "?", !1);
			this.hasMap_.set(e, r), vr(r, function() {
				return t.hasMap_.delete(e);
			});
		}
		return n.get();
	}, t.set = function(e, t) {
		var n = this.has_(e);
		if (U(this)) {
			var r = W(this, {
				type: n ? q : Zr,
				object: this,
				newValue: t,
				name: e
			});
			if (!r) return this;
			t = r.newValue;
		}
		return n ? this.updateValue_(e, t) : this.addValue_(e, t), this;
	}, t.delete = function(e) {
		var t = this;
		if (N(this.keysAtom_), U(this) && !W(this, {
			type: Qr,
			object: this,
			name: e
		})) return !1;
		if (this.has_(e)) {
			var n = R(), r = G(this), i = r || n ? {
				observableKind: "map",
				debugObjectName: this.name_,
				type: Qr,
				object: this,
				oldValue: this.data_.get(e).value_,
				name: e
			} : null;
			return n && z(i), H(function() {
				var n;
				t.keysAtom_.reportChanged(), (n = t.hasMap_.get(e)) == null || n.setNewValue_(!1), t.data_.get(e).setNewValue_(void 0), t.data_.delete(e);
			}), r && K(this, i), n && B(), !0;
		}
		return !1;
	}, t.updateValue_ = function(e, t) {
		var n = this.data_.get(e);
		if (t = n.prepareNewValue_(t), t !== F.UNCHANGED) {
			var r = R(), i = G(this), a = i || r ? {
				observableKind: "map",
				debugObjectName: this.name_,
				type: q,
				object: this,
				oldValue: n.value_,
				name: e,
				newValue: t
			} : null;
			r && z(a), n.setNewValue_(t), i && K(this, a), r && B();
		}
	}, t.addValue_ = function(e, t) {
		var n = this;
		N(this.keysAtom_), H(function() {
			var r, i = new vn(t, n.enhancer_, n.name_ + "." + Ie(e), !1);
			n.data_.set(e, i), t = i.value_, (r = n.hasMap_.get(e)) == null || r.setNewValue_(!0), n.keysAtom_.reportChanged();
		});
		var r = R(), i = G(this), a = i || r ? {
			observableKind: "map",
			debugObjectName: this.name_,
			type: Zr,
			object: this,
			name: e,
			newValue: t
		} : null;
		r && z(a), i && K(this, a), r && B();
	}, t.get = function(e) {
		return this.has(e) ? this.dehanceValue_(this.data_.get(e).get()) : this.dehanceValue_(void 0);
	}, t.dehanceValue_ = function(e) {
		return this.dehancer === void 0 ? e : this.dehancer(e);
	}, t.keys = function() {
		return this.keysAtom_.reportObserved(), this.data_.keys();
	}, t.values = function() {
		var e = this, t = this.keys();
		return ei({ next: function() {
			var n = t.next(), r = n.done, i = n.value;
			return {
				done: r,
				value: r ? void 0 : e.get(i)
			};
		} });
	}, t.entries = function() {
		var e = this, t = this.keys();
		return ei({ next: function() {
			var n = t.next(), r = n.done, i = n.value;
			return {
				done: r,
				value: r ? void 0 : [i, e.get(i)]
			};
		} });
	}, t[Symbol.iterator] = function() {
		return this.entries();
	}, t.forEach = function(e, t) {
		for (var n = He(this), r; !(r = n()).done;) {
			var i = r.value, a = i[0], o = i[1];
			e.call(t, o, a, this);
		}
	}, t.merge = function(e) {
		var t = this;
		return Z(e) && (e = new Map(e)), H(function() {
			y(e) ? Pe(e).forEach(function(n) {
				return t.set(n, e[n]);
			}) : Array.isArray(e) ? e.forEach(function(e) {
				var n = e[0], r = e[1];
				return t.set(n, r);
			}) : je(e) ? (Me(e) || p(19, e), e.forEach(function(e, n) {
				return t.set(n, e);
			})) : e != null && p(20, e);
		}), this;
	}, t.clear = function() {
		var e = this;
		H(function() {
			On(function() {
				for (var t = He(e.keys()), n; !(n = t()).done;) {
					var r = n.value;
					e.delete(r);
				}
			});
		});
	}, t.replace = function(e) {
		var t = this;
		return H(function() {
			for (var n = ti(e), r = /* @__PURE__ */ new Map(), i = !1, a = He(t.data_.keys()), o; !(o = a()).done;) {
				var s = o.value;
				if (!n.has(s)) if (t.delete(s)) i = !0;
				else {
					var c = t.data_.get(s);
					r.set(s, c);
				}
			}
			for (var l = He(n.entries()), u; !(u = l()).done;) {
				var ee = u.value, te = ee[0], ne = ee[1], re = t.data_.has(te);
				if (t.set(te, ne), t.data_.has(te)) {
					var ie = t.data_.get(te);
					r.set(te, ie), re || (i = !0);
				}
			}
			if (!i) if (t.data_.size !== r.size) t.keysAtom_.reportChanged();
			else for (var ae = t.data_.keys(), oe = r.keys(), d = ae.next(), se = oe.next(); !d.done;) {
				if (d.value !== se.value) {
					t.keysAtom_.reportChanged();
					break;
				}
				d = ae.next(), se = oe.next();
			}
			t.data_ = r;
		}), this;
	}, t.toString = function() {
		return "[object ObservableMap]";
	}, t.toJSON = function() {
		return Array.from(this);
	}, t.observe_ = function(e, t) {
		return t === !0 && p("`observe` doesn't support fireImmediately=true in combination with maps."), zr(this, e);
	}, t.intercept_ = function(e) {
		return Rr(this, e);
	}, Ve(e, [{
		key: "size",
		get: function() {
			return this.keysAtom_.reportObserved(), this.data_.size;
		}
	}, {
		key: Symbol.toStringTag,
		get: function() {
			return "Map";
		}
	}]);
}(), Z = /* @__PURE__ */ Ae("ObservableMap", $r);
function ei(e) {
	return e[Symbol.toStringTag] = "MapIterator", Mi(e);
}
function ti(e) {
	if (je(e) || Z(e)) return e;
	if (Array.isArray(e)) return new Map(e);
	if (y(e)) {
		var t = /* @__PURE__ */ new Map();
		for (var n in e) t.set(n, e[n]);
		return t;
	} else return p(21, e);
}
var ni = {}, ri = /* @__PURE__ */ function() {
	function e(e, t, n) {
		var r = this;
		t === void 0 && (t = st), n === void 0 && (n = "ObservableSet@" + _()), this.name_ = void 0, this[D] = ni, this.data_ = /* @__PURE__ */ new Set(), this.atom_ = void 0, this.changeListeners_ = void 0, this.interceptors_ = void 0, this.dehancer = void 0, this.enhancer_ = void 0, this.name_ = n, v(Set) || p(22), this.enhancer_ = function(e, r) {
			return t(e, r, n);
		}, Ei(function() {
			r.atom_ = tt(r.name_), e && r.replace(e);
		});
	}
	var t = e.prototype;
	return t.dehanceValue_ = function(e) {
		return this.dehancer === void 0 ? e : this.dehancer(e);
	}, t.clear = function() {
		var e = this;
		H(function() {
			On(function() {
				for (var t = He(e.data_.values()), n; !(n = t()).done;) {
					var r = n.value;
					e.delete(r);
				}
			});
		});
	}, t.forEach = function(e, t) {
		for (var n = He(this), r; !(r = n()).done;) {
			var i = r.value;
			e.call(t, i, i, this);
		}
	}, t.add = function(e) {
		var t = this;
		if (N(this.atom_), U(this)) {
			var n = W(this, {
				type: Zr,
				object: this,
				newValue: e
			});
			if (!n) return this;
			e = n.newValue;
		}
		if (!this.has(e)) {
			H(function() {
				t.data_.add(t.enhancer_(e, void 0)), t.atom_.reportChanged();
			});
			var r = R(), i = G(this), a = i || r ? {
				observableKind: "set",
				debugObjectName: this.name_,
				type: Zr,
				object: this,
				newValue: e
			} : null;
			r && z(a), i && K(this, a), r && B();
		}
		return this;
	}, t.delete = function(e) {
		var t = this;
		if (U(this) && !W(this, {
			type: Qr,
			object: this,
			oldValue: e
		})) return !1;
		if (this.has(e)) {
			var n = R(), r = G(this), i = r || n ? {
				observableKind: "set",
				debugObjectName: this.name_,
				type: Qr,
				object: this,
				oldValue: e
			} : null;
			return n && z(i), H(function() {
				t.atom_.reportChanged(), t.data_.delete(e);
			}), r && K(this, i), n && B(), !0;
		}
		return !1;
	}, t.has = function(e) {
		return this.atom_.reportObserved(), this.data_.has(this.dehanceValue_(e));
	}, t.entries = function() {
		var e = this.values();
		return ii({ next: function() {
			var t = e.next(), n = t.value, r = t.done;
			return r ? {
				value: void 0,
				done: r
			} : {
				value: [n, n],
				done: r
			};
		} });
	}, t.keys = function() {
		return this.values();
	}, t.values = function() {
		this.atom_.reportObserved();
		var e = this, t = this.data_.values();
		return ii({ next: function() {
			var n = t.next(), r = n.value, i = n.done;
			return i ? {
				value: void 0,
				done: i
			} : {
				value: e.dehanceValue_(r),
				done: i
			};
		} });
	}, t.intersection = function(e) {
		return b(e) && !Q(e) ? e.intersection(this) : new Set(this).intersection(e);
	}, t.union = function(e) {
		return b(e) && !Q(e) ? e.union(this) : new Set(this).union(e);
	}, t.difference = function(e) {
		return new Set(this).difference(e);
	}, t.symmetricDifference = function(e) {
		return b(e) && !Q(e) ? e.symmetricDifference(this) : new Set(this).symmetricDifference(e);
	}, t.isSubsetOf = function(e) {
		return new Set(this).isSubsetOf(e);
	}, t.isSupersetOf = function(e) {
		return new Set(this).isSupersetOf(e);
	}, t.isDisjointFrom = function(e) {
		return b(e) && !Q(e) ? e.isDisjointFrom(this) : new Set(this).isDisjointFrom(e);
	}, t.replace = function(e) {
		var t = this;
		return Q(e) && (e = new Set(e)), H(function() {
			Array.isArray(e) || b(e) ? (t.clear(), e.forEach(function(e) {
				return t.add(e);
			})) : e != null && p("Cannot initialize set from " + e);
		}), this;
	}, t.observe_ = function(e, t) {
		return t === !0 && p("`observe` doesn't support fireImmediately=true in combination with sets."), zr(this, e);
	}, t.intercept_ = function(e) {
		return Rr(this, e);
	}, t.toJSON = function() {
		return Array.from(this);
	}, t.toString = function() {
		return "[object ObservableSet]";
	}, t[Symbol.iterator] = function() {
		return this.values();
	}, Ve(e, [{
		key: "size",
		get: function() {
			return this.atom_.reportObserved(), this.data_.size;
		}
	}, {
		key: Symbol.toStringTag,
		get: function() {
			return "Set";
		}
	}]);
}(), Q = /* @__PURE__ */ Ae("ObservableSet", ri);
function ii(e) {
	return e[Symbol.toStringTag] = "SetIterator", Mi(e);
}
var ai = /* @__PURE__ */ Object.create(null), oi = "remove", si = /* @__PURE__ */ function() {
	function e(e, t, n, r) {
		t === void 0 && (t = /* @__PURE__ */ new Map()), r === void 0 && (r = It), this.target_ = void 0, this.values_ = void 0, this.name_ = void 0, this.defaultAnnotation_ = void 0, this.keysAtom_ = void 0, this.changeListeners_ = void 0, this.interceptors_ = void 0, this.proxy_ = void 0, this.isPlainObject_ = void 0, this.appliedAnnotations_ = void 0, this.pendingKeys_ = void 0, this.target_ = e, this.values_ = t, this.name_ = n, this.defaultAnnotation_ = r, this.keysAtom_ = new $e(this.name_ + ".keys"), this.isPlainObject_ = y(this.target_), Pi(this.defaultAnnotation_) || p("defaultAnnotation must be valid annotation"), this.appliedAnnotations_ = {};
	}
	var t = e.prototype;
	return t.getObservablePropValue_ = function(e) {
		return this.values_.get(e).get();
	}, t.setObservablePropValue_ = function(e, t) {
		var n = this.values_.get(e);
		if (n instanceof A) return n.set(t), !0;
		if (U(this)) {
			var r = W(this, {
				type: q,
				object: this.proxy_ || this.target_,
				name: e,
				newValue: t
			});
			if (!r) return null;
			t = r.newValue;
		}
		if (t = n.prepareNewValue_(t), t !== F.UNCHANGED) {
			var i = G(this), a = R(), o = i || a ? {
				type: q,
				observableKind: "object",
				debugObjectName: this.name_,
				object: this.proxy_ || this.target_,
				oldValue: n.value_,
				name: e,
				newValue: t
			} : null;
			a && z(o), n.setNewValue_(t), i && K(this, o), a && B();
		}
		return !0;
	}, t.get_ = function(e) {
		return F.trackingDerivation && !x(this.target_, e) && this.has_(e), this.target_[e];
	}, t.set_ = function(e, t, n) {
		return n === void 0 && (n = !1), x(this.target_, e) ? this.values_.has(e) ? this.setObservablePropValue_(e, t) : n ? Reflect.set(this.target_, e, t) : (this.target_[e] = t, !0) : this.extend_(e, {
			value: t,
			enumerable: !0,
			writable: !0,
			configurable: !0
		}, this.defaultAnnotation_, n);
	}, t.has_ = function(e) {
		if (!F.trackingDerivation) return e in this.target_;
		this.pendingKeys_ ||= /* @__PURE__ */ new Map();
		var t = this.pendingKeys_.get(e);
		return t || (t = new vn(e in this.target_, lt, this.name_ + "." + Ie(e) + "?", !1), this.pendingKeys_.set(e, t)), t.get();
	}, t.make_ = function(e, t) {
		if (t === !0 && (t = this.defaultAnnotation_), t !== !1) {
			if (pi(this, t, e), !(e in this.target_)) {
				var n;
				if ((n = this.target_[T]) != null && n[e]) return;
				p(1, t.annotationType_, this.name_ + "." + e.toString());
			}
			for (var r = this.target_; r && r !== h;) {
				var i = _e(r, e);
				if (i) {
					var a = t.make_(this, e, i, r);
					if (a === 0) return;
					if (a === 1) break;
				}
				r = Object.getPrototypeOf(r);
			}
			fi(this, t, e);
		}
	}, t.extend_ = function(e, t, n, r) {
		if (r === void 0 && (r = !1), n === !0 && (n = this.defaultAnnotation_), n === !1) return this.defineProperty_(e, t, r);
		pi(this, n, e);
		var i = n.extend_(this, e, t, r);
		return i && fi(this, n, e), i;
	}, t.defineProperty_ = function(e, t, n) {
		n === void 0 && (n = !1), N(this.keysAtom_);
		try {
			I();
			var r = this.delete_(e);
			if (!r) return r;
			if (U(this)) {
				var i = W(this, {
					object: this.proxy_ || this.target_,
					name: e,
					type: Zr,
					newValue: t.value
				});
				if (!i) return null;
				var a = i.newValue;
				t.value !== a && (t = w({}, t, { value: a }));
			}
			if (n) {
				if (!Reflect.defineProperty(this.target_, e, t)) return !1;
			} else m(this.target_, e, t);
			this.notifyPropertyAddition_(e, t.value);
		} finally {
			L();
		}
		return !0;
	}, t.defineObservableProperty_ = function(e, t, n, r) {
		r === void 0 && (r = !1), N(this.keysAtom_);
		try {
			I();
			var i = this.delete_(e);
			if (!i) return i;
			if (U(this)) {
				var a = W(this, {
					object: this.proxy_ || this.target_,
					name: e,
					type: Zr,
					newValue: t
				});
				if (!a) return null;
				t = a.newValue;
			}
			var o = ui(e), s = {
				configurable: F.safeDescriptors ? this.isPlainObject_ : !0,
				enumerable: !0,
				get: o.get,
				set: o.set
			};
			if (r) {
				if (!Reflect.defineProperty(this.target_, e, s)) return !1;
			} else m(this.target_, e, s);
			var c = new vn(t, n, this.name_ + "." + e.toString(), !1);
			this.values_.set(e, c), this.notifyPropertyAddition_(e, c.value_);
		} finally {
			L();
		}
		return !0;
	}, t.defineComputedProperty_ = function(e, t, n) {
		n === void 0 && (n = !1), N(this.keysAtom_);
		try {
			I();
			var r = this.delete_(e);
			if (!r) return r;
			if (U(this) && !W(this, {
				object: this.proxy_ || this.target_,
				name: e,
				type: Zr,
				newValue: void 0
			})) return null;
			t.name ||= this.name_ + "." + e.toString(), t.context = this.proxy_ || this.target_;
			var i = ui(e), a = {
				configurable: F.safeDescriptors ? this.isPlainObject_ : !0,
				enumerable: !1,
				get: i.get,
				set: i.set
			};
			if (n) {
				if (!Reflect.defineProperty(this.target_, e, a)) return !1;
			} else m(this.target_, e, a);
			this.values_.set(e, new A(t)), this.notifyPropertyAddition_(e, void 0);
		} finally {
			L();
		}
		return !0;
	}, t.delete_ = function(e, t) {
		if (t === void 0 && (t = !1), N(this.keysAtom_), !x(this.target_, e)) return !0;
		if (U(this) && !W(this, {
			object: this.proxy_ || this.target_,
			name: e,
			type: oi
		})) return null;
		try {
			var n;
			I();
			var r = G(this), i = R(), a = this.values_.get(e), o = void 0;
			if (!a && (r || i) && (o = _e(this.target_, e)?.value), t) {
				if (!Reflect.deleteProperty(this.target_, e)) return !1;
			} else delete this.target_[e];
			if (delete this.appliedAnnotations_[e], a && (this.values_.delete(e), a instanceof vn && (o = a.value_), Bn(a)), this.keysAtom_.reportChanged(), (n = this.pendingKeys_) == null || (n = n.get(e)) == null || n.set(e in this.target_), r || i) {
				var s = {
					type: oi,
					observableKind: "object",
					object: this.proxy_ || this.target_,
					debugObjectName: this.name_,
					oldValue: o,
					name: e
				};
				i && z(s), r && K(this, s), i && B();
			}
		} finally {
			L();
		}
		return !0;
	}, t.observe_ = function(e, t) {
		return t === !0 && p("`observe` doesn't support the fire immediately property for observable objects."), zr(this, e);
	}, t.intercept_ = function(e) {
		return Rr(this, e);
	}, t.notifyPropertyAddition_ = function(e, t) {
		var n, r = G(this), i = R();
		if (r || i) {
			var a = r || i ? {
				type: Zr,
				observableKind: "object",
				debugObjectName: this.name_,
				object: this.proxy_ || this.target_,
				name: e,
				newValue: t
			} : null;
			i && z(a), r && K(this, a), i && B();
		}
		(n = this.pendingKeys_) == null || (n = n.get(e)) == null || n.set(!0), this.keysAtom_.reportChanged();
	}, t.ownKeys_ = function() {
		return this.keysAtom_.reportObserved(), Fe(this.target_);
	}, t.keys_ = function() {
		return this.keysAtom_.reportObserved(), Object.keys(this.target_);
	}, e;
}();
function ci(e, t) {
	if (t && di(e) && p("Options can't be provided for already observable objects."), x(e, D)) return wi(e) instanceof si || p("Cannot convert '" + Ti(e) + "' into observable object:\nThe target is already observable of different type.\nExtending builtins is not supported."), e;
	Object.isExtensible(e) || p("Cannot make the designated object observable; it is not extensible");
	var n = t?.name ?? (y(e) ? "ObservableObject" : e.constructor.name) + "@" + _();
	return Oe(e, D, new si(e, /* @__PURE__ */ new Map(), String(n), $t(t))), e;
}
var li = /* @__PURE__ */ Ae("ObservableObjectAdministration", si);
function ui(e) {
	return ai[e] || (ai[e] = {
		get: function() {
			return this[D].getObservablePropValue_(e);
		},
		set: function(t) {
			return this[D].setObservablePropValue_(e, t);
		}
	});
}
function di(e) {
	return Ee(e) ? li(e[D]) : !1;
}
function fi(e, t, n) {
	var r;
	e.appliedAnnotations_[n] = t, (r = e.target_[T]) == null || delete r[n];
}
function pi(e, t, n) {
	if (Pi(t) || p("Cannot annotate '" + e.name_ + "." + n.toString() + "': Invalid annotation."), !ft(t) && x(e.appliedAnnotations_, n)) {
		var r = e.name_ + "." + n.toString(), i = e.appliedAnnotations_[n].annotationType_, a = t.annotationType_;
		p("Cannot apply '" + a + "' to '" + r + "':" + ("\nThe field is already annotated with '" + i + "'.") + "\nRe-annotating fields is not allowed.\nUse 'override' annotation for methods overridden by subclass.");
	}
}
var mi = /* @__PURE__ */ bi(0), hi = /* @__PURE__ */ function() {
	var e = !1, t = {};
	return Object.defineProperty(t, "0", { set: function() {
		e = !0;
	} }), Object.create(t)[0] = 1, e === !1;
}(), gi = 0, _i = function() {};
function vi(e, t) {
	Object.setPrototypeOf ? Object.setPrototypeOf(e.prototype, t) : e.prototype.__proto__ === void 0 ? e.prototype = t : e.prototype.__proto__ = t;
}
vi(_i, Array.prototype);
var yi = /* @__PURE__ */ function(e) {
	function t(t, n, r, i) {
		var a;
		return r === void 0 && (r = "ObservableArray@" + _()), i === void 0 && (i = !1), a = e.call(this) || this, Ei(function() {
			var e = new Wr(r, n, i, !0);
			e.proxy_ = a, ke(a, D, e), t && t.length && a.spliceWithArray(0, 0, t), hi && Object.defineProperty(a, "0", mi);
		}), a;
	}
	Ue(t, e);
	var n = t.prototype;
	return n.concat = function() {
		this[D].atom_.reportObserved();
		var e = [...arguments];
		return Array.prototype.concat.apply(this.slice(), e.map(function(e) {
			return Yr(e) ? e.slice() : e;
		}));
	}, n[Symbol.iterator] = function() {
		var e = this, t = 0;
		return Mi({ next: function() {
			return t < e.length ? {
				value: e[t++],
				done: !1
			} : {
				done: !0,
				value: void 0
			};
		} });
	}, Ve(t, [{
		key: "length",
		get: function() {
			return this[D].getArrayLength_();
		},
		set: function(e) {
			this[D].setArrayLength_(e);
		}
	}, {
		key: Symbol.toStringTag,
		get: function() {
			return "Array";
		}
	}]);
}(_i);
Object.entries(Kr).forEach(function(e) {
	var t = e[0], n = e[1];
	t !== "concat" && Oe(yi.prototype, t, n);
});
function bi(e) {
	return {
		enumerable: !1,
		configurable: !0,
		get: function() {
			return this[D].get_(e);
		},
		set: function(t) {
			this[D].set_(e, t);
		}
	};
}
function xi(e) {
	m(yi.prototype, "" + e, bi(e));
}
function Si(e) {
	if (e > gi) {
		for (var t = gi; t < e + 100; t++) xi(t);
		gi = e;
	}
}
Si(1e3);
function Ci(e, t, n) {
	return new yi(e, t, n);
}
function $(e, t) {
	if (typeof e == "object" && e) {
		if (Yr(e)) return t !== void 0 && p(23), e[D].atom_;
		if (Q(e)) return e.atom_;
		if (Z(e)) {
			if (t === void 0) return e.keysAtom_;
			var n = e.data_.get(t) || e.hasMap_.get(t);
			return n || p(25, t, Ti(e)), n;
		}
		if (di(e)) {
			if (!t) return p(26);
			var r = e[D].values_.get(t);
			return r || p(27, t, Ti(e)), r;
		}
		if (et(e) || yn(e) || Xn(e)) return e;
	} else if (v(e) && Xn(e[D])) return e[D];
	p(28);
}
function wi(e, t) {
	if (e || p(29), t !== void 0) return wi($(e, t));
	if (et(e) || yn(e) || Xn(e) || Z(e) || Q(e)) return e;
	if (e[D]) return e[D];
	p(24, e);
}
function Ti(e, t) {
	var n;
	if (t !== void 0) n = $(e, t);
	else if (dr(e)) return e.name;
	else n = di(e) || Z(e) || Q(e) ? wi(e) : $(e);
	return n.name_;
}
function Ei(e) {
	var t = kn(), n = hn(!0);
	I();
	try {
		return e();
	} finally {
		L(), gn(n), P(t);
	}
}
var Di = h.toString;
function Oi(e, t, n) {
	return n === void 0 && (n = -1), ki(e, t, n);
}
function ki(e, t, n, r, i) {
	if (e === t) return e !== 0 || 1 / e == 1 / t;
	if (e == null || t == null) return !1;
	if (e !== e) return t !== t;
	var a = typeof e;
	if (a !== "function" && a !== "object" && typeof t != "object") return !1;
	var o = Di.call(e);
	if (o !== Di.call(t)) return !1;
	switch (o) {
		case "[object RegExp]":
		case "[object String]": return "" + e == "" + t;
		case "[object Number]": return +e == +e ? +e == 0 ? 1 / e == 1 / t : +e == +t : +t != +t;
		case "[object Date]":
		case "[object Boolean]": return +e == +t;
		case "[object Symbol]": return typeof Symbol < "u" && Symbol.valueOf.call(e) === Symbol.valueOf.call(t);
		case "[object Map]":
		case "[object Set]":
			n >= 0 && n++;
			break;
	}
	e = Ai(e), t = Ai(t);
	var s = o === "[object Array]";
	if (!s) {
		if (typeof e != "object" || typeof t != "object") return !1;
		var c = e.constructor, l = t.constructor;
		if (c !== l && !(v(c) && c instanceof c && v(l) && l instanceof l) && "constructor" in e && "constructor" in t) return !1;
	}
	if (n === 0) return !1;
	n < 0 && (n = -1), r ||= [], i ||= [];
	for (var u = r.length; u--;) if (r[u] === e) return i[u] === t;
	if (r.push(e), i.push(t), s) {
		if (u = e.length, u !== t.length) return !1;
		for (; u--;) if (!ki(e[u], t[u], n - 1, r, i)) return !1;
	} else {
		var ee = Object.keys(e), te = ee.length;
		if (Object.keys(t).length !== te) return !1;
		for (var ne = 0; ne < te; ne++) {
			var re = ee[ne];
			if (!(x(t, re) && ki(e[re], t[re], n - 1, r, i))) return !1;
		}
	}
	return r.pop(), i.pop(), !0;
}
function Ai(e) {
	return Yr(e) ? e.slice() : je(e) || Z(e) || b(e) || Q(e) ? Array.from(e.entries()) : e;
}
var ji = he().Iterator?.prototype || {};
function Mi(e) {
	return e[Symbol.iterator] = Ni, Object.assign(Object.create(ji), e);
}
function Ni() {
	return this;
}
function Pi(e) {
	return e instanceof Object && typeof e.annotationType_ == "string" && v(e.make_) && v(e.extend_);
}
[
	"Symbol",
	"Map",
	"Set"
].forEach(function(e) {
	he()[e] === void 0 && p("MobX requires global '" + e + "' to be available or polyfilled");
}), typeof __MOBX_DEVTOOLS_GLOBAL_HOOK__ == "object" && __MOBX_DEVTOOLS_GLOBAL_HOOK__.injectMobx({
	spy: $n,
	extras: { getDebugName: Ti },
	$mobx: D
});
//#endregion
//#region src/structs/nodeCollection.ts
var Fi = class {
	remove(e) {
		this.nodeMap.delete(e.id);
	}
	addEdge(e) {
		this._edgeMap[e.id] = e;
	}
	findEdge = (e) => this._edgeMap[e];
	get size() {
		return this.nodeMap.size;
	}
	get getEdgesMap() {
		return this._edgeMap;
	}
	_edgeMap = {};
	*nodes_() {
		for (let e of this.nodeMap.values()) yield e;
	}
	*graphs_() {
		for (let e of this.nodes_()) e instanceof Ii && (yield e);
	}
	constructor() {
		Br(this, {
			nodeMap: O,
			_edgeMap: O,
			getNodeMap: k,
			getEdgesMap: k,
			remove: V
		}, { autoBind: !0 }), this.findEdge = this.findEdge.bind(this);
	}
	findShallow(e) {
		return this.nodeMap.get(e);
	}
	get nodesShallow() {
		return this.nodes_();
	}
	get graphs() {
		return this.graphs_();
	}
	nodeMap = /* @__PURE__ */ new Map();
	get getNodeMap() {
		return this.nodeMap;
	}
	*_edges() {
		for (let e of this.nodeMap.values()) {
			for (let t of e.outEdges) yield t;
			for (let t of e.selfEdges) yield t;
		}
	}
	interGraphEdges() {
		throw Error("not implemented");
	}
	get nodeShallowCount() {
		return this.nodeMap.size;
	}
	get edgeCount() {
		let e = 0;
		for (let t of this.nodeMap.values()) e += t.outDegree + t.selfDegree;
		return e;
	}
	get edges() {
		return this._edges();
	}
	addNode(e) {
		this.nodeMap.set(e.id, e);
	}
	nodeIsConsistent(e) {
		for (let t of e.outEdges) if (t.source !== e || t.source === t.target) return !1;
		for (let t of e.inEdges) if (t.target !== e || t.source === t.target) return !1;
		for (let t of e.selfEdges) if (t.target !== t.source || t.source !== e) return !1;
		return !0;
	}
	isConsistent() {
		for (let e of this.nodeMap.values()) if (!this.nodeIsConsistent(e)) return !1;
		return !0;
	}
}, Ii = class e extends f {
	root;
	isLogic = !1;
	comments = {};
	wasm2Edges = [];
	wasm_edge_vertice_ids = [];
	groupCounts = /* @__PURE__ */ new Map();
	positionRanges = [];
	disposeAutorun = () => {};
	version = 0;
	isRoot = !1;
	constructor(e = "__graph__", t = !1, n = !0) {
		super(e), this.isRoot = t, this.isLogic = n, this.findNode = this.findNode.bind(this), this.addNode = this.addNode.bind(this), this.setEdge = this.setEdge.bind(this), this._bumpVersion = this._bumpVersion.bind(this), this.setRoot = this.setRoot.bind(this), this.findNodeRecursive = this.findNodeRecursive.bind(this), Br(this, {
			version: O,
			_bumpVersion: V,
			getVersion: k,
			getEdgesGeometry: k,
			getComments: k,
			groupCounts: O,
			getGroupCounts: k,
			addNode: V,
			setEdge: V,
			addToGroup: V,
			rmFromGroup: V,
			resetNodes: V,
			reset: V
		});
	}
	addToGroup = (e, t) => {
		let n = this.groupCounts.get(e);
		n ? this.groupCounts.set(e, n + 1) : this.groupCounts.set(e, 1);
	};
	rmFromGroup = (e, t) => {
		let n = this.groupCounts.get(e);
		n && this.groupCounts.set(e, n - 1);
	};
	get getGroupCounts() {
		return this.groupCounts;
	}
	remove(e) {
		this.nodeCollection.remove(e);
	}
	removeSubgraph() {
		let e = this.parent;
		e && e.removeNode(this);
		for (let e of this.outGoingEdges()) e.attachedAtSource ? e.node.removeOutEdge(e.edge) : e.node.removeInEdge(e.edge);
	}
	*outGoingEdges() {
		for (let e of this.outEdges) {
			let t = e.target;
			this.isAncestor(t) || (yield {
				edge: e,
				node: t,
				attachedAtSource: !1
			});
		}
		for (let e of this.inEdges) {
			let t = e.source;
			this.isAncestor(t) || (yield {
				edge: e,
				node: t,
				attachedAtSource: !0
			});
		}
		for (let e of this.nodesBreadthFirst) {
			for (let t of e.outEdges) {
				let e = t.target;
				e !== this && (this.isAncestor(e) || (yield {
					edge: t,
					node: e,
					attachedAtSource: !1
				}));
			}
			for (let t of e.inEdges) {
				let e = t.source;
				e !== this && (this.isAncestor(e) || (yield {
					edge: t,
					node: e,
					attachedAtSource: !0
				}));
			}
		}
	}
	isAncestor(e) {
		for (let t of e.getAncestors()) if (t === this) return !0;
		return !1;
	}
	*getClusteredConnectedComponents() {
		let e = /* @__PURE__ */ new Set(), t = new ce.Queue();
		for (let n of this.nodesBreadthFirst) {
			if (e.has(n)) continue;
			e.add(n), t.enqueue(n);
			let r = /* @__PURE__ */ new Set();
			do {
				let n = t.dequeue();
				n.parent === this && r.add(n);
				for (let r of this.reachableFrom(n)) e.has(r) || (e.add(r), t.enqueue(r));
			} while (t.length > 0);
			yield Array.from(r);
		}
	}
	*reachableFrom(t) {
		for (let e of t.outEdges) yield e.target;
		for (let e of t.inEdges) yield e.source;
		t instanceof e && (yield* t.shallowNodes), t.parent != this && (yield t.parent);
	}
	hasSomeAttrOnIndex(e) {
		for (let t of this.nodesBreadthFirst) if (t.getAttr(e)) return !0;
		for (let t of this.deepEdges) if (t.getAttr(e)) return !0;
		return !1;
	}
	*graphs() {
		for (let e of this.nodeCollection.graphs) yield e;
	}
	noEmptySubgraphs() {
		for (let e of this.subgraphsBreadthFirst()) if (e.shallowNodeCount === 0) return !1;
		return !0;
	}
	hasSubgraphs() {
		for (let t of this.shallowNodes) if (t instanceof e) return !0;
		return !1;
	}
	*subgraphsBreadthFirst() {
		for (let t of this.nodesBreadthFirst) t instanceof e && (yield t);
	}
	isEmpty() {
		return this.shallowNodeCount === 0;
	}
	setEdge(e, t, n, r) {
		let i = this.nodeCollection.findShallow(t);
		if (i == null) return;
		let a = r ? r.nodeCollection.findShallow(n) : this.nodeCollection.findShallow(n);
		if (a == null) return;
		let o = new fe(e, i, a);
		return this.isLogic, this.nodeCollection.addEdge(o), o;
	}
	get shallowNodes() {
		return this.nodeCollection.nodesShallow;
	}
	get nodesBreadthFirst() {
		return this.nodesBreadthFirst_();
	}
	*nodesBreadthFirst_() {
		for (let t of this.nodeCollection.nodesShallow) yield t, t instanceof e && (yield* t.nodesBreadthFirst);
	}
	dispose() {
		this.disposeAutorun && this.disposeAutorun();
	}
	setRoot = (e) => {
		this.root = e;
	};
	findNodeRecursive(t) {
		let n = this.nodeCollection.findShallow(t);
		if (n) return n;
		for (let n of this.shallowNodes) if (n instanceof e) {
			let e = n.findNodeRecursive(t);
			if (e) return e;
		}
		return null;
	}
	findNode(e) {
		return this.nodeCollection.findShallow(e);
	}
	get shallowEdges() {
		return this.nodeCollection.edges;
	}
	get deepEdges() {
		return this.deepEdgesIt();
	}
	*deepEdgesIt() {
		for (let e of this.nodesBreadthFirst) {
			for (let t of e.outEdges) yield t;
			for (let t of e.selfEdges) yield t;
			for (let t of e.inEdges) this.isAncestor(t.source) || (yield t);
		}
	}
	isConsistent() {
		return this.parent ? this.parent.isConsistent() : this.eachNodeIdIsUnique() && this.nodeCollection.isConsistent();
	}
	nodeIsConsistent(e) {
		return this.nodeCollection.nodeIsConsistent(e);
	}
	removeNode(e) {
		for (let t of e.outEdges) t.target.inEdges.delete(t);
		for (let t of e.inEdges) t.source.outEdges.delete(t);
		this.nodeCollection.remove(e);
		for (let t of this.subgraphsBreadthFirst()) t.removeNode(e);
	}
	addNode(e) {
		return le.assert(this.findNodeRecursive(e.id) == null), e.parent = this, this.nodeCollection.addNode(e), e;
	}
	nodeCollection = new Fi();
	get shallowNodeCount() {
		return this.nodeCollection.nodeShallowCount;
	}
	get nodeCountDeep() {
		let t = this.nodeCollection.size;
		for (let n of this.shallowNodes) n instanceof e && (t += n.nodeCountDeep);
		return t;
	}
	get edgeCount() {
		return this.nodeCollection.edgeCount;
	}
	liftNode(e) {
		for (; e != null && e.parent !== this;) e = e.parent;
		return e;
	}
	get deepEdgesCount() {
		let e = 0;
		for (let t of this.nodesBreadthFirst) e += t.outDegree + t.selfDegree;
		return e;
	}
	eachNodeIdIsUnique() {
		let e = /* @__PURE__ */ new Set();
		for (let t of this.nodesBreadthFirst) {
			if (e.has(t.id)) return !1;
			e.add(t.id);
		}
		return !0;
	}
	*allElements() {
		for (let e of this.allSuccessorsWidthFirst()) {
			yield e;
			for (let t of e.selfEdges) yield t;
			for (let t of e.outEdges) yield t;
			for (let t of e.inEdges) this.isAncestor(t.source) || (yield t);
		}
		yield* this.edges;
	}
	*allSuccessorsWidthFirst() {
		for (let e of this.shallowNodes) yield e;
		for (let t of this.shallowNodes) t instanceof e && (yield* t.allSuccessorsWidthFirst());
	}
	*allSuccessorsDepthFirst() {
		for (let t of this.shallowNodes) t instanceof e && (yield* t.allSuccessorsDepthFirst()), yield t;
	}
	resetNodes = () => {
		this.nodeCollection = new Fi(), this.positionRanges = [];
	};
	get getNodes() {
		return this.nodeCollection.nodesShallow;
	}
	reset = () => {
		this.resetNodes(), this.groupCounts = /* @__PURE__ */ new Map(), this.wasm2Edges = [], this.wasm_edge_vertice_ids = [];
	};
	triggerUpdate = () => {
		this._bumpVersion();
	};
	equals = (t) => !t || !(t instanceof e) ? !1 : this.version === t.version;
	_bumpVersion() {
		this.version += 1;
	}
	get getVersion() {
		return this.version;
	}
	get getComments() {
		return this.comments;
	}
	get getWasmId2Edges() {
		return this.wasm2Edges;
	}
	get getEdgeVerticeIds() {
		return this.wasm_edge_vertice_ids;
	}
	get getEdgesGeometry() {
		Array.from(this.root.graph.subgraphsBreadthFirst()).concat([this.root.graph]), this.root.visLayers.getCategories();
		let e = {}, t = {}, n = this.root.panel.positions;
		return this.wasm2Edges.forEach((r, i) => {
			if (!r.length) return;
			let a = r[0], { source: o, data: s } = a, ee = r[r.length - 1], { target: ae } = ee, d = o.parent, se = ae.parent, ce = d.findNode, le = se.findNode, ue = s?.dataRecord, de = { arcStyle: { arcConfig: { height: void 0 } } }, fe, f, { parPath: pe } = s || {}, p = pe[0], me = pe, he = this.wasm_edge_vertice_ids[i][0], ge = u(me, he, n, !0), [_e, m] = me.length ? te(me, ge, ce, le) : [[], []], h = m;
			if (!h?.length) return;
			let g = oe.getGeom(a), ve = oe.getGeom(ee);
			if (g?.source && (g?.curve?.start ? h.forEach((e, t) => {
				e.length > 3 && (h[t] = e.slice(1, -1));
			}) : g?.curve?.start || (console.warn("Invalid controlPoints or polyPoints", p, a.id), h = [h])), !h.length) return;
			let ye = ue, be = re(h, !this.isLogic), xe = {
				...g?.sourceArrowhead?.tipPosition ? { start: [g.sourceArrowhead.tipPosition.x, g.sourceArrowhead.tipPosition.y] } : {},
				...ve?.targetArrowhead?.tipPosition ? { end: [ve.targetArrowhead.tipPosition.x, ve.targetArrowhead.tipPosition.y] } : {}
			}, Se = {
				heIdx: i,
				edgeId: a.id,
				type: "Feature",
				geometry: {
					type: "MultiLineString",
					coordinates: h
				},
				rowIndex: ue?.rowIndex,
				properties: {
					...ye ?? {},
					locName: p,
					segrPath: _e,
					...be ? { arrowAngles: be } : {},
					...Object.keys(xe).length ? { arrowTips: xe } : {}
				}
			};
			if (de = Se.properties, fe = g?.sourceArrowhead?.tipPosition ? [g.sourceArrowhead.tipPosition.x, g.sourceArrowhead.tipPosition.y] : h[0][0], f = ve?.targetArrowhead?.tipPosition ? [ve.targetArrowhead.tipPosition.x, ve.targetArrowhead.tipPosition.y] : h.at(-1).at(-1), t[d.id] || (t[d.id] = []), t[d.id].push(Se), a.setLineId(t[d.id].length - 1), !fe || !f) return;
			let { arcStyle: _ } = de, Ce = _?.arcConfig?.height, we = c(this.isLogic ? ne(fe, f) : l(fe, f, { units: "meters" }), 0, 0, .5, Ce === void 0 ? .5 : Ce), v = [...ie(fe, f, this.isLogic), we], Te = {
				sourcePosition: fe,
				targetPosition: f,
				midPoint: v,
				properties: de,
				edgeId: a.id
			};
			e[d.id] || (e[d.id] = []), e[d.id].push(Te), a.setArcId(e[d.id].length - 1);
		}), [t, e];
	}
}, Li = class {
	colType;
	layerName;
	__state = {};
	frameRefId;
	features = [];
	positionRanges = [];
	colorThresholds;
	useMockData = !1;
	groups = [];
	constructor(e, t) {
		this.colType = e, this.layerName = t, this.getState = this.getState.bind(this), this.setThresholds = this.setThresholds.bind(this), this.setFeatures = this.setFeatures.bind(this), this.setPositionRanges = this.setPositionRanges.bind(this), this.clear = this.clear.bind(this);
	}
	setGroups = (e) => {
		this.groups = e;
	};
	addGroup = (e) => {
		this.groups.push(e);
	};
	get getGroups() {
		return this.groups;
	}
	setThresholds = (e) => {
		this.colorThresholds = e ?? {};
	};
	setFeatures(e, t) {
		this.frameRefId = t, this.features = e;
	}
	setPositionRanges(e) {
		this.positionRanges = e;
	}
	getState() {
		return this.__state;
	}
	clear() {
		this.features = [];
	}
};
//#endregion
export { r as AttributeRegistry, a as CurveFactory, fe as Edge, s as EdgeRoutingMode, Li as FeatSource, i as GeomGraph, e as GeomNode, Ii as Graph, d as LayerDirectionEnum, f as Node, n as Point, se as SugiyamaLayoutSettings, o as TileMap, ae as layoutGeomGraph };
