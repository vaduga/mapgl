//#region \0rolldown/runtime.js
var e = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports), t = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.LinkedList = class {
		constructor(...e) {
			this._head = this._tail = null, this._length = 0, e.length > 0 && e.forEach((e) => {
				this.append(e);
			});
		}
		*iterator() {
			let e = this._head;
			for (; e;) yield e.value, e = e.next;
		}
		[Symbol.iterator]() {
			return this.iterator();
		}
		get head() {
			return this._head ? this._head.value : null;
		}
		get tail() {
			return this._tail ? this._tail.value : null;
		}
		get length() {
			return this._length;
		}
		insert(e, n, r = !1) {
			if (r && this.isDuplicate(e)) return !1;
			let i = new t(e), a = this._head;
			if (a) for (;;) if (a.value === n) return i.next = a.next, i.prev = a, a.next = i, i.next ? i.next.prev = i : this._tail = i, this._length++, !0;
			else if (a.next) a = a.next;
			else return !1;
			else return !1;
		}
		append(e, n = !1) {
			if (n && this.isDuplicate(e)) return !1;
			let r = new t(e);
			return this._tail ? (this._tail.next = r, r.prev = this._tail, this._tail = r) : this._head = this._tail = r, this._length++, !0;
		}
		prepend(e, n = !1) {
			if (n && this.isDuplicate(e)) return !1;
			let r = new t(e);
			return this._head ? (r.next = this._head, this._head.prev = r, this._head = r) : this._head = this._tail = r, this._length++, !0;
		}
		remove(e) {
			let t = this._head;
			if (t) {
				if (t.value === e) return this._head = t.next, this._head.prev = null, t.next = t.prev = null, this._length--, t.value;
				for (;;) if (t.value === e) return t.next ? (t.prev.next = t.next, t.next.prev = t.prev, t.next = t.prev = null) : (t.prev.next = null, this._tail = t.prev, t.next = t.prev = null), this._length--, t.value;
				else if (t.next) t = t.next;
				else return;
			}
		}
		removeHead() {
			let e = this._head;
			if (e) return this._head.next ? (this._head.next.prev = null, this._head = this._head.next, e.next = e.prev = null) : (this._head = null, this._tail = null), this._length--, e.value;
		}
		removeTail() {
			let e = this._tail;
			if (e) return this._tail.prev ? (this._tail.prev.next = null, this._tail = this._tail.prev, e.next = e.prev = null) : (this._head = null, this._tail = null), this._length--, e.value;
		}
		first(e) {
			let t = this.iterator(), n = [], r = Math.min(e, this.length);
			for (let e = 0; e < r; e++) {
				let e = t.next();
				n.push(e.value);
			}
			return n;
		}
		toArray() {
			return [...this];
		}
		isDuplicate(e) {
			return new Set(this.toArray()).has(e);
		}
	};
	var t = class {
		constructor(e) {
			this.value = e, this.next = null, this.prev = null;
		}
	};
	e.LinkedListItem = t;
})), n = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var n = t();
	e.Queue = class extends n.LinkedList {
		constructor(...e) {
			super(...e);
		}
		get front() {
			return this.head;
		}
		enqueue(e) {
			this.append(e);
		}
		dequeue() {
			return this.removeHead();
		}
	};
})), r = class {
	static GeomObjectIndex = 0;
	static DrawingObjectIndex = 1;
	static AlgorithmDataIndex = 2;
	static ViewerIndex = 3;
	static NodeDataIndex = 4;
	static EdgeDataIndex = 5;
}, i = n(), a = class {
	constructor() {
		this.attrs = [], this._parent = null;
	}
	addEvent(e) {
		this.events.push(e);
	}
	removeEvent(e) {
		let t = this.events.indexOf(e);
		t >= 0 && (this.events = this.events.splice(t, 1));
	}
	raiseEvents(e) {
		this.events.forEach((t) => t(e));
	}
	clearAttr() {
		this.attrs = [];
	}
	setAttr(e, t) {
		this.attrs[e] = t;
	}
	getAttr(e) {
		return this.attrs[e];
	}
	get parent() {
		return this._parent;
	}
	set parent(e) {
		this._parent = e;
	}
	*getAncestors() {
		let e = this.parent;
		for (; e != null;) yield e, e = e.parent;
	}
	isDescendantOf(e) {
		for (let t of this.getAncestors()) if (t === e) return !0;
		return !1;
	}
}, o = class {
	bind(e) {
		this.entity && this.entity.setAttr(e, this);
	}
	constructor(e, t) {
		this.entity = e, this.bind(t);
	}
}, s = class {};
s.GeomObjectIndex = 0, s.DrawingObjectIndex = 1, s.AlgorithmDataIndex = 2, s.ViewerIndex = 3;
//#endregion
//#region node_modules/@msagl/core/dist/layout/core/geomObject.js
var c = class e extends o {
	constructor(e) {
		super(e, s.GeomObjectIndex);
	}
	static getGeom(e) {
		return e == null ? null : e.getAttr(s.GeomObjectIndex);
	}
	get parent() {
		let t = this.entity.parent;
		return t ? e.getGeom(t) : null;
	}
	rebind(e) {
		this.entity = e, this.bind(s.GeomObjectIndex);
	}
	*getAncestors() {
		let e = this.parent;
		for (; e != null;) yield e, e = e.parent;
	}
}, l = class e {
	static solve(t, n, r, i, a, o) {
		let s = t * a - i * n;
		if (!(Math.abs(s) < e.eps)) return {
			x: (r * a - o * n) / s,
			y: (t * o - i * r) / s
		};
	}
};
l.eps = 1e-8;
//#endregion
//#region node_modules/@msagl/core/dist/math/geometry/geomConstants.js
var u = class {};
u.distanceEpsilonPrecision = 6, u.mult = 10 ** 6, u.defaultLeafBoxesOffset = .5, u.lineSegmentThreshold = .05, u.intersectionEpsilon = 1e-4, u.distanceEpsilon = 10 ** -u.distanceEpsilonPrecision, u.squareOfDistanceEpsilon = 10 ** (-u.distanceEpsilonPrecision * 2), u.tolerance = 1e-8;
//#endregion
//#region node_modules/@msagl/core/dist/utils/compare.js
function d(e, t) {
	return !!e - +!!t;
}
function f(e, t) {
	let n = e - t;
	return n < 0 ? -1 : n === 0 ? 0 : 1;
}
function p(e, t) {
	return f(e.y, t.y) || f(e.x, t.x);
}
function m(e, t) {
	let n = e - t;
	return -u.distanceEpsilon <= n && n <= u.distanceEpsilon;
}
function h(e, t) {
	return g(e, t) > 0;
}
function g(e, t) {
	let n = e - t;
	return n <= -u.distanceEpsilon ? -1 : +(n >= u.distanceEpsilon);
}
//#endregion
//#region node_modules/@msagl/core/dist/math/geometry/point.js
var _;
(function(e) {
	e[e.Clockwise = 0] = "Clockwise", e[e.Counterclockwise = 1] = "Counterclockwise", e[e.Collinear = 2] = "Collinear";
})(_ ||= {});
function v(e, t) {
	return e.sub(t).length;
}
var y = class e {
	static RoundPoint(t) {
		return new e(e.RoundDouble(t.x), e.RoundDouble(t.y));
	}
	static RoundDouble(e) {
		return Math.round(e * u.mult) / u.mult;
	}
	toJSON() {
		return {
			x: this.x,
			y: this.y
		};
	}
	static fromJSON(t) {
		return new e(t.x, t.y);
	}
	static ProjectionToLine(e, t, n) {
		let r = t.sub(e), i = r.length;
		if (i < u.distanceEpsilon) return e;
		r = r.div(i);
		let a = n.sub(e).dot(r);
		return e.add(r.mul(a));
	}
	static RayIntersectsRayInteriors(t, n, r, i) {
		let a = e.lineLineIntersection(t, t.add(n), r, r.add(i));
		if (a && a.sub(t).dot(n.div(n.l1)) > u.distanceEpsilon && a.sub(r).dot(i.div(i.l1)) > u.distanceEpsilon) return a;
	}
	static IntervalIntersectsRay(t, n, r, i) {
		let a = e.lineLineIntersection(t, n, r, r.add(i));
		if (!a) return;
		let o = t.sub(a), s = a.sub(n);
		if (!(o.dot(s) <= 0) && !(a.sub(r).dot(i) < 0) && o.dot(o) > u.squareOfDistanceEpsilon && s.dot(s) >= u.squareOfDistanceEpsilon) return a;
	}
	static PointToTheLeftOfLineOrOnLine(t, n, r) {
		return e.signedDoubledTriangleArea(t, n, r) >= 0;
	}
	static PointToTheLeftOfLine(t, n, r) {
		return e.signedDoubledTriangleArea(t, n, r) > 0;
	}
	static PointIsInsideCone(t, n, r, i) {
		return e.PointToTheRightOfLineOrOnLine(t, n, r) && e.PointToTheLeftOfLineOrOnLine(t, n, i);
	}
	static PointToTheRightOfLineOrOnLine(t, n, r) {
		return e.signedDoubledTriangleArea(n, r, t) <= 0;
	}
	static PointToTheRightOfLine(t, n, r) {
		return e.signedDoubledTriangleArea(n, r, t) < 0;
	}
	static closeIntersections(t, n) {
		return e.close(t, n, u.intersectionEpsilon);
	}
	get l1() {
		return Math.abs(this.x_) + Math.abs(this.y_);
	}
	dot(e) {
		return this.x * e.x + this.y * e.y;
	}
	get x() {
		return this.x_;
	}
	get y() {
		return this.y_;
	}
	compareTo(e) {
		let t = f(this.x, e.x);
		return t === 0 ? f(this.y, e.y) : t;
	}
	toString() {
		return "(" + this.x + "," + this.y + ")";
	}
	static close(e, t, n) {
		return e.sub(t).length <= n;
	}
	static closeSquare(e, t, n) {
		let r = t.sub(e);
		return r.dot(r) <= n;
	}
	static closeDistEps(e, t, n = u.distanceEpsilon) {
		return e.sub(t).length <= n;
	}
	normalize() {
		let t = this.length;
		return new e(this.x / t, this.y / t);
	}
	get length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	get lengthSquared() {
		return this.x * this.x + this.y * this.y;
	}
	constructor(e, t) {
		this.x_ = e, this.y_ = t;
	}
	static middle(e, t) {
		return e.add(t).div(2);
	}
	scale(t, n) {
		return new e(this.x * t, this.y * n);
	}
	add(t) {
		return new e(this.x + t.x, this.y + t.y);
	}
	sub(t) {
		return new e(this.x - t.x, this.y - t.y);
	}
	mul(t) {
		return new e(this.x * t, this.y * t);
	}
	div(t) {
		return new e(this.x / t, this.y / t);
	}
	equal(e) {
		return e.x === this.x && e.y === this.y;
	}
	neg() {
		return new e(-this.x, -this.y);
	}
	static lineLineIntersection(e, t, n, r) {
		let i = t.sub(e), a = n.sub(r), o = n.sub(e), s = l.solve(i.x, a.x, o.x, i.y, a.y, o.y);
		if (s !== void 0) return e.add(i.mul(s.x));
	}
	static segSegIntersection(e, t, n, r) {
		let i = t.sub(e), a = n.sub(r), o = n.sub(e), s = u.tolerance, c = l.solve(i.x, a.x, o.x, i.y, a.y, o.y);
		if (c !== void 0 && c.x > -s && c.x < 1 + s && c.y > -s && c.y < 1 + s) return e.add(i.mul(c.x));
	}
	static parallelWithinEpsilon(e, t, n) {
		let r = e.length, i = t.length;
		return r < n || i < n ? !0 : (e = e.div(r), t = t.div(i), Math.abs(-e.x * t.y + e.y * t.x) < n);
	}
	static crossProduct(e, t) {
		return e.x * t.y - e.y * t.x;
	}
	static dot(e, t) {
		return e.x * t.x + e.y * t.y;
	}
	static add(e, t) {
		return e.add(t);
	}
	rotate90Ccw() {
		return new e(-this.y, this.x);
	}
	rotate90Cw() {
		return new e(this.y, -this.x);
	}
	clone() {
		return new e(this.x, this.y);
	}
	rotate(t) {
		let n = Math.cos(t), r = Math.sin(t);
		return new e(n * this.x - r * this.y, r * this.x + n * this.y);
	}
	static mkPoint(e, t, n, r) {
		return t.mul(e).add(r.mul(n));
	}
	static convSum(e, t, n) {
		return t.add(n.sub(t).mul(e));
	}
	static anglePCP(t, n, r) {
		return e.angle(t.sub(n), r.sub(n));
	}
	static angle(e, t) {
		let n = e.x, r = e.y, i = t.x, a = t.y, o = n * a - r * i, s = n * i + r * a;
		if (Math.abs(s) < u.tolerance) return Math.abs(o) < u.tolerance ? 0 : o < -u.tolerance ? 3 * Math.PI / 2 : Math.PI / 2;
		if (Math.abs(o) < u.tolerance) return s < -u.tolerance ? Math.PI : 0;
		let c = Math.atan2(o, s);
		return o >= -u.tolerance ? c : Math.PI * 2 + c;
	}
	static signedDoubledTriangleArea(e, t, n) {
		return (t.x - e.x) * (n.y - e.y) - (n.x - e.x) * (t.y - e.y);
	}
	static getTriangleOrientation(t, n, r) {
		let i = e.signedDoubledTriangleArea(t, n, r);
		return i > u.distanceEpsilon ? _.Counterclockwise : i < -u.distanceEpsilon ? _.Clockwise : _.Collinear;
	}
	static getTriangleOrientationWithIntersectionEpsilon(t, n, r) {
		let i = e.signedDoubledTriangleArea(t, n, r);
		return i > u.intersectionEpsilon ? _.Counterclockwise : i < -u.intersectionEpsilon ? _.Clockwise : _.Collinear;
	}
	static ClosestPointAtLineSegment(e, t, n) {
		let r = n.sub(t), i = e.sub(t), a = r.dot(i), o = r.dot(r);
		return a <= 0 + u.tolerance ? t : o <= a + u.tolerance ? n : t.add(r.mul(a / o));
	}
	static pointToTheLeftOfLineOrOnLine(t, n, r) {
		return e.signedDoubledTriangleArea(t, n, r) >= 0;
	}
	static pointToTheLeftOfLine(t, n, r) {
		return e.signedDoubledTriangleArea(t, n, r) > 0;
	}
	static pointToTheRightOfLineOrOnLine(t, n, r) {
		return e.signedDoubledTriangleArea(n, r, t) <= 0;
	}
	static pointToTheRightOfLine(t, n, r) {
		return e.signedDoubledTriangleArea(n, r, t) < 0;
	}
	static canProject(e, t, n) {
		let r = n.sub(t);
		return !(e.sub(t).dot(r) < 0 || e.sub(n).dot(r) > 0);
	}
	static distToLineSegment(e, t, n) {
		let r = n.sub(t), i = e.sub(t), a, o;
		if ((a = r.dot(i)) <= u.tolerance) return {
			par: 0,
			dist: i.length
		};
		if ((o = r.dot(r)) <= a + u.tolerance) return {
			par: 1,
			dist: e.sub(n).length
		};
		let s = a / o;
		return {
			par: s,
			dist: t.add(r.mul(s)).length
		};
	}
}, b = class e {
	constructor() {
		this._next = null, this.prev = null;
	}
	get point() {
		return this._point;
	}
	set point(e) {
		this._point = e;
	}
	get next() {
		return this._next;
	}
	set next(e) {
		this._next = e;
	}
	get nextOnPolyline() {
		return this.polyline.next(this);
	}
	get prevOnPolyline() {
		return this.polyline.prev(this);
	}
	getNext() {
		return this.next;
	}
	setNext(e) {
		this.next = e, this.polyline != null && this.polyline.setInitIsRequired();
	}
	getPrev() {
		return this.prev;
	}
	setPrev(e) {
		this.prev = e, this.polyline != null && this.polyline.setInitIsRequired();
	}
	static mkFromPoint(t) {
		let n = new e();
		return n.point = t, n;
	}
}, ee;
(function(e) {
	e[e.Corner = 0] = "Corner", e[e.VertexA = 1] = "VertexA", e[e.otherCorner = 2] = "otherCorner", e[e.VertexB = 3] = "VertexB";
})(ee ||= {});
var x = class e {
	contains(e) {
		let t = e.sub(this.corner), n = u.distanceEpsilon, r = t.dot(this.bRot);
		if (r > this.abRot + n || r < -n) return !1;
		let i = t.dot(this.aRot);
		return i <= this.baRot + n && i >= -n;
	}
	get area() {
		return Math.abs(this.a.x * this.b.y - this.a.y * this.b.x);
	}
	vertex(e) {
		switch (e) {
			case ee.Corner: return this.corner;
			case ee.VertexA: return this.aPlusCorner;
			case ee.otherCorner: return this.otherCorner;
			case ee.VertexB: return this.bPlusCorner;
			default: return;
		}
	}
	static parallelogramOfTwo(t, n) {
		let r = new e(), i = t.corner, a = {
			minx: i.x,
			maxx: i.x,
			miny: i.y,
			maxy: i.y
		};
		return e.pumpMinMax(a, t.aPlusCorner), e.pumpMinMax(a, t.otherCorner), e.pumpMinMax(a, t.bPlusCorner), e.pumpMinMax(a, n.corner), e.pumpMinMax(a, n.aPlusCorner), e.pumpMinMax(a, n.otherCorner), e.pumpMinMax(a, n.bPlusCorner), r.corner = new y(a.minx, a.miny), r.a = new y(0, a.maxy - a.miny), r.b = new y(a.maxx - a.minx, 0), r.aPlusCorner = r.a.add(r.corner), r.otherCorner = r.b.add(r.aPlusCorner), r.bPlusCorner = r.b.add(r.corner), r.aRot = new y(-r.a.y, r.a.x), r.aRot.length > .5 && (r.aRot = r.aRot.normalize()), r.bRot = new y(-r.b.y, r.b.x), r.bRot.length > .5 && (r.bRot = r.bRot.normalize()), r.abRot = r.a.dot(r.bRot), r.baRot = r.b.dot(r.aRot), r.abRot < 0 && (r.abRot = -r.abRot, r.bRot = r.bRot.neg()), r.baRot < 0 && (r.baRot = -r.baRot, r.aRot = r.aRot.neg()), r.isSeg = r.a.sub(r.b).length < u.distanceEpsilon, r;
	}
	static pumpMinMax(e, t) {
		t.x < e.minx ? e.minx = t.x : t.x > e.maxx && (e.maxx = t.x), t.y < e.miny ? e.miny = t.y : t.y > e.maxy && (e.maxy = t.y);
	}
	static intersect(t, n) {
		return e.separByA(t, n) || e.separByA(n, t) || e.separByB(t, n) || e.separByB(n, t) ? !1 : !(t.isSeg && n.isSeg) || !y.parallelWithinEpsilon(t.otherCorner.sub(t.corner), n.otherCorner.sub(n.corner), 1e-5) ? !0 : e.ParallelSegsIntersect(n, t);
	}
	static ParallelSegsIntersect(e, t) {
		let n = e.corner, r = e.otherCorner, i = t.corner, a = t.otherCorner, o = r.sub(n), s = o.dot(o), c = i.sub(n).dot(o), l = a.sub(n).dot(o);
		if (c > l) {
			let e = c;
			c = l, l = e;
		}
		return !(l < 0 - u.distanceEpsilon || c > s + u.distanceEpsilon);
	}
	static separByB(e, t) {
		let n = u.distanceEpsilon, r = t.vertex(0).sub(e.corner).dot(e.bRot), i = [
			ee.VertexA,
			ee.otherCorner,
			ee.VertexB
		];
		if (r > e.abRot + n) {
			for (let r of i) if (t.vertex(r).sub(e.corner).dot(e.bRot) <= e.abRot + n) return !1;
			return !0;
		} else if (r < -n) {
			for (let r of i) if (t.vertex(r).sub(e.corner).dot(e.bRot) >= -n) return !1;
			return !0;
		}
		return !1;
	}
	static separByA(e, t) {
		let n = u.distanceEpsilon, r = t.corner.sub(e.corner), i = y.dot(r, e.aRot);
		return i > e.baRot + n ? (r = t.aPlusCorner.sub(e.corner), !(y.dot(r, e.aRot) <= e.baRot + n || (r = t.bPlusCorner.sub(e.corner), y.dot(r, e.aRot) <= e.baRot + n) || (r = t.otherCorner.sub(e.corner), y.dot(r, e.aRot) <= e.baRot + n))) : i < -n ? (r = t.aPlusCorner.sub(e.corner), !(y.dot(r, e.aRot) >= -n || (r = t.bPlusCorner.sub(e.corner), y.dot(r, e.aRot) >= -n) || (r = t.otherCorner.sub(e.corner), y.dot(r, e.aRot) >= -n))) : !1;
	}
	static parallelogramByCornerSideSide(t, n, r) {
		let i = new e();
		return i.corner = t, i.a = n, i.b = r, i.aRot = new y(-n.y, n.x), i.aRot.length > .5 && (i.aRot = i.aRot.normalize()), i.bRot = new y(-r.y, r.x), i.bRot.length > .5 && (i.bRot = i.bRot.normalize()), i.abRot = i.bRot.dot(n), i.baRot = r.dot(i.aRot), i.abRot < 0 && (i.abRot = -i.abRot, i.bRot = i.bRot.neg()), i.baRot < 0 && (i.baRot = -i.baRot, i.aRot = i.aRot.neg()), i.isSeg = n.sub(r).length < u.distanceEpsilon, i.aPlusCorner = n.add(t), i.otherCorner = r.add(i.aPlusCorner), i.bPlusCorner = r.add(t), i;
	}
	static getParallelogramOfAGroup(t) {
		let n = 0, r = 0, i = 0, a = 0, o = !0;
		for (let e of t) {
			let t = te(e);
			for (let e of t) {
				let t = e.x, s = e.y;
				o ? (o = !1, n = r = t, i = a = s) : (t < n ? n = t : t > r && (r = t), s < i ? i = s : s > a && (a = s));
			}
		}
		return e.parallelogramByCornerSideSide(new y(n, i), new y(0, a - i), new y(r - n, 0));
	}
};
function* te(e) {
	yield e.corner, yield e.aPlusCorner, yield e.otherCorner, yield e.bPlusCorner;
}
//#endregion
//#region node_modules/@msagl/core/dist/math/geometry/lineSegment.js
var S = class e {
	static fromJSON(t) {
		return e.mkPP(y.fromJSON(t.start), y.fromJSON(t.end));
	}
	toJSON() {
		return {
			start: this.start.toJSON(),
			end: this.end.toJSON()
		};
	}
	offsetCurve(e, t) {
		return null;
	}
	constructor(e, t, n, r) {
		this.parStart = 0, this.parEnd = 1, this.start = new y(e, t), this.end = new y(n, r);
	}
	trim(t, n) {
		if (t = Math.max(this.parStart, t), n = Math.min(this.parEnd, n), t > n) throw "wrong params in trimming";
		let r = this.value(t), i = this.value(n);
		return y.close(r, i, u.distanceEpsilon) ? null : e.mkPP(r, i);
	}
	value(e) {
		return this.start.add(this.end.sub(this.start).mul(e));
	}
	trimWithWrap(e, t) {
		return null;
	}
	pNodeOverICurve() {
		let e = this.end.sub(this.start).mul(.5);
		return {
			parallelogram: x.parallelogramByCornerSideSide(this.start, e, e),
			seg: this,
			leafBoxesOffset: 0,
			node: {
				low: 0,
				high: 1,
				chord: this
			}
		};
	}
	normal() {
		let e = this.start.sub(this.end);
		return e = e.div(e.length), new y(-e.y, e.x);
	}
	static mkPP(t, n) {
		return new e(t.x, t.y, n.x, n.y);
	}
	static mkLinePXY(t, n, r) {
		return new e(t.x, t.y, n, r);
	}
	derivative(e) {
		return this.end.sub(this.start);
	}
	secondDerivative(e) {
		return new y(0, 0);
	}
	thirdDerivative(e) {
		return new y(0, 0);
	}
	reverse() {
		return e.mkPP(this.end, this.start);
	}
	translate(e) {
		this.start = this.start.add(e), this.end = this.end.add(e);
	}
	scaleFromOrigin(t, n) {
		return e.mkPP(this.start.scale(t, n), this.end.scale(t, n));
	}
	getParameterAtLength(e) {
		let t = this.end.sub(this.start).length;
		if (t < u.tolerance) return 0;
		let n = e / t;
		return n > 1 ? 1 : n < 0 ? 0 : n;
	}
	transform(t) {
		return e.mkPP(t.multiplyPoint(this.start), t.multiplyPoint(this.end));
	}
	closestParameterWithinBounds(e, t, n) {
		let r = this.closestParameter(e);
		return r < t && (r = t), r > n && (r = n), r;
	}
	lengthPartial(e, t) {
		return this.value(t).sub(this.value(e)).length;
	}
	get length() {
		return this.start.sub(this.end).length;
	}
	get boundingBox() {
		return O.mkPP(this.start, this.end);
	}
	clone() {
		return e.mkPP(this.start.clone(), this.end.clone());
	}
	static closestParameterOnLineSegment(e, t, n) {
		let r = n.sub(t), i = e.sub(t), a = r.dot(i);
		if (a <= 0 + u.tolerance) return 0;
		let o = r.dot(r);
		return o <= a + u.tolerance ? 1 : a / o;
	}
	closestParameter(t) {
		return e.closestParameterOnLineSegment(t, this.start, this.end);
	}
	leftDerivative(e) {
		return this.derivative(e);
	}
	rightDerivative(e) {
		return this.derivative(e);
	}
	static IntersectPPPP(e, t, n, r) {
		let i = y.lineLineIntersection(e, t, n, r);
		if (i != null && C(i, e, t) && C(i, n, r)) return i;
	}
	curvature(e) {
		return 0;
	}
	curvatureDerivative(e) {
		return 0;
	}
	curvatureSecondDerivative(e) {
		return 0;
	}
	static minDistBetweenLineSegments(e, t, n, r) {
		let i = t.sub(e), a = r.sub(n), o = e.sub(n), s = y.crossProduct(i, a), c = i.dot(i), l = i.dot(a), d = a.dot(a), f = i.dot(o), p = a.dot(o), m, h, g = Math.abs(s), _ = g, v = g;
		g < u.tolerance ? (m = 0, _ = 1, h = p, v = d) : (m = y.crossProduct(a, o), h = y.crossProduct(i, o), s < 0 && (m = -m, h = -h), m < 0 ? (m = 0, h = p, v = d) : m > _ && (m = _ = 1, h = p + l, v = d)), h < 0 ? (h = 0, -f < 0 ? m = 0 : -f > c ? m = _ : (m = -f, _ = c)) : h > v && (h = v = 1, -f + l < 0 ? m = 0 : -f + l > c ? m = _ : (m = -f + l, _ = c));
		let b = Math.abs(m) < u.tolerance ? 0 : m / _, ee = Math.abs(h) < u.tolerance ? 0 : h / v;
		return {
			parab: b,
			parcd: ee,
			dist: o.add(i.mul(b).sub(a.mul(ee))).length
		};
	}
};
function C(e, t, n) {
	return e.x >= Math.min(t.x, n.x) - u.distanceEpsilon && e.y >= Math.min(t.y, n.y) - u.distanceEpsilon && e.x <= Math.max(t.x, n.x) + u.distanceEpsilon && e.y <= Math.max(t.y, n.y) + u.distanceEpsilon;
}
function ne(e, t, n, r) {
	let i = y.getTriangleOrientation(e, t, n), a = y.getTriangleOrientation(e, t, r), o = y.getTriangleOrientation(n, r, e), s = y.getTriangleOrientation(n, r, t);
	return !!(i != a && o != s || i == _.Collinear && C(n, e, t) || a == _.Collinear && C(r, e, t) || o == _.Collinear && C(e, n, r) || s == _.Collinear && C(t, n, r));
}
//#endregion
//#region node_modules/@msagl/core/dist/math/geometry/parallelogramNode.js
function re(e, t, n, r, i) {
	return {
		parallelogram: n,
		seg: r,
		leafBoxesOffset: i,
		node: {
			low: e,
			high: t,
			chord: null
		}
	};
}
var ie = class e {
	static distToSegm(e, t, n) {
		let r = n.sub(t);
		if (r.length < u.intersectionEpsilon) return e.sub(t.add(n).div(2)).length;
		let i = new y(-r.y, r.x);
		return i = i.mul(1 / i.length), Math.abs(e.sub(t).dot(i));
	}
	static createParallelogramOnSubSeg(e, t, n) {
		let r = n.derivative(e), i = n.derivative(t), a = new y(-i.y, i.x), o = n.value(e), s = n.value(t), c = s.sub(o).dot(a), l = r.dot(a), d = Math.abs(c) < u.distanceEpsilon;
		if (!d && Math.abs(l) < u.distanceEpsilon) return;
		let f = d ? 0 : c / l;
		return r = r.mul(f), x.parallelogramByCornerSideSide(o, r, s.sub(o).sub(r));
	}
	static createParallelogramNodeForCurveSeg(t, n, r, i) {
		if (t === r.parStart && n === r.parEnd && y.close(r.start, r.end, u.distanceEpsilon)) return e.createNodeWithSegmentSplit(t, n, r, i);
		let a = r.value(t), o = r.value(n), s = o.sub(a), c = r.value((t + n) / 2);
		if (e.distToSegm(c, a, o) <= u.intersectionEpsilon && s.dot(s) < u.lineSegmentThreshold * u.lineSegmentThreshold && n - t < u.lineSegmentThreshold) {
			let e = S.mkPP(a, o), i = e.pNodeOverICurve();
			i.seg = r;
			let s = i.node;
			return s.low = t, s.high = n, s.chord = e, i;
		}
		if (e.WithinEpsilon(r, t, n, i)) {
			let a = e.createParallelogramOnSubSeg(t, n, r);
			if (a !== void 0) return re(t, n, a, r, i);
		}
		return e.createNodeWithSegmentSplit(t, n, r, i);
	}
	static WithinEpsilon(t, n, r, i) {
		let a = (r - n) / 3, o = t.value(n), s = t.value(r);
		return e.distToSegm(t.value(n + a), o, s) > i ? !1 : e.distToSegm(t.value(n + a * 2), o, s) <= i;
	}
	static createParallelogramNodeForCurveSegDefaultOffset(t) {
		return e.createParallelogramNodeForCurveSeg(t.parStart, t.parEnd, t, u.defaultLeafBoxesOffset);
	}
	static createNodeWithSegmentSplit(t, n, r, i) {
		let a = {
			parallelogram: null,
			seg: r,
			leafBoxesOffset: 1,
			node: { children: [] }
		}, o = a.node;
		return o.children.push(e.createParallelogramNodeForCurveSeg(t, .5 * (t + n), r, i)), o.children.push(e.createParallelogramNodeForCurveSeg(.5 * (t + n), n, r, i)), a.parallelogram = x.parallelogramOfTwo(o.children[0].parallelogram, o.children[1].parallelogram), a;
	}
}, ae = class {
	constructor(e, t, n, r, i) {
		this.par0 = e, this.par1 = t, this.x = n, this.seg0 = r, this.seg1 = i;
	}
}, oe = class {
	static closestPoint(e, t, n, r, i) {
		let a = n, o = 0, s = 0, c, l = !1;
		do {
			let n = e.value(a), l = e.derivative(a), d = e.secondDerivative(a), f = l.dot(l) + n.sub(t).dot(d);
			if (Math.abs(f) < u.tolerance) return a;
			c = n.sub(t).dot(l.div(f)), a -= c, a > i + u.tolerance ? (a = i, s++) : a < r - u.tolerance && (a = r, s++), o++;
		} while (Math.abs(c) > u.tolerance && !(l = o >= 5 || s >= 5));
		return l && e.value(n).sub(t).length < u.distanceEpsilon && (a = n), a;
	}
}, w = class e {
	isFullEllipse() {
		return this.parEnd === Math.PI * 2 && this.parStart === 0;
	}
	static fromJSON(t) {
		return new e(t.parStart, t.parEnd, y.fromJSON(t.axis0), y.fromJSON(t.axis1), y.fromJSON(t.center));
	}
	toJSON() {
		return {
			parStart: this.parStart,
			parEnd: this.parEnd,
			axis0: this.aAxis.toJSON(),
			axis1: this.bAxis.toJSON(),
			center: this.center.toJSON()
		};
	}
	offsetCurve(t, n) {
		let r = n.sub(this.center), i = y.angle(this.aAxis, r);
		if (this.aAxis.mul(Math.cos(i)).add(this.bAxis.mul(Math.sin(i))).length < r.length) {
			let n = this.aAxis.length, r = this.bAxis.length;
			return e.mkEllipsePPP(this.aAxis.normalize().mul(n + t), this.bAxis.normalize().mul(r + t), this.center);
		}
		{
			let n = this.aAxis.length, r = this.bAxis.length;
			return e.mkEllipsePPP(this.aAxis.normalize().mul(n - t), this.bAxis.normalize().mul(r - t), this.center);
		}
	}
	reverse() {
		return null;
	}
	static mkEllipsePPP(t, n, r) {
		return new e(0, Math.PI * 2, t, n, r);
	}
	constructor(e, t, n, r, i) {
		for (this.parStart = e, this.parEnd = t, this.aAxis = n, this.bAxis = r, this.center = i, this.pNode = null, this.setBoundingBox(); this.parStart < 0;) this.parStart += Math.PI * 2, this.parEnd += Math.PI * 2;
	}
	get start() {
		return this.value(this.parStart);
	}
	get end() {
		return this.value(this.parEnd);
	}
	trim(t, n) {
		return new e(Math.max(t, this.parStart), Math.min(n, this.parEnd), this.aAxis, this.bAxis, this.center);
	}
	trimWithWrap(e, t) {
		return null;
	}
	get boundingBox() {
		return this.box;
	}
	value(e) {
		return this.center.add(y.mkPoint(Math.cos(e), this.aAxis, Math.sin(e), this.bAxis));
	}
	derivative(e) {
		return y.mkPoint(-Math.sin(e), this.aAxis, Math.cos(e), this.bAxis);
	}
	secondDerivative(e) {
		return y.mkPoint(-Math.cos(e), this.aAxis, -Math.sin(e), this.bAxis);
	}
	thirdDerivative(e) {
		return y.mkPoint(Math.sin(e), this.aAxis, -Math.cos(e), this.bAxis);
	}
	pNodeOverICurve() {
		return this.pNode == null ? this.pNode = ie.createParallelogramNodeForCurveSegDefaultOffset(this) : this.pNode;
	}
	setBoundingBox() {
		if (m(this.parStart, 0) && m(this.parEnd, Math.PI * 2)) this.box = this.fullBox();
		else {
			this.box = O.mkPP(this.start, this.end);
			let e;
			for (let t = Math.ceil(this.parStart / (Math.PI / 2)); (e = t * Math.PI / 2) < this.parEnd; t++) e > this.parStart && this.box.add(this.value(e));
		}
	}
	static mkEllipse(t, n, r, i, a, o) {
		return new e(t, n, r, i, new y(a, o));
	}
	static mkFullEllipsePPP(t, n, r) {
		return new e(0, Math.PI * 2, t, n, r);
	}
	static mkFullEllipseNNP(t, n, r) {
		return new e(0, Math.PI * 2, new y(t, 0), new y(0, n), r);
	}
	static mkCircle(t, n) {
		return e.mkFullEllipseNNP(t, t, n);
	}
	translate(e) {
		this.center = this.center.add(e), this.box.center = this.box.center.add(e), this.pNode = null;
	}
	scaleFromOrigin(t, n) {
		return new e(this.parStart, this.parEnd, this.aAxis.mul(t), this.bAxis.mul(n), this.center.scale(t, n));
	}
	getParameterAtLength(e) {
		let t = .001, n = this.parStart, r = this.parEnd, i = e + t, a = e - t;
		for (; r - n > u.distanceEpsilon;) {
			let e = .5 * (r + n), t = this.lengthPartial(this.parStart, e);
			if (t > i) r = e;
			else if (t < a) n = e;
			else return e;
		}
		return (r + n) / 2;
	}
	transform(t) {
		if (t != null) {
			let n = t.multiplyPoint(this.aAxis).sub(t.offset()), r = t.multiplyPoint(this.bAxis).sub(t.offset());
			return new e(this.parStart, this.parEnd, n, r, t.multiplyPoint(this.center));
		}
		return this.clone();
	}
	closestParameterWithinBounds(e, t, n) {
		let r = (n - t) / 9, i = t, a = Number.MAX_VALUE;
		for (let n = 0; n <= 8; n++) {
			let o = t + n * r, s = e.sub(this.value(o)), c = s.dot(s);
			c < a && (a = c, i = o);
		}
		i === 0 && n === Math.PI * 2 && (t = -Math.PI);
		let o = oe.closestPoint(this, e, i, t, n);
		return o < 0 && (o += 2 * Math.PI), o;
	}
	lengthPartial(e, t) {
		return E.lengthWithInterpolationAndThreshold(this.trim(e, t), u.lineSegmentThreshold / 100);
	}
	get length() {
		return (this.aAxis.length + this.bAxis.length) * Math.abs(this.parEnd - this.parStart) / 2;
	}
	clone() {
		return new e(this.parStart, this.parEnd, this.aAxis.clone(), this.bAxis.clone(), this.center.clone());
	}
	closestParameter(e) {
		let t = 0, n = (this.parEnd - this.parStart) / 9, r = this.parStart, i = Number.MAX_VALUE;
		for (let t = 0; t <= 8; t++) {
			let a = this.parStart + t * n, o = e.sub(this.value(a)), s = o.dot(o);
			s < i && (i = s, r = a);
		}
		let a = !1;
		r === 0 && this.parEnd === Math.PI * 2 && (a = !0, t = this.parStart, this.parStart = -Math.PI);
		let o = oe.closestPoint(this, e, r, this.parStart, this.parEnd);
		return o < 0 && (o += 2 * Math.PI), a && (this.parStart = t), o;
	}
	leftDerivative(e) {
		return this.derivative(e);
	}
	rightDerivative(e) {
		return this.derivative(e);
	}
	curvature(e) {
		throw "NotImplementedException()";
	}
	curvatureDerivative(e) {
		throw "NotImplementedException();";
	}
	curvatureSecondDerivative(e) {
		throw "NotImplementedException()";
	}
	orientedCounterclockwise() {
		return y.crossProduct(this.aAxis, this.bAxis) > 0;
	}
	fullBox() {
		let e = this.aAxis.add(this.bAxis);
		return O.mkPP(this.center.add(e), this.center.sub(e));
	}
	isArc() {
		return Math.abs(this.aAxis.dot(this.bAxis)) < u.tolerance && Math.abs(this.aAxis.length - this.bAxis.length) < u.tolerance && y.closeDistEps(this.aAxis.rotate90Ccw(), this.bAxis);
	}
}, se = class {
	initValues() {
		this.a = this.curveA.value(this.si), this.b = this.curveB.value(this.ti), this.a_b = this.a.sub(this.b), this.ad = this.curveA.derivative(this.si), this.add = this.curveA.secondDerivative(this.si), this.bd = this.curveB.derivative(this.ti), this.bdd = this.curveB.secondDerivative(this.ti);
	}
	constructor(e, t, n, r, i, a, o, s) {
		this.curveA = e, this.curveB = t, this.aMin = n, this.bMin = i, this.aMax = r, this.bMax = a, this.aGuess = o, this.bGuess = s, this.si = o, this.ti = s;
	}
	Fs() {
		return this.a_b.dot(this.ad);
	}
	Fss() {
		return this.a_b.dot(this.add) + this.ad.dot(this.ad);
	}
	Fst() {
		return -this.bd.dot(this.ad);
	}
	Ftt() {
		return -this.a_b.dot(this.bdd) + this.bd.dot(this.bd);
	}
	Ft() {
		return -this.a_b.dot(this.bd);
	}
	delta(e, t, n, r) {
		return e * r - n * t;
	}
	solve() {
		let e = 0, t = 0, n = !1;
		if (this.initValues(), this.curveA instanceof S && this.curveB instanceof S) {
			let e = this.curveB.derivative(0);
			e = e.div(e.length);
			let t = this.curveA.normal(), n = Math.abs(t.dot(e));
			if (Math.abs(n) < u.distanceEpsilon || this.delta(this.Fss(), this.Fst(), this.Fst(), this.Ftt()) < u.tolerance) {
				this.success = !0, this.parallelLineSegLineSegMinDist();
				return;
			}
		}
		let r;
		do {
			let i = this.delta(this.Fss(), this.Fst(), this.Fst(), this.Ftt());
			if (Math.abs(i) < u.tolerance) {
				this.success = !1, n = !0;
				break;
			}
			r = {
				s: this.delta(-this.Fs(), this.Fst(), -this.Ft(), this.Ftt()) / i,
				t: this.delta(this.Fss(), -this.Fs(), this.Fst(), -this.Ft()) / i
			};
			let a = this.si + r.s, o = this.ti + r.t, s;
			a > this.aMax + u.distanceEpsilon || a < this.aMin - u.distanceEpsilon || o > this.bMax + u.distanceEpsilon || o < this.bMin - u.distanceEpsilon ? (e++, this.chopDsDt(r), this.si += r.s, this.ti += r.t, s = !0) : (s = !1, this.si = a, this.ti = o, this.si > this.aMax ? this.si = this.aMax : this.si < this.aMin && (this.si = this.aMin), this.ti > this.bMax ? this.ti = this.bMax : this.ti < this.bMin && (this.ti = this.bMin)), this.initValues(), t++, n = e >= 10 || t >= 100 || r.s === 0 && r.t === 0 && s;
		} while ((Math.abs(r.s) >= u.tolerance || Math.abs(r.t) >= u.tolerance) && !n);
		if (n) {
			let e = this.curveA.value(this.aGuess).sub(this.curveB.value(this.bGuess));
			if (e.dot(e) < u.distanceEpsilon * u.distanceEpsilon) {
				this.aSolution = this.aGuess, this.bSolution = this.bGuess, this.aPoint = this.curveA.value(this.aGuess), this.bPoint = this.curveB.value(this.bGuess), this.success = !0;
				return;
			}
		}
		this.aSolution = this.si, this.bSolution = this.ti, this.aPoint = this.a, this.bPoint = this.b, this.success = !n;
	}
	chopDsDt(e) {
		if (e.s !== 0 && e.t !== 0) {
			let t = 1;
			this.si + e.s > this.aMax ? t = (this.aMax - this.si) / e.s : this.si + e.s < this.aMin && (t = (this.aMin - this.si) / e.s);
			let n = 1;
			this.ti + e.t > this.bMax ? n = (this.bMax - this.ti) / e.t : this.ti + e.t < this.bMin && (n = (this.bMin - this.ti) / e.t);
			let r = Math.min(t, n);
			e.s *= r, e.t *= r;
		} else e.s === 0 ? this.ti + e.t > this.bMax ? e.t = this.bMax - this.ti : this.ti + e.t < this.bMin && (e.t = this.bMin - this.ti) : this.si + e.s > this.aMax ? e.s = this.aMax - this.si : this.si + e.s < this.aMin && (e.s = this.aMin - this.si);
	}
	parallelLineSegLineSegMinDist() {
		let e = this.curveA, t = this.curveB, n = e.start, r = e.end, i = t.start, a = t.end, o = r.sub(n), s = o.length, c = 0, l, d, f;
		if (s > u.distanceEpsilon) {
			o = o.div(s), l = o.dot(r.sub(n)), d = o.dot(i.sub(n)), f = o.dot(a.sub(n));
			let e = !1;
			if (d > f) {
				e = !0;
				let t = d;
				d = f, f = t;
			}
			if (f < c) this.aSolution = 0, this.bSolution = +!e;
			else if (d > l) this.aSolution = 1, this.bSolution = +!!e;
			else {
				let t = Math.min(l, f);
				this.aSolution = t / (l - c), this.bSolution = (t - d) / (f - d), e && (this.bSolution = 1 - this.bSolution);
			}
		} else {
			let e = a.sub(i), t = e.length;
			t > u.distanceEpsilon ? (e = e.div(t), c = 0, l = e.dot(a.sub(i)), d = e.dot(n.sub(i)), d < c ? (this.bSolution = 0, this.aSolution = 1) : d > l ? (this.bSolution = 1, this.aSolution = 0) : (this.bSolution = Math.min(l, d) / (l - c), this.aSolution = 0)) : (this.aSolution = 0, this.bSolution = 0);
		}
		this.aPoint = this.curveA.value(this.aSolution), this.bPoint = this.curveB.value(this.bSolution);
	}
}, ce = class e {
	toJSON() {
		return { b: this.b.map((e) => e.toJSON()) };
	}
	static fromJSON(t) {
		return e.mkBezier(t.b.map(y.fromJSON));
	}
	leftDerivative(e) {
		return this.derivative(e);
	}
	rightDerivative(e) {
		return this.derivative(e);
	}
	B(e) {
		return this.b[e];
	}
	pNodeOverICurve() {
		return this.pBoxNode == null ? this.pBoxNode = ie.createParallelogramNodeForCurveSegDefaultOffset(this) : this.pBoxNode;
	}
	value(e) {
		let t = e * e, n = t * e;
		return this.l.mul(n).add(this.e.mul(t).add(this.c.mul(e)).add(this.b[0]));
	}
	static adjustParamTo01(e) {
		return e > 1 ? 1 : e < 0 ? 0 : e;
	}
	trim(t, n) {
		if (t = e.adjustParamTo01(t), n = e.adjustParamTo01(n), t > n) return this.trim(n, t);
		if (t > 1 - u.tolerance) return new e(this.b[3], this.b[3], this.b[3], this.b[3]);
		let r = [
			,
			,
			,
		], i = [, ,], a = new e(this.casteljau(t, r, i), i[1], r[2], this.b[3]), o = a.casteljau((n - t) / (1 - t), r, i);
		return new e(a.b[0], r[0], i[0], o);
	}
	trimWithWrap(e, t) {
		throw "NotImplementedException()";
	}
	casteljau(e, t, n) {
		let r = 1 - e;
		for (let n = 0; n < 3; n++) t[n] = y.mkPoint(r, this.b[n], e, this.b[n + 1]);
		for (let i = 0; i < 2; i++) n[i] = y.mkPoint(r, t[i], e, t[i + 1]);
		return y.mkPoint(r, n[0], e, n[1]);
	}
	derivative(e) {
		return this.l.mul(3 * e * e).add(this.e.mul(2 * e)).add(this.c);
	}
	secondDerivative(e) {
		return y.mkPoint(6 * e, this.l, 2, this.e);
	}
	thirdDerivative(e) {
		return this.l.mul(6);
	}
	constructor(e, t, n, r) {
		this.b = [
			,
			,
			,
			,
		], this.parStart = 0, this.parEnd = 1, this.b[0] = e, this.b[1] = t, this.b[2] = n, this.b[3] = r, this.c = this.b[1].sub(this.b[0]).mul(3), this.e = this.b[2].sub(this.b[1]).mul(3).sub(this.c), this.l = this.b[3].sub(this.b[0]).sub(this.c).sub(this.e);
	}
	get start() {
		return this.b[0];
	}
	get end() {
		return this.b[3];
	}
	reverse() {
		return new e(this.b[3], this.b[2], this.b[1], this.b[0]);
	}
	translate(e) {
		this.b[0] = this.b[0].add(e), this.b[1] = this.b[1].add(e), this.b[2] = this.b[2].add(e), this.b[3] = this.b[3].add(e), this.c = this.b[1].sub(this.b[0]).mul(3), this.e = this.b[2].sub(this.b[1]).mul(3).sub(this.c), this.l = this.b[3].sub(this.b[0]).sub(this.c).sub(this.e), this.bbox &&= O.translate(this.bbox, e), this.pBoxNode = null;
	}
	scaleFromOrigin(t, n) {
		return new e(this.b[0].scale(t, n), this.b[1].scale(t, n), this.b[2].scale(t, n), this.b[3].scale(t, n));
	}
	offsetCurve(e, t) {
		return null;
	}
	lengthPartial(e, t) {
		return this.trim(e, t).length;
	}
	get length() {
		return e.lengthOnControlPolygon(this.b[0], this.b[1], this.b[2], this.b[3]);
	}
	static lengthOnControlPolygon(t, n, r, i) {
		let a = i.sub(t).length, o = n.sub(t).length + r.sub(n).length + i.sub(r).length;
		if (o - a > u.lineSegmentThreshold) {
			let a = y.middle(t, n), o = y.middle(n, r), s = y.middle(r, i), c = y.middle(a, o), l = y.middle(s, o), u = y.middle(c, l);
			return e.lengthOnControlPolygon(t, a, c, u) + e.lengthOnControlPolygon(u, l, s, i);
		}
		return (o + a) / 2;
	}
	get boundingBox() {
		return this.bbox ? this.bbox : this.bbox = O.mkOnPoints(this.b);
	}
	transform(t) {
		return new e(t.multiplyPoint(this.b[0]), t.multiplyPoint(this.b[1]), t.multiplyPoint(this.b[2]), t.multiplyPoint(this.b[3]));
	}
	closestParameterWithinBounds(e, t, n) {
		let r = (n - t) / 8, i = 0, a = Number.MAX_VALUE;
		for (let n = 0; n < 9; n++) {
			let o = e.sub(this.value(n * r + t)), s = o.dot(o);
			s < a && (a = s, i = n * r + t);
		}
		return oe.closestPoint(this, e, i, t, n);
	}
	clone() {
		return new e(this.b[0], this.b[1], this.b[2], this.b[3]);
	}
	static mkBezier(t) {
		return new e(t[0], t[1], t[2], t[3]);
	}
	curvature(e) {
		let t = this.G(e);
		return this.F(e) / t;
	}
	F(e) {
		return this.Xp(e) * this.Ypp(e) - this.Yp(e) * this.Xpp(e);
	}
	G(e) {
		let t = this.Xp(e), n = this.Yp(e), r = t * t + n * n;
		return Math.sqrt(r * r * r);
	}
	Xp(e) {
		return 3 * this.l.x * e * e + 2 * this.e.x * e + this.c.x;
	}
	Ypp(e) {
		return 6 * this.l.y * e + 2 * this.e.y;
	}
	Yp(e) {
		return 3 * this.l.y * e * e + 2 * this.e.y * e + this.c.y;
	}
	Xpp(e) {
		return 6 * this.l.x * e + 2 * this.e.x;
	}
	Xppp(e) {
		return 6 * this.l.x;
	}
	Yppp(e) {
		return 6 * this.l.y;
	}
	curvatureDerivative(e) {
		let t = this.G(e);
		return (this.Fp(e) * t - this.Gp(e) * this.F(e)) / (t * t);
	}
	Fp(e) {
		return this.Xp(e) * this.Yppp(e) - this.Yp(e) * this.Xppp(e);
	}
	Fpp(e) {
		return this.Xpp(e) * this.Yppp(e) - this.Ypp(e) * this.Xppp(e);
	}
	closestParameter(e) {
		let t = 1 / 8, n = 0, r = Number.MAX_VALUE;
		for (let i = 0; i < 9; i++) {
			let a = e.sub(this.value(i * t)), o = a.dot(a);
			o < r && (r = o, n = i * t);
		}
		return oe.closestPoint(this, e, n, 0, 1);
	}
	curvatureSecondDerivative(e) {
		let t = this.G(e);
		return (this.Qp(e) * t - 2 * this.Q(e) * this.Gp(e)) / (t * t * t);
	}
	Q(e) {
		return this.Fp(e) * this.G(e) - this.Gp(e) * this.F(e);
	}
	Qp(e) {
		return this.Fpp(e) * this.G(e) - this.Gpp(e) * this.F(e);
	}
	Gpp(e) {
		let t = this.Xp(e), n = this.Yp(e), r = this.Xpp(e), i = this.Ypp(e), a = this.Xppp(e), o = this.Yppp(e), s = Math.sqrt(t * t + n * n), c = t * r + n * i;
		return 3 * (c * c / s + s * (r * r + t * a + i * i + n * o));
	}
	Gp(e) {
		let t = this.Xp(e), n = this.Yp(e), r = this.Xpp(e), i = this.Ypp(e);
		return 3 * Math.sqrt(t * t + n * n) * (t * r + n * i);
	}
	getParameterAtLength(e) {
		let t = 0, n = 1;
		for (; n - t > u.tolerance;) {
			let r = (n + t) / 2, i = this.evaluateError(e, r);
			if (i > 0) n = r;
			else if (i < 0) t = r;
			else return r;
		}
		return (t + n) / 2;
	}
	evaluateError(t, n) {
		let r = 1 - n, i = y.mkPoint(r, this.b[0], n, this.b[1]), a = y.mkPoint(r, this.b[1], n, this.b[2]), o = y.mkPoint(r, this.b[2], n, this.b[3]), s = y.mkPoint(r, i, n, a), c = y.mkPoint(r, a, n, o), l = y.mkPoint(r, s, n, c), d = e.lengthOnControlPolygon(this.b[0], i, s, l);
		return d > t + u.distanceEpsilon ? 1 : d < t - u.distanceEpsilon ? -1 : 0;
	}
};
//#endregion
//#region node_modules/@msagl/core/dist/math/geometry/curve.js
function le(e) {
	return e.seg.value(e.par);
}
function ue(e) {
	return e.seg.derivative(e.par);
}
function de(e) {
	return e.seg.secondDerivative(e.par);
}
function fe(e) {
	return e.seg.thirdDerivative(e.par);
}
var T;
(function(e) {
	e[e.Outside = 0] = "Outside", e[e.Boundary = 1] = "Boundary", e[e.Inside = 2] = "Inside";
})(T ||= {});
function pe(e) {
	if (e instanceof w) return {
		tag: "ellipse",
		segData: e.toJSON()
	};
	if (e instanceof S) return {
		tag: "lineSegment",
		segData: e.toJSON()
	};
	if (e instanceof ce) return {
		tag: "bezier",
		segData: e.toJSON()
	};
	throw Error("not implemented");
}
var E = class e {
	static fromJSON(t) {
		let n = new e();
		for (let e of t.segs) switch (e.tag) {
			case "bezier":
				n.addSegment(ce.fromJSON(e.segData));
				break;
			case "ellipse":
				n.addSegment(w.fromJSON(e.segData));
				break;
			case "lineSegment":
				n.addSegment(S.fromJSON(e.segData));
				break;
			default: throw Error("not implemented");
		}
		return n;
	}
	toJSON() {
		return { segs: this.segs.map((e) => pe(e)) };
	}
	static CurvesIntersect(t, n) {
		return t === n || e.intersectionOne(t, n, !1) != null;
	}
	static lengthWithInterpolationAndThreshold(e, t) {
		throw Error("not implemented");
	}
	static lengthWithInterpolation(e) {
		throw "not implemented";
	}
	get parStart() {
		return 0;
	}
	get parEnd() {
		return this.parEnd_;
	}
	lengthPartial(e, t) {
		let n = {
			start: e,
			end: t
		};
		this.adjustStartEndEndParametersToDomain(n);
		let r = this.getSegIndexParam(e), i = this.getSegIndexParam(t);
		if (r.segIndex < i.segIndex) {
			let e = this.segs[r.segIndex], t = e.lengthPartial(r.par, e.parEnd);
			for (let e = r.segIndex + 1; e < i.segIndex; e++) t += this.segs[e].length;
			return e = this.segs[i.segIndex], t + e.lengthPartial(e.parStart, i.par);
		} else throw Error("not implemented.");
	}
	reverse() {
		let t = new e();
		for (let e = this.segs.length - 1; e >= 0; e--) t.addSegment(this.segs[e].reverse());
		return t;
	}
	constructor() {
		this.segs = [], this.parEnd_ = 0;
	}
	mkCurveWithSegs(t) {
		this.segs = t;
		for (let n of t) this.parEnd_ += e.paramSpan(n);
	}
	get start() {
		return this.segs[0].start;
	}
	get end() {
		return this.segs[this.segs.length - 1].end;
	}
	scaleFromOrigin(t, n) {
		let r = new e();
		for (let e of this.segs) r.addSegment(e.scaleFromOrigin(t, n));
		return r;
	}
	trim(t, n) {
		let r = {
			start: t,
			end: n
		};
		this.adjustStartEndEndParametersToDomain(r);
		let i = this.getSegIndexParam(r.start), a = this.getSegIndexParam(r.end);
		if (i.segIndex === a.segIndex) return this.segs[i.segIndex].trim(i.par, a.par);
		let o = new e();
		i.par < this.segs[i.segIndex].parEnd && (o = o.addSegment(this.segs[i.segIndex].trim(i.par, this.segs[i.segIndex].parEnd)));
		for (let e = i.segIndex + 1; e < a.segIndex; e++) o = o.addSegment(this.segs[e]);
		return this.segs[a.segIndex].parStart < a.par && (o = o.addSegment(this.segs[a.segIndex].trim(this.segs[a.segIndex].parStart, a.par))), o;
	}
	translate(e) {
		for (let t of this.segs) t.translate(e);
		this.boundingBox_ &&= O.translate(this.boundingBox_, e), this.pBNode = null;
	}
	adjustStartEndEndParametersToDomain(e) {
		if (e.start > e.end) {
			let t = e.start;
			e.start = e.end, e.end = t;
		}
		e.start < this.parStart && (e.start = this.parStart), e.end > this.parEnd && (e.end = this.parEnd);
	}
	trimWithWrap(t, n) {
		if (t < n) return this.trim(t, n);
		let r = new e();
		return r.addSegment(this.trim(t, this.parEnd)), r.addSegment(this.trim(this.parStart, n)), r;
	}
	addSegs(e) {
		for (let t of e) this.addSegment(t);
		return this;
	}
	addSegment(t) {
		if (t == null) return this;
		if (this.boundingBox_ = null, !(t instanceof e)) this.segs.push(t), this.parEnd_ += e.paramSpan(t);
		else for (let n of t.segs) this.segs.push(n), this.parEnd_ += e.paramSpan(n);
		return this;
	}
	pNodeOverICurve() {
		if (this.pBNode != null) return this.pBNode;
		let e = [], t = [];
		for (let n of this.segs) {
			let r = n.pNodeOverICurve();
			e.push(r.parallelogram), t.push(r);
		}
		return this.pBNode = {
			parallelogram: x.getParallelogramOfAGroup(e),
			seg: this,
			leafBoxesOffset: u.defaultLeafBoxesOffset,
			node: { children: t }
		}, this.pBNode;
	}
	static intersectionOne(t, n, r) {
		let i = e.curveCurveXWithParallelogramNodesOne(t.pNodeOverICurve(), n.pNodeOverICurve());
		return r && i != null && (i = e.liftIntersectionToCurves(t, n, i)), i;
	}
	static getAllIntersections(t, n, r) {
		return t instanceof S ? e.getAllIntersectionsOfLineAndICurve(t, n, r) : e.getAllIntersectionsInternal(t, n, r);
	}
	static getAllIntersectionsInternal(t, n, r) {
		let i = [];
		if (e.curveCurveXWithParallelogramNodes(t.pNodeOverICurve(), n.pNodeOverICurve(), i), r) for (let r = 0; r < i.length; r++) i[r] = e.liftIntersectionToCurves(t, n, i[r]);
		return i;
	}
	static getAllIntersectionsOfLineAndICurve(t, n, r) {
		return n instanceof D ? e.getAllIntersectionsOfLineAndPolyline(t, n) : n instanceof e ? e.getAllIntersectionsOfLineAndCurve(t, n, r) : n instanceof w && n.isArc() ? e.getAllIntersectionsOfLineAndArc(t, n) : e.getAllIntersectionsInternal(t, n, r);
	}
	static getAllIntersectionsOfLineAndCurve(t, n, r) {
		let i = [], a = t.pNodeOverICurve(), o = n.pNodeOverICurve();
		if (x.intersect(a.parallelogram, o.parallelogram) === !1) return i;
		let s = 0;
		for (let a of n.segs) {
			let o = e.getAllIntersections(t, a, !1);
			if (r) {
				for (let e of o) e.par1 += s - a.parStart, e.seg1 = n;
				s += a.parEnd - a.parStart;
			}
			for (let t of o) e.alreadyInside(i, t) || i.push(t);
		}
		return i;
	}
	static closeIntersections(e, t) {
		return y.close(e.x, t.x, u.intersectionEpsilon);
	}
	static closeIntersectionPoints(e, t) {
		return y.close(e, t, u.intersectionEpsilon);
	}
	static alreadyInside(t, n) {
		for (let r = 0; r < t.length; r++) {
			let i = t[r];
			if (e.closeIntersections(i, n)) return !0;
		}
		return !1;
	}
	static getAllIntersectionsOfLineAndArc(t, n) {
		let r = t.end.sub(t.start), i = [], a = r.length;
		if (a < u.distanceEpsilon) {
			let e = t.start.sub(n.center);
			if (m(e.length, n.aAxis.length)) {
				let r = y.angle(n.aAxis, e);
				n.parStart - u.tolerance <= r && (r = Math.max(r, n.parStart), r <= n.parEnd + u.tolerance && (r = Math.min(n.parEnd, r), i.push(new ae(0, r, t.start, t, n))));
			}
			return i;
		}
		let o = r.rotate90Ccw().div(a), s = t.start.sub(n.center).dot(o), c = n.center.add(o.mul(s)), l = n.aAxis.length, d = Math.abs(s);
		if (l < d - u.distanceEpsilon) return i;
		if (r = o.rotate90Cw(), m(l, d)) e.tryToAddPointToLineCircleCrossing(t, n, i, c, a, r);
		else {
			let o = Math.sqrt(l * l - s * s), u = r.mul(o);
			e.tryToAddPointToLineCircleCrossing(t, n, i, c.add(u), a, r), e.tryToAddPointToLineCircleCrossing(t, n, i, c.sub(u), a, r);
		}
		return i;
	}
	static tryToAddPointToLineCircleCrossing(e, t, n, r, i, a) {
		let o = r.sub(e.start).dot(a);
		if (o < -u.distanceEpsilon || (o = Math.max(o, 0), o > i + u.distanceEpsilon)) return;
		o = Math.min(o, i), o /= i;
		let s = y.angle(t.aAxis, r.sub(t.center));
		t.parStart - u.tolerance <= s && (s = Math.max(s, t.parStart), s <= t.parEnd + u.tolerance && (s = Math.min(t.parEnd, s), n.push(new ae(o, s, r, e, t))));
	}
	static getAllIntersectionsOfLineAndPolyline(t, n) {
		let r = [], i = 0, a = n.startPoint;
		for (; a != null && a.getNext() != null; a = a.getNext()) {
			let o = e.crossTwoLineSegs(t.start, t.end, a.point, a.getNext().point, 0, 1, 0, 1);
			o && (e.adjustSolution(t.start, t.end, a.point, a.getNext().point, o), e.oldIntersection(r, o.x) || r.push(new ae(o.aSol, i + o.bSol, o.x, t, n))), i++;
		}
		if (n.closed) {
			let o = e.crossTwoLineSegs(t.start, t.end, a.point, n.start, 0, 1, 0, 1);
			o && (e.adjustSolution(t.start, t.end, a.point, n.start, o), e.oldIntersection(r, o.x) || r.push(new ae(o.aSol, i + o.bSol, o.x, t, n)));
		}
		return r;
	}
	static adjustSolution(t, n, r, i, a) {
		e.closeIntersectionPoints(a.x, t) ? (a.x = t, a.aSol = 0) : e.closeIntersectionPoints(a.x, n) && (a.x = n, a.aSol = 1), e.closeIntersectionPoints(a.x, r) ? (a.x = r, a.bSol = Math.floor(a.bSol)) : e.closeIntersectionPoints(a.x, i) && (a.x = i, a.bSol = Math.ceil(a.bSol));
	}
	static curveCurveXWithParallelogramNodesOne(t, n) {
		if (!x.intersect(t.parallelogram, n.parallelogram)) return null;
		let r = t.node, i = n.node, a = r.hasOwnProperty("children"), o = i.hasOwnProperty("children");
		if (a && o) for (let t of r.children) for (let n of i.children) {
			let r = e.curveCurveXWithParallelogramNodesOne(t, n);
			if (r != null) return r;
		}
		else if (o) for (let n of i.children) {
			let r = e.curveCurveXWithParallelogramNodesOne(t, n);
			if (r != null) return r;
		}
		else if (a) for (let t of r.children) {
			let r = e.curveCurveXWithParallelogramNodesOne(t, n);
			if (r != null) return r;
		}
		else return e.crossOverIntervalsOne(t, n);
		return null;
	}
	static curveCurveXWithParallelogramNodes(t, n, r) {
		if (!x.intersect(t.parallelogram, n.parallelogram)) return;
		let i = t.node.hasOwnProperty("children"), a = n.node.hasOwnProperty("children");
		if (i && a) for (let i of t.node.children) for (let t of n.node.children) e.curveCurveXWithParallelogramNodes(i, t, r);
		else if (a) for (let i of n.node.children) e.curveCurveXWithParallelogramNodes(t, i, r);
		else if (i) for (let i of t.node.children) e.curveCurveXWithParallelogramNodes(i, n, r);
		else r = e.crossOverLeaves(t, n, r);
	}
	static crossOverIntervalsOne(t, n) {
		let r = t.node, i = n.node, a = (r.high - r.low) / 2, o = (i.high - i.low) / 2;
		for (let s = 1; s < 2; s++) {
			let c = s * a + r.low;
			for (let a = 1; a < 2; a++) {
				let l = a * o + i.low, u;
				if (r.chord == null && i.chord == null ? u = e.crossWithinIntervalsWithGuess(t.seg, n.seg, r.low, r.high, i.low, i.high, c, l) : r.chord != null && i.chord == null ? u = e.crossWithinIntervalsWithGuess(r.chord, n.seg, 0, 1, i.low, i.high, .5 * s, l) : r.chord == null ? (u = e.crossWithinIntervalsWithGuess(t.seg, i.chord, r.low, r.high, 0, 1, c, .5 * a), u && (u.bSol = i.low + u.bSol * (i.high - i.low))) : (u = e.crossWithinIntervalsWithGuess(r.chord, i.chord, 0, 1, 0, 1, .5 * s, .5 * a), u && (u.aSol = r.low + u.aSol * (r.high - r.low), u.bSol = i.low + u.bSol * (i.high - i.low))), u) return e.createIntersectionOne(t, n, u.aSol, u.bSol, u.x);
			}
		}
		return e.goDeeperOne(t, n);
	}
	static crossOverLeaves(t, n, r) {
		let i = t.node, a = n.node, o = !1, s = (i.high - i.low) / 2 + i.low, c = (a.high - a.low) / 2 + a.low, l;
		return i.chord == null && a.chord == null ? l = e.crossWithinIntervalsWithGuess(t.seg, n.seg, i.low, i.high, a.low, a.high, s, c) : i.chord != null && a.chord == null ? (l = e.crossWithinIntervalsWithGuess(i.chord, n.seg, 0, 1, a.low, a.high, .5, c), l && (l.aSol = i.low + l.aSol * (i.high - i.low))) : i.chord == null ? (l = e.crossWithinIntervalsWithGuess(t.seg, a.chord, i.low, i.high, 0, 1, s, .5), l && (l.bSol = a.low + l.bSol * (a.high - a.low))) : (l = e.crossWithinIntervalsWithGuess(i.chord, a.chord, 0, 1, 0, 1, .5, .5), l && (l.bSol = a.low + l.bSol * (a.high - a.low), l.aSol = i.low + l.aSol * (i.high - i.low))), l && (e.addIntersection(t, n, r, l), o = !0), o || e.goDeeper(r, t, n), r;
	}
	static addIntersection(t, n, r, i) {
		let a = t.node;
		e.closeIntersectionPoints(i.x, t.seg.value(a.low)) ? (i.x = t.seg.value(a.low), i.aSol = a.low) : e.closeIntersectionPoints(i.x, t.seg.value(a.high)) && (i.x = t.seg.value(a.high), i.aSol = a.high);
		let o = n.node;
		if (e.closeIntersectionPoints(i.x, n.seg.value(o.low)) ? (i.x = n.seg.value(o.low), i.bSol = o.low) : e.closeIntersectionPoints(i.x, n.seg.value(o.high)) && (i.x = n.seg.value(o.high), i.bSol = o.high), !e.oldIntersection(r, i.x)) {
			let e = new ae(i.aSol, i.bSol, i.x, t.seg, n.seg);
			r.push(e);
		}
	}
	static oldIntersection(e, t) {
		for (let n of e) if (t.sub(n.x).length < u.distanceEpsilon * 100) return !0;
		return !1;
	}
	static createIntersectionOne(t, n, r, i, a) {
		let o = t.node, s = n.node;
		return e.closeIntersectionPoints(a, t.seg.value(o.low)) ? (a = t.seg.value(o.low), r = o.low) : e.closeIntersectionPoints(a, t.seg.value(o.high)) && (a = t.seg.value(o.high), r = o.high), e.closeIntersectionPoints(a, n.seg.value(s.low)) ? (a = n.seg.value(s.low), i = s.low) : e.closeIntersectionPoints(a, n.seg.value(s.high)) && (a = n.seg.value(s.high), i = s.high), new ae(r, i, a, t.seg, n.seg);
	}
	static liftIntersectionToCurves_(t, n, r, i, a, o, s) {
		return new ae(t instanceof e ? e.liftParameterToCurve(t, r - o.parStart, o) : r, n instanceof e ? e.liftParameterToCurve(n, i - s.parStart, s) : i, a, t, n);
	}
	static DropIntersectionToSegs(t) {
		let n, r;
		if (t.seg0 instanceof e) {
			let e = t.seg0.getSegParam(t.par0);
			n = e.seg, r = e.par;
		} else r = t.par0, n = t.seg0;
		let i, a;
		if (t.seg1 instanceof e) {
			let e = t.seg1.getSegParam(t.par1);
			a = e.par, i = e.seg;
		} else a = t.par1, i = t.seg1;
		return new ae(r, a, t.x, n, i);
	}
	static liftIntersectionToCurves(t, n, r) {
		return e.liftIntersectionToCurves_(t, n, r.par0, r.par1, r.x, r.seg0, r.seg1);
	}
	static liftParameterToCurve(t, n, r) {
		if (t === r) return n;
		if (!t.hasOwnProperty("segs")) return;
		let i = t, a = 0;
		for (let t of i.segs) {
			if (t === r) return n + a;
			a += e.paramSpan(t);
		}
		throw "bug in liftParameterToCurve";
	}
	static paramSpan(e) {
		return e.parEnd - e.parStart;
	}
	static goDeeperOne(t, n) {
		let r = t.node, i = n.node;
		if (t.leafBoxesOffset > u.distanceEpsilon && n.leafBoxesOffset > u.distanceEpsilon) {
			let a = ie.createParallelogramNodeForCurveSeg(r.low, r.high, t.seg, t.leafBoxesOffset / 2), o = ie.createParallelogramNodeForCurveSeg(i.low, i.high, n.seg, n.leafBoxesOffset / 2);
			return e.curveCurveXWithParallelogramNodesOne(a, o);
		}
		if (t.leafBoxesOffset > u.distanceEpsilon) {
			let i = ie.createParallelogramNodeForCurveSeg(r.low, r.high, t.seg, t.leafBoxesOffset / 2);
			return e.curveCurveXWithParallelogramNodesOne(i, n);
		}
		if (n.leafBoxesOffset > u.distanceEpsilon) {
			let r = ie.createParallelogramNodeForCurveSeg(i.low, i.high, n.seg, n.leafBoxesOffset / 2);
			return e.curveCurveXWithParallelogramNodesOne(t, r);
		}
		let a = t.seg.value(r.low), o = t.seg.value(r.high);
		if (!y.closeDistEps(a, o)) {
			let r = n.seg.value(i.low), s = n.seg.value(i.high);
			if (!y.closeDistEps(r, s)) {
				let i = t.seg instanceof S ? t.seg : S.mkPP(a, o), c = n.seg instanceof S ? n.seg : S.mkPP(r, s), l = e.crossWithinIntervalsWithGuess(i, c, 0, 1, 0, 1, .5, .5);
				if (l) return e.adjustParameters(t, i, n, c, l), e.createIntersectionOne(t, n, l.aSol, l.bSol, l.x);
			}
		}
		return null;
	}
	static goDeeper(t, n, r) {
		let i = n.node, a = r.node, o = n.leafBoxesOffset > u.distanceEpsilon, s = r.leafBoxesOffset > u.distanceEpsilon;
		if (o && s) {
			let o = ie.createParallelogramNodeForCurveSeg(i.low, i.high, n.seg, n.leafBoxesOffset / 2), s = ie.createParallelogramNodeForCurveSeg(a.low, a.high, r.seg, r.leafBoxesOffset / 2);
			e.curveCurveXWithParallelogramNodes(o, s, t);
		} else if (o) {
			let a = ie.createParallelogramNodeForCurveSeg(i.low, i.high, n.seg, n.leafBoxesOffset / 2);
			e.curveCurveXWithParallelogramNodes(a, r, t);
		} else if (s) {
			let i = ie.createParallelogramNodeForCurveSeg(a.low, a.high, r.seg, r.leafBoxesOffset / 2);
			e.curveCurveXWithParallelogramNodes(n, i, t);
		} else {
			let o = n.seg.value(i.low), s = n.seg.value(i.high);
			if (!y.closeDistEps(o, s)) {
				let i = r.seg.value(a.low), c = r.seg.value(a.high);
				if (!y.closeDistEps(i, c)) {
					let a = n.seg instanceof S ? n.seg : S.mkPP(o, s), l = r.seg instanceof S ? r.seg : S.mkPP(i, c), u = e.crossWithinIntervalsWithGuess(a, l, 0, 1, 0, 1, .5, .5);
					u && (e.adjustParameters(n, a, r, l, u), e.addIntersection(n, r, t, u));
				}
			}
		}
	}
	static adjustParameters(e, t, n, r, i) {
		if (t !== e.seg && !(e.seg instanceof D)) i.aSol = e.seg.closestParameter(i.x);
		else {
			let t = e.node;
			i.aSol = t.low + i.aSol * (t.high - t.low);
		}
		if (r !== n.seg && !(n.seg instanceof D)) i.bSol = n.seg.closestParameter(i.x);
		else {
			let e = n.node;
			i.bSol = e.low + i.bSol * (e.high - e.low);
		}
	}
	getSegParam(e) {
		let t = this.parStart;
		for (let n of this.segs) {
			let r = t + n.parEnd - n.parStart;
			if (e >= t && e <= r) return {
				par: e - t + n.parStart,
				seg: n
			};
			t = r;
		}
		let n = this.segs[this.segs.length - 1];
		return {
			seg: n,
			par: n.parEnd
		};
	}
	getSegIndexParam(e) {
		let t = 0, n = this.segs.length;
		for (let r = 0; r < n; r++) {
			let n = this.segs[r], i = t + n.parEnd - n.parStart;
			if (e >= t && e <= i) return {
				segIndex: r,
				par: e - t + n.parStart
			};
			t = i;
		}
		let r = this.segs[n - 1];
		return {
			segIndex: n - 1,
			par: r.parEnd
		};
	}
	value(e) {
		return le(this.getSegParam(e));
	}
	derivative(e) {
		return ue(this.getSegParam(e));
	}
	secondDerivative(e) {
		return de(this.getSegParam(e));
	}
	thirdDerivative(e) {
		return fe(this.getSegParam(e));
	}
	static crossWithinIntervalsWithGuess(t, n, r, i, a, o, s, c) {
		if (t instanceof S && n instanceof S) {
			let s = e.crossTwoLineSegs(t.start, t.end, n.start, n.end, r, i, a, o);
			if (s !== void 0) return s;
		}
		let l = e.minDistWithinIntervals(t, n, r, i, a, o, s, c);
		if (l == null) return;
		let d = l.aX.sub(l.bX);
		return d.dot(d) >= u.distanceEpsilon ? void 0 : {
			aSol: l.aSol,
			bSol: l.bSol,
			x: y.middle(l.aX, l.bX)
		};
	}
	static crossTwoLineSegs(e, t, n, r, i, a, o, s) {
		let c = t.sub(e), d = n.sub(r), f = n.sub(e), p = l.solve(c.x, d.x, f.x, c.y, d.y, f.y);
		if (p == null) return;
		let m = p.x, h = p.y, g = e.add(c.mul(m));
		if (!(m < i - u.tolerance) && (m = Math.max(m, i), !(m > a + u.tolerance) && (m = Math.min(m, a), !(h < o - u.tolerance) && (h = Math.max(h, o), !(h > s + u.tolerance))))) return h = Math.min(h, s), {
			aSol: m,
			bSol: h,
			x: g
		};
	}
	static PointRelativeToCurveLocation(t, n) {
		if (!n.boundingBox.contains(t)) return T.Outside;
		let r = 2 * n.boundingBox.diagonal, i = Math.PI / 180, a = 0;
		for (let o = 13; o < 360; o += 13) {
			let s = new y(Math.cos(o * i), Math.sin(o * i)), c = S.mkPP(t, t.add(s.mul(r))), l = this.getAllIntersectionsOfLineAndICurve(c, n, !0);
			if (e.AllIntersectionsAreGood(l, n)) {
				for (let e of l) if (y.closeDistEps(e.x, t)) return T.Boundary;
				if (l.length % 2 == 1 ? a++ : a--, a >= 2) return T.Inside;
				if (a <= -2) return T.Outside;
			}
		}
		return T.Boundary;
	}
	static AllIntersectionsAreGood(t, n) {
		let r = n.hasOwnProperty("segs"), i = null;
		if (r || n instanceof D && (i = n.toCurve()), i) {
			for (let n of t) if (!e.RealCut(e.DropIntersectionToSegs(n), i, !1)) return !1;
		}
		return !0;
	}
	static RealCut(e, t, n) {
		let r = e.seg0, i = e.seg1, a = e.par0, o = e.par1, s = e.x, c = r.derivative(a).normalize(), l = i.derivative(o).normalize().rotate(Math.PI / 2);
		if (y.closeDistEps(s, i.end)) {
			let e = null;
			for (let n = 0; n < t.segs.length - 1; n++) if (t.segs[n] === i) {
				e = t.segs[n + 1];
				break;
			}
			if (e == null) return !1;
			let n = c.rotate(Math.PI / 2);
			return !(n.dot(i.derivative(i.parEnd)) * n.dot(e.derivative(e.parStart)) < u.tolerance);
		}
		if (y.closeDistEps(s, i.start)) {
			let e = null;
			for (let n = t.segs.length - 1; n > 0; n--) if (t.segs[n] === i) {
				e = t.segs[n - 1];
				break;
			}
			if (e == null) return !1;
			let n = c.rotate(Math.PI / 2);
			return !(n.dot(i.derivative(i.parStart)) * n.dot(e.derivative(e.parEnd)) < u.tolerance);
		}
		let d = c.dot(l);
		return n ? d > u.distanceEpsilon : Math.abs(d) > u.distanceEpsilon;
	}
	static realCutWithClosedCurve(e, t, n) {
		let r = e.seg0, i = e.seg1, a = e.par0, o = e.par1, s = e.x, c = r.derivative(a).normalize(), l = i.derivative(o).normalize().rotate(Math.PI / 2);
		if (y.closeDistEps(s, i.end)) {
			let e = null;
			for (let n = 0; n < t.segs.length; n++) if (t.segs[n] === i) {
				e = t.segs[(n + 1) % t.segs.length];
				break;
			}
			if (e == null) throw Error();
			let n = c.rotate(Math.PI / 2);
			return !(n.dot(i.derivative(i.parEnd)) * n.dot(e.derivative(e.parStart)) < u.tolerance);
		}
		if (y.closeDistEps(s, i.start)) {
			let e = null;
			for (let n = 0; n < t.segs.length; n++) if (t.segs[n] === i) {
				e = t.segs[n > 0 ? n - 1 : t.segs.length - 1];
				break;
			}
			let n = c.rotate(Math.PI / 2);
			return !(n.dot(i.derivative(i.parStart)) * n.dot(e.derivative(e.parEnd)) < u.tolerance);
		}
		let d = c.dot(l);
		return n ? d > u.distanceEpsilon : Math.abs(d) > u.distanceEpsilon;
	}
	static minDistWithinIntervals(e, t, n, r, i, a, o, s) {
		let c = new se(e, t, n, r, i, a, o, s);
		return c.solve(), c.success ? {
			aSol: c.aSolution,
			bSol: c.bSolution,
			aX: c.aPoint,
			bX: c.bPoint
		} : void 0;
	}
	offsetCurve(e, t) {
		throw Error("Method not implemented.");
	}
	get boundingBox() {
		if (this.boundingBox_) return this.boundingBox_;
		if (this.segs.length === 0) this.boundingBox_ = O.mkEmpty();
		else {
			let e = this.segs[0].boundingBox.clone();
			for (let t = 1; t < this.segs.length; t++) e.addRecSelf(this.segs[t].boundingBox);
			return this.boundingBox_ = e;
		}
	}
	clone() {
		let t = new e();
		for (let e of this.segs) t.addSegment(e.clone());
		return this.boundingBox_ != null && (t.boundingBox_ = this.boundingBox_.clone()), t;
	}
	getParameterAtLength(e) {
		let t = 0;
		for (let n of this.segs) {
			let r = n.length;
			if (r >= e) return t + n.getParameterAtLength(e);
			e -= r, t += n.parEnd - n.parStart;
		}
		return this.parEnd;
	}
	get length() {
		let e = 0;
		for (let t of this.segs) e += t.length;
		return e;
	}
	transform(t) {
		let n = new e();
		for (let e of this.segs) n.addSegment(e.transform(t));
		return this.boundingBox_ && (n.boundingBox_ = this.boundingBox_.transform(t)), n;
	}
	closestParameterWithinBounds(t, n, r) {
		let i = 0, a = Number.MAX_VALUE, o = 0;
		for (let s of this.segs) {
			if (o > r) break;
			let c = e.paramSpan(s);
			if (o + c >= n) {
				let e = Math.max(s.parStart, s.parStart + (n - o)), c = Math.min(s.parEnd, s.parStart + (r - o)), l = s.closestParameterWithinBounds(t, e, c), u = t.sub(s.value(l)), d = u.dot(u);
				d < a && (i = o + l - s.parStart, a = d);
			}
			o += c;
		}
		return i;
	}
	closestParameter(t) {
		let n = 0, r = Number.MAX_VALUE, i = 0;
		for (let a of this.segs) {
			let o = a.closestParameter(t), s = t.sub(a.value(o)), c = s.dot(s);
			if (c < r) {
				if (n = i + o - a.parStart, c === 0) break;
				r = c;
			}
			i += e.paramSpan(a);
		}
		return n;
	}
	static addLineSegment(e, t, n) {
		return e.addSegment(S.mkPP(t, n));
	}
	static addLineSegmentCNNP(t, n, r, i) {
		return e.addLineSegment(t, new y(n, r), i);
	}
	static addLineSegmentCNNNN(t, n, r, i, a) {
		e.addLineSegment(t, new y(n, r), new y(i, a));
	}
	static continueWithLineSegmentNN(t, n, r) {
		e.addLineSegment(t, t.end, new y(n, r));
	}
	static continueWithLineSegmentP(t, n) {
		e.addLineSegment(t, t.end, n);
	}
	static closeCurve(t) {
		return e.continueWithLineSegmentP(t, t.start), t;
	}
	leftDerivative(e) {
		let t = this.tryToGetLeftSegment(e);
		return t == null ? this.derivative(e) : t.derivative(t.parEnd);
	}
	rightDerivative(e) {
		let t = this.tryToGetRightSegment(e);
		return t == null ? this.derivative(e) : t.derivative(t.parStart);
	}
	tryToGetLeftSegment(t) {
		if (Math.abs(t - this.parStart) < u.tolerance) return this.start.equal(this.end) ? this.segs[this.segs.length - 1] : null;
		for (let n of this.segs) if (t -= e.paramSpan(n), Math.abs(t) < u.tolerance) return n;
		return null;
	}
	tryToGetRightSegment(t) {
		if (Math.abs(t - this.parEnd) < u.tolerance) return this.start === this.end ? this.segs[0] : null;
		for (let n of this.segs) {
			if (Math.abs(t) < u.tolerance) return n;
			t -= e.paramSpan(n);
		}
		return null;
	}
	static ClosestPoint(e, t) {
		return e.value(e.closestParameter(t));
	}
	static CurveIsInsideOther(t, n) {
		if (!n.boundingBox.containsRect(t.boundingBox)) return !1;
		let r = e.getAllIntersections(t, n, !0);
		if (r.length === 0) return e.NonIntersectingCurveIsInsideOther(t, n);
		if (r.length === 1) return t.start.equal(r[0].x) ? e.PointRelativeToCurveLocation(t.value((t.parStart + t.parEnd) / 2), n) == T.Inside : e.PointRelativeToCurveLocation(t.start, n) === T.Inside;
		for (let i of e.PointsBetweenIntersections(t, r)) if (e.PointRelativeToCurveLocation(i, n) === T.Outside) return !1;
		return !0;
	}
	static *PointsBetweenIntersections(e, t) {
		t.sort((e, t) => e.par0 - t.par0);
		for (let n = 0; n < t.length - 1; n++) yield e.value((t[n].par0 + t[n + 1].par0) / 2);
		let n = t[t.length - 1].par0, r = t[0].par0, i = n + (e.parEnd - n + (r - e.parStart)) / 2;
		i > e.parEnd && (i = e.parStart + (i - e.parEnd)), yield e.value(i);
	}
	static NonIntersectingCurveIsInsideOther(t, n) {
		for (let r = t.parStart; r < t.parEnd; r += .5) {
			let i = e.PointRelativeToCurveLocation(t.value(r), n);
			if (T.Boundary !== i) return T.Inside === i;
		}
		return T.Outside !== e.PointRelativeToCurveLocation(t.end, n);
	}
	static ClosedCurveInteriorsIntersect(t, n) {
		if (!n.boundingBox.intersects(t.boundingBox)) return !1;
		let r = e.getAllIntersections(t, n, !0);
		if (r.length === 0) return e.NonIntersectingCurveIsInsideOther(t, n) || e.NonIntersectingCurveIsInsideOther(n, t);
		if (r.length === 1) return t.start.equal(r[0].x) ? e.PointRelativeToCurveLocation(t.value((t.parStart + t.parEnd) / 2), n) === T.Inside || !n.start.equal(r[0].x) ? e.PointRelativeToCurveLocation(n.start, t) === T.Inside : e.PointRelativeToCurveLocation(n.value((n.parStart + n.parEnd) / 2), t) === T.Inside : e.PointRelativeToCurveLocation(t.start, n) === T.Inside;
		for (let i of e.PointsBetweenIntersections(t, r)) if (e.PointRelativeToCurveLocation(i, n) === T.Inside) return !0;
		return !0;
	}
	curvature(e) {
		let t = this.getSegParam(e);
		return t.seg.curvature(t.par);
	}
	curvatureDerivative(e) {
		throw Error("Not implemente");
	}
	curvatureSecondDerivative(e) {
		throw Error("Not implemented");
	}
	static createBezierSeg(e, t, n, r, i) {
		let a = y.mkPoint(e, n.point, 1 - e, r.point), o = y.mkPoint(t, i.point, 1 - t, r.point), s = r.point.mul(2 / 3);
		return new ce(a, a.div(3).add(s), s.add(o.div(3)), o);
	}
	static createBezierSegN(e, t, n, r) {
		let i = n.mul(r);
		return new ce(e, e.add(i), t.add(i), t);
	}
	static findCorner(e) {
		let t = e.next;
		if (t.next == null) return;
		let n = t.next;
		if (n != null) return {
			b: t,
			c: n
		};
	}
	static trimEdgeSplineWithNodeBoundaries(t, n, r, i) {
		let a = r.parStart, o = r.parEnd;
		t != null && (a = e.findNewStart(r, a, t, i)), n != null && (o = e.findNewEnd(r, n, i, o));
		let s = Math.min(a, o), c = Math.max(a, o);
		return s < c ? r.trim(s, c) : r;
	}
	static findNewEnd(t, n, r, i) {
		let a = e.getAllIntersections(t, n, !0);
		if (a.length === 0) return i = t.parEnd, i;
		if (r) {
			i = t.parEnd;
			for (let e of a) e.par0 < i && (i = e.par0);
		} else {
			i = t.parStart;
			for (let e of a) e.par0 > i && (i = e.par0);
		}
		return i;
	}
	static findNewStart(t, n, r, i) {
		let a = e.getAllIntersections(t, r, !0);
		if (a.length === 0) {
			n = t.parStart;
			return;
		}
		if (i) {
			n = t.parStart;
			for (let e of a) e.par0 > n && (n = e.par0);
		} else {
			n = t.parEnd;
			for (let e of a) e.par0 < n && (n = e.par0);
		}
		return n;
	}
	static polylineAroundClosedCurve(t) {
		if (t instanceof w) return e.refineEllipse(t);
		if (t instanceof D) return t;
		if (t instanceof e && e.allSegsAreLines(t)) {
			let e = new D();
			for (let n of t.segs) e.addPoint(n.start);
			if (e.closed = !0, !e.isClockwise()) return e.reverse();
		}
		return t.boundingBox.perimeter();
	}
	static allSegsAreLines(e) {
		for (let t of e.segs) if (!(t instanceof S)) return !1;
		return !0;
	}
	static refineEllipse(t) {
		let n = t.boundingBox.perimeter(), r = Math.PI / 4, i = t.boundingBox.width, a = t.boundingBox.height, o = Math.sqrt(i * i + a * a), s = [];
		for (let i = 0; i < 4; i++) {
			let a = r + i * Math.PI / 2, c = t.value(a), l = t.derivative(a).normalize().mul(o), u = S.mkPP(c.sub(l), c.add(l));
			for (let t of e.getAllIntersections(n, u, !0)) s.push(t);
		}
		s.sort((e, t) => e.par0 < t.par0 ? -1 : +(e.par0 > t.par0));
		let c = new D();
		return s.forEach((e) => c.addPoint(e.x)), c.closed = !0, c;
	}
	static polyFromBox(e) {
		let t = new D();
		return t.addPoint(e.leftTop), t.addPoint(e.rightTop), t.addPoint(e.rightBottom), t.addPoint(e.leftBottom), t.closed = !0, t;
	}
}, D = class e {
	constructor() {
		this.initIsRequired = !0, this.isClosed_ = !1;
	}
	toJSON() {
		return { points: Array.from(this).map((e) => e.toJSON()) };
	}
	static fromJSON(t) {
		return e.mkFromPoints(t.points.map((e) => y.fromJSON(e)));
	}
	RemoveStartPoint() {
		let e = this.startPoint.next;
		e.prev = null, this.startPoint = e, this.setInitIsRequired();
	}
	RemoveEndPoint() {
		let e = this.endPoint.prev;
		e.next = null, this.endPoint = e, this.setInitIsRequired();
	}
	setInitIsRequired() {
		this.initIsRequired = !0;
	}
	addPointXY(e, t) {
		this.addPoint(new y(e, t));
	}
	isClockwise() {
		return y.getTriangleOrientation(this.startPoint.point, this.startPoint.next.point, this.startPoint.next.next.point) == _.Clockwise;
	}
	addPoint(e) {
		let t = new b();
		t.polyline = this, t.point = e.clone(), this.endPoint == null ? this.startPoint = this.endPoint = t : (this.endPoint.next = t, t.prev = this.endPoint, this.endPoint = t), this.setInitIsRequired();
	}
	PrependPoint(e) {
		let t = b.mkFromPoint(e);
		t.polyline = this, this.startPoint == null ? (this.endPoint = t, this.startPoint = t) : y.closeDistEps(e, this.startPoint.point) || (this.startPoint.prev = t, t.next = this.startPoint, this.startPoint = t), this.setInitIsRequired();
	}
	*[Symbol.iterator]() {
		for (let e = this.startPoint; e != null; e = e.next) yield e.point;
	}
	*polylinePoints() {
		for (let e = this.startPoint; e != null; e = e.next) yield e;
	}
	*skip(e) {
		for (let t = this.startPoint; t != null; t = t.next) e > 0 ? e-- : yield t;
	}
	static parallelogramOfLineSeg(e, t) {
		let n = t.sub(e).div(2);
		return x.parallelogramByCornerSideSide(e, n, n);
	}
	static mkFromPoints(t) {
		let n = new e();
		for (let e of t) n.addPoint(e);
		return n;
	}
	static mkClosedFromPoints(t) {
		let n = e.mkFromPoints(t);
		return n.closed = !0, n;
	}
	calculatePbNode() {
		let t = [], n = [], r = this.startPoint, i = 0;
		for (; r.next != null;) {
			let a = e.parallelogramOfLineSeg(r.point, r.next.point);
			t.push(a), n.push({
				parallelogram: a,
				seg: this,
				leafBoxesOffset: 0,
				node: {
					low: i,
					high: i + 1,
					chord: S.mkPP(r.point, r.next.point)
				}
			}), r = r.next, i++;
		}
		if (this.isClosed_) {
			let r = e.parallelogramOfLineSeg(this.endPoint.point, this.startPoint.point);
			t.push(r), n.push({
				parallelogram: r,
				seg: this,
				leafBoxesOffset: 0,
				node: {
					low: i,
					high: i + 1,
					chord: S.mkPP(this.endPoint.point, this.startPoint.point)
				}
			});
		}
		this.pBNode = {
			parallelogram: x.getParallelogramOfAGroup(t),
			seg: this,
			leafBoxesOffset: 0,
			node: { children: n }
		};
	}
	init() {
		this.bBox = O.rectangleOnPoint(this.startPoint.point);
		for (let e of this.skip(1)) this.bBox.add(e.point);
		this.updateCount(), this.calculatePbNode(), this.initIsRequired = !1;
	}
	updateCount() {
		this.count_ = 0;
		for (let e = this.startPoint; e != null; e = e.next) this.count_++;
	}
	get count() {
		return this.initIsRequired && this.init(), this.count_;
	}
	get closed() {
		return this.isClosed_;
	}
	set closed(e) {
		this.isClosed_ = e;
	}
	value(e) {
		this.initIsRequired && this.init();
		let t = this.getAdjustedParamAndStartEndPoints(e);
		return y.convSum(t.t, t.a, t.b);
	}
	getAdjustedParamAndStartEndPoints(e) {
		let t = this.startPoint;
		for (; t.next != null;) {
			if (e <= 1) return {
				a: t.point,
				b: t.next.point,
				t: e
			};
			t = t.next, --e;
		}
		if (this.closed && e <= 1) return {
			a: this.endPoint.point,
			b: this.startPoint.point,
			t: e
		};
		throw Error("out of the parameter domain");
	}
	derivative(e) {
		let t = this.getAdjustedParamAndStartEndPoints(e);
		return t.b.sub(t.a);
	}
	secondDerivative(e) {
		return new y(0, 0);
	}
	thirdDerivative(e) {
		return new y(0, 0);
	}
	pNodeOverICurve() {
		return this.initIsRequired && this.init(), this.pBNode;
	}
	get boundingBox() {
		return this.initIsRequired && this.init(), this.bBox;
	}
	get parStart() {
		return 0;
	}
	get parEnd() {
		return this.initIsRequired && this.init(), this.closed ? this.count_ : this.count_ - 1;
	}
	static polylineFromCurve(t) {
		let n = new e();
		n.addPoint(t.start);
		for (let e of t.segs) n.addPoint(e.end);
		return n.closed = t.start === t.end, n;
	}
	trim(t, n) {
		let r = this.toCurve();
		return r = r.trim(t, n), r instanceof E ? e.polylineFromCurve(r) : e.mkFromPoints([r.start, r.end]);
	}
	trimWithWrap(e, t) {
		throw Error("Method not implemented.");
	}
	translate(e) {
		let t = this.startPoint;
		do {
			if (t.point = t.point.add(e), t === this.endPoint) break;
			t = t.getNext();
		} while (!0);
		this.setInitIsRequired();
	}
	scaleFromOrigin(e, t) {
		throw Error("Method not implemented.");
	}
	get start() {
		return this.startPoint.point;
	}
	get end() {
		return this.endPoint.point;
	}
	reverse() {
		let t = new e();
		t.closed = this.closed;
		let n = this.endPoint;
		do {
			if (t.addPoint(n.point), n === this.startPoint) break;
			n = n.getPrev();
		} while (!0);
		return t;
	}
	offsetCurve(e, t) {
		throw Error("Method not implemented.");
	}
	lengthPartial(e, t) {
		throw Error("Method not implemented.");
	}
	get length() {
		throw Error("Method not implemented.");
	}
	getParameterAtLength(e) {
		throw Error("Method not implemented.");
	}
	transform(t) {
		let n = new e();
		for (let e of this.polylinePoints()) n.addPoint(t.multiplyPoint(e.point));
		return n.closed = this.closed, n;
	}
	closestParameterWithinBounds(e, t, n) {
		throw Error("Method not implemented.");
	}
	closestParameter(e) {
		let t = 0, n = Number.MAX_VALUE, r = 0, i = this.startPoint;
		for (; i.next != null;) {
			let a = S.mkPP(i.point, i.next.point), o = a.closestParameter(e), s = a.value(o).sub(e), c = s.dot(s);
			c < n && (n = c, t = o + r), i = i.next, r++;
		}
		if (this.closed) {
			let i = S.mkPP(this.endPoint.point, this.startPoint.point), a = i.closestParameter(e), o = i.value(a).sub(e);
			o.dot(o) < n && (t = a + r);
		}
		return t;
	}
	clone() {
		let t = new e();
		t.closed = this.closed;
		let n = this.startPoint;
		do {
			if (t.addPoint(n.point), n === this.endPoint) break;
			n = n.getNext();
		} while (!0);
		return t;
	}
	leftDerivative(e) {
		throw Error("Method not implemented.");
	}
	rightDerivative(e) {
		throw Error("Method not implemented.");
	}
	curvature(e) {
		throw Error("Method not implemented.");
	}
	curvatureDerivative(e) {
		throw Error("Method not implemented.");
	}
	curvatureSecondDerivative(e) {
		throw Error("Method not implemented.");
	}
	next(e) {
		return e.next ?? (this.closed ? this.startPoint : null);
	}
	prev(e) {
		return e.prev ?? (this.closed ? this.endPoint : null);
	}
	toCurve() {
		let e = new E();
		E.addLineSegment(e, this.startPoint.point, this.startPoint.next.point);
		let t = this.startPoint.next;
		for (; (t = t.next) != null;) E.continueWithLineSegmentP(e, t.point);
		return this.closed && E.continueWithLineSegmentP(e, this.startPoint.point), e;
	}
	RemoveCollinearVertices() {
		for (let e = this.startPoint.next; e.next != null; e = e.next) y.getTriangleOrientation(e.prev.point, e.point, e.next.point) === _.Collinear && (e.prev.next = e.next, e.next.prev = e.prev);
		return this.setInitIsRequired(), this;
	}
}, me = class {
	pad(e) {
		this.width += e * 2;
	}
	constructor(e, t = e) {
		this.width = e, this.height = t;
	}
}, O = class e {
	transform(t) {
		return e.mkPP(t.multiplyPoint(this.leftTop), t.multiplyPoint(this.rightBottom));
	}
	translate(t) {
		return e.mkSizeCenter(this.size, this.center.add(t));
	}
	equal(e) {
		return this.left_ === e.left && this.right_ === e.right && this.top_ === e.top && this.bottom_ === e.bottom;
	}
	equalEps(e) {
		return m(this.left_, e.left) && m(this.right_, e.right) && m(this.top_, e.top) && m(this.bottom_, e.bottom);
	}
	static mkSizeCenter(t, n) {
		let r = t.width / 2, i = t.height / 2;
		return new e({
			left: n.x - r,
			right: n.x + r,
			bottom: n.y - i,
			top: n.y + i
		});
	}
	constructor(e) {
		this.left_ = e.left, this.right_ = e.right, this.top_ = e.top, this.bottom = e.bottom;
	}
	add_rect(e) {
		return this.addRec(e);
	}
	contains_point(e) {
		return this.contains(e);
	}
	contains_rect(e) {
		return this.containsRect(e);
	}
	intersection_rect(e) {
		return this.intersection(e);
	}
	intersects_rect(e) {
		return this.intersects(e);
	}
	unite(t) {
		return e.rectangleOfTwo(this, t);
	}
	contains_point_radius(e, t) {
		return this.containsWithPadding(e, t);
	}
	intersects(e) {
		return this.intersectsOnX(e) && this.intersectsOnY(e);
	}
	intersection(t) {
		if (!this.intersects(t)) {
			let t = e.mkEmpty();
			return t.setToEmpty(), t;
		}
		let n = Math.max(this.left, t.left), r = Math.min(this.right, t.right);
		return new e({
			left: n,
			bottom: Math.max(this.bottom, t.bottom),
			right: r,
			top: Math.min(this.top, t.top)
		});
	}
	get center() {
		return this.leftTop.add(this.rightBottom).mul(.5);
	}
	set center(e) {
		let t = this.leftTop.add(this.rightBottom).mul(.5), n = e.sub(t);
		this.leftTop = this.leftTop.add(n), this.rightBottom = this.rightBottom.add(n);
	}
	intersectsOnY(e) {
		return !(e.bottom_ > this.top_ + u.distanceEpsilon || e.top_ < this.bottom_ - u.distanceEpsilon);
	}
	intersectsOnX(e) {
		return !(e.left > this.right_ + u.distanceEpsilon || e.right < this.left_ - u.distanceEpsilon);
	}
	static mkEmpty() {
		return new e({
			left: 0,
			right: -1,
			bottom: 0,
			top: -1
		});
	}
	get left() {
		return this.left_;
	}
	set left(e) {
		this.left_ = e, this.onUpdated();
	}
	get right() {
		return this.right_;
	}
	set right(e) {
		this.right_ = e, this.onUpdated();
	}
	get top() {
		return this.top_;
	}
	set top(e) {
		this.top_ = e, this.onUpdated();
	}
	get bottom() {
		return this.bottom_;
	}
	set bottom(e) {
		this.bottom_ = e, this.onUpdated();
	}
	get leftBottom() {
		return new y(this.left_, this.bottom_);
	}
	set leftBottom(e) {
		this.left_ = e.x, this.bottom = e.y;
	}
	get rightTop() {
		return new y(this.right_, this.top_);
	}
	set rightTop(e) {
		this.right_ = e.x, this.top_ = e.y;
	}
	get leftTop() {
		return new y(this.left_, this.top_);
	}
	set leftTop(e) {
		this.left_ = e.x, this.top_ = e.y;
	}
	get rightBottom() {
		return new y(this.right_, this.bottom_);
	}
	set rightBottom(e) {
		this.right_ = e.x, this.bottom = e.y;
	}
	onUpdated() {}
	static mkPP(t, n) {
		let r = new e({
			left: t.x,
			right: t.x,
			top: t.y,
			bottom: t.y
		});
		return r.add(n), r;
	}
	static rectangleOnPoint(t) {
		return new e({
			left: t.x,
			right: t.x,
			top: t.y,
			bottom: t.y
		});
	}
	static mkLeftBottomSize(t, n, r) {
		return new e({
			left: t,
			right: t + r.width,
			top: n + r.height,
			bottom: n
		});
	}
	static getRectangleOnCoords(t, n, r, i) {
		let a = new e({
			left: t,
			bottom: n,
			right: t,
			top: n
		});
		return a.add(new y(r, i)), a;
	}
	static mkOnPoints(t) {
		let n = e.mkEmpty();
		for (let e of t) n.add(e);
		return n;
	}
	static mkOnRectangles(t) {
		let n = e.mkEmpty();
		for (let e of t) n.addRecSelf(e);
		return n;
	}
	get width() {
		return this.right_ - this.left_;
	}
	set width(e) {
		let t = e / 2, n = (this.left_ + this.right_) / 2;
		this.left_ = n - t, this.right_ = n + t;
	}
	isEmpty() {
		return this.right < this.left;
	}
	setToEmpty() {
		this.left = 0, this.right = -1;
	}
	get height() {
		return this.top_ - this.bottom_;
	}
	set height(e) {
		let t = e / 2, n = (this.top_ + this.bottom_) / 2;
		this.top_ = n + t, this.bottom = n - t;
	}
	static rectangleOfTwo(t, n) {
		let r = new e({
			left: t.left_,
			right: t.right_,
			top: t.top_,
			bottom: t.bottom_
		});
		return r.addRecSelf(n), r;
	}
	containsWithPadding(e, t) {
		return this.left_ - t - u.distanceEpsilon <= e.x && e.x <= this.right_ + t + u.distanceEpsilon && this.bottom_ - t - u.distanceEpsilon <= e.y && e.y <= this.top_ + t + u.distanceEpsilon;
	}
	get area() {
		return (this.right_ - this.left_) * (this.top_ - this.bottom_);
	}
	add(e) {
		this.isEmpty() ? (this.left_ = this.right_ = e.x, this.top_ = this.bottom = e.y) : (this.left_ > e.x && (this.left_ = e.x), this.top_ < e.y && (this.top_ = e.y), this.right_ < e.x && (this.right_ = e.x), this.bottom_ > e.y && (this.bottom = e.y));
	}
	addRecSelf(e) {
		this.add(e.leftTop), this.add(e.rightBottom);
	}
	addRec(e) {
		let t = this.clone();
		return t.add(e.leftTop), t.add(e.rightBottom), t;
	}
	static translate(e, t) {
		let n = e.clone();
		return n.center = e.center.add(t), n;
	}
	static transform(t, n) {
		return e.mkPP(n.multiplyPoint(t.leftTop), n.multiplyPoint(t.rightBottom));
	}
	contains(e) {
		return this.containsWithPadding(e, 0);
	}
	containsRect(e) {
		return this.contains(e.leftTop) && this.contains(e.rightBottom);
	}
	containsRectWithPadding(e, t) {
		return this.containsWithPadding(e.leftTop, t) && this.containsWithPadding(e.rightBottom, t);
	}
	get diagonal() {
		return Math.sqrt(this.width * this.width + this.height * this.height);
	}
	padWidth(e) {
		this.left -= e, this.right += e;
	}
	padHeight(e) {
		this.top += e, this.bottom -= e;
	}
	pad(e) {
		e < -this.width / 2 && (e = -this.width / 2), e < -this.height / 2 && (e = -this.height / 2), this.padWidth(e), this.padHeight(e);
	}
	padEverywhere(e) {
		this.left -= e.left, this.right += e.right, this.bottom -= e.bottom, this.top += e.top;
	}
	static intersect(t, n) {
		return t.intersects(n) ? e.mkPP(new y(Math.max(t.left, n.left), Math.max(t.bottom, n.bottom)), new y(Math.min(t.right, n.right), Math.min(t.top, n.top))) : e.mkEmpty();
	}
	perimeter() {
		let e = new D();
		return e.addPoint(this.leftTop), e.addPoint(this.rightTop), e.addPoint(this.rightBottom), e.addPoint(this.leftBottom), e.closed = !0, e;
	}
	scaleAroundCenter(e) {
		this.width *= e, this.height *= e;
	}
	clone() {
		return new e({
			left: this.left,
			right: this.right,
			top: this.top,
			bottom: this.bottom
		});
	}
	get size() {
		return new me(this.width, this.height);
	}
	set size(e) {
		this.width = e.width, this.height = e.height;
	}
	static creatRectangleWithSize(t, n) {
		let r = t.width / 2, i = n.x - r, a = n.x + r, o = t.height / 2, s = n.y - o;
		return new e({
			left: i,
			right: a,
			top: n.y + o,
			bottom: s
		});
	}
	addPointWithSize(e, t) {
		let n = e.width / 2, r = e.height / 2;
		this.add(new y(t.x - n, t.y - r)), this.add(new y(t.x + n, t.y - r)), this.add(new y(t.x - n, t.y + r)), this.add(new y(t.x + n, t.y + r));
	}
}, k = class e {
	constructor() {
		this.previouisBezierCoefficient = .5, this.nextBezierCoefficient = .5, this.previousTangentCoefficient = 1 / 3, this.nextTangentCoefficient = 1 / 3;
	}
	static mkSiteP(t) {
		let n = new e();
		return n.point = t, n;
	}
	static mkSiteSP(t, n) {
		let r = new e();
		return r.point = n, r.prev = t, t.next = r, r;
	}
	static mkSiteSPS(t, n, r) {
		let i = new e();
		return i.prev = t, i.point = n, i.next = r, t.next = i, r.prev = i, i;
	}
	get turn() {
		return this.next == null || this.prev == null ? 0 : y.getTriangleOrientation(this.prev.point, this.point, this.next.point);
	}
	clone() {
		let t = new e();
		return t.previouisBezierCoefficient = this.previouisBezierCoefficient, t.point = this.point, t;
	}
}, he = class e {
	static mkFromPoints(t) {
		let n = null, r = null;
		for (let i of t) if (r == null) r = k.mkSiteP(i), n = new e(r);
		else {
			let e = k.mkSiteP(i);
			e.prev = r, r.next = e, r = e;
		}
		return n;
	}
	clone() {
		let t = this.headSite, n = null, r, i = null;
		for (; t != null;) r = t.clone(), r.prev = n, n == null ? i = r : n.next = r, t = t.next, n = r;
		return new e(i);
	}
	constructor(e) {
		this.headSite = e;
	}
	get lastSite() {
		let e = this.headSite;
		for (; e.next != null;) e = e.next;
		return e;
	}
	*[Symbol.iterator]() {
		let e = this.headSite;
		for (; e != null;) yield e.point, e = e.next;
	}
	createCurve() {
		let t = new E(), n = this.headSite;
		do {
			let r = E.findCorner(n);
			if (r == null) break;
			let i = e.createBezierSegOnSite(r.b);
			t.segs.length === 0 ? y.closeDistEps(n.point, i.start) || E.addLineSegment(t, n.point, i.start) : y.closeDistEps(t.end, i.start) || E.continueWithLineSegmentP(t, i.start), t.addSegment(i), n = r.b;
		} while (!0);
		return t.segs.length === 0 ? y.closeDistEps(n.point, n.next.point) ? t.segs.push(new ce(n.point, n.point.add(new y(5, 5)), n.point.add(new y(-5, 5)), (void 0).point)) : E.addLineSegment(t, n.point, n.next.point) : y.closeDistEps(t.end, n.next.point) || E.continueWithLineSegmentP(t, n.next.point), t;
	}
	static createBezierSegOnSite(e) {
		let t = e.previouisBezierCoefficient, n = e.nextBezierCoefficient, r = e.prev, i = e.next, a = r.point.mul(t).add(e.point.mul(1 - t)), o = i.point.mul(n).add(e.point.mul(1 - n)), s = a.mul(e.previousTangentCoefficient).add(e.point.mul(1 - e.previousTangentCoefficient)), c = o.mul(e.nextTangentCoefficient).add(e.point.mul(1 - e.nextTangentCoefficient));
		return ce.mkBezier([
			a,
			s,
			c,
			o
		]);
	}
}, ge = class e {
	get Elements() {
		return this.elements;
	}
	getElem(e, t) {
		return this.elements[e][t];
	}
	setElem(e, t, n) {
		this.elements[e][t] = n;
	}
	static Divide(e, t) {
		return e.multiply(t.inverse());
	}
	isIdentity() {
		return m(this.elements[0][0], 1) && m(this.elements[0][1], 0) && m(this.elements[0][2], 0) && m(this.elements[1][0], 0) && m(this.elements[1][1], 1) && m(this.elements[1][2], 0);
	}
	offset() {
		return new y(this.getElem(0, 2), this.getElem(1, 2));
	}
	static getIdentity() {
		return new e(1, 0, 0, 0, 1, 0);
	}
	constructor(e, t, n, r, i, a) {
		this.elements = [[
			e,
			t,
			n
		], [
			r,
			i,
			a
		]];
	}
	static rotation(t) {
		let n = Math.cos(t), r = Math.sin(t);
		return new e(n, -r, 0, r, n, 0);
	}
	static scaleAroundCenterTransformation(t, n, r) {
		let i = 1 - t, a = 1 - n;
		return new e(t, 0, i * r.x, 0, n, a * r.y);
	}
	multiplyPoint(e) {
		return new y(this.getElem(0, 0) * e.x + this.getElem(0, 1) * e.y + this.getElem(0, 2), this.getElem(1, 0) * e.x + this.getElem(1, 1) * e.y + this.getElem(1, 2));
	}
	multiply(t) {
		return t == null ? null : new e(this.getElem(0, 0) * t.getElem(0, 0) + this.getElem(0, 1) * t.getElem(1, 0), this.getElem(0, 0) * t.getElem(0, 1) + this.getElem(0, 1) * t.getElem(1, 1), this.getElem(0, 0) * t.getElem(0, 2) + this.getElem(0, 1) * t.getElem(1, 2) + this.getElem(0, 2), this.getElem(1, 0) * t.getElem(0, 0) + this.getElem(1, 1) * t.getElem(1, 0), this.getElem(1, 0) * t.getElem(0, 1) + this.getElem(1, 1) * t.getElem(1, 1), this.getElem(1, 0) * t.getElem(0, 2) + this.getElem(1, 1) * t.getElem(1, 2) + this.getElem(1, 2));
	}
	inverse() {
		let t = this.getElem(0, 0) * this.getElem(1, 1) - this.getElem(1, 0) * this.getElem(0, 1), n = this.getElem(1, 1) / t, r = -this.getElem(0, 1) / t, i = -this.getElem(1, 0) / t, a = this.getElem(0, 0) / t;
		return new e(n, r, -n * this.getElem(0, 2) - r * this.getElem(1, 2), i, a, -i * this.getElem(0, 2) - a * this.getElem(1, 2));
	}
}, _e = class e {
	static mkEllipse(e, t, n) {
		return w.mkFullEllipseNNP(e, t, n);
	}
	static createParallelogram(e, t, n) {
		let r = t / 2, i = e / 2, a = n.x, o = n.y, s = 80 * Math.PI / 180, c = r / Math.tan(s);
		return D.mkClosedFromPoints([
			new y(-i - c + a, -r + o),
			new y(i + a, -r + o),
			new y(i + a + c, r + o),
			new y(-i + a, r + o)
		]);
	}
	static createHexagon(e, t, n) {
		let r = t / 2, i = e / 2, a = n.x, o = n.y;
		return D.mkClosedFromPoints([
			new y(-i + a, -r + o),
			new y(i + a, -r + o),
			new y(i + (r + a), 0 + o),
			new y(i + a, r + o),
			new y(-i + a, r + o),
			new y(-(i - r) + a, 0 + o)
		]);
	}
	static createOctagon(t, n, r) {
		let i = t / 2, a = n / 2, o = Array(8);
		o[0] = new y(i + e.octagonPad * i, a - a * e.octagonPad), o[3] = new y(o[0].x * -1, o[0].y), o[4] = new y(o[3].x, o[3].y * -1), o[7] = new y(o[0].x, o[0].y * -1), o[1] = new y(i - i * e.octagonPad, a + a * e.octagonPad), o[2] = new y(o[1].x * -1, o[1].y), o[6] = new y(o[1].x, o[1].y * -1), o[5] = new y(o[2].x, o[2].y * -1);
		for (let e = 0; e < 8; e++) o[e] = o[e].add(r);
		return D.mkClosedFromPoints(o);
	}
	static createInvertedHouse(t, n, r) {
		let i = e.createHouse(t, n, r);
		return e.rotateCurveAroundCenterByDegree(i, r, 180);
	}
	static createHouse(e, t, n) {
		let r = e / 2, i = t / 2, a = n.x, o = n.y, s = new E();
		return E.addLineSegmentCNNNN(s, a - r, o - i, a + r, o - i), E.continueWithLineSegmentNN(s, a + r, o + i), E.continueWithLineSegmentNN(s, a, o + 2 * i), E.continueWithLineSegmentNN(s, a - r, o + i), E.closeCurve(s);
	}
	static mkDiamond(e, t, n) {
		let r = e, i = t, a = n.x, o = n.y, s = new E(), c = [
			new y(a, o - i),
			new y(a + r, o),
			new y(a, o + i),
			new y(a - r, o)
		];
		return s.addSegs([
			S.mkPP(c[0], c[1]),
			S.mkPP(c[1], c[2]),
			S.mkPP(c[2], c[3]),
			S.mkPP(c[3], c[0])
		]), s;
	}
	static rotateCurveAroundCenterByDegree(t, n, r) {
		return e.rotateCurveAroundCenterByRadian(t, n, r * Math.PI / 180);
	}
	static rotateCurveAroundCenterByRadian(e, t, n) {
		let r = Math.cos(n), i = Math.sin(n), a = new ge(1, 0, t.x, 0, 1, t.y).multiply(new ge(r, -i, 0, i, r, 0)).multiply(new ge(1, 0, -t.x, 0, 1, -t.y));
		return e.transform(a);
	}
	static mkCircle(e, t) {
		return w.mkCircle(e, t);
	}
	static createRectangle(e, t, n) {
		let r = e / 2, i = t / 2, a = n.x, o = n.y, s = new E(), c = [
			new y(a - r, o - i),
			new y(a + r, o - i),
			new y(a + r, o + i),
			new y(a - r, o + i)
		];
		return s.addSegs([
			S.mkPP(c[0], c[1]),
			S.mkPP(c[1], c[2]),
			S.mkPP(c[2], c[3]),
			S.mkPP(c[3], c[0])
		]), s;
	}
	static isRoundedRect(e) {
		if (!(e instanceof E)) return;
		let t = e.segs;
		if (t.length !== 8 && t.length !== 4) return;
		let n = t.length === 8, r, i;
		for (let e = 0; e < 4; e++) {
			let a = n ? 2 * e + 1 : e;
			if (e === 0) {
				if (!(t[a] instanceof w)) return;
				let e = t[a];
				r = e.aAxis.length, i = e.bAxis.length;
			} else {
				if (!(t[a] instanceof w)) return;
				let e = t[a];
				if (r !== e.aAxis.length || i !== e.bAxis.length) return;
			}
		}
		return {
			radX: r,
			radY: i
		};
	}
	static mkRectangleWithRoundedCorners(t, n, r, i, a = new y(0, 0)) {
		if (r === 0 || i === 0) return e.createRectangle(t, n, a);
		let o = new E(), s = t / 2;
		r > s / 2 && (r = s / 2);
		let c = n / 2;
		i > c / 2 && (i = c / 2);
		let l = a.x, u = a.y, d = s - r, f = c - i, p = u + c, m = u - c, h = l - s, g = l + s, _ = new y(r, 0), v = new y(0, i);
		return d > 0 && o.addSegment(S.mkPP(new y(l - d, m), new y(l + d, m))), o.addSegment(w.mkEllipse(1.5 * Math.PI, 2 * Math.PI, _, v, l + d, u - f)), f > 0 && o.addSegment(S.mkPP(new y(g, u - f), new y(g, u + f))), o.addSegment(w.mkEllipse(0, .5 * Math.PI, _, v, l + d, u + f)), d > 0 && o.addSegment(S.mkPP(new y(l + d, p), new y(l - d, p))), o.addSegment(w.mkEllipse(.5 * Math.PI, Math.PI, _, v, l - d, u + f)), f > 0 && o.addSegment(S.mkPP(new y(h, u + f), new y(h, u - f))), o.addSegment(w.mkEllipse(Math.PI, 1.5 * Math.PI, _, v, l - d, u - f)), o;
	}
};
_e.octagonPad = 1 / 4;
//#endregion
//#region node_modules/@msagl/core/dist/math/geometry/icurve.js
function ve(e) {
	return e.parEnd - e.parStart;
}
//#endregion
//#region node_modules/@msagl/core/dist/math/geometry/direction.js
var A;
(function(e) {
	e[e.None = 0] = "None", e[e.North = 1] = "North", e[e.East = 2] = "East", e[e.South = 4] = "South", e[e.West = 8] = "West";
})(A ||= {});
//#endregion
//#region node_modules/@msagl/core/dist/routing/rectilinear/PointComparer.js
var j = class e {
	static get DifferenceEpsilon() {
		return e.differenceEpsilon;
	}
	static EqualPP(t, n) {
		return e.Equal(t.x, n.x) && e.Equal(t.y, n.y);
	}
	static Equal(t, n) {
		return e.Compare(t, n) === 0;
	}
	static Compare(t, n) {
		let r = 0;
		return t + e.DifferenceEpsilon < n ? r = -1 : n + e.DifferenceEpsilon < t && (r = 1), r;
	}
	static ComparePP(t, n) {
		let r = e.Compare(t.x, n.x);
		return r === 0 && (r = e.Compare(t.y, n.y)), r;
	}
	static LessOrEqual(t, n) {
		let r = e.Compare(t, n);
		return r < 0 || r === 0;
	}
	static Less(t, n) {
		return e.Compare(t, n) < 0;
	}
	static GetDirections(e, t) {
		return M.DirectionFromPointToPoint(e, t);
	}
	static IsPureDirection(t, n) {
		return M.IsPureDirection(e.GetDirections(t, n));
	}
	static IsPureDirectionD(e) {
		return M.IsPureDirection(e);
	}
	static IsPureLower(t, n) {
		let r = e.GetDirections(t, n);
		return A.East === r || A.North === r;
	}
	static GetPureDirectionVV(t, n) {
		return e.GetDirections(t.point, n.point);
	}
};
j.differenceEpsilon = u.distanceEpsilon / 2;
//#endregion
//#region node_modules/@msagl/core/dist/math/geometry/compassVector.js
var M = class e {
	constructor(e) {
		this.Dir = e;
	}
	get Right() {
		return new e(e.RotateRight(this.Dir));
	}
	static RotateRight(e) {
		switch (e) {
			case A.North: return A.East;
			case A.East: return A.South;
			case A.South: return A.West;
			case A.West: return A.North;
			default: throw Error();
		}
	}
	static RotateLeft(e) {
		switch (e) {
			case A.North: return A.West;
			case A.West: return A.South;
			case A.South: return A.East;
			case A.East: return A.North;
			default: throw Error();
		}
	}
	static ToIndex(e) {
		switch (e) {
			case A.North: return 0;
			case A.East: return 1;
			case A.South: return 2;
			case A.West: return 3;
			default: throw Error();
		}
	}
	static VectorDirection(e) {
		let t = A.None;
		return e.x > j.DifferenceEpsilon ? t = A.East : e.x < -j.DifferenceEpsilon && (t = A.West), e.y > j.DifferenceEpsilon ? t |= A.North : e.y < -j.DifferenceEpsilon && (t |= A.South), t;
	}
	static VectorDirectionPP(e, t) {
		let n = A.None, r = t.x - e.x, i = t.y - e.y;
		return r > j.DifferenceEpsilon ? n = A.East : -r > j.DifferenceEpsilon && (n = A.West), i > j.DifferenceEpsilon ? n |= A.North : -i > j.DifferenceEpsilon && (n |= A.South), n;
	}
	static DirectionFromPointToPoint(t, n) {
		return e.VectorDirectionPP(t, n);
	}
	static OppositeDir(e) {
		switch (e) {
			case A.North: return A.South;
			case A.West: return A.East;
			case A.South: return A.North;
			case A.East: return A.West;
			default: return A.None;
		}
	}
	static IsPureDirection(e) {
		switch (e) {
			case A.North: return !0;
			case A.East: return !0;
			case A.South: return !0;
			case A.West: return !0;
			default: return !1;
		}
	}
	static IsPureDirectionPP(t, n) {
		return e.IsPureDirection(e.DirectionFromPointToPoint(t, n));
	}
	static DirectionsAreParallel(t, n) {
		return t === n || t === e.OppositeDir(n);
	}
	ToPoint() {
		let e = 0, t = 0;
		return (this.Dir & A.East) === A.East && e++, (this.Dir & A.North) === A.North && t++, (this.Dir & A.West) === A.West && e--, (this.Dir & A.South) === A.South && t--, new y(e, t);
	}
	static toPoint(t) {
		return new e(t).ToPoint();
	}
	static negate(t) {
		return new e(e.OppositeDir(t.Dir));
	}
}, ye = class e extends c {
	clone() {
		let t = new e(null, null);
		return t.isPositioned = this.isPositioned, t._boundingBox = this._boundingBox.clone(), t.attachmentSegmentEnd = this.attachmentSegmentEnd, t.attachmentSegmentStart = this.attachmentSegmentStart, t;
	}
	get isPositioned() {
		return this._isPositioned;
	}
	set isPositioned(e) {
		this._isPositioned = e;
	}
	constructor(e, t) {
		super(e), this._isPositioned = !1, t && (this.boundingBox = O.mkPP(new y(0, 0), new y(t.width, t.height)));
	}
	get boundingBox() {
		return this._boundingBox;
	}
	set boundingBox(e) {
		this._boundingBox = e;
	}
	setBoundingBox(e) {
		this.isPositioned = !0, this._boundingBox = e;
	}
	get width() {
		return this.boundingBox.width;
	}
	set width(e) {
		this.boundingBox.width = e;
	}
	get height() {
		return this.boundingBox.height;
	}
	set height(e) {
		this.boundingBox.height = e;
	}
	get center() {
		return this.boundingBox.center;
	}
	set center(e) {
		this.boundingBox.center = e;
	}
	translate(e) {
		this.isPositioned && (this.center = this.center.add(e));
	}
	transform(e) {
		this.isPositioned && (this.center = e.multiplyPoint(this.center));
	}
	positionCenter(e) {
		this.boundingBox.center = e, this.isPositioned = !0;
	}
}, be = class e extends c {
	*getSmoothPolyPoints() {
		yield this.source.center, this.curve instanceof E ? yield* this.getCurvePoints(this.curve) : this.curve instanceof S ? (yield this.curve.start, yield this.curve.end) : this.curve instanceof w ? (yield this.curve.start, yield this.curve.value((this.curve.parStart + this.curve.parEnd) / .5), yield this.curve.end) : this.curve instanceof ce && (yield this.curve.start, yield this.curve.value(.25), yield this.curve.value(.75), yield this.curve.end), yield this.target.center;
	}
	*getCurvePoints(e) {
		for (let t of e.segs) if (yield t.start, t instanceof ce) {
			let e = xe(t);
			e && (yield e);
		}
		yield e.end;
	}
	static getGeom(e) {
		return c.getGeom(e);
	}
	clone() {
		let t = new e(null);
		return this.smoothedPolyline && (t.smoothedPolyline = this.smoothedPolyline.clone()), t.curve = this.curve.clone(), this.sourceArrowhead != null && (t.sourceArrowhead = this.sourceArrowhead.clone()), this.targetArrowhead != null && (t.targetArrowhead = this.targetArrowhead.clone()), t;
	}
	get label() {
		return this.edge != null && this.edge.label != null ? c.getGeom(this.edge.label) : null;
	}
	set label(e) {
		this.edge.label.setAttr(s.GeomObjectIndex, e);
	}
	RaiseLayoutChangeEvent(e) {
		this.edge.raiseEvents(e);
	}
	requireRouting() {
		this.curve = null, this.smoothedPolyline = null;
	}
	translate(e) {
		if (!(e.x === 0 && e.y === 0)) {
			if (this.curve != null && this.curve.translate(e), this.smoothedPolyline != null) for (let t = this.smoothedPolyline.headSite, n = this.smoothedPolyline.headSite; t != null; t = t.next, n = n.next) t.point = n.point.add(e);
			if (this.sourceArrowhead != null && this.sourceArrowhead.tipPosition && (this.sourceArrowhead.tipPosition = this.sourceArrowhead.tipPosition.add(e)), this.targetArrowhead != null && this.targetArrowhead.tipPosition && (this.targetArrowhead.tipPosition = this.targetArrowhead.tipPosition.add(e)), this.edge.label) {
				let t = ye.getGeom(this.edge.label);
				t && t.translate(e);
			}
		}
	}
	GetMaxArrowheadLength() {
		let e = 0;
		return this.sourceArrowhead != null && (e = this.sourceArrowhead.length), this.targetArrowhead != null && this.targetArrowhead.length > e ? this.targetArrowhead.length : e;
	}
	transform(e) {
		if (this.curve != null) {
			if (this.curve = this.curve.transform(e), this.smoothedPolyline != null) for (let t = this.smoothedPolyline.headSite, n = this.smoothedPolyline.headSite; t != null; t = t.next, n = n.next) t.point = e.multiplyPoint(t.point);
			this.sourceArrowhead != null && (this.sourceArrowhead.tipPosition = e.multiplyPoint(this.sourceArrowhead.tipPosition)), this.targetArrowhead != null && (this.targetArrowhead.tipPosition = e.multiplyPoint(this.targetArrowhead.tipPosition));
		}
	}
	get edge() {
		return this.entity;
	}
	get source() {
		return c.getGeom(this.edge.source);
	}
	*sourceArrowheadPoints(e) {
		if (this.sourceArrowhead == null) return;
		yield this.sourceArrowhead.tipPosition;
		let t = this.sourceArrowhead.tipPosition.sub(this.curve.start);
		t = t.rotate90Cw().mul(Math.tan(e * .5 * (Math.PI / 180))), yield t.add(this.curve.start), yield this.curve.start.sub(t);
	}
	*targetArrowheadPoints(e) {
		if (this.targetArrowhead == null) return;
		yield this.targetArrowhead.tipPosition;
		let t = this.targetArrowhead.tipPosition.sub(this.curve.end);
		t = t.rotate90Cw().mul(Math.tan(e * .5 * (Math.PI / 180))), yield t.add(this.curve.end), yield this.curve.end.sub(t);
	}
	get boundingBox() {
		let e = O.mkEmpty();
		if (this.smoothedPolyline != null) for (let t of this.smoothedPolyline) e.add(t);
		this.curve != null && e.addRecSelf(this.curve.boundingBox);
		for (let t of this.sourceArrowheadPoints(25)) e.add(t);
		for (let t of this.targetArrowheadPoints(25)) e.add(t);
		this.label && e.addRecSelf(this.label.boundingBox);
		let t = this.lineWidth;
		return e.left -= t, e.top += t, e.right += t, e.bottom -= t, e;
	}
	isInterGraphEdge() {
		return this.edge.isInterGraphEdge();
	}
	get target() {
		return c.getGeom(this.edge.target);
	}
	constructor(e) {
		super(e), this.lineWidth = 1;
	}
	toString() {
		return this.source.toString() + "->" + this.target;
	}
	static RouteSelfEdge(e, t, n) {
		let r = e.boundingBox.width, i = e.boundingBox.height, a = e.boundingBox.center, o = new y(a.x - r / 4, a.y), s = new y(a.x - r / 4, a.y - i / 2 - t), c = new y(a.x + r / 4, a.y - i / 2 - t), l = new y(a.x + r / 4, a.y);
		return n.smoothedPolyline = he.mkFromPoints([
			o,
			s,
			c,
			l
		]), n.smoothedPolyline.createCurve();
	}
	underCollapsedGraph() {
		return this.source.underCollapsedGraph() || this.target.underCollapsedGraph();
	}
	EdgeToAncestor() {
		return this.edge.EdgeToAncestor();
	}
};
function xe(e) {
	return y.lineLineIntersection(e.b[0], e.b[1], e.b[2], e.b[3]);
}
//#endregion
//#region node_modules/@msagl/core/dist/math/geometry/RTree/hitTestBehavior.js
var N = (/* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var n = t();
	e.Stack = class extends n.LinkedList {
		constructor(...e) {
			super(...e);
		}
		get top() {
			return this.head;
		}
		get size() {
			return this.length;
		}
		push(e) {
			this.prepend(e);
		}
		pop() {
			return this.removeHead();
		}
	};
})))(), P;
(function(e) {
	e[e.Continue = 0] = "Continue", e[e.Stop = 1] = "Stop";
})(P ||= {});
//#endregion
//#region node_modules/@msagl/core/dist/math/geometry/RTree/rectangleNode.js
function Se(e, t, n, r, i, a) {
	for (let o = 0; o < e.length; o++) {
		if (o === t || o === n) continue;
		let s = a.box0.add_rect(e[o].irect), c = s.area - a.box0.area, l = a.box1.add_rect(e[o].irect), u = l.area - a.box1.area;
		r.length * 2 < i.length ? (r.push(e[o]), a.box0 = s) : i.length * 2 < r.length ? (i.push(e[o]), a.box1 = l) : c < u ? (r.push(e[o]), a.box0 = s) : u < c ? (i.push(e[o]), a.box1 = l) : a.box0.area < a.box1.area ? (r.push(e[o]), a.box0 = s) : (i.push(e[o]), a.box1 = l);
	}
}
function F(e) {
	if (e.length === 0) return null;
	if (e.length === 1) return e[0];
	let t = {
		b0: e[0].irect,
		seed0: 1
	}, n = we(e, t), r = [], i = [];
	r.push(e[t.seed0]), i.push(e[n]);
	let a = {
		box0: e[t.seed0].irect,
		box1: e[n].irect
	};
	Se(e, t.seed0, n, r, i, a);
	let o = Ee(e.length);
	return o.irect = a.box0.add_rect(a.box1), o.Left = F(r), o.Right = F(i), o;
}
function Ce(e, t) {
	return e.add_rect(t).area;
}
function we(e, t) {
	let n = Ce(t.b0, e[t.seed0].irect);
	for (let r = 2; r < e.length; r++) {
		let i = Ce(t.b0, e[r].irect);
		i > n && (t.seed0 = r, n = i);
	}
	let r;
	for (let n = 0; n < e.length; n++) if (n !== t.seed0) {
		r = n;
		break;
	}
	n = e[t.seed0].irect.add_rect(e[r].irect).area;
	for (let i = 0; i < e.length; i++) {
		if (i === t.seed0) continue;
		let a = e[t.seed0].irect.add_rect(e[i].irect).area;
		a > n && (r = i, n = a);
	}
	return r;
}
function Te(e, t) {
	return e == null || t == null ? null : F(Array.from(e).map((e) => I(e, t(e))));
}
function Ee(e) {
	let t = new Oe();
	return t.Count = e, t;
}
function I(e, t) {
	let n = new Oe();
	return n.UserData = e, n.irect = t, n.Count = 1, n;
}
function De(e, t, n) {
	return e.irect.intersects_rect(n) ? t(e.UserData) === P.Continue && (e.Left == null || De(e.Left, t, n) === P.Continue && De(e.Right, t, n) === P.Continue) ? P.Continue : P.Stop : P.Continue;
}
var Oe = class {
	toString() {
		return this.IsLeaf ? this.Count.toString() + " " + this.UserData : this.Count.toString();
	}
	get IsLeaf() {
		return this.left == null;
	}
	get Left() {
		return this.left;
	}
	set Left(e) {
		this.left != null && this.left.Parent === this && (this.left.Parent = null), this.left = e, this.left != null && (this.left.Parent = this);
	}
	get Right() {
		return this.right;
	}
	set Right(e) {
		this.right != null && this.right.Parent === this && (this.right.Parent = null), this.right = e, this.right != null && (this.right.Parent = this);
	}
	get IsLeftChild() {
		return this === this.Parent.Left;
	}
	FirstIntersectedNode(e) {
		return e.intersects_rect(this.irect) ? this.IsLeaf ? this : this.Left.FirstIntersectedNode(e) ?? this.Right.FirstIntersectedNode(e) : null;
	}
	FirstHitNodeWithPredicate(e, t) {
		return this.irect.contains_point(e) ? this.IsLeaf ? t(e, this.UserData) === P.Stop ? this : null : this.Left.FirstHitNodeWithPredicate(e, t) ?? this.Right.FirstHitNodeWithPredicate(e, t) : null;
	}
	FirstHitByRectWithPredicate(e, t) {
		return this.irect.intersects_rect(e) ? this.IsLeaf ? t(this.UserData) === P.Stop ? this : null : this.Left.FirstHitByRectWithPredicate(e, t) ?? this.Right.FirstHitByRectWithPredicate(e, t) : null;
	}
	FirstHitNode(e) {
		return this.irect.contains_point(e) ? this.IsLeaf ? this : this.Left.FirstHitNode(e) ?? this.Right.FirstHitNode(e) : null;
	}
	*AllHitItems(e, t = null) {
		let n = new N.Stack();
		for (n.push(this); n.size > 0;) {
			let r = n.pop();
			r.irect.intersects_rect(e) && (r.IsLeaf ? (t == null || t(r.UserData)) && (yield r.UserData) : (n.push(r.left), n.push(r.right)));
		}
	}
	*AllHitItems_(e) {
		let t = new N.Stack();
		for (t.push(this); t.size > 0;) {
			let n = t.pop();
			n.irect.contains_point(e) && (n.IsLeaf ? yield n.UserData : (t.push(n.left), t.push(n.right)));
		}
	}
	VisitTree(e, t) {
		De(this, e, t);
	}
	Clone() {
		let e = Ee(this.Count);
		return e.UserData = this.UserData, e.irect = this.irect, this.Left != null && (e.Left = this.Left.Clone()), this.Right != null && (e.Right = this.Right.Clone()), e;
	}
	*GetNodeItemsIntersectingRectangle(e) {
		for (let t of this.GetLeafRectangleNodesIntersectingRectangle(e)) yield t.UserData;
	}
	*GetLeafRectangleNodesIntersectingRectangle(e) {
		let t = new N.Stack();
		for (t.push(this); t.size > 0;) {
			let n = t.pop();
			n.irect.intersects_rect(e) && (n.IsLeaf ? yield n : (t.push(n.left), t.push(n.right)));
		}
	}
	*GetAllLeaves() {
		for (let e of this.GetAllLeafNodes()) yield e.UserData;
	}
	*GetAllLeafNodes() {
		for (let e of this.EnumRectangleNodes(!0)) yield e;
	}
	*EnumRectangleNodes(e) {
		let t = new N.Stack();
		for (t.push(this); t.size > 0;) {
			let n = t.pop();
			(n.IsLeaf || !e) && (yield n), n.IsLeaf || (t.push(n.left), t.push(n.right));
		}
	}
	TraverseHierarchy(e, t) {
		t(e), e.Left != null && this.TraverseHierarchy(e.Left, t), e.Right != null && this.TraverseHierarchy(e.Right, t);
	}
}, L = class {
	constructor(e, t) {
		p(e, t) < 0 ? (this._first = e, this._second = t) : (this._first = t, this._second = e);
	}
	get first() {
		return this._first;
	}
	get second() {
		return this._second;
	}
	get Length() {
		return v(this._first, this._second);
	}
	CompareTo(e) {
		let t = p(this._first, e._first);
		return t === 0 ? p(this._second, e._second) : t;
	}
	static equal(e, t) {
		return e._first.equal(t._first) && e._second.equal(t._second);
	}
	toString() {
		return this._first + (" " + this._second);
	}
}, R = class e {
	delete(e) {
		return this.deletexy(e.x, e.y);
	}
	clear() {
		this.mapOfSets.clear(), this.size_ = 0;
	}
	get size() {
		return this.size_;
	}
	static mk(t) {
		let n = new e();
		for (let e of t) n.add(e);
		return n;
	}
	addxy(e, t) {
		let n = this.mapOfSets.get(e);
		n ?? this.mapOfSets.set(e, n = /* @__PURE__ */ new Set()), n.has(t) || this.size_++, n.add(t);
	}
	add(e) {
		return this.addxy(e.x, e.y), this;
	}
	deletexy(e, t) {
		let n = this.mapOfSets.get(e);
		return n != null && n.delete(t) ? (this.size_--, !0) : !1;
	}
	hasxy(e, t) {
		return this.mapOfSets.has(e) && this.mapOfSets.get(e).has(t);
	}
	has(e) {
		return this.hasxy(e.x, e.y);
	}
	constructor() {
		this.size_ = 0, this.mapOfSets = /* @__PURE__ */ new Map();
	}
	forEach(e, t) {
		for (let n of this) e(n, n, t);
	}
	*entries() {
		for (let e of this) yield [e, e];
	}
	keys() {
		return this.values();
	}
	*values() {
		for (let e of this.mapOfSets) for (let t of e[1]) yield new y(e[0], t);
	}
	[Symbol.iterator]() {
		return this.values();
	}
};
//#endregion
//#region node_modules/@msagl/core/dist/utils/setOperations.js
function ke(e, t) {
	let n = /* @__PURE__ */ new Set();
	for (let r of e) t.has(r) || n.add(r);
	return n;
}
function Ae(e, t) {
	let n = new R();
	for (let r of e) t.has(r) || n.add(r);
	return n;
}
function je(e, t) {
	let n = new Set(e);
	for (let e of t) n.add(e);
	return n;
}
function Me(e, t) {
	for (let n of t) e.push(n);
}
function Ne(e, t) {
	let n = /* @__PURE__ */ new Set();
	if (e.size < t.size) for (let r of e) t.has(r) && n.add(r);
	else for (let r of t) e.has(r) && n.add(r);
	return n;
}
function Pe(e) {
	if (e.length === 0) return /* @__PURE__ */ new Set();
	let t = e[0];
	for (let n = 1; n < e.length; n++) t = Ne(t, e[n]);
	return t;
}
function Fe(e, t) {
	for (let n of t) e.add(n);
}
function Ie(e, t) {
	if (e.size !== t.size) return !1;
	for (let n of e) if (!t.has(n)) return !1;
	return !0;
}
function Le(e, t) {
	let n = [];
	for (let r of e) for (let e of t(r)) n.push(e);
	return n;
}
function Re(e, t, n) {
	let r = e.get(t);
	r || (r = /* @__PURE__ */ new Set(), e.set(t, r)), r.add(n);
}
function ze(e, t, n) {
	let r = e.get(t);
	r || (r = [], e.set(t, r)), r.push(n);
}
function Be(e, t, n) {
	let r = e.get(t);
	r || (r = /* @__PURE__ */ new Set(), e.set(t, r)), r.add(n);
}
function Ve(e, t, n) {
	Be(e, new L(t[0], t[1]), n);
}
function He(e, t, n) {
	let r = e.get(t);
	r && r.delete(n);
}
function Ue(e, t, n) {
	He(e, new L(t[0], t[1]), n);
}
//#endregion
//#region node_modules/@msagl/core/dist/utils/assert.js
var z = class {
	static assert(e, t = null) {
		if (!e) throw t == null ? Error("condition does not hold") : (console.log(t), Error(t));
	}
}, We;
(function(e) {
	e[e.None = 0] = "None", e[e.FromAncestor = 1] = "FromAncestor", e[e.ToAncestor = 2] = "ToAncestor";
})(We ||= {});
var Ge = class extends a {
	constructor(e, t) {
		super(), this.source = e, this.target = t, e === t ? e.selfEdges.add(this) : (e.outEdges.add(this), t.inEdges.add(this));
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
		return this.source instanceof Je && this.target.isDescendantOf(this.source) ? We.FromAncestor : this.target instanceof Je && this.source.isDescendantOf(this.target) ? We.ToAncestor : We.None;
	}
}, Ke = class extends a {
	removeOutEdge(e) {
		this.outEdges.delete(e);
	}
	removeInEdge(e) {
		this.inEdges.delete(e);
	}
	get id() {
		return this._id;
	}
	set id(e) {
		this._id = e;
	}
	toString() {
		return this.id;
	}
	constructor(e) {
		super(), this.inEdges = /* @__PURE__ */ new Set(), this.outEdges = /* @__PURE__ */ new Set(), this.selfEdges = /* @__PURE__ */ new Set(), this.id = e;
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
}, qe = class {
	constructor() {
		this.nodeMap = /* @__PURE__ */ new Map();
	}
	remove(e) {
		this.nodeMap.delete(e.id);
	}
	get size() {
		return this.nodeMap.size;
	}
	*nodes_() {
		for (let e of this.nodeMap.values()) yield e;
	}
	*graphs_() {
		for (let e of this.nodes_()) e instanceof Je && (yield e);
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
}, Je = class e extends Ke {
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
		let e = /* @__PURE__ */ new Set(), t = new i.Queue();
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
	setEdge(e, t) {
		let n = this.nodeCollection.findShallow(e);
		if (n == null) return;
		let r = this.nodeCollection.findShallow(t);
		if (r != null) return new Ge(n, r);
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
	constructor(e = "__graph__") {
		super(e), this.nodeCollection = new qe();
	}
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
		return z.assert(this.findNodeRecursive(e.id) == null), e.parent = this, this.nodeCollection.addNode(e), e;
	}
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
};
function* Ye(e) {
	let t = /* @__PURE__ */ new Set(), n = new i.Queue();
	for (let i of e.shallowNodes) {
		if (t.has(i)) continue;
		let e = [];
		for (a(i, n, t); n.length > 0;) {
			let i = n.dequeue();
			e.push(i);
			for (let e of r(i)) a(e, n, t);
		}
		yield e;
	}
	function* r(e) {
		for (let t of e.outEdges) yield t.target;
		for (let t of e.inEdges) yield t.source;
	}
	function a(e, t, n) {
		n.has(e) || (t.enqueue(e), n.add(e));
	}
}
function Xe(e, t) {
	let n = /* @__PURE__ */ new Map(), r = e.nodeCountDeep, i = 1 / r;
	for (let t of e.nodesBreadthFirst) n.set(t, i);
	for (let a = 0; a < 50; a++) {
		i = (1 - t) / r;
		let a = /* @__PURE__ */ new Map();
		for (let t of e.nodesBreadthFirst) a.set(t, i);
		for (let r of e.nodesBreadthFirst) {
			let e = a.get(r);
			for (let i of r.inEdges) {
				let r = i.source;
				e += t * (n.get(r) / r.outDegree);
			}
			a.set(r, e);
		}
		n = a;
	}
	return n;
}
function Ze(e, t) {
	return t.has(e.source) && t.has(e.target);
}
//#endregion
//#region node_modules/@msagl/core/dist/layout/core/geomNode.js
var Qe = class e extends c {
	clone() {
		let t = new e(null);
		return this.boundaryCurve && (t.boundaryCurve = this.boundaryCurve.clone()), t;
	}
	translate(e) {
		e.x === 0 && e.y === 0 || this.boundaryCurve.translate(e);
	}
	toJSON() {
		return { boundaryCurve: this.boundaryCurve };
	}
	get node() {
		return this.entity;
	}
	get boundaryCurve() {
		return this._boundaryCurve;
	}
	set boundaryCurve(t) {
		t != null && t.boundingBox && (t.boundingBox.height < e.minHeight || t.boundingBox.width < e.minWidth) && (t = _e.mkCircle(e.minWidth, t.boundingBox.center)), this._boundaryCurve = t;
	}
	get id() {
		return this.node.id;
	}
	toString() {
		return this.id;
	}
	static mkNode(t, n) {
		let r = new e(n);
		return r.boundaryCurve = t, r;
	}
	get center() {
		return this.boundaryCurve.boundingBox.center;
	}
	set center(e) {
		let t = e.sub(this.center);
		this.boundaryCurve.translate(t);
	}
	fitBoundaryCurveToTarget(e) {
		if (this.boundaryCurve != null) {
			let t = _e.isRoundedRect(this.boundaryCurve);
			if (t == null) {
				let t = e.width / this.boundaryCurve.boundingBox.width, n = e.height / this.boundaryCurve.boundingBox.height;
				this.boundaryCurve = this.boundaryCurve.scaleFromOrigin(t, n), this.boundaryCurve.translate(e.center.sub(this.boundaryCurve.boundingBox.center));
			} else this.boundaryCurve = _e.mkRectangleWithRoundedCorners(e.width, e.height, t.radX, t.radY, e.center);
		}
	}
	static getGeom(e) {
		return e.getAttr(s.GeomObjectIndex);
	}
	*inEdges() {
		for (let e of this.node.inEdges) yield c.getGeom(e);
	}
	*outEdges() {
		for (let e of this.node.outEdges) yield c.getGeom(e);
	}
	*selfEdges() {
		for (let e of this.node.selfEdges) yield c.getGeom(e);
	}
	get boundingBox() {
		return this.boundaryCurve ? this.boundaryCurve.boundingBox : null;
	}
	set boundingBox(e) {
		this.boundaryCurve && (Math.abs(e.width - this.width) < 1e-4 && Math.abs(e.height - this.height) < 1e-4 ? this.center = e.center : this.fitBoundaryCurveToTarget(e));
	}
	get width() {
		return this.boundaryCurve.boundingBox.width;
	}
	get height() {
		return this.boundaryCurve.boundingBox.height;
	}
	transform(e) {
		this.boundaryCurve != null && (this.boundaryCurve = this.boundaryCurve.transform(e));
	}
	underCollapsedGraph() {
		let e = this.node.parent;
		if (e == null) return !1;
		let t = c.getGeom(e);
		return t == null ? !1 : t.isCollapsed ? !0 : t.underCollapsedGraph();
	}
	*getAncestors() {
		for (let e of this.node.getAncestors()) yield c.getGeom(e);
	}
};
Qe.minHeight = 2, Qe.minWidth = 3;
//#endregion
//#region node_modules/@msagl/core/dist/utils/algorithm.js
var B = class {
	ProgressStep() {}
	constructor(e) {
		this.cancelToken = e;
	}
}, $e = class {};
$e.GoldenRatio = (1 + Math.sqrt(5)) / 2, $e.GoldenRatioRemainder = 2 - $e.GoldenRatio;
//#endregion
//#region node_modules/@msagl/core/dist/math/geometry/rectanglePacking/OptimalPacking.js
var et = class e extends B {
	constructor(e, t) {
		super(null), this.desiredAspectRatio = 1.2, this.bestPacking = null, this.cachedCosts = /* @__PURE__ */ new Map(), this.rectangles = e, this.desiredAspectRatio = t;
	}
	get PackedWidth() {
		return this.bestPacking == null ? 0 : this.bestPacking.PackedWidth;
	}
	get PackedHeight() {
		return this.bestPacking == null ? 0 : this.bestPacking.PackedHeight;
	}
	Pack(t, n, r) {
		let i = e.GetGoldenSectionStep(t, n), a = Math.max(r / 10, (n - t) / e.MaxSteps);
		n += a, this.bestPackingCost = Number.MAX_VALUE, this.rectangles.length === 1 ? this.PackLimit(t) : this.rectangles.length === 2 ? (this.PackLimit(t), this.PackLimit(n)) : this.rectangles.length > 2 && e.GoldenSectionSearch((e) => this.PackLimit(e), t, i, n, a);
		let o = this.bestPacking.getRects();
		for (let e = 0; e < this.rectangles.length; e++) this.rectangles[e] = o[e];
	}
	PackLimit(e) {
		let t = this.cachedCosts.get(e);
		if (t == null) {
			let n = this.createPacking(this.rectangles, e);
			n.run(), this.cachedCosts.set(e, t = Math.abs(n.PackedAspectRatio - this.desiredAspectRatio)), t < this.bestPackingCost && (this.bestPackingCost = t, this.bestPacking = n);
		}
		return t;
	}
	static GoldenSectionSearch(t, n, r, i, a) {
		if (Math.abs(n - i) < a) return t(n) < t(i) ? n : i;
		let o = e.GetGoldenSectionStep(r, i), s = t(r), c = t(o), l = () => e.GoldenSectionSearch(t, o, r, n, a), u = () => e.GoldenSectionSearch(t, r, o, i, a);
		if (c < s) return u();
		if (c > s) return l();
		let d = u(), f = l();
		return t(f) < t(d) ? f : d;
	}
	static GetGoldenSectionStep(e, t) {
		return e < t ? e + $e.GoldenRatioRemainder * (t - e) : e - $e.GoldenRatioRemainder * (e - t);
	}
};
et.MaxSteps = 1e3;
//#endregion
//#region node_modules/@msagl/core/dist/math/geometry/rectanglePacking/Packing.js
var tt = class extends B {
	get PackedWidth() {
		return this.packedWidth;
	}
	set PackedWidth(e) {
		this.packedWidth = e;
	}
	get PackedHeight() {
		return this.packedHeight;
	}
	set PackedHeight(e) {
		this.packedHeight = e;
	}
	get PackedAspectRatio() {
		return this.PackedWidth / this.PackedHeight;
	}
	getRects() {
		let e = [];
		for (let [t, n] of this.rectsToCenters) t.center = n, e.push(t);
		return e;
	}
}, nt = class e extends tt {
	constructor(t, n, r = !1) {
		super(null), this.rectsToCenters = /* @__PURE__ */ new Map(), this.rectanglesByDescendingHeight = r ? t : e.SortRectangles(t), this.wrapWidth = n;
	}
	static SortRectangles(e) {
		return e.sort((e, t) => t.height - e.height), e;
	}
	run() {
		this.Pack();
	}
	Pack() {
		this.PackedWidth = 0, this.PackedHeight = 0;
		let e = new N.Stack(), t = !1, n = 0, r = 0, i = 0, a = this.rectanglesByDescendingHeight;
		for (let o = 0; t || o < a.length;) {
			let s = a[o], c = e.length > 0 ? e.top : null;
			if (c == null || c.right + s.width <= this.wrapWidth && n + s.height <= c.top) {
				let a = new y(c ? c.right : 0, n).add(new y(s.width / 2, s.height / 2));
				s.center = a, this.rectsToCenters.set(s, a), r = Math.max(r, s.right), i = Math.max(i, s.top), e.push(s), t = !1;
			} else n = c.top, e.pop(), t = !0;
			t || o++;
		}
		this.PackedWidth = r, this.PackedHeight = i;
	}
}, rt = class extends et {
	constructor(e, t) {
		super(nt.SortRectangles(e), t), this.createPacking = (e, t) => new nt(e, t, !0);
	}
	run() {
		let e = Number.MAX_VALUE, t = 0, n = 0;
		for (let r of this.rectangles) {
			let i = r.width;
			n += i, e = Math.min(e, i), t = Math.max(t, i);
		}
		this.Pack(t, n, e);
	}
};
//#endregion
//#region node_modules/@msagl/core/dist/math/geometry/RTree/rTree.js
function it(e) {
	return new dt(F(e.map(([e, t]) => I(t, e))));
}
function at(e, t) {
	e.UserData = t.UserData, e.Left = t.Left, e.Right = t.Right, e.Count--, e.irect = t.irect;
}
function ot(e) {
	for (let t = e.Parent; t != null; t = t.Parent) t.Count--, t.irect = t.Left.irect.add_rect(t.Right.irect);
}
function st(e, t) {
	let n = [];
	for (let r of e.GetAllLeafNodes()) r !== t && n.push(r);
	let r = F(n);
	e.Count = r.Count, e.Left = r.Left, e.Right = r.Right, e.irect = r.Left.irect.add_rect(r.Right.irect);
}
function ct(e) {
	for (let t = e.Parent; t != null; t = t.Parent) if (!lt(t)) return t;
	return null;
}
function lt(e) {
	return 2 * e.Left.Count >= e.Right.Count && 2 * e.Right.Count >= e.Left.Count;
}
function ut(e, t, n, r) {
	return e.irect.intersects_rect(t) ? e.IsLeaf ? r(e.UserData) ? --n.bound !== 0 : !0 : ut(e.Left, t, n, r) && ut(e.Right, t, n, r) : !0;
}
var dt = class {
	clear() {
		this.RootNode = null;
	}
	NumberOfIntersectedIsLessThanBound(e, t, n) {
		return ut(this._rootNode, e, { bound: t }, n);
	}
	get RootNode() {
		return this._rootNode;
	}
	set RootNode(e) {
		this._rootNode = e;
	}
	constructor(e) {
		this._rootNode = e;
	}
	*GetAllLeaves() {
		if (this._rootNode != null && this.Count > 0) for (let e of this._rootNode.GetAllLeaves()) yield e;
	}
	get Count() {
		return this._rootNode == null ? 0 : this._rootNode.Count;
	}
	Add(e, t) {
		this.AddNode(I(t, e));
	}
	AddNode(e) {
		this._rootNode == null ? this._rootNode = e : this.Count <= 2 ? this._rootNode = F(Array.from(this._rootNode.GetAllLeafNodes()).concat([e])) : this.AddNodeToTreeRecursive(e, this._rootNode);
	}
	Rebuild() {
		this._rootNode = F(Array.from(this._rootNode.GetAllLeafNodes()));
	}
	AddNodeToTreeRecursive(e, t) {
		if (t.IsLeaf) t.Left = I(t.UserData, t.irect), t.Right = e, t.Count = 2;
		else {
			t.Count++;
			let n, r;
			if (2 * t.Left.Count < t.Right.Count) this.AddNodeToTreeRecursive(e, t.Left), t.Left.irect = t.Left.irect.add_rect(e.irect);
			else if (2 * t.Right.Count < t.Left.Count) this.AddNodeToTreeRecursive(e, t.Right), t.Right.irect = t.Right.irect.add_rect(e.irect);
			else {
				n = t.Left.irect.add_rect(e.irect);
				let i = n.area - t.Left.irect.area;
				r = t.Right.irect.add_rect(e.irect);
				let a = r.area - t.Right.irect.area;
				i < a ? (this.AddNodeToTreeRecursive(e, t.Left), t.Left.irect = n) : i > a ? (this.AddNodeToTreeRecursive(e, t.Right), t.Right.irect = r) : n.area < r.area ? (this.AddNodeToTreeRecursive(e, t.Left), t.Left.irect = n) : (this.AddNodeToTreeRecursive(e, t.Right), t.Right.irect = r);
			}
		}
		t.irect = t.Left.irect.add_rect(t.Right.irect);
	}
	GetAllIntersecting(e) {
		return this._rootNode == null || this.Count === 0 ? [] : Array.from(this._rootNode.GetNodeItemsIntersectingRectangle(e));
	}
	OneIntersecting(e) {
		if (this._rootNode == null || this.Count === 0) return;
		let t = this._rootNode.FirstIntersectedNode(e);
		if (t != null) return { intersectedLeaf: t.UserData };
	}
	GetAllLeavesIntersectingRectangle(e) {
		return this._rootNode == null || this.Count === 0 ? [] : this._rootNode.GetLeafRectangleNodesIntersectingRectangle(e);
	}
	IsIntersecting(e) {
		if (this._rootNode == null || this.Count === 0) return !1;
		for (let t of this._rootNode.GetNodeItemsIntersectingRectangle(e)) return !0;
		return !1;
	}
	Contains(e, t) {
		if (this._rootNode == null) return !1;
		for (let n of this._rootNode.GetLeafRectangleNodesIntersectingRectangle(e)) if (n.UserData === t) return !0;
		return !1;
	}
	Remove(e, t) {
		if (this._rootNode == null) return;
		let n;
		for (let r of this._rootNode.GetLeafRectangleNodesIntersectingRectangle(e)) r.UserData === t && (n = r);
		if (n != null) return this.RootNode.Count === 1 ? this.RootNode = null : this.RemoveLeaf(n), n.UserData;
	}
	RemoveLeaf(e) {
		let t = ct(e);
		if (t != null) st(t, e), ot(t);
		else {
			let t = e.Parent;
			t == null ? this._rootNode = new Oe() : (at(t, e.IsLeftChild ? t.Right : t.Left), ot(t));
		}
	}
	UnbalancedNode(e) {
		for (let t = e.Parent; t != null; t = t.Parent) if (!lt(t)) return t;
		return null;
	}
}, ft = class extends O {
	constructor(e) {
		super(e), this.radX = e.radX, this.radY = e.radY, this.roundedRect_ = _e.mkRectangleWithRoundedCorners(this.width, this.height, e.radX, e.radY, this.center);
	}
	onUpdated() {
		this.isEmpty || (this.roundedRect_ = _e.mkRectangleWithRoundedCorners(this.width, this.height, this.radX, this.radY, this.center));
	}
	isOk() {
		return this.isEmpty() ? !0 : this.roundedRect_.boundingBox.equalEps(this);
	}
	setRect(e) {
		this.left = e.left, this.right = e.right, this.top = e.top, this.bottom = e.bottom, this.isEmpty() || (this.roundedRect_ = _e.mkRectangleWithRoundedCorners(e.width, e.height, this.radX, this.radY, this.center));
	}
};
//#endregion
//#region node_modules/@msagl/core/dist/layout/core/geomGraph.js
function pt(e, t) {
	let n = t.map((e) => [e, e.boundingBox]), r = new rt(n.map((e) => e[1]), 1.5);
	r.run();
	for (let [e, t] of n) {
		let n = t.leftBottom.sub(e.boundingBox.leftBottom);
		e.translate(n);
	}
	e.boundingBox = new O({
		left: 0,
		bottom: 0,
		right: r.PackedWidth,
		top: r.PackedHeight
	});
}
var mt = class e extends Qe {
	isAncestor(e) {
		return this.graph.isAncestor(e.node);
	}
	deepTranslate(t) {
		for (let n of this.nodesBreadthFirst) {
			n instanceof e ? n.boundingBox = n.boundingBox.translate(t) : n.translate(t);
			for (let e of n.selfEdges()) e.translate(t);
			for (let e of n.outEdges()) this.graph.isAncestor(e.target.node) && e.translate(t);
		}
		this.boundingBox = this.boundingBox.translate(t);
	}
	clone() {
		let t = new e(null);
		return t.boundingBox = this.boundingBox.clone(), t.layoutSettings = this.layoutSettings, t.margins = this.margins, t.radX = this.radX, t.radY = this.radY, t;
	}
	calculateBoundsFromChildren() {
		let e = O.mkEmpty();
		for (let t of this.shallowNodes) e.addRecSelf(t.boundingBox);
		return e.padEverywhere(this.margins), e;
	}
	*allSuccessorsWidthFirst() {
		for (let e of this.graph.allSuccessorsWidthFirst()) yield Qe.getGeom(e);
	}
	static getGeom(e) {
		return c.getGeom(e);
	}
	edgeCurveOrArrowheadsIntersectRect(e, t) {
		for (let n of e.sourceArrowheadPoints(25)) if (t.contains(n)) return !0;
		for (let n of e.targetArrowheadPoints(25)) if (t.contains(n)) return !0;
		let n = e.curve, r = t.perimeter();
		return E.intersectionOne(n, r, !1) != null || E.PointRelativeToCurveLocation(n.start, r) === T.Inside;
	}
	isEmpty() {
		return this.graph.isEmpty();
	}
	setSettingsRecursively(e) {
		this.layoutSettings = e;
		for (let t of this.nodesBreadthFirst) {
			let n = t;
			n.layoutSettings = e;
		}
	}
	get layoutSettings() {
		return this._layoutSettings;
	}
	set layoutSettings(e) {
		this._layoutSettings = e;
	}
	get labelSize() {
		return this._labelSize;
	}
	set labelSize(e) {
		this._labelSize = e;
	}
	get boundingBox() {
		return this.rrect ? this.rrect.clone() : null;
	}
	set boundingBox(e) {
		e ? this.rrect.setRect(e) : this.rrect.roundedRect_ = null;
	}
	transform(e) {
		if (!e.isIdentity()) {
			for (let t of this.shallowNodes) t.transform(e);
			for (let t of this.shallowEdges) t.transform(e), t.label && t.label.transform(e);
			this.boundingBox = this.rrect == null || this.rrect.isEmpty() ? this.pumpTheBoxToTheGraphWithMargins() : this.boundingBox.transform(e);
		}
	}
	translate(e) {
		e.x === 0 && e.y === 0 || this.deepTranslate(e);
	}
	get nodesBreadthFirst() {
		return this.nodesBreadthFirstIter();
	}
	*nodesBreadthFirstIter() {
		for (let e of this.graph.nodesBreadthFirst) yield c.getGeom(e);
	}
	setEdge(e, t) {
		return new be(this.graph.setEdge(e, t));
	}
	getPumpedGraphWithMarginsBox() {
		let e = { b: O.mkEmpty() };
		return ht(this, e), e.b.padEverywhere(this.margins), e.b;
	}
	pumpTheBoxToTheGraphWithMargins() {
		return this.boundingBox = this.getPumpedGraphWithMarginsBox();
	}
	get center() {
		return this.boundingBox || this.boundingBox.isEmpty ? this.boundingBox.center : new y(0, 0);
	}
	set center(e) {
		let t = e.sub(this.center), n = new ge(1, 0, t.x, 0, 1, t.y);
		this.transform(n);
	}
	get left() {
		return this.boundingBox.left;
	}
	get right() {
		return this.boundingBox.right;
	}
	get top() {
		return this.boundingBox.top;
	}
	get bottom() {
		return this.boundingBox.bottom;
	}
	CheckClusterConsistency() {
		throw Error("Method not implemented.");
	}
	get edgeCount() {
		return this.graph.edgeCount;
	}
	get boundaryCurve() {
		return this.rrect.roundedRect_;
	}
	set boundaryCurve(e) {
		throw Error();
	}
	get shallowNodes() {
		return this.shallowNodes_();
	}
	*shallowNodes_() {
		for (let e of this.graph.shallowNodes) yield c.getGeom(e);
	}
	get deepEdges() {
		return this.deepEdgesIt();
	}
	*deepEdgesIt() {
		for (let e of this.graph.deepEdges) yield c.getGeom(e);
	}
	get shallowEdges() {
		return this.shallowEdgesIt();
	}
	*shallowEdgesIt() {
		for (let e of this.graph.shallowEdges) yield c.getGeom(e);
	}
	static mk(t, n = new me(0, 0)) {
		let r = new e(new Je(t));
		return r.labelSize = n, r;
	}
	get Clusters() {
		return this.subgraphs();
	}
	*subgraphs() {
		for (let e of this.graph.subgraphsBreadthFirst()) yield c.getGeom(e);
	}
	static mkWithGraphAndLabel(t, n) {
		let r = new e(t);
		return r.labelSize = n, r;
	}
	constructor(e) {
		super(e), this.margins = {
			left: 10,
			top: 10,
			bottom: 10,
			right: 10
		}, this.radX = 10, this.radY = 10, this.rrect = new ft({
			left: 0,
			right: -1,
			top: 20,
			bottom: 0,
			radX: this.radX,
			radY: this.radY
		});
	}
	get deepNodeCount() {
		let e = 0;
		for (let t of this.graph.nodesBreadthFirst) e++;
		return e;
	}
	get subgraphsDepthFirst() {
		return this.getSubgraphsDepthFirst();
	}
	*getSubgraphsDepthFirst() {
		for (let t of this.graph.allSuccessorsDepthFirst()) t instanceof Je && (yield e.getGeom(t));
	}
	get uniformMargins() {
		return Math.max(this.margins.left, this.margins.right, this.margins.right, this.margins.bottom);
	}
	set uniformMargins(e) {
		this.margins.left = this.margins.right = this.margins.right = this.margins.bottom = e;
	}
	get height() {
		return this.boundingBox.height;
	}
	get width() {
		return this.boundingBox.width;
	}
	get shallowNodeCount() {
		return this.graph.shallowNodeCount;
	}
	get graph() {
		return this.entity;
	}
	liftNode(e) {
		let t = this.graph.liftNode(e.node);
		return t ? c.getGeom(t) : null;
	}
	findNode(e) {
		let t = this.graph.findNode(e);
		return t ? c.getGeom(t) : null;
	}
	addNode(e) {
		return this.graph.addNode(e.node), e;
	}
	addLabelToGraphBB(e) {
		this.labelSize && (e.top += this.labelSize.height + 2, e.width < this.labelSize.width && (e.width = this.labelSize.width));
	}
};
function ht(e, t) {
	for (let r of e.shallowEdges) {
		if (!n(r)) continue;
		let e = r.curve.boundingBox;
		if (t.b.addRecSelf(e), r.edge.label != null) {
			let e = c.getGeom(r.edge.label);
			e && t.b.addRecSelf(e.boundingBox);
		}
	}
	for (let n of e.shallowNodes) "shallowEdges" in n && ht(n, t), !(n.underCollapsedGraph() || !n.boundingBox) && t.b.addRecSelf(n.boundingBox);
	e instanceof mt && e.addLabelToGraphBB(t.b);
	function n(t) {
		if (t == null || t.curve == null || t.underCollapsedGraph()) return !1;
		if (e instanceof mt) {
			let n = e.entity;
			return n.isAncestor(t.source.entity) && n.isAncestor(t.target.entity);
		} else return !0;
	}
}
//#endregion
//#region node_modules/@msagl/core/dist/utils/IntPair.js
var V = class {
	constructor(e, t) {
		this.x = e, this.y = t;
	}
	get source() {
		return this.x;
	}
	get target() {
		return this.y;
	}
	isDiagonal() {
		return this.x === this.y;
	}
}, gt = class {
	isEmpty() {
		if (this.arrayOfMaps.length === 0) return !0;
		for (let e of this.arrayOfMaps) if (e.size > 0) return !1;
		return !0;
	}
	set(e, t, n) {
		let r = this.arrayOfMaps[e];
		r === void 0 && (this.arrayOfMaps[e] = r = /* @__PURE__ */ new Map()), r.set(t, n);
	}
	setPair(e, t) {
		this.set(e.x, e.y, t);
	}
	delete(e, t) {
		if (e < 0 || e >= this.arrayOfMaps.length) return;
		let n = this.arrayOfMaps[e];
		n !== void 0 && (n.delete(t), n.size === 0 && (this.arrayOfMaps[e] = void 0));
	}
	has(e, t) {
		if (e < 0 || e >= this.arrayOfMaps.length) return !1;
		let n = this.arrayOfMaps[e];
		return n === void 0 ? !1 : n.has(t);
	}
	get(e, t) {
		if (e < 0 || e >= this.arrayOfMaps.length) return null;
		let n = this.arrayOfMaps[e];
		return n === void 0 ? null : n.get(t);
	}
	getI(e) {
		return this.get(e.x, e.y);
	}
	constructor() {
		this.arrayOfMaps = [];
	}
	*keys() {
		for (let e = 0; e < this.arrayOfMaps.length; e++) {
			let t = this.arrayOfMaps[e];
			if (t !== void 0) for (let n of t) yield new V(e, n[0]);
		}
	}
	*keyValues() {
		for (let e = 0; e < this.arrayOfMaps.length; e++) {
			let t = this.arrayOfMaps[e];
			if (t !== void 0) for (let n of t) yield [new V(e, n[0]), n[1]];
		}
	}
	*values() {
		for (let e = 0; e < this.arrayOfMaps.length; e++) {
			let t = this.arrayOfMaps[e];
			if (t !== void 0) for (let e of t) yield e[1];
		}
	}
	get size() {
		let e = 0;
		for (let t = 0; t < this.arrayOfMaps.length; t++) {
			let n = this.arrayOfMaps[t];
			n !== void 0 && (e += n.size);
		}
		return e;
	}
}, _t = class {
	get curveClips() {
		return this._curveClips;
	}
	set curveClips(e) {
		this._curveClips = e;
	}
	constructor(e) {
		this._curveClips = [], this.arrowheads = [], this.nodes = [], this.labels = [], this.rect = e, this._curveClips = [];
	}
	addCurveClip(e) {
		z.assert(!(e.curve instanceof E), "CurveClip.curve should not be a Curve!"), this._curveClips.push(e);
	}
	isEmpty() {
		return this._curveClips.length == 0 && this.arrowheads.length == 0 && this.nodes.length == 0 && this.labels.length == 0;
	}
	initCurveClips() {
		this._curveClips = [];
	}
	clear() {
		this.arrowheads = [], this.nodes = [], this.labels = [], this._curveClips = [];
	}
	get entityCount() {
		return this._curveClips.length + this.arrowheads.length + this.labels.length + this.nodes.length;
	}
	addElement(e) {
		if (e instanceof Qe) this.nodes.push(e);
		else if (e instanceof ye) this.labels.push(e);
		else if ("curve" in e) if (e.curve instanceof E) for (let t of e.curve.segs) this.addCurveClip({
			edge: e.edge,
			curve: t,
			startPar: t.parStart,
			endPar: t.parEnd
		});
		else this.addCurveClip(e);
		else this.arrowheads.push(e);
	}
}, vt = class e {
	get Parents() {
		return Array.from(this.parents.values());
	}
	get Children() {
		return Array.from(this.children.values());
	}
	get BoundaryCurve() {
		return this.boundaryCurve;
	}
	set BoundaryCurve(e) {
		this.boundaryCurve = e;
	}
	get BoundingBox() {
		return this.BoundaryCurve.boundingBox;
	}
	get Ports() {
		return this.ports;
	}
	static mkShape() {
		return new e(null);
	}
	constructor(e = null) {
		this.parents = /* @__PURE__ */ new Set(), this.children = /* @__PURE__ */ new Set(), this.ports = /* @__PURE__ */ new Set(), this.BoundaryCurve = e;
	}
	get IsGroup() {
		return this.children.size > 0;
	}
	*Descendants() {
		let e = new i.Queue();
		for (let t of this.Children) e.enqueue(t);
		for (; e.length > 0;) {
			let t = e.dequeue();
			yield t;
			for (let n of t.Children) e.enqueue(n);
		}
	}
	*Ancestors() {
		let e = new i.Queue();
		for (let t of this.Parents) e.enqueue(t);
		for (; e.length > 0;) {
			let t = e.dequeue();
			yield t;
			for (let n of t.Parents) e.enqueue(n);
		}
	}
	AddParent(e) {
		this.parents.add(e), e.children.add(this);
	}
	AddChild(e) {
		e.parents.add(this), this.children.add(e);
	}
	RemoveChild(e) {
		this.children.delete(e), e.parents.delete(this);
	}
	RemoveParent(e) {
		this.parents.delete(e), e.children.delete(this);
	}
	ToString() {
		return this.UserData ? this.UserData.toString() : "null";
	}
}, yt = class {}, bt = class extends yt {
	constructor(e, t) {
		super(), this.curve = this.curve, this.location = t.clone();
	}
	get Location() {
		return this.location;
	}
	set Location(e) {
		this.location = e;
	}
	Translate(e) {
		this.location = this.location.add(e);
	}
	get Curve() {
		return this.curve;
	}
	set Curve(e) {
		this.curve = e;
	}
}, xt = class e extends bt {
	static mk(t, n) {
		return new e(t, n, new y(0, 0));
	}
	get CenterDelegate() {
		return this.centerDelegate;
	}
	set CenterDelegate(e) {
		this.centerDelegate = e;
	}
	get CurveDelegate() {
		return this.curveDelegate;
	}
	set CurveDelegate(e) {
		this.curveDelegate = e;
	}
	get LocationOffset() {
		return this.locationOffset;
	}
	set LocationOffset(e) {
		this.locationOffset = e;
	}
	constructor(e, t, n) {
		super(null, t().add(n)), this.LocationOffset = n, this.CurveDelegate = e, this.CenterDelegate = t;
	}
	get Location() {
		return this.CenterDelegate().add(this.LocationOffset);
	}
	get Curve() {
		return this.CurveDelegate();
	}
}, St = class {
	constructor(e, t, n, r, i) {
		this.color = e, t !== void 0 && (this.item = t), n !== void 0 && (this.parent = n), r !== void 0 && (this.left = r), i !== void 0 && (this.right = i);
	}
	toString() {
		return this.item.toString();
	}
}, H;
(function(e) {
	e[e.Red = 0] = "Red", e[e.Black = 1] = "Black";
})(H ||= {});
//#endregion
//#region node_modules/@msagl/core/dist/math/RBTree/rbTree.js
var Ct = class {
	[Symbol.iterator]() {
		return this.allNodes();
	}
	constructor(e) {
		this.comparer = e, this.count = 0, this.root = this.nil = new St(H.Black);
	}
	clear() {
		this.root = this.nil = new St(H.Black);
	}
	toNull(e) {
		return e === this.nil ? null : e;
	}
	isEmpty() {
		return this.root === this.nil;
	}
	getComparer() {
		return this.comparer;
	}
	getRoot() {
		return this.root;
	}
	find(e, t = this.root) {
		let n;
		for (; t !== this.nil && (n = this.comparer(e, t.item)) !== 0;) t = n < 0 ? t.left : t.right;
		return this.toNull(t);
	}
	findFirst(e, t = this.root) {
		if (t === this.nil) return null;
		let n = null;
		for (; t !== this.nil;) t = e(t.item) ? (n = t).left : t.right;
		return n;
	}
	findLast(e, t = this.root) {
		if (t === this.nil) return null;
		let n = null;
		for (; t !== this.nil;) t = e(t.item) ? (n = t).right : t.left;
		return n;
	}
	treeMinimum(e = this.root) {
		for (; e.left !== this.nil;) e = e.left;
		return this.toNull(e);
	}
	treeMaximum(e = this.root) {
		for (; e.right !== this.nil;) e = e.right;
		return this.toNull(e);
	}
	next(e) {
		if (e.right !== this.nil) return this.treeMinimum(e.right);
		let t = e.parent;
		for (; t !== this.nil && e === t.right;) e = t, t = t.parent;
		return this.toNull(t);
	}
	previous(e) {
		if (e.left !== this.nil) return this.treeMaximum(e.left);
		let t = e.parent;
		for (; t !== this.nil && e === t.left;) e = t, t = t.parent;
		return this.toNull(t);
	}
	leftRotate(e) {
		let t = e.right;
		e.right = t.left, t.left !== this.nil && (t.left.parent = e), t.parent = e.parent, e.parent === this.nil ? this.root = t : e === e.parent.left ? e.parent.left = t : e.parent.right = t, t.left = e, e.parent = t;
	}
	rightRotate(e) {
		let t = e.left;
		e.left = t.right, t.right !== this.nil && (t.right.parent = e), t.parent = e.parent, e.parent === this.nil ? this.root = t : e === e.parent.right ? e.parent.right = t : e.parent.left = t, t.right = e, e.parent = t;
	}
	deleteFixup(e) {
		for (; e !== this.root && e.color === H.Black;) if (e === e.parent.left) {
			let t = e.parent.right;
			t.color === H.Red && (t.color = H.Black, e.parent.color = H.Red, this.leftRotate(e.parent), t = e.parent.right), t.left.color === H.Black && t.right.color === H.Black ? (t.color = H.Red, e = e.parent) : (t.right.color === H.Black && (t.left.color = H.Black, t.color = H.Red, this.rightRotate(t), t = e.parent.right), t.color = e.parent.color, e.parent.color = H.Black, t.right.color = H.Black, this.leftRotate(e.parent), e = this.root);
		} else {
			let t = e.parent.left;
			t.color === H.Red && (t.color = H.Black, e.parent.color = H.Red, this.rightRotate(e.parent), t = e.parent.left), t.right.color === H.Black && t.left.color === H.Black ? (t.color = H.Red, e = e.parent) : (t.left.color === H.Black && (t.right.color = H.Black, t.color = H.Red, this.leftRotate(t), t = e.parent.left), t.color = e.parent.color, e.parent.color = H.Black, t.left.color = H.Black, this.rightRotate(e.parent), e = this.root);
		}
		e.color = H.Black;
	}
	deleteSubTree(e) {
		let t;
		if (e.left === this.nil || e.right === this.nil) t = e;
		else for (t = e.right; t.left !== this.nil;) t = t.left;
		let n = t.left === this.nil ? t.right : t.left;
		return n.parent = t.parent, t.parent === this.nil ? this.root = n : t === t.parent.left ? t.parent.left = n : t.parent.right = n, t !== e && (e.item = t.item), t.color === H.Black && this.deleteFixup(n), this.toNull(e);
	}
	deleteNodeInternal(e) {
		this.count--, this.deleteSubTree(e);
	}
	remove(e) {
		let t = this.find(e);
		return t == null ? null : (this.count--, this.deleteSubTree(t));
	}
	insert(e) {
		let t = this.treeInsert(e);
		return this.insertPrivate(t), this.toNull(t);
	}
	treeInsert(e) {
		let t = this.nil, n = this.root, r = 0;
		for (; n !== this.nil;) t = n, r = this.comparer(e, n.item), n = r < 0 ? n.left : n.right;
		let i = new St(H.Black, e, t, this.nil, this.nil);
		return t === this.nil ? this.root = i : r < 0 ? t.left = i : t.right = i, this.toNull(i);
	}
	insertPrivate(e) {
		for (this.count++, e.color = H.Red; e !== this.root && e.parent.color === H.Red;) if (e.parent === e.parent.parent.left) {
			let t = e.parent.parent.right;
			t.color === H.Red ? (e.parent.color = H.Black, t.color = H.Black, e.parent.parent.color = H.Red, e = e.parent.parent) : (e === e.parent.right && (e = e.parent, this.leftRotate(e)), e.parent.color = H.Black, e.parent.parent.color = H.Red, this.rightRotate(e.parent.parent));
		} else {
			let t = e.parent.parent.left;
			t.color === H.Red ? (e.parent.color = H.Black, t.color = H.Black, e.parent.parent.color = H.Red, e = e.parent.parent) : (e === e.parent.left && (e = e.parent, this.rightRotate(e)), e.parent.color = H.Black, e.parent.parent.color = H.Red, this.leftRotate(e.parent.parent));
		}
		this.root.color = H.Black;
	}
	*allNodes() {
		if (this.isEmpty()) return;
		let e = this.treeMinimum();
		for (; e != null;) yield e.item, e = this.next(e);
	}
	toString() {
		let e = "{", t = 0;
		for (let n of this.allNodes()) e += n.toString(), t !== this.count - 1 && (e += "\n"), t++;
		return e + "}";
	}
}, wt = class {
	*[Symbol.iterator]() {
		for (let e = 1; e <= this.heapSize; e++) yield this.A[e];
	}
	Enqueue(e) {
		let t = this.heapSize + 1;
		this.A[t] = e, this.heapSize++;
		let n = t >> 1, r, i;
		for (; t > 1 && this.Less(r = this.A[t], i = this.A[n]);) this.A[n] = r, this.A[t] = i, t = n, n = t >> 1;
	}
	Dequeue() {
		if (this.heapSize < 1) throw Error();
		let e = this.A[1], t = this.A[this.heapSize];
		return this.heapSize--, this.ChangeMinimum(t), e;
	}
	ChangeMinimum(e) {
		this.A[1] = e;
		let t = 1, n = 2, r = !1;
		for (; n < this.heapSize && !r;) {
			r = !0;
			let i = this.A[n], a = this.A[n + 1];
			this.compare(i, a) < 0 ? this.compare(i, e) < 0 && (this.A[t] = i, this.A[n] = e, r = !1, t = n, n = t << 1) : this.compare(a, e) < 0 && (this.A[t] = a, this.A[n + 1] = e, r = !1, t = n + 1, n = t << 1);
		}
		if (n === this.heapSize) {
			let r = this.A[n];
			this.compare(r, e) < 0 && (this.A[t] = r, this.A[n] = e);
		}
	}
	get Count() {
		return this.heapSize;
	}
	Less(e, t) {
		return this.compare(e, t) < 0;
	}
	constructor(e) {
		this.heapSize = 0, this.A = [], this.compare = e;
	}
	GetMinimum() {
		return this.A[1];
	}
}, Tt = class {}, Et = class extends Tt {
	get Site() {
		return this.Vertex.point;
	}
	constructor(e) {
		super(), this.Vertex = e;
	}
	get Polyline() {
		return this.Vertex.polyline;
	}
}, Dt = class extends Et {
	constructor(e) {
		super(e);
	}
}, Ot = class {
	constructor(e) {
		this.lineSweeper = e;
	}
	Compare(e, t) {
		switch (y.getTriangleOrientation(t.Start, t.End, this.x)) {
			case _.Collinear: return 0;
			case _.Clockwise: return 1;
			default: return -1;
		}
	}
	SetOperand(e) {
		this.x = this.IntersectionOfSideAndSweepLine(e);
	}
	IntersectionOfSideAndSweepLine(e) {
		let t = e.Direction.dot(this.lineSweeper.SweepDirection), n = (this.lineSweeper.Z - e.Start.dot(this.lineSweeper.SweepDirection)) / t;
		return e.Start.add(e.Direction.mul(n));
	}
}, kt = class extends Tt {
	constructor(e) {
		super(), this.site = e;
	}
	get Site() {
		return this.site;
	}
}, At = class {
	constructor(e, t) {
		this.PreviousZ = -Infinity, this.z = -Infinity, this.Obstacles = e ?? [], this.SweepDirection = t, this.DirectionPerp = t.rotate(-Math.PI / 2), this.EventQueue = new wt((e, t) => this.Compare(e, t)), this.ObstacleSideComparer = new Ot(this), this.LeftObstacleSideTree = new Ct((e, t) => this.ObstacleSideComparer.Compare(e, t)), this.RightObstacleSideTree = new Ct((e, t) => this.ObstacleSideComparer.Compare(e, t));
	}
	get EventQueue() {
		return this.eventQueue;
	}
	set EventQueue(e) {
		this.eventQueue = e;
	}
	get DirectionPerp() {
		return this.directionPerp;
	}
	set DirectionPerp(e) {
		this.directionPerp = e;
	}
	get Z() {
		return this.z;
	}
	set Z(e) {
		e > this.z + u.tolerance && (this.PreviousZ = this.z), this.z = e;
	}
	GetZS(e) {
		return this.SweepDirection.dot(e.Site);
	}
	GetZP(e) {
		return this.SweepDirection.dot(e);
	}
	SegmentIsNotHorizontal(e, t) {
		return Math.abs(e.sub(t).dot(this.SweepDirection)) > u.distanceEpsilon;
	}
	RemoveLeftSide(e) {
		this.ObstacleSideComparer.SetOperand(e), this.LeftObstacleSideTree.remove(e);
	}
	RemoveRightSide(e) {
		this.ObstacleSideComparer.SetOperand(e), this.RightObstacleSideTree.remove(e);
	}
	InsertLeftSide(e) {
		this.ObstacleSideComparer.SetOperand(e), this.LeftObstacleSideTree.insert(e);
	}
	InsertRightSide(e) {
		this.ObstacleSideComparer.SetOperand(e), this.RightObstacleSideTree.insert(e);
	}
	FindFirstObstacleSideToTheLeftOfPoint(e) {
		let t = this.RightObstacleSideTree.findLast((t) => y.pointToTheRightOfLineOrOnLine(e, t.Start, t.End));
		return t == null ? null : t.item;
	}
	FindFirstObstacleSideToToTheRightOfPoint(e) {
		let t = this.LeftObstacleSideTree.findFirst((t) => !y.pointToTheRightOfLineOrOnLine(e, t.Start, t.End));
		return t == null ? null : t.item;
	}
	EnqueueEvent(e) {
		this.eventQueue.Enqueue(e);
	}
	InitQueueOfEvents() {
		for (let e of this.Obstacles) this.EnqueueLowestPointsOnObstacles(e);
		if (this.Ports != null) for (let e of this.Ports.values()) this.EnqueueEvent(new kt(e));
	}
	EnqueueLowestPointsOnObstacles(e) {
		let t = this.GetLowestPoint(e);
		this.EnqueueEvent(new Dt(t));
	}
	GetLowestPoint(e) {
		let t = e.startPoint, n = e.startPoint.next;
		for (; n != null; n = n.next) this.Less(n.point, t.point) && (t = n);
		return t;
	}
	Compare(e, t) {
		let n = e.Site, r = t.Site;
		return this.ComparePoints(n, r);
	}
	Less(e, t) {
		return this.ComparePoints(e, t) < 0;
	}
	ComparePoints(e, t) {
		let n = this.SweepDirection.dot(e), r = this.SweepDirection.dot(t);
		return n < r ? -1 : n > r ? 1 : (n = this.directionPerp.dot(e), r = this.directionPerp.dot(t), n < r ? -1 : +(n > r));
	}
}, U = (/* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.StringBuilder = e.String = e.emptyString = void 0, e.isNullOrWhiteSpace = n, e.joinString = r, e.formatString = i;
	var t = "\r\n";
	function n(e) {
		return a.isNullOrWhiteSpace(e);
	}
	function r(e, ...t) {
		return a.join(e, ...t);
	}
	function i(e, ...t) {
		return a.format(e, ...t);
	}
	e.emptyString = "";
	var a = class e {
		static regexNumber = /{(\d+(:\w*)?)}/g;
		static regexObject = /{(\w+(:\w*)?)}/g;
		static empty = "";
		static Empty = "";
		static IsNullOrWhiteSpace(t) {
			return e.isNullOrWhiteSpace(t);
		}
		static Join(t, ...n) {
			return e.join(t, ...n);
		}
		static Format(t, ...n) {
			return e.format(t, ...n);
		}
		static isNullOrWhiteSpace(e) {
			try {
				return e == null || e == "undefined" ? !0 : e.toString().replace(/\s/g, "").length < 1;
			} catch (e) {
				return console.log(e), !1;
			}
		}
		static join(t, ...n) {
			try {
				var r = n[0];
				if (Array.isArray(r) || r instanceof Array) {
					let n = e.empty;
					for (let e = 0; e < r.length; e++) {
						var i = r[e];
						e < r.length - 1 ? n += i + t : n += i;
					}
					return n;
				}
				if (typeof r == "object") {
					let n = e.empty, i = r;
					return Object.keys(r).forEach((e) => {
						n += i[e] + t;
					}), n = n.slice(0, n.length - t.length);
				}
				var a = n;
				return e.joinString(t, ...a);
			} catch (t) {
				return console.log(t), e.empty;
			}
		}
		static format(t, ...n) {
			try {
				return t.match(e.regexNumber) ? e.formatString(e.regexNumber, t, n) : t.match(e.regexObject) ? e.formatString(e.regexObject, t, n, !0) : t;
			} catch (t) {
				return console.log(t), e.empty;
			}
		}
		static formatString(t, n, r, i = !1) {
			return n.replace(t, function(t, n) {
				var a = t.split(":");
				1 < a.length && (n = a[0].replace("{", ""), t = a[1].replace("}", ""));
				let o;
				return (o = (i ? r[0] : r)[n]) == null || o == null || t.match(/{\d+}/) || (o = e.parsePattern(t, o)) !== void 0 && o != null ? o : e.empty;
			});
		}
		static parsePattern(t, n) {
			switch (t) {
				case "L": return n = n.toLocaleLowerCase();
				case "U": return n = n.toLocaleUpperCase();
				case "d":
					if (typeof n == "string") return e.getDisplayDateFromString(n);
					if (n instanceof Date) return e.format("{0:00}.{1:00}.{2:0000}", n.getDate(), n.getMonth(), n.getFullYear());
					break;
				case "s":
					if (typeof n == "string") return e.getSortableDateFromString(n);
					if (n instanceof Date) return e.format("{0:0000}-{1:00}-{2:00}", n.getFullYear(), n.getMonth(), n.getDate());
					break;
				case "n": {
					var r = (n = typeof n == "string" ? n : n.toString()).replace(/,/g, ".");
					if (isNaN(parseFloat(r)) || r.length <= 3) break;
					r = r.split(/\D+/g);
					let t = r;
					var r = (t = 1 < r.length ? [e.joinString("", ...r.splice(0, r.length - 1)), r[r.length - 1]] : t)[0], i = r.length % 3, a = 0 < i ? r.substring(0, i) : e.empty, r = r.substring(i).match(/.{3}/g);
					return n = a + "." + e.join(".", r) + (1 < t.length ? "," + t[1] : "");
				}
				case "x": return this.decimalToHexString(n);
				case "X": return this.decimalToHexString(n, !0);
			}
			return typeof n != "number" && isNaN(n) || isNaN(+t) || e.isNullOrWhiteSpace(n) ? n : e.formatNumber(n, t);
		}
		static decimalToHexString(e, t = !1) {
			return e = parseFloat(e).toString(16), t ? e.toLocaleUpperCase() : e;
		}
		static getDisplayDateFromString(e) {
			var t = e.split("-");
			if (t.length <= 1) return e;
			let n = t[t.length - 1];
			return e = t[t.length - 2], t = t[t.length - 3], (n = (n = n.split("T")[0]).split(" ")[0]) + `.${e}.` + t;
		}
		static getSortableDateFromString(t) {
			var n = t.replace(",", "").split(".");
			if (n.length <= 1) return t;
			t = n[n.length - 1].split(" ");
			let r = e.empty, i = (1 < t.length && (r = t[t.length - 1]), n[n.length - 1].split(" ")[0] + `-${n[n.length - 2]}-` + n[n.length - 3]);
			return !e.isNullOrWhiteSpace(r) && 1 < r.length ? i += "T" + r : i += "T00:00:00", i;
		}
		static formatNumber(e, t) {
			var t = t.length, e = e.toString();
			return t <= e.length ? e : (t -= e.length, ++t, Array(t).join("0") + e);
		}
		static joinString(t, ...n) {
			let r = e.empty;
			for (let a = 0; a < n.length; a++) if (!(typeof n[a] == "string" && e.isNullOrWhiteSpace(n[a]) || typeof n[a] != "number" && typeof n[a] != "string")) {
				var i = "" + n[a];
				r += i;
				for (let i = a + 1; i < n.length; i++) if (!e.isNullOrWhiteSpace(n[i])) {
					r += t, a = i - 1;
					break;
				}
			}
			return r;
		}
	};
	e.String = a, e.StringBuilder = class {
		Values;
		constructor(e = "") {
			this.Values = [], a.isNullOrWhiteSpace(e) || (this.Values = Array(e));
		}
		toString() {
			return this.Values.join(a.empty);
		}
		ToString() {
			return this.toString();
		}
		append(e) {
			this.Values.push(e);
		}
		Append(e) {
			this.append(e);
		}
		appendLine(e) {
			this.Values.push(t + e);
		}
		AppendLine(e) {
			this.appendLine(e);
		}
		appendFormat(e, ...t) {
			this.Values.push(a.format(e, ...t));
		}
		AppendFormat(e, ...t) {
			this.appendFormat(e, ...t);
		}
		appendLineFormat(e, ...n) {
			this.Values.push(t + a.format(e, ...n));
		}
		AppendLineFormat(e, ...t) {
			return this.appendLineFormat(e, ...t);
		}
		clear() {
			this.Values = [];
		}
		Clear() {
			this.clear();
		}
	};
})))(), jt = class e {
	static closeuv(t, n) {
		return y.closeDistEps(t.point, e.u, .1) && y.closeDistEps(n.point, e.v, .1);
	}
	constructor(e, t, n = 1) {
		this.LengthMultiplier = 1, this.Source = e, this.Target = t, this.Weight = n;
	}
	get SourcePoint() {
		return this.Source.point;
	}
	get TargetPoint() {
		return this.Target.point;
	}
	get Length() {
		return this.SourcePoint.sub(this.TargetPoint).length * this.LengthMultiplier;
	}
	toString() {
		return U.String.format("{0}->{1} ({2})", this.Source, this.Target, this.Weight);
	}
	ReversedClone() {
		return new e(this.Target, this.Source);
	}
	Clone() {
		return new e(this.Source, this.Target);
	}
};
jt.u = new y(545.833, 840.458), jt.v = new y(606.1667261889578, 786.2917261889578), jt.DefaultWeight = 1;
//#endregion
//#region node_modules/@msagl/core/dist/routing/visibility/TollFreeVisibilityEdge.js
var Mt = class e extends jt {
	static constructorVV(t, n) {
		return new e(t, n, 0);
	}
	constructor(e, t, n = 0) {
		super(e, t, n);
	}
}, Nt = class {
	deleteP(e) {
		return this.delete(e.x, e.y);
	}
	clear() {
		this.m.clear();
	}
	get size() {
		return this.m.size;
	}
	setxy(e, t, n) {
		this.m.set(Pt(e, t), n);
	}
	set(e, t) {
		this.setxy(e.x, e.y, t);
	}
	delete(e, t) {
		return this.m.delete(Pt(e, t));
	}
	hasxy(e, t) {
		return this.m.has(Pt(e, t));
	}
	has(e) {
		return this.hasxy(e.x, e.y);
	}
	getxy(e, t) {
		return this.m.get(Pt(e, t));
	}
	get(e) {
		return this.getxy(e.x, e.y);
	}
	constructor() {
		this.m = /* @__PURE__ */ new Map();
	}
	*keys() {
		for (let e of this.m.keys()) {
			let t = e.split(",");
			yield new y(Number(t[0]), Number(t[1]));
		}
	}
	*[Symbol.iterator]() {
		for (let [e, t] of this.m) {
			let n = e.split(",");
			yield [new y(Number(n[0]), Number(n[1])), t];
		}
	}
	*values() {
		yield* this.m.values();
	}
};
function Pt(e, t) {
	return e.toString() + "," + t.toString();
}
//#endregion
//#region node_modules/@msagl/core/dist/routing/visibility/VisibilityVertex.js
var Ft = class e {
	get InEdges() {
		return this._inEdges;
	}
	get OutEdges() {
		return this._outEdges;
	}
	get Degree() {
		return this._inEdges.length + this.OutEdges.count;
	}
	InEdgesLength() {
		return this._inEdges.length;
	}
	addInEdge(e) {
		this._inEdges.push(e);
	}
	get IsTerminal() {
		return this._isTerminal;
	}
	set IsTerminal(e) {
		this._isTerminal = e;
	}
	get IsShortestPathTerminal() {
		return this._isShortestPathTerminal;
	}
	set IsShortestPathTerminal(e) {
		this._isShortestPathTerminal = e;
	}
	constructor(e) {
		this._inEdges = [], this._outEdges = new Ct((e, t) => this.Compare(e, t)), this.point = e;
	}
	toString() {
		return this.point.toString();
	}
	RemoveOutEdge(e) {
		this.OutEdges.remove(e);
	}
	RemoveInEdge(e) {
		let t = this._inEdges.indexOf(e);
		if (t === -1) return;
		let n = this._inEdges.length - 1;
		t !== n && (this._inEdges[t] = this._inEdges[n]), this._inEdges.pop();
	}
	static FindFirst(t, n) {
		return e.FindFirst_t(t.root, t, n);
	}
	static FindFirst_t(e, t, n) {
		if (e === t.nil) return null;
		let r = null;
		for (; e !== t.nil;) e = e.item.TargetPoint.compareTo(n) >= 0 ? (r = e).left : e.right;
		return r;
	}
	get(t) {
		let n = e.FindFirst(this.OutEdges, t.point);
		return n != null && n.item.Target === t || (n = e.FindFirst(t.OutEdges, this.point), n != null && n.item.Target === this) ? n.item : null;
	}
	Compare(e, t) {
		return e.TargetPoint.compareTo(t.TargetPoint);
	}
	ClearEdges() {
		this._outEdges.clear(), this._inEdges = [];
	}
}, W = class {
	constructor() {
		this.activeVertices = /* @__PURE__ */ new Set(), this.VertexFactory = (e) => new Ft(e), this.pointToVertexMap = new Nt();
	}
	*edges_() {
		for (let e of this.pointToVertexMap.values()) for (let t of e.OutEdges) yield t;
	}
	get Edges() {
		return this.edges_();
	}
	ClearPrevEdgesTable() {
		for (let e of this.activeVertices) e.prevEdge = null;
		this.activeVertices.clear();
	}
	ShrinkLengthOfPrevEdge(e, t) {
		e.prevEdge.LengthMultiplier = t;
	}
	PreviosVertex(e) {
		let t = e.prevEdge;
		return t ? t.Source === e ? t.Target : t.Source : null;
	}
	SetPreviousEdge(e, t) {
		this.activeVertices.add(e), e.prevEdge = t;
	}
	AddHole(e) {
		let t = e.startPoint;
		for (; t !== e.endPoint;) this.AddEdgePlPl(t, t.next), t = t.next;
		this.AddEdgePlPl(e.endPoint, e.startPoint);
	}
	static *OrientHolesClockwise(e) {
		for (let t of e) for (let e = t.startPoint;; e = e.next) {
			let n = y.getTriangleOrientation(e.point, e.next.point, e.next.next.point);
			if (n !== _.Collinear) {
				yield n === _.Clockwise ? t : t.reverse();
				break;
			}
		}
	}
	AddVertexP(e) {
		let t = this.pointToVertexMap.get(e);
		if (t) return t;
		let n = this.VertexFactory(e);
		return this.pointToVertexMap.set(e, n), n;
	}
	AddVertexV(e) {
		this.pointToVertexMap.set(e.point, e);
	}
	ContainsVertex(e) {
		return this.pointToVertexMap.has(e);
	}
	static AddEdgeVV(e, t) {
		let n;
		if (n = e.get(t)) return n;
		if (e === t) throw Error("Self-edges are not allowed");
		let r = new jt(e, t);
		return e.OutEdges.insert(r), t.InEdges.push(r), r;
	}
	AddEdgePlPl(e, t) {
		this.AddEdgePP(e.point, t.point);
	}
	static AddEdge(e) {
		e.Source.OutEdges.insert(e), e.Target.addInEdge(e);
	}
	AddEdgeF(e, t, n) {
		let r = this.FindVertex(e), i = null;
		if (r != null && (i = this.FindVertex(t), i != null)) {
			let e = r.get(i);
			if (e) return e;
		}
		r == null ? (r = this.AddVertexP(e), i = this.AddVertexP(t)) : i ??= this.AddVertexP(t);
		let a = n(r, i);
		return r.OutEdges.insert(a), i.addInEdge(a), a;
	}
	AddEdgePP(e, t) {
		return this.AddEdgeF(e, t, (e, t) => new jt(e, t));
	}
	FindVertex(e) {
		return this.pointToVertexMap.get(e);
	}
	Vertices() {
		return this.pointToVertexMap.values();
	}
	RemoveVertex(e) {
		for (let t of e.OutEdges) t.Target.RemoveInEdge(t);
		for (let t of e.InEdges) t.Source.RemoveOutEdge(t);
		this.pointToVertexMap.deleteP(e.point);
	}
	FindEdgePP(e, t) {
		let n = this.FindVertex(e);
		if (n == null) return null;
		let r = this.FindVertex(t);
		return r == null ? null : n.get(r);
	}
	static RemoveEdge(e) {
		e.Source.RemoveOutEdge(e), e.Target.RemoveInEdge(e);
	}
	ClearEdges() {
		for (let e of this.Vertices()) e.ClearEdges();
	}
}, It = class {
	constructor() {
		this.Removed = !1;
	}
}, Lt = class extends It {
	get Start() {
		return this.start;
	}
	get End() {
		return this.EndVertex.point;
	}
	constructor(e, t, n) {
		super(), this.start = e, this.EndVertex = t, this.ConeSide = n;
	}
	get Direction() {
		return this.End.sub(this.Start);
	}
	toString() {
		return "BrokenConeSide: " + (this.Start + ("," + this.End));
	}
}, Rt = class {
	get Removed() {
		return this.removed;
	}
	set Removed(e) {
		this.removed = e;
	}
	constructor(e, t) {
		this.apex = e, this.coneSweeper = t;
	}
	get Apex() {
		return this.apex;
	}
	set Apex(e) {
		this.apex = e;
	}
	get RightSideDirection() {
		return this.coneSweeper.ConeRightSideDirection;
	}
	get LeftSideDirection() {
		return this.coneSweeper.ConeLeftSideDirection;
	}
	get RightSide() {
		return this.rightSide;
	}
	set RightSide(e) {
		this.rightSide = e, this.rightSide.Cone = this;
	}
	get LeftSide() {
		return this.leftSide;
	}
	set LeftSide(e) {
		this.leftSide = e, this.leftSide.Cone = this;
	}
}, zt = class extends Tt {
	get ConeToClose() {
		return this.coneToClose;
	}
	get Site() {
		return this.site;
	}
	constructor(e, t) {
		super(), this.site = e, this.coneToClose = t;
	}
	toString() {
		return "ConeClosureEvent " + this.site;
	}
}, Bt = class extends It {
	constructor(e) {
		super(), this.Cone = e;
	}
	get Start() {
		return this.Cone.Apex;
	}
	get Direction() {
		return this.Cone.LeftSideDirection;
	}
	toString() {
		return "ConeLeftSide " + this.Start + (" " + this.Direction);
	}
}, Vt = class extends It {
	constructor(e) {
		super(), this.Cone = e;
	}
	get Start() {
		return this.Cone.Apex;
	}
	get Direction() {
		return this.Cone.RightSideDirection;
	}
	toString() {
		return "ConeRightSide " + this.Start + " " + this.Direction;
	}
}, Ht = class e {
	SetOperand(e) {
		this.x = this.IntersectionOfSegmentAndSweepLine(e);
	}
	constructor(e) {
		this.coneSweeper = e;
	}
	Compare(t, n) {
		let r = t instanceof Lt, i = n instanceof Lt;
		return r ? i ? this.CompareBrokenSides(t, n) : this.CompareObstacleSideAndConeSide(n) : i ? this.CompareConeSideAndObstacleSide(t, n) : e.CompareNotIntersectingSegs(t, n);
	}
	static CompareNotIntersectingSegs(e, t) {
		switch (y.getTriangleOrientation(e.Start, t.Start, t.Start.add(t.Direction))) {
			case _.Counterclockwise: return -1;
			case _.Clockwise: return 1;
			default: return 0;
		}
	}
	CompareObstacleSideAndConeSide(e) {
		let t = y.getTriangleOrientation(this.x, e.Start, e.Start.add(e.Direction));
		return t === _.Counterclockwise ? -1 : t === _.Clockwise ? 1 : e instanceof Bt ? -1 : 1;
	}
	CompareConeSideAndObstacleSide(e, t) {
		let n = y.getTriangleOrientation(this.x, t.start, t.End);
		return n === _.Counterclockwise ? -1 : n === _.Clockwise || e instanceof Bt ? 1 : -1;
	}
	IntersectionOfSegmentAndSweepLine(e) {
		let t = e.Direction.dot(this.coneSweeper.SweepDirection), n = (this.coneSweeper.Z - e.Start.dot(this.coneSweeper.SweepDirection)) / t;
		return e.Start.add(e.Direction.mul(n));
	}
	CompareBrokenSides(t, n) {
		return t.EndVertex === n.EndVertex ? e.CompareNotIntersectingSegs(t.ConeSide, n.ConeSide) : y.getTriangleOrientation(this.x, n.start, n.EndVertex.point) === _.Counterclockwise ? -1 : 1;
	}
}, Ut = class extends Tt {
	get EndVertex() {
		return this.endVertex;
	}
	constructor(e, t, n) {
		super(), this.coneLeftSide = e, this.intersectionPoint = t, this.endVertex = n;
	}
	get Site() {
		return this.intersectionPoint;
	}
	toString() {
		return "LeftIntersectionEvent " + this.intersectionPoint;
	}
}, Wt = class {
	get Direction() {
		return this.End.sub(this.Start);
	}
	toString() {
		return this.Start + " " + this.End;
	}
}, Gt = class extends Wt {
	Init(e) {
		this.StartVertex = e;
	}
	constructor(e) {
		super(), this.Init(e);
	}
	get Polyline() {
		return this.StartVertex.polyline;
	}
	get Start() {
		return this.StartVertex.point;
	}
	get End() {
		return this.EndVertex.point;
	}
}, Kt = class extends Gt {
	constructor(e) {
		super(e), this.end = e.nextOnPolyline.point;
	}
	get End() {
		return this.end;
	}
	get EndVertex() {
		return this.StartVertex.nextOnPolyline;
	}
}, qt = class extends Et {
	constructor(e) {
		super(e);
	}
}, Jt = class extends Tt {
	get EndVertex() {
		return this.endVertex;
	}
	set EndVertex(e) {
		this.endVertex = e;
	}
	constructor(e, t, n) {
		super(), this.coneRightSide = e, this.intersectionPoint = t, this.endVertex = n;
	}
	get Site() {
		return this.intersectionPoint;
	}
	toString() {
		return "RightIntersectionEvent " + this.intersectionPoint;
	}
}, Yt = class extends Gt {
	constructor(e) {
		super(e), this.end = e.prevOnPolyline.point;
	}
	get End() {
		return this.end;
	}
	get EndVertex() {
		return this.StartVertex.prevOnPolyline;
	}
}, Xt = class extends Et {
	constructor(e) {
		super(e);
	}
}, Zt = class e extends At {
	constructor(e, t, n, r, i, a, o) {
		super(e, t), this.visibilityGraph = i, this.ConeRightSideDirection = n, this.ConeLeftSideDirection = r, this.coneSideComparer = new Ht(this), this.leftConeSides = new Ct((e, t) => this.coneSideComparer.Compare(e, t)), this.rightConeSides = new Ct((e, t) => this.coneSideComparer.Compare(e, t)), this.Ports = a, this.BorderPolyline = o, this.PortEdgesCreator = (e, t) => new Mt(e, t, 0);
	}
	static Sweep(t, n, r, i, a, o) {
		new e(t, n, n.rotate(-r / 2), n.rotate(r / 2), i, a, o).Calculate();
	}
	Calculate() {
		for (this.InitQueueOfEvents(); this.EventQueue.Count > 0;) this.ProcessEvent(this.EventQueue.Dequeue());
		this.BorderPolyline != null && this.CloseRemainingCones(), this.CreatePortEdges();
	}
	CreatePortEdges() {
		if (this.portEdgesGraph != null) for (let e of this.portEdgesGraph.Edges) this.visibilityGraph.AddEdgeF(e.SourcePoint, e.TargetPoint, this.PortEdgesCreator);
	}
	CloseRemainingCones() {
		if (this.leftConeSides.count === 0) return;
		let e = this.BorderPolyline.startPoint, t = this.leftConeSides.count;
		do {
			let n = this.leftConeSides.treeMinimum().item.Cone;
			e = this.FindPolylineSideIntersectingConeRightSide(e, n), e = this.GetPolylinePointInsideOfConeAndRemoveCones(e, n), t--;
		} while (this.leftConeSides.count > 0 && t > 0);
	}
	GetPolylinePointInsideOfConeAndRemoveCones(t, n) {
		let r = t.nextOnPolyline, i = e.FindInsidePoint(t.point, r.point, n);
		return y.closeDistEps(i, t.point) ? (this.AddEdgeAndRemoveCone(n, t.point), this.AddEdgesAndRemoveRemainingConesByPoint(t.point)) : y.closeDistEps(i, r.point) ? (this.AddEdgeAndRemoveCone(n, r.point), this.AddEdgesAndRemoveRemainingConesByPoint(r.point), t = r) : (t = e.InsertPointIntoPolylineAfter(this.BorderPolyline, t, i), this.AddEdgeAndRemoveCone(n, t.point), this.AddEdgesAndRemoveRemainingConesByPoint(t.point)), t;
	}
	static FindInsidePoint(t, n, r) {
		return e.FindInsidePointBool(t, n, r.Apex, r.Apex.add(r.LeftSideDirection), r.Apex.add(r.RightSideDirection));
	}
	static FindInsidePointBool(t, n, r, i, a) {
		if (y.closeDistEps(t, n) || y.PointIsInsideCone(t, r, i, a)) return t;
		if (y.PointIsInsideCone(n, r, i, a)) return n;
		let o = y.middle(t, n);
		return y.pointToTheLeftOfLine(o, r, i) ? e.FindInsidePointBool(o, n, r, i, a) : e.FindInsidePointBool(t, o, r, i, a);
	}
	AddEdgesAndRemoveRemainingConesByPoint(e) {
		let t = [];
		for (let n of this.leftConeSides) if (y.PointToTheRightOfLineOrOnLine(e, n.Start, n.Start.add(n.Direction))) t.push(n.Cone);
		else break;
		for (let n of t) this.AddEdgeAndRemoveCone(n, e);
	}
	FindPolylineSideIntersectingConeRightSide(t, n) {
		let r = t, i = n.Apex, a = n.Apex.add(this.ConeRightSideDirection), o = e.GetSign(t, i, a);
		for (;;) {
			let n = t.nextOnPolyline, s = e.GetSign(n, i, a);
			if (s - o > 0) return t;
			if (t = n, o = s, t === r) throw Error("cannod decide if the polyline intersects the cone!");
		}
	}
	static GetSign(e, t, n) {
		let r = y.signedDoubledTriangleArea(t, n, e.point);
		return r < 0 ? 1 : r > 0 ? -1 : 0;
	}
	AddEdgeAndRemoveCone(e, t) {
		this.Ports != null && this.Ports.has(e.Apex) ? this.CreatePortEdge(e, t) : this.visibilityGraph.AddEdgePP(e.Apex, t), this.RemoveCone(e);
	}
	CreatePortEdge(e, t) {
		this.portEdgesGraph ??= new W();
		let n = this.portEdgesGraph.FindVertex(e.Apex), r = n == null ? null : Array.from(n.InEdges).concat(Array.from(n.OutEdges.allNodes()));
		if (r) for (let e of r) {
			let r = (e.Target === n ? e.Source : e.Target).point;
			W.RemoveEdge(e), this.portEdgesGraph.AddEdgePP(r, t);
		}
		this.portEdgesGraph.AddEdgePP(e.Apex, t);
	}
	static InsertPointIntoPolylineAfter(e, t, n) {
		let r;
		return t.next == null ? (r = b.mkFromPoint(n), r.prev = t, t.next = r, e.endPoint = r) : (r = b.mkFromPoint(n), r.prev = t, r.next = t.next, t.next.prev = r, t.next = r), r.polyline = e, e.setInitIsRequired(), r;
	}
	ProcessEvent(e) {
		e instanceof Et ? this.ProcessVertexEvent(e) : e instanceof Jt ? this.ProcessRightIntersectionEvent(e) : e instanceof Ut ? this.ProcessLeftIntersectionEvent(e) : (e instanceof zt ? e.ConeToClose.Removed || this.RemoveCone(e.ConeToClose) : this.ProcessPortObstacleEvent(e), this.Z = this.GetZS(e));
	}
	ProcessPortObstacleEvent(e) {
		this.Z = this.GetZS(e), this.GoOverConesSeeingVertexEvent(e), this.CreateConeOnVertex(e);
	}
	ProcessLeftIntersectionEvent(e) {
		if (e.coneLeftSide.Removed === !1) if (Math.abs(e.EndVertex.point.sub(e.Site).dot(this.SweepDirection)) < u.distanceEpsilon) this.RemoveCone(e.coneLeftSide.Cone);
		else {
			this.RemoveSegFromLeftTree(e.coneLeftSide), this.Z = this.GetZP(e.Site);
			let t = new Lt(e.Site, e.EndVertex, e.coneLeftSide);
			this.InsertToTree(this.leftConeSides, t), e.coneLeftSide.Cone.LeftSide = t, this.LookForIntersectionOfObstacleSideAndLeftConeSide(e.Site, e.EndVertex), this.TryCreateConeClosureForLeftSide(t);
		}
		else this.Z = this.GetZP(e.Site);
	}
	TryCreateConeClosureForLeftSide(e) {
		if (e.Cone.RightSide instanceof Vt) {
			let t = e.Cone.RightSide;
			y.getTriangleOrientation(t.Start, t.Start.add(t.Direction), e.EndVertex.point) == _.Clockwise && this.CreateConeClosureEvent(e, t);
		}
	}
	CreateConeClosureEvent(e, t) {
		let n = y.RayIntersectsRayInteriors(e.start, e.Direction, t.Start, t.Direction);
		if (n) {
			let t = new zt(n, e.Cone);
			this.EnqueueEvent(t);
		}
	}
	ProcessRightIntersectionEvent(e) {
		if (e.coneRightSide.Removed) this.Z = this.GetZP(e.Site);
		else {
			this.RemoveSegFromRightTree(e.coneRightSide), this.Z = this.GetZP(e.Site);
			let t = new Lt(e.Site, e.EndVertex, e.coneRightSide);
			this.InsertToTree(this.rightConeSides, t), e.coneRightSide.Cone.RightSide = t, this.LookForIntersectionOfObstacleSideAndRightConeSide(e.Site, e.EndVertex), this.TryCreateConeClosureForRightSide(t);
		}
	}
	TryCreateConeClosureForRightSide(e) {
		if (e.Cone.LeftSide instanceof Bt) {
			let t = e.Cone.LeftSide;
			y.getTriangleOrientation(t.Start, t.Start.add(t.Direction), e.EndVertex.point) == _.Counterclockwise && this.CreateConeClosureEvent(e, t);
		}
	}
	RemoveConesClosedBySegment(e, t) {
		this.CloseConesCoveredBySegment(e, t, this.GetZP(e) > this.GetZP(t) ? this.leftConeSides : this.rightConeSides);
	}
	CloseConesCoveredBySegment(e, t, n) {
		let r = n.findFirst((t) => y.getTriangleOrientation(t.Start, t.Start.add(t.Direction), e) === _.Counterclockwise);
		if (r == null || !y.IntervalIntersectsRay(e, t, r.item.Start, r.item.Direction)) return;
		let i = [];
		do
			i.push(r.item.Cone), r = n.next(r);
		while (r != null && y.IntervalIntersectsRay(e, t, r.item.Start, r.item.Direction) !== void 0);
		for (let e of i) this.RemoveCone(e);
	}
	ProcessVertexEvent(e) {
		this.Z = this.GetZS(e), this.GoOverConesSeeingVertexEvent(e), this.AddConeAndEnqueueEvents(e);
	}
	static Diamond(e) {
		return _e.mkDiamond(2, 2, e);
	}
	AddConeAndEnqueueEvents(e) {
		if (e instanceof qt) {
			let t = e.Vertex.nextOnPolyline;
			this.CloseConesAddConeAtLeftVertex(e, t);
		} else if (e instanceof Xt) {
			let t = e.Vertex.prevOnPolyline;
			this.CloseConesAddConeAtRightVertex(e, t);
		} else this.CloseConesAddConeAtLeftVertex(e, e.Vertex.nextOnPolyline), this.CloseConesAddConeAtRightVertex(e, e.Vertex.prevOnPolyline);
	}
	CloseConesAddConeAtRightVertex(e, t) {
		let n = e.Vertex.nextOnPolyline.point;
		this.directionPerp.dot(e.Site.sub(n)) > u.distanceEpsilon && this.RemoveConesClosedBySegment(n, e.Vertex.point), this.directionPerp.dot(t.point.sub(e.Site)) > u.distanceEpsilon && this.RemoveConesClosedBySegment(e.Site, t.point);
		let r = e.Site, i = r.add(this.ConeLeftSideDirection), a = r.add(this.ConeRightSideDirection), o = t.point;
		this.GetZP(r.sub(n)) > u.distanceEpsilon && this.RemoveRightSide(new Yt(e.Vertex.nextOnPolyline)), this.GetZP(r.sub(t.point)) > u.distanceEpsilon && this.RemoveLeftSide(new Kt(t)), this.GetZP(o) + u.distanceEpsilon < this.GetZS(e) && this.CreateConeOnVertex(e), y.PointToTheRightOfLineOrOnLine(o, r, i) ? y.PointToTheLeftOfLineOrOnLine(o, r, a) ? this.CaseToTheLeftOfLineOrOnLineConeRp(e, t) : (this.GetZP(o.sub(r)) > u.distanceEpsilon && (this.LookForIntersectionOfObstacleSideAndLeftConeSide(e.Site, t), this.InsertRightSide(new Yt(e.Vertex))), this.EnqueueRightVertexEvent(new Xt(t))) : (this.CreateConeOnVertex(e), y.PointToTheLeftOfLineOrOnLine(o.add(this.DirectionPerp), o, r) && this.EnqueueRightVertexEvent(new Xt(t)));
	}
	CaseToTheLeftOfLineOrOnLineConeRp(e, t) {
		this.EnqueueRightVertexEvent(new Xt(t));
		let n = new Rt(e.Vertex.point, this), r = new Lt(n.Apex, t, new Bt(n));
		n.LeftSide = r, n.RightSide = new Vt(n);
		let i = this.InsertToTree(this.rightConeSides, n.RightSide);
		this.LookForIntersectionWithConeRightSide(i);
		let a = this.InsertToTree(this.leftConeSides, n.LeftSide);
		this.FixConeLeftSideIntersections(r, a), this.GetZP(t.point.sub(e.Site)) > u.distanceEpsilon && this.InsertRightSide(new Yt(e.Vertex));
	}
	LookForIntersectionOfObstacleSideAndRightConeSide(e, t) {
		let n = this.GetLastNodeToTheLeftOfPointInRightSegmentTree(e);
		if (n != null && n.item instanceof Vt) {
			let r = y.IntervalIntersectsRay(e, t.point, n.item.Start, this.ConeRightSideDirection);
			r && this.SegmentIsNotHorizontal(r, t.point) && this.EnqueueEvent(this.CreateRightIntersectionEvent(n.item, r, t));
		}
	}
	CreateRightIntersectionEvent(e, t, n) {
		return new Jt(e, t, n);
	}
	GetLastNodeToTheLeftOfPointInRightSegmentTree(t) {
		return this.rightConeSides.findLast((n) => e.PointIsToTheRightOfSegment(t, n));
	}
	LookForIntersectionOfObstacleSideAndLeftConeSide(e, t) {
		let n = this.GetFirstNodeToTheRightOfPoint(e);
		if (n == null || !(n.item instanceof Bt)) return;
		let r = n.item, i = y.IntervalIntersectsRay(e, t.point, r.Start, this.ConeLeftSideDirection);
		i && this.EnqueueEvent(new Ut(r, i, t));
	}
	GetFirstNodeToTheRightOfPoint(t) {
		return this.leftConeSides.findFirst((n) => e.PointIsToTheLeftOfSegment(t, n));
	}
	static PointIsToTheLeftOfSegment(e, t) {
		return y.getTriangleOrientation(t.Start, t.Start.add(t.Direction), e) === _.Counterclockwise;
	}
	static PointIsToTheRightOfSegment(e, t) {
		return y.getTriangleOrientation(t.Start, t.Start.add(t.Direction), e) === _.Clockwise;
	}
	FixConeLeftSideIntersections(e, t) {
		do
			t = this.leftConeSides.next(t);
		while (t != null && y.PointToTheRightOfLineOrOnLine(e.Start, t.item.Start, t.item.Start.add(t.item.Direction)));
		if (t != null && t.item instanceof Bt) {
			let n = t.item, r = y.IntervalIntersectsRay(e.start, e.End, n.Start, n.Direction);
			r && this.EnqueueEvent(new Ut(n, r, e.EndVertex));
		}
	}
	InsertToTree(e, t) {
		return this.coneSideComparer.SetOperand(t), e.insert(t);
	}
	CloseConesAddConeAtLeftVertex(e, t) {
		let n = e.Vertex.prevOnPolyline.point;
		e.Site.sub(n).dot(this.directionPerp) < -u.distanceEpsilon && this.RemoveConesClosedBySegment(e.Site, n), t.point.sub(e.Site).dot(this.directionPerp) < -u.distanceEpsilon && this.RemoveConesClosedBySegment(t.point, e.Site);
		let r = e.Site, i = r.add(this.ConeLeftSideDirection), a = r.add(this.ConeRightSideDirection), o = t.point;
		this.GetZP(r.sub(n)) > u.distanceEpsilon && this.RemoveLeftSide(new Kt(e.Vertex.prevOnPolyline));
		let s = this.GetZP(o) - this.Z;
		s < -u.distanceEpsilon && this.RemoveRightSide(new Yt(t));
		let c = o.sub(e.Site);
		if (s < -u.distanceEpsilon || m(s, 0) && this.GetZP(c) > 0 && c.dot(this.directionPerp) > -u.distanceEpsilon) this.CreateConeOnVertex(e);
		else if (!y.PointToTheLeftOfLineOrOnLine(o, r, a)) this.CreateConeOnVertex(e), this.EnqueueEvent(new qt(t));
		else if (y.PointToTheLeftOfLineOrOnLine(o, r, i)) this.EnqueueEvent(new qt(t)), this.GetZP(c) > u.distanceEpsilon && (this.LookForIntersectionOfObstacleSideAndRightConeSide(e.Site, t), this.InsertLeftSide(new Kt(e.Vertex)));
		else {
			this.EnqueueEvent(new qt(t));
			let n = new Rt(e.Vertex.point, this), r = new Lt(e.Vertex.point, t, new Vt(n));
			n.RightSide = r, n.LeftSide = new Bt(n), this.LookForIntersectionWithConeLeftSide(this.InsertToTree(this.leftConeSides, n.LeftSide));
			let i = this.InsertToTree(this.rightConeSides, r);
			this.FixConeRightSideIntersections(r, i), this.GetZP(c) > u.distanceEpsilon && this.InsertLeftSide(new Kt(e.Vertex));
		}
	}
	RemoveCone(e) {
		e.Removed = !0, this.RemoveSegFromLeftTree(e.LeftSide), this.RemoveSegFromRightTree(e.RightSide);
	}
	RemoveSegFromRightTree(e) {
		this.coneSideComparer.SetOperand(e);
		let t = this.rightConeSides.remove(e);
		if (e.Removed = !0, t == null) {
			let n = this.Z;
			this.Z = Math.max(this.GetZP(e.Start), this.Z - .01), this.coneSideComparer.SetOperand(e), t = this.rightConeSides.remove(e), this.Z = n;
		}
	}
	RemoveSegFromLeftTree(e) {
		if (e.Removed = !0, this.coneSideComparer.SetOperand(e), this.leftConeSides.remove(e) == null) {
			let t = this.Z;
			this.Z = Math.max(this.GetZP(e.Start), this.Z - .01), this.coneSideComparer.SetOperand(e), this.leftConeSides.remove(e), this.Z = t;
		}
	}
	FixConeRightSideIntersections(e, t) {
		do
			t = this.rightConeSides.previous(t);
		while (t != null && y.PointToTheLeftOfLineOrOnLine(e.start, t.item.Start, t.item.Start.add(t.item.Direction)));
		if (t != null) {
			let n;
			if (t.item instanceof Vt) {
				let r = t.item;
				(n = y.IntervalIntersectsRay(e.start, e.End, r.Start, r.Direction)) && this.EnqueueEvent(this.CreateRightIntersectionEvent(r, n, e.EndVertex));
			}
		}
	}
	CreateConeOnVertex(e) {
		let t = new Rt(e.Site, this);
		t.LeftSide = new Bt(t), t.RightSide = new Vt(t);
		let n = this.InsertToTree(this.leftConeSides, t.LeftSide), r = this.InsertToTree(this.rightConeSides, t.RightSide);
		this.LookForIntersectionWithConeRightSide(r), this.LookForIntersectionWithConeLeftSide(n);
	}
	LookForIntersectionWithConeLeftSide(e) {
		if (e.item instanceof Bt) {
			let t = e.item, n = this.FindFirstObstacleSideToTheLeftOfPoint(t.Start);
			n != null && this.TryIntersectionOfConeLeftSideAndObstacleSide(t, n);
		} else {
			let t = e.item;
			e = this.leftConeSides.next(e), e != null && e.item instanceof Bt && this.TryIntersectionOfConeLeftSideAndObstacleConeSide(e.item, t);
		}
	}
	LookForIntersectionWithConeRightSide(e) {
		if (e.item instanceof Vt) {
			let t = e.item, n = this.FindFirstObstacleSideToToTheRightOfPoint(t.Start);
			n != null && this.TryIntersectionOfConeRightSideAndObstacleSide(t, n);
		} else {
			let t = e.item;
			e = this.rightConeSides.previous(e), e != null && e.item instanceof Vt && this.TryIntersectionOfConeRightSideAndObstacleConeSide(e.item, t);
		}
	}
	TryIntersectionOfConeRightSideAndObstacleConeSide(e, t) {
		let n = y.IntervalIntersectsRay(t.start, t.End, e.Start, e.Direction);
		n && this.EnqueueEvent(this.CreateRightIntersectionEvent(e, n, t.EndVertex));
	}
	TryIntersectionOfConeRightSideAndObstacleSide(e, t) {
		let n = y.IntervalIntersectsRay(t.Start, t.End, e.Start, e.Direction);
		n && this.EnqueueEvent(this.CreateRightIntersectionEvent(e, n, t.EndVertex));
	}
	TryIntersectionOfConeLeftSideAndObstacleConeSide(e, t) {
		let n = y.IntervalIntersectsRay(t.start, t.End, e.Start, e.Direction);
		n && this.EnqueueEvent(new Ut(e, n, t.EndVertex));
	}
	TryIntersectionOfConeLeftSideAndObstacleSide(e, t) {
		let n = y.IntervalIntersectsRay(t.Start, t.End, e.Start, e.Direction);
		n && this.EnqueueEvent(new Ut(e, n, t.EndVertex));
	}
	ExtendSegmentToZ(e) {
		let t = e.Direction.dot(this.SweepDirection), n = (this.Z + 40 - e.Start.dot(this.SweepDirection)) / t;
		return S.mkPP(e.Start, e.Start.add(e.Direction.mul(n)));
	}
	GoOverConesSeeingVertexEvent(t) {
		let n = this.FindFirstSegmentInTheRightTreeNotToTheLeftOfVertex(t);
		if (n == null) return;
		let r = n.item.Cone, i = r.LeftSide;
		if (e.VertexIsToTheLeftOfSegment(t, i)) return;
		let a = [r];
		if (this.coneSideComparer.SetOperand(i), n = this.leftConeSides.find(i), n == null) {
			let e = this.Z;
			this.Z = Math.max(this.GetZP(i.Start), this.PreviousZ), this.coneSideComparer.SetOperand(i), n = this.leftConeSides.find(i), this.Z = e;
		}
		if (!(n == null && (n = this.GetRbNodeEmergency(i), n == null))) {
			for (n = this.leftConeSides.next(n); n != null && !e.VertexIsToTheLeftOfSegment(t, n.item);) a.push(n.item.Cone), n = this.leftConeSides.next(n);
			for (let e of a) this.AddEdgeAndRemoveCone(e, t.Site);
		}
	}
	GetRbNodeEmergency(e) {
		if (this.leftConeSides.count === 0) return null;
		for (let t = this.leftConeSides.treeMinimum(); t != null; t = this.leftConeSides.next(t)) if (t.item === e) return t;
		return null;
	}
	static VertexIsToTheLeftOfSegment(e, t) {
		return y.getTriangleOrientation(t.Start, t.Start.add(t.Direction), e.Site) === _.Counterclockwise;
	}
	static VertexIsToTheRightOfSegment(e, t) {
		return y.getTriangleOrientation(t.Start, t.Start.add(t.Direction), e.Site) === _.Clockwise;
	}
	FindFirstSegmentInTheRightTreeNotToTheLeftOfVertex(t) {
		return this.rightConeSides.findFirst((n) => !e.VertexIsToTheRightOfSegment(t, n));
	}
	EnqueueRightVertexEvent(e) {
		this.GetZP(e.Site.sub(e.Vertex.prevOnPolyline.point)) > u.tolerance || this.EnqueueEvent(e);
	}
	invariant() {
		for (let e of this.leftConeSides) if (e.Removed) return !1;
		for (let e of this.rightConeSides) if (e.Removed) return !1;
		return !0;
	}
}, Qt = class e extends B {
	constructor(e, t) {
		super(null), this.coneAngle = Math.PI / 6, this.ports = new R(), this._obstacles = Array.from(W.OrientHolesClockwise(e)), this._visibilityGraph = t;
	}
	static mk(t, n, r, i, a) {
		let o = new e(t, n);
		return o.Ports = i, o.BorderPolyline = a, o.ConeAngle = r, o;
	}
	get ConeAngle() {
		return this.coneAngle;
	}
	set ConeAngle(e) {
		this.coneAngle = e;
	}
	get Ports() {
		return this.ports;
	}
	set Ports(e) {
		this.ports = e;
	}
	get BorderPolyline() {
		return this.borderPolyline;
	}
	set BorderPolyline(e) {
		this.borderPolyline = e;
	}
	get Bidirectional() {
		return this._bidirectional;
	}
	set Bidirectional(e) {
		this._bidirectional = e;
	}
	static GetTotalSteps(e) {
		return Math.floor((2 * Math.PI - e / 2) / e) + 1;
	}
	run() {
		let e = 2 * Math.PI - this.coneAngle / 2;
		if (this.Bidirectional) this.HandleBideractionalCase();
		else {
			let t;
			for (let n = 0; (t = this.coneAngle * n) <= e; n++) super.ProgressStep(), this.AddDirection(new y(Math.cos(t), Math.sin(t)), this.BorderPolyline, this._visibilityGraph);
		}
	}
	HandleBideractionalCase() {
		let e = Math.PI / this.coneAngle;
		for (let t = 0; t < e; t++) {
			let e = t * this.coneAngle, n = new W();
			this.AddDirection(new y(Math.cos(e), Math.sin(e)), this.BorderPolyline, n);
			let r = new W();
			this.AddDirection(new y(Math.cos(e) * -1, Math.sin(e) * -1), this.BorderPolyline, r), this.AddIntersectionOfBothDirectionSweepsToTheResult(n, r);
		}
	}
	AddIntersectionOfBothDirectionSweepsToTheResult(e, t) {
		for (let n of e.Edges) t.FindEdgePP(n.SourcePoint, n.TargetPoint) != null && this._visibilityGraph.AddEdgePP(n.SourcePoint, n.TargetPoint);
	}
	AddDirection(e, t, n) {
		Zt.Sweep(this._obstacles, e, this.coneAngle, n, this.Ports, t);
	}
}, $t = class e extends yt {
	mk(t, n) {
		let r = new e(t);
		return r.HookSize = n, r;
	}
	constructor(e) {
		super(), this.adjustmentAngle = Math.PI / 10, this.hookSize = 9, this.curve = e, this.location = this.curve().start;
	}
	get Location() {
		return this.location;
	}
	get Curve() {
		return this.curve();
	}
	SetLocation(e) {
		this.location = e;
	}
	get AdjustmentAngle() {
		return this.adjustmentAngle;
	}
	set AdjustmentAngle(e) {
		this.adjustmentAngle = e;
	}
	get HookSize() {
		return this.hookSize;
	}
	set HookSize(e) {
		this.hookSize = e;
	}
}, en = class e extends xt {
	get LoosePolyline() {
		return this.loosePolyline;
	}
	set LoosePolyline(e) {
		this.loosePolyline = e;
	}
	constructor(e, t, n = new y(0, 0)) {
		super(e, t, n);
	}
	static mk(t, n) {
		return new e(t, n);
	}
}, tn = class e extends yt {
	get Location() {
		return this.curve.value(this.parameter);
	}
	set Location(e) {
		throw Error("Method should not be called.");
	}
	static mk(t, n) {
		let r = new e();
		return r.curve = t, r.parameter = n, r;
	}
	get Parameter() {
		return this.parameter;
	}
	set Parameter(e) {
		this.parameter = e;
	}
	get Curve() {
		return this.curve;
	}
	set Curve(e) {
		this.curve = e;
	}
}, nn = class e {
	constructor() {
		this.capacityOverflowCoefficient = e.DefaultCapacityOverflowCoefficientMultiplier, this.RotateBundles = !1, this.MaxHubRadius = 50, this.MinHubRadius = .1, this.CreateUnderlyingPolyline = !1, this.pathLengthImportance = e.DefaultPathLengthImportance, this.inkImportance = e.DefaultInkImportance, this.edgeSeparation = e.DefaultEdgeSeparation, this._edgeWidthShrinkCoeff = 1, this.useCubicBezierSegmentsInsideOfHubs = !1, this.angleThreshold = Math.PI / 180 * 45, this.hubRepulsionImportance = 100, this.bundleRepulsionImportance = 100, this.minimalRatioOfGoodCdtEdges = .9, this.highestQuality = !0, this.KeepOverlaps = !1, this.StopAfterShortestPaths = !1;
	}
	toJSON() {
		let t = {};
		return this.capacityOverflowCoefficient != e.DefaultCapacityOverflowCoefficientMultiplier && (t.capacityOverflowCoefficient = this.capacityOverflowCoefficient), this.RotateBundles && (t.RotateBundles = this.RotateBundles), this.MaxHubRadius != 50 && (t.MaxHubRadius = this.MaxHubRadius), this.MinHubRadius != .1 && (t.MinHubRadius = this.MinHubRadius), this.CreateUnderlyingPolyline && (t.CreateUnderlyingPolyline = this.CreateUnderlyingPolyline), this.pathLengthImportance != e.DefaultPathLengthImportance && (t.pathLengthImportance = this.pathLengthImportance), this.inkImportance != e.DefaultInkImportance && (t.inkImportance = this.inkImportance), this.edgeSeparation != e.DefaultEdgeSeparation && (t.edgeSeparation = this.edgeSeparation), this._edgeWidthShrinkCoeff != 1 && (t._edgeWidthShrinkCoeff = this._edgeWidthShrinkCoeff), this.useCubicBezierSegmentsInsideOfHubs && (t.useCubicBezierSegmentsInsideOfHubs = this.useCubicBezierSegmentsInsideOfHubs), this.angleThreshold != Math.PI / 180 * 45 && (t.angleThreshold = this.angleThreshold), this.hubRepulsionImportance != 100 && (t.hubRepulsionImportance = this.hubRepulsionImportance), this.bundleRepulsionImportance != 100 && (t.bundleRepulsionImportance = this.bundleRepulsionImportance), this.minimalRatioOfGoodCdtEdges != .9 && (t.minimalRatioOfGoodCdtEdges = this.minimalRatioOfGoodCdtEdges), this.highestQuality || (t.highestQuality = this.highestQuality), this.KeepOverlaps && (t.KeepOverlaps = this.KeepOverlaps), this.StopAfterShortestPaths && (t.StopAfterShortestPaths = this.StopAfterShortestPaths), t;
	}
	static createFromJSON(t) {
		let n = new e();
		return t.capacityOverflowCoefficient && (n.capacityOverflowCoefficient = t.capacityOverflowCoefficient), t.RotateBundles && (n.RotateBundles = t.RotateBundles), t.MaxHubRadius && (n.MaxHubRadius = t.MaxHubRadius), t.MinHubRadius && (n.MinHubRadius = t.MinHubRadius), t.CreateUnderlyingPolyline && (n.CreateUnderlyingPolyline = t.CreateUnderlyingPolyline), t.pathLengthImportance && (n.pathLengthImportance = t.pathLengthImportance), t.inkImportance && (n.inkImportance = t.inkImportance), t.edgeSeparation && (n.edgeSeparation = t.edgeSeparation), t._edgeWidthShrinkCoeff && (n._edgeWidthShrinkCoeff = t._edgeWidthShrinkCoeff), t.useCubicBezierSegmentsInsideOfHubs && (n.useCubicBezierSegmentsInsideOfHubs = t.useCubicBezierSegmentsInsideOfHubs), t.angleThreshold && (n.angleThreshold = t.angleThreshold), t.hubRepulsionImportance && (n.hubRepulsionImportance = t.hubRepulsionImportance), t.bundleRepulsionImportance && (n.bundleRepulsionImportance = t.bundleRepulsionImportance), t.minimalRatioOfGoodCdtEdges && (n.minimalRatioOfGoodCdtEdges = t.minimalRatioOfGoodCdtEdges), t.highestQuality && (n.HighestQuality = t.highestQuality), t.KeepOverlaps && (n.KeepOverlaps = t.KeepOverlaps), t.StopAfterShortestPaths && (n.StopAfterShortestPaths = t.StopAfterShortestPaths), n;
	}
	get CapacityOverflowCoefficient() {
		return this.capacityOverflowCoefficient;
	}
	set CapacityOverflowCoefficient(e) {
		this.capacityOverflowCoefficient = e;
	}
	get PathLengthImportance() {
		return this.pathLengthImportance;
	}
	set PathLengthImportance(e) {
		this.pathLengthImportance = e;
	}
	get InkImportance() {
		return this.inkImportance;
	}
	set InkImportance(e) {
		this.inkImportance = e;
	}
	get EdgeSeparation() {
		return this.edgeSeparation;
	}
	set EdgeSeparation(e) {
		this.edgeSeparation = e;
	}
	get edgeWidthShrinkCoeff() {
		return this._edgeWidthShrinkCoeff;
	}
	set edgeWidthShrinkCoeff(e) {
		this._edgeWidthShrinkCoeff = e;
	}
	ActualEdgeWidth(e, t = this.edgeWidthShrinkCoeff) {
		return t * (this.edgeSeparation + e.lineWidth);
	}
	get UseCubicBezierSegmentsInsideOfHubs() {
		return this.useCubicBezierSegmentsInsideOfHubs;
	}
	set UseCubicBezierSegmentsInsideOfHubs(e) {
		this.useCubicBezierSegmentsInsideOfHubs = e;
	}
	get AngleThreshold() {
		return this.angleThreshold;
	}
	set AngleThreshold(e) {
		this.angleThreshold = e;
	}
	get HubRepulsionImportance() {
		return this.hubRepulsionImportance;
	}
	set HubRepulsionImportance(e) {
		this.hubRepulsionImportance = e;
	}
	get BundleRepulsionImportance() {
		return this.bundleRepulsionImportance;
	}
	set BundleRepulsionImportance(e) {
		this.bundleRepulsionImportance = e;
	}
	get MinimalRatioOfGoodCdtEdges() {
		return this.minimalRatioOfGoodCdtEdges;
	}
	set MinimalRatioOfGoodCdtEdges(e) {
		this.minimalRatioOfGoodCdtEdges = e;
	}
	get HighestQuality() {
		return this.highestQuality;
	}
	set HighestQuality(e) {
		this.highestQuality = e;
	}
};
nn.DefaultCapacityOverflowCoefficientMultiplier = 1e3, nn.DefaultPathLengthImportance = 500, nn.DefaultInkImportance = .01, nn.DefaultEdgeSeparation = .5;
//#endregion
//#region node_modules/@msagl/core/dist/routing/RelativeShape.js
var rn = class extends vt {
	get BoundaryCurve() {
		return this.node.boundaryCurve;
	}
	set BoundaryCurve(e) {
		if (e) throw Error("Cannot set BoundaryCurve directly for RelativeShape");
	}
	constructor(e) {
		super(null), this.node = e;
	}
}, an = class e {
	static GetShapes(t, n) {
		let r = /* @__PURE__ */ new Map();
		for (let n of t) e.ProcessAncestorDescendantCouple(n.target, n.source, r), e.InsertEdgePortsToShapes(r, n);
		for (let t of n) e.ProcessAncestorDescendantCouple(t.source, t.target, r), e.InsertEdgePortsToShapes(r, t);
		return e.BindShapes(r), Array.from(r.values());
	}
	static InsertEdgePortsToShapes(e, t) {
		e.get(t.target).Ports.add(t.targetPort), e.get(t.source).Ports.add(t.sourcePort);
	}
	static BindShapes(e) {
		for (let [t, n] of e) {
			if (!(t instanceof mt)) continue;
			let r = t;
			for (let t of sn(r)) {
				let r = e.get(t);
				r && n.AddChild(r);
			}
		}
	}
	static ProcessAncestorDescendantCouple(t, n, r) {
		let i = on(n);
		do {
			for (let t of sn(i)) e.CreateShapeIfNeeeded(t, r);
			if (i === t) break;
			i = on(i);
		} while (!0);
		e.CreateShapeIfNeeeded(i, r);
	}
	static CreateShapeIfNeeeded(e, t) {
		t.has(e) || t.set(e, new rn(e));
	}
	static NumberOfActiveNodesIsUnderThreshold(t, n, r) {
		let i = /* @__PURE__ */ new Set();
		for (let n of t) if (e.SetOfActiveNodesIsLargerThanThreshold(n.target, n.source, i, r)) return !1;
		for (let t of n) if (e.SetOfActiveNodesIsLargerThanThreshold(t.source, t.target, i, r)) return !1;
		return !0;
	}
	static SetOfActiveNodesIsLargerThanThreshold(e, t, n, r) {
		let i = on(t);
		for (;;) {
			for (let e of sn(i)) if (n.add(e), n.size > r) return !0;
			if (i === e) break;
			i = on(i);
		}
		return n.add(i), n.size > r;
	}
};
function on(e) {
	let t = e.node.parent;
	return c.getGeom(t);
}
function* sn(e) {
	for (let t of e.graph.shallowNodes) yield c.getGeom(t);
}
//#endregion
//#region node_modules/@msagl/core/dist/math/geometry/convexHull.js
var cn = class e {
	constructor(e) {
		this.stamp = 0, this.SetPivotAndAllocateHullPointsArray(e);
	}
	SetPivotAndAllocateHullPointsArray(e) {
		this.pivot = new y(0, 2 ** 53 - 1);
		let t = -1, n = 0;
		for (let r of e) (r.y < this.pivot.y || r.y === this.pivot.y && r.x > this.pivot.x) && (this.pivot = r, t = n), n++;
		if (n >= 1) {
			this.hullPoints = Array(n - 1), n = 0;
			for (let r of e) n === t ? t = -1 : this.hullPoints[n++] = {
				point: r,
				deleted: !1,
				stamp: this.stamp++
			};
		}
	}
	get StackTopPoint() {
		return this.stack.point;
	}
	get StackSecondPoint() {
		return this.stack.next.point;
	}
	static *CalculateConvexHull(t) {
		let n = new e(t);
		for (let e of n.Calculate()) yield e;
	}
	*Calculate() {
		if (this.pivot.y !== 2 ** 53 - 1) {
			if (this.hullPoints.length === 0) {
				yield this.pivot;
				return;
			}
			this.SortAllPointsWithoutPivot(), this.Scan();
			for (let e of this.EnumerateStack()) yield e;
		}
	}
	*EnumerateStack() {
		let e = this.stack;
		for (; e != null;) yield e.point, e = e.next;
	}
	Scan() {
		let e = 0;
		for (; this.hullPoints[e].deleted;) e++;
		for (this.stack = {
			point: this.pivot,
			next: null
		}, this.Push(e++), e < this.hullPoints.length && (this.hullPoints[e].deleted ? e++ : this.Push(e++)); e < this.hullPoints.length;) this.hullPoints[e].deleted ? e++ : this.LeftTurn(e) ? this.Push(e++) : this.Pop();
		for (; this.StackHasMoreThanTwoPoints() && !this.LeftTurnToPivot();) this.Pop();
	}
	LeftTurnToPivot() {
		return y.getTriangleOrientation(this.StackSecondPoint, this.StackTopPoint, this.pivot) === _.Counterclockwise;
	}
	StackHasMoreThanTwoPoints() {
		return this.stack.next != null && this.stack.next.next != null;
	}
	Pop() {
		this.stack = this.stack.next;
	}
	LeftTurn(e) {
		if (this.stack.next == null) return !0;
		let t = y.getTriangleOrientationWithIntersectionEpsilon(this.StackSecondPoint, this.StackTopPoint, this.hullPoints[e].point);
		return t === _.Counterclockwise ? !0 : t === _.Clockwise ? !1 : this.BackSwitchOverPivot(this.hullPoints[e].point);
	}
	BackSwitchOverPivot(e) {
		return this.stack.next.next == null ? this.StackTopPoint.x > this.pivot.x + u.distanceEpsilon && e.x < this.pivot.x - u.distanceEpsilon : !1;
	}
	Push(e) {
		this.stack = {
			point: this.hullPoints[e].point,
			next: this.stack
		};
	}
	SortAllPointsWithoutPivot() {
		this.hullPoints.sort(ln(this.pivot));
	}
	static createConvexHullAsClosedPolyline(t) {
		return D.mkClosedFromPoints(Array.from(e.CalculateConvexHull(t)));
	}
};
function ln(e) {
	return (t, n) => {
		if (t === n) return 0;
		if (t == null) return -1;
		if (n == null) return 1;
		switch (y.getTriangleOrientationWithIntersectionEpsilon(e, t.point, n.point)) {
			case _.Counterclockwise: return -1;
			case _.Clockwise: return 1;
			case _.Collinear:
				let r = t.point.x - e.x, i = n.point.x - e.x;
				if (r > u.distanceEpsilon && i < -u.distanceEpsilon) return -1;
				if (r < -u.distanceEpsilon && i > u.distanceEpsilon) return 1;
				let a = t.point.sub(e), o = n.point.sub(e), s = a.l1 - o.l1;
				return s < 0 ? (t.deleted = !0, -1) : s > 0 ? (n.deleted = !0, 1) : (t.stamp > n.stamp ? t.deleted = !0 : n.deleted = !0, 0);
		}
		throw Error();
	};
}
//#endregion
//#region node_modules/@msagl/core/dist/math/geometry/RTree/rectangleNodeUtils.js
function un(e, t, n) {
	e.irect.intersects_rect(t.irect) && (e.Left == null ? t.Left == null ? n(e.UserData, t.UserData) : (un(e, t.Left, n), un(e, t.Right, n)) : t.Left == null ? (un(e.Left, t, n), un(e.Right, t, n)) : (un(e.Left, t.Left, n), un(e.Left, t.Right, n), un(e.Right, t.Left, n), un(e.Right, t.Right, n)));
}
function G(e, t, n) {
	e.irect.intersects_rect(t.irect) && (e === t ? pn(e, n) : e.Left == null ? t.Left == null ? n(e.UserData, t.UserData) : (G(e, t.Left, n), G(e, t.Right, n)) : t.Left == null ? (G(e.Left, t, n), G(e.Right, t, n)) : (G(e.Left, t.Left, n), G(e.Left, t.Right, n), G(e.Right, t.Left, n), G(e.Right, t.Right, n)));
}
function dn(e, t, n) {
	if (!e.irect.intersects_rect(t.irect)) return !1;
	if (e === t) return fn(e, n);
	if (e.Left == null) {
		if (t.Left == null) return n(e.UserData, t.UserData);
		if (dn(e, t.Left, n) || dn(e, t.Right, n)) return !0;
	} else if (t.Left != null) {
		if (dn(e.Left, t.Left, n) || dn(e.Left, t.Right, n) || dn(e.Right, t.Left, n) || dn(e.Right, t.Right, n)) return !0;
	} else if (dn(e.Left, t, n) || dn(e.Right, t, n)) return !0;
	return !1;
}
function fn(e, t) {
	return e.Left == null ? !1 : dn(e.Left, e.Left, t) || dn(e.Left, e.Right, t) || dn(e.Right, e.Right, t);
}
function pn(e, t) {
	e.Left != null && (G(e.Left, e.Left, t), G(e.Left, e.Right, t), G(e.Right, e.Right, t));
}
//#endregion
//#region node_modules/reliable-random/dist/index.esm.js
var mn = BigInt("6364136223846793005"), hn = (BigInt(1) << BigInt(32)) - BigInt(1), gn = (BigInt(1) << BigInt(64)) - BigInt(1), _n = class {
	constructor(e, t) {
		this._state = BigInt(0), this._inc = (BigInt(t) << BigInt(1) | BigInt(1)) & gn, this._random_b(), this._state = this._state + BigInt(e) & gn, this._random_b();
	}
	_random_b() {
		let e = this._state;
		this._state = e * mn + this._inc & gn;
		let t = (e >> BigInt(18) ^ e) >> BigInt(27), n = e >> BigInt(59), r = n ^ BigInt(31);
		return (t >> n | t << r) & hn;
	}
	_advance(e) {
		e &= gn;
		let t = BigInt(1), n = mn, r = BigInt(0), i = this._inc;
		for (; e > 0;) e & BigInt(1) && (t = t * n & gn, r = r * n + i & gn), i = (n + BigInt(1)) * i & gn, n = n * n & gn, e >>= BigInt(1);
		this._state = t * this._state + r & gn;
	}
	randint(e) {
		if (e > hn) throw TypeError(`Bound too large: ${e}`);
		if (e <= 0) throw TypeError(`Empty sample space for r: 0 ≤ r < ${e}`);
		let t = BigInt(e), n = (hn ^ t) % t;
		for (;;) {
			let e = this._random_b();
			if (e >= n) return Number(e % t);
		}
	}
	random() {
		return Number(this._random_b()) / 2 ** 32;
	}
}, vn;
function yn(e) {
	return vn ??= new _n(0, 0), vn.randint(e);
}
function bn(e) {
	vn = new _n(e, 0);
}
function xn() {
	return vn ??= new _n(0, 0), vn.random();
}
//#endregion
//#region node_modules/@msagl/core/dist/math/graphAlgorithms/ConnectedComponentCalculator.js
function* Sn(e) {
	let t = Array(e.nodeCount).fill(!1), n = new i.Queue();
	for (let r = 0; r < e.nodeCount; r++) if (!t[r]) {
		let i = [];
		for (wn(r, n, t); n.length > 0;) {
			let r = n.dequeue();
			i.push(r);
			for (let i of Cn(e, r)) wn(i, n, t);
		}
		yield i;
	}
}
function* Cn(e, t) {
	for (let n of e.outEdges[t]) yield n.target;
	for (let n of e.inEdges[t]) yield n.source;
}
function wn(e, t, n) {
	n[e] === !1 && (t.enqueue(e), n[e] = !0);
}
//#endregion
//#region node_modules/@msagl/core/dist/structs/basicGraphOnEdges.js
function Tn(e) {
	let t = new On();
	return t.SetEdges(e, On.vertexCount(e)), t;
}
function En(e) {
	let t = new On();
	return t.SetEdges(e, On.vertexCount(e)), t;
}
function Dn(e, t) {
	let n = new On();
	return n.SetEdges(e, t), n;
}
var On = class e {
	constructor() {
		this.nodeCount = 0;
	}
	*incidentEdges(e) {
		for (let t of this.outEdges[e]) yield t;
		for (let t of this.inEdges[e]) yield t;
	}
	static deleteFromArray(e, t) {
		let n = e.indexOf(t, 0);
		n > -1 && e.splice(n, 1);
	}
	removeEdge(t) {
		e.deleteFromArray(this.edges, t), t.source === t.target ? e.deleteFromArray(this.selfEdges[t.source], t) : (e.deleteFromArray(this.outEdges[t.source], t), e.deleteFromArray(this.inEdges[t.target], t));
	}
	static vertexCount(e) {
		let t = 0;
		for (let n of e) n.source >= t && (t = n.source), n.target >= t && (t = n.target);
		return ++t;
	}
	SetEdges(e, t) {
		this.edges = e, this.nodeCount = t;
		let n = Array(this.nodeCount).fill(0), r = Array(this.nodeCount).fill(0), i = Array(this.nodeCount).fill(0);
		this.outEdges = Array(this.nodeCount), this.inEdges = Array(this.nodeCount), this.selfEdges = Array(this.nodeCount);
		for (let e of this.edges) e.source === e.target ? i[e.source]++ : (n[e.source]++, r[e.target]++);
		for (let e = 0; e < this.nodeCount; e++) this.outEdges[e] = Array(n[e]), n[e] = 0, this.inEdges[e] = Array(r[e]), r[e] = 0, this.selfEdges[e] = Array(i[e]), i[e] = 0;
		for (let e of this.edges) {
			let t = e.source, a = e.target;
			t === a ? this.selfEdges[t][i[t]++] = e : (this.outEdges[t][n[t]++] = e, this.inEdges[a][r[a]++] = e);
		}
	}
	inEdgesCount(e) {
		return this.inEdges[e].length;
	}
	outEdgesCount(e) {
		return this.outEdges[e].length;
	}
	selfEdgesCount(e) {
		return this.selfEdges[e].length;
	}
	addEdge(e) {
		this.edges.push(e), e.source === e.target ? this.selfEdges[e.source].push(e) : (this.outEdges[e.source].push(e), this.inEdges[e.target].push(e));
	}
	*nodesOfConnectedGraph() {
		if (this.edges.length === 0) return;
		let t = /* @__PURE__ */ new Set(), n = new i.Queue(), r = this.edges[0].source;
		for (e.enqueue(t, n, r), yield r; n.length > 0;) {
			r = n.dequeue();
			for (let i of this.outEdges[r]) {
				let r = i.target;
				t.has(r) || (e.enqueue(t, n, r), yield r);
			}
			for (let i of this.inEdges[r]) {
				let r = i.source;
				t.has(r) || (e.enqueue(t, n, r), yield r);
			}
		}
	}
	*pred(e) {
		for (let t of this.inEdges[e]) yield t.source;
	}
	*succ(e) {
		for (let t of this.outEdges[e]) yield t.target;
	}
	static enqueue(e, t, n) {
		t.enqueue(n), e.add(n);
	}
}, K;
(function(e) {
	e[e.Increasing = 0] = "Increasing", e[e.Decreasing = 1] = "Decreasing", e[e.Extremum = 2] = "Extremum";
})(K ||= {});
var kn = class {
	get Sequence() {
		return this.f;
	}
	set Sequence(e) {
		this.f = e;
	}
	get Length() {
		return this.length;
	}
	set Length(e) {
		this.length = e;
	}
	constructor(e, t) {
		this.f = e, this.length = t;
	}
	FindMinimum() {
		let e = 0, t = this.length - 1, n = e + Math.floor((t - e) / 2), r = this.f(n);
		if (r >= this.f(0) && r >= this.f(this.length - 1)) return this.f(0) < this.f(this.length - 1) ? 0 : this.length - 1;
		for (; t - e > 1;) switch (n = e + Math.floor((t - e) / 2), this.BehaviourAtIndex(n)) {
			case K.Decreasing:
				e = n;
				break;
			case K.Increasing:
				t = n;
				break;
			case K.Extremum: return n;
		}
		return e === t || this.f(e) <= this.f(t) ? e : t;
	}
	BehaviourAtIndex(e) {
		let t = this.f(e);
		if (e === 0) {
			let e = this.f(1);
			return e === t ? K.Extremum : e > t ? K.Increasing : K.Decreasing;
		}
		if (e === this.length - 1) {
			let e = this.f(this.length - 2);
			return e === t ? K.Extremum : e > t ? K.Decreasing : K.Increasing;
		}
		let n = t - this.f(e - 1);
		return n * (this.f(e + 1) - t) <= 0 ? K.Extremum : n > 0 ? K.Increasing : K.Decreasing;
	}
	FindMaximum() {
		let e = 0, t = this.length - 1, n = e + Math.floor((t - e) / 2), r = this.f(n);
		if (r <= this.f(0) && r <= this.f(this.length - 1)) return this.f(0) > this.f(this.length - 1) ? 0 : this.length - 1;
		for (; t - e > 1;) switch (n = e + Math.floor((t - e) / 2), this.BehaviourAtIndex(n)) {
			case K.Decreasing:
				t = n;
				break;
			case K.Increasing:
				e = n;
				break;
			case K.Extremum: return n;
		}
		return e === t || this.f(e) >= this.f(t) ? e : t;
	}
}, An = class {
	toArray() {
		let e = [];
		for (let t = 0; t < this.length; t++) e.push(this.f(t));
		return e;
	}
	constructor(e, t) {
		this.f = e, this.length = t;
	}
	GetAdjustedSequenceForMinimum() {
		let e = this.f(0), t = (this.f(this.length - 1) - e) / (this.length - 1);
		return (n) => Math.min(this.f(n), e + t * n);
	}
	GetAdjustedSequenceForMaximum() {
		let e = this.f(0), t = (this.f(this.length - 1) - e) / (this.length - 1);
		return (n) => Math.max(this.f(n), e + t * n);
	}
	FindMinimum() {
		return this.f(0) === this.f(this.length - 1) ? new kn(this.f, this.length).FindMinimum() : new kn(this.GetAdjustedSequenceForMinimum(), this.length).FindMinimum();
	}
	FindMaximum() {
		return this.f(0) === this.f(this.length - 1) ? new kn(this.f, this.length).FindMaximum() : new kn(this.GetAdjustedSequenceForMaximum(), this.length).FindMaximum();
	}
}, jn = class e {
	constructor(e, t) {
		this.P = e, this.Q = t;
	}
	LeftFromLineOnP(e, t, n) {
		let r = this.P.pnt(e);
		return this.upperBranchOnP ? y.pointToTheLeftOfLineOrOnLine(n, r, t) : y.pointToTheRightOfLineOrOnLine(n, r, t);
	}
	LeftFromLineOnQ(e, t, n) {
		let r = this.Q.pnt(e);
		return this.lowerBranchOnQ ? y.pointToTheLeftOfLineOrOnLine(n, r, t) : y.pointToTheRightOfLineOrOnLine(n, r, t);
	}
	PrevOnP(e) {
		return this.upperBranchOnP ? this.P.Prev(e) : this.P.Next(e);
	}
	PrevOnQ(e) {
		return this.lowerBranchOnQ ? this.Q.Prev(e) : this.Q.Next(e);
	}
	NextOnP(e) {
		return this.upperBranchOnP ? this.P.Next(e) : this.P.Prev(e);
	}
	NextOnQ(e) {
		return this.lowerBranchOnQ ? this.Q.Next(e) : this.Q.Prev(e);
	}
	MedianOnP(e, t) {
		return this.upperBranchOnP ? this.P.Median(e, t) : this.P.Median(t, e);
	}
	MedianOnQ(e, t) {
		return this.lowerBranchOnQ ? this.Q.Median(e, t) : this.Q.Median(t, e);
	}
	ModuleP(e, t) {
		return this.upperBranchOnP ? this.P.Module(t - e) : this.P.Module(e - t);
	}
	ModuleQ(e, t) {
		return this.lowerBranchOnQ ? this.Q.Module(t - e) : this.Q.Module(e - t);
	}
	TangentBetweenBranches(e, t, n, r) {
		for (; t !== e || r !== n;) {
			let i = t === e ? e : this.MedianOnP(e, t), a = r === n ? n : this.MedianOnQ(n, r), o = this.P.pnt(i), s = this.Q.pnt(a), c = !0;
			this.ModuleP(e, t) > 1 ? this.LeftFromLineOnP(this.NextOnP(i), o, s) ? e = i : this.LeftFromLineOnP(this.PrevOnP(i), o, s) ? t = i : c = !1 : t === e ? c = !1 : this.LeftFromLineOnP(t, this.P.pnt(e), s) ? e = t : this.LeftFromLineOnP(e, this.P.pnt(t), s) ? t = e : c = !1;
			let l = !0;
			this.ModuleQ(n, r) > 1 ? this.LeftFromLineOnQ(this.NextOnQ(a), s, o) ? n = a : this.LeftFromLineOnQ(this.PrevOnQ(a), s, o) ? r = a : l = !1 : r === n ? l = !1 : this.LeftFromLineOnQ(r, this.Q.pnt(n), o) ? n = r : this.LeftFromLineOnQ(n, this.Q.pnt(r), o) ? r = n : l = !1, !c && !l && (e = i, t = i, n = a, r = a);
		}
		return [e, r];
	}
	FindDividingBisector(e) {
		let t = {
			pClosest: void 0,
			qClosest: void 0,
			p1: void 0,
			p2: void 0,
			q1: void 0,
			q2: void 0
		};
		this.FindClosestFeatures(t), e.bisectorPivot = y.middle(t.pClosest, t.qClosest), e.bisectorRay = t.pClosest.sub(t.qClosest).rotate(Math.PI / 2), e.p1 = t.p1, e.p2 = t.p2, e.q1 = t.q1, e.q2 = t.q2;
	}
	FindClosestPoints() {
		let e = {
			q2: void 0,
			p1: void 0,
			p2: void 0,
			q1: void 0,
			pClosest: void 0,
			qClosest: void 0
		};
		return this.FindClosestFeatures(e), {
			pClosest: e.pClosest,
			qClosest: e.qClosest
		};
	}
	FindClosestFeatures(e) {
		let t = {
			leftTangentPoint: void 0,
			rightTangentPoint: void 0
		};
		this.P.GetTangentPoints(t, this.Q.pp(0).point), e.p2 = t.leftTangentPoint, e.p1 = t.rightTangentPoint, e.p2 === e.p1 && (e.p2 += this.P.count), this.Q.GetTangentPoints(t, this.P.pp(0).point), e.q1 = t.leftTangentPoint, e.q2 = t.rightTangentPoint, e.q2 === e.q1 && (e.q2 += this.Q.count), this.FindClosestPoints_(e);
	}
	FindClosestPoints_(e) {
		for (; this.ChunksAreLong(e.p2, e.p1, e.q2, e.q1);) this.ShrinkChunks(e);
		e.p1 === e.p2 ? (e.pClosest = this.P.pp(e.p2).point, e.q1 === e.q2 ? e.qClosest = this.Q.pp(e.q1).point : (e.qClosest = y.ClosestPointAtLineSegment(e.pClosest, this.Q.pp(e.q1).point, this.Q.pp(e.q2).point), y.closeDistEps(e.qClosest, this.Q.pnt(e.q1)) ? e.q2 = e.q1 : y.closeDistEps(e.qClosest, this.Q.pnt(e.q2)) && (e.q1 = e.q2))) : (e.qClosest = this.Q.pp(e.q1).point, e.pClosest = y.ClosestPointAtLineSegment(e.qClosest, this.P.pp(e.p1).point, this.P.pp(e.p2).point), y.closeDistEps(e.pClosest, this.P.pnt(e.p1)) ? e.p2 = e.p1 : y.closeDistEps(e.qClosest, this.P.pnt(e.p2)) && (e.p1 = e.p2));
	}
	ChunksAreLong(e, t, n, r) {
		let i = this.P.Module(e - t) + 1;
		if (i > 2) return !0;
		let a = this.Q.Module(r - n) + 1;
		return a > 2 || i === 2 && a === 2;
	}
	ShrinkChunks(t) {
		let n = t.p1 === t.p2 ? t.p1 : this.P.Median(t.p1, t.p2), r = t.q1 === t.q2 ? t.q1 : this.Q.Median(t.q2, t.q1), i = this.P.pp(n).point, a = this.Q.pp(r).point, o = {
			a1: void 0,
			a2: void 0,
			b1: void 0,
			b2: void 0
		};
		if (this.GetAnglesAtTheMedian(n, r, i, a, o), !this.InternalCut(t, n, r, o.a1, o.a2, o.b1, o.b2) && !e.OneOfChunksContainsOnlyOneVertex(t, n, r, o.a1, o.b1) && !this.OnlyOneChunkContainsExactlyTwoVertices(t, {
			mp: n,
			mq: r
		}, o)) {
			if (t.p2 === this.P.Next(t.p1) && t.q1 === this.Q.Next(t.q2)) {
				let e = S.minDistBetweenLineSegments(this.P.pnt(t.p1), this.P.pnt(t.p2), this.Q.pnt(t.q1), this.Q.pnt(t.q2));
				e.parab === 0 ? t.p2 = t.p1 : e.parab === 1 ? t.p1 = t.p2 : e.parcd === 0 ? t.q2 = t.q1 : e.parcd === 1 && (t.q1 = t.q2);
				return;
			}
			o.a1 <= Math.PI && o.a2 <= Math.PI && o.b1 <= Math.PI && o.b2 <= Math.PI ? o.a1 + o.b1 > Math.PI ? o.a1 >= Math.PI / 2 ? t.p1 = n : t.q1 = r : o.a2 >= Math.PI / 2 ? t.p2 = n : t.q2 = r : o.a1 > Math.PI ? t.p1 = n : o.a2 > Math.PI ? t.p2 = n : o.b1 > Math.PI ? t.q1 = r : t.q2 = r;
		}
	}
	InternalCut(e, t, n, r, i, a, o) {
		let s = !1;
		if (r >= Math.PI && i >= Math.PI) {
			let r = this.P.pp(t).point, i = this.Q.pp(n).point, a = this.P.pp(this.P.Next(t)).point;
			y.getTriangleOrientation(r, i, this.Q.pp(0).point) === y.getTriangleOrientation(r, i, a) ? e.p1 = this.P.Next(t) : e.p2 = this.P.Prev(t), s = !0;
		}
		if (a >= Math.PI && o >= Math.PI) {
			let r = this.P.pp(t).point, i = this.Q.pp(n).point, a = this.Q.pp(this.Q.Next(n)).point;
			y.getTriangleOrientation(r, i, this.P.pp(0).point) === y.getTriangleOrientation(r, i, a) ? e.q2 = this.Q.Next(n) : e.q1 = this.Q.Prev(n), s = !0;
		}
		return s;
	}
	GetAnglesAtTheMedian(e, t, n, r, i) {
		i.a1 = y.anglePCP(r, n, this.P.pnt(this.P.Prev(e))), i.a2 = y.anglePCP(this.P.pnt(this.P.Next(e)), n, r), i.b1 = y.anglePCP(this.Q.pnt(this.Q.Next(t)), r, n), i.b2 = y.anglePCP(n, r, this.Q.pnt(this.Q.Prev(t)));
	}
	OnlyOneChunkContainsExactlyTwoVertices(e, t, n) {
		let r = e.p2 === this.P.Next(e.p1), i = e.q1 === this.Q.Next(e.q2);
		return r && !i ? (this.ProcessShortSide(e, t.mp, t.mq, n.a1, n.b1, n.a2, n.b2), !0) : i && !r ? (this.SwapEverything(e, t, n), this.ProcessShortSide(e, t.mp, t.mq, n.a1, n.b1, n.a2, n.b2), this.SwapEverything(e, t, n), !0) : !1;
	}
	SwapEverything(e, t, n) {
		this.SwapPq();
		let r = e.p2;
		e.p2 = e.q1, e.q1 = r, r = e.q2, e.q2 = e.p1, e.p1 = r, r = t.mq, t.mq = t.mp, t.mp = r, r = n.a2, n.a2 = n.b1, n.b1 = r, r = n.b2, n.b2 = n.a1, n.a1 = r;
	}
	ProcessShortSide(e, t, n, r, i, a, o) {
		t === e.p2 ? this.ProcessSide(e, n, r, i, o) : a <= Math.PI ? a + o >= Math.PI ? a >= Math.PI / 2 ? e.p2 = e.p1 : e.q2 = n : i >= Math.PI / 2 ? e.q1 = n : a < o && (y.canProject(this.Q.pnt(n), this.P.pp(e.p1).point, this.P.pp(e.p2).point) ? e.q1 = n : e.p1 = e.p2) : r + i <= Math.PI ? e.p1 = e.p2 : e.p2 = e.p1;
	}
	SwapPq() {
		let e = this.P;
		this.P = this.Q, this.Q = e;
	}
	ProcessSide(e, t, n, r, i) {
		let a = this.Q.pnt(t);
		n <= Math.PI ? n + r >= Math.PI ? n >= Math.PI / 2 ? e.p1 = e.p2 : e.q1 = t : i >= Math.PI / 2 ? e.q2 = t : n < i && (y.canProject(a, this.P.pp(e.p1).point, this.P.pp(e.p2).point) ? e.q2 = t : e.p2 = e.p1) : (e.p2 = e.p1, r >= Math.PI ? e.q1 = t : i >= Math.PI && (e.q2 = t));
	}
	static OneOfChunksContainsOnlyOneVertex(e, t, n, r, i) {
		return e.p1 === e.p2 ? (i >= Math.PI / 2 ? e.q1 = n : e.q2 = n, !0) : e.q1 === e.q2 ? (r >= Math.PI / 2 ? e.p1 = t : e.p2 = t, !0) : !1;
	}
	CalculateLeftTangents() {
		let e = {
			bisectorPivot: null,
			bisectorRay: null,
			p1: 0,
			p2: 0,
			q1: 0,
			q2: 0
		};
		this.FindDividingBisector(e);
		let t = this.P.FindTheFurthestVertexFromBisector(e.p1, e.p2, e.bisectorPivot, e.bisectorRay), n = this.Q.FindTheFurthestVertexFromBisector(e.q2, e.q1, e.bisectorPivot, e.bisectorRay);
		this.upperBranchOnP = !1, this.lowerBranchOnQ = !0, this.leftPLeftQ = this.TangentBetweenBranches(t, e.p1, n, e.q1), this.lowerBranchOnQ = !1, this.leftPRightQ = this.TangentBetweenBranches(t, e.p1, n, e.q2);
	}
	CalculateRightTangents() {
		let e = {
			bisectorPivot: null,
			bisectorRay: null,
			p1: 0,
			p2: 0,
			q1: 0,
			q2: 0
		};
		this.FindDividingBisector(e);
		let t = this.P.FindTheFurthestVertexFromBisector(e.p1, e.p2, e.bisectorPivot, e.bisectorRay), n = this.Q.FindTheFurthestVertexFromBisector(e.q2, e.q1, e.bisectorPivot, e.bisectorRay);
		this.upperBranchOnP = !0, this.lowerBranchOnQ = !0, this.rightPLeftQ = this.TangentBetweenBranches(t, e.p2, n, e.q1), this.lowerBranchOnQ = !1, this.rightPRightQ = this.TangentBetweenBranches(t, e.p2, n, e.q2);
	}
}, Mn = class e {
	static mkFromPoints(t) {
		return new e(D.mkClosedFromPoints(t));
	}
	get Polyline() {
		return this.polyline;
	}
	constructor(e) {
		this.polyline = e, this.points = [];
		for (let e = this.polyline.startPoint; e; e = e.next) this.points.push(e);
	}
	Next(e) {
		return this.Module(e + 1);
	}
	Prev(e) {
		return this.Module(e - 1);
	}
	get count() {
		return this.Polyline.count;
	}
	Module(e) {
		return e < 0 ? e + this.count : e < this.count ? e : e - this.count;
	}
	pp(e) {
		return this.points[this.Module(e)];
	}
	pnt(e) {
		return this.pp(e).point;
	}
	toString() {
		return this.polyline.toString();
	}
	Median(e, t) {
		return t > e ? Math.floor((t + e) / 2) : this.Module(t + Math.floor((this.count + e) / 2));
	}
	FindTheFurthestVertexFromBisector(e, t, n, r) {
		let i = r.rotate(Math.PI / 2);
		this.polyline.startPoint.point.sub(n).dot(i) < 0 && (i = i.mul(-1)), e === t && (t = this.Next(e));
		do {
			let n = this.Median(t, e), r = this.pnt(n);
			this.pnt(this.Next(n)).sub(r).dot(i) >= 0 ? t = this.Next(n) : this.pnt(this.Prev(n)).sub(r).dot(i) >= 0 ? e = this.Prev(n) : t = n, e = n;
		} while (e !== t);
		return e;
	}
	static TestPolygonDist(e, t) {
		let n = 2 ** 53 - 1;
		for (let r = 0; r < e.count; r++) for (let i = 0; i < t.count; i++) {
			let a = S.minDistBetweenLineSegments(e.pnt(r), e.pnt(r + 1), t.pnt(i), t.pnt(i + 1));
			n = Math.min(n, a.dist);
		}
		return n;
	}
	static Distance(e, t) {
		let n = new jn(e, t).FindClosestPoints();
		return {
			p: n.pClosest,
			q: n.qClosest,
			dist: n.pClosest.sub(n.qClosest).length
		};
	}
	static DistanceOnly(t, n) {
		return e.Distance(t, n).dist;
	}
	static PolygonIsLegalDebug(e) {
		let t = e.Polyline;
		for (let e = t.startPoint; e.next != null && e.next.next != null; e = e.next) if (y.getTriangleOrientation(e.point, e.next.point, e.next.next.point) === _.Collinear) return !1;
		return !0;
	}
	static DistancePoint(e, t) {
		let n = Number.MAX_VALUE;
		for (let r = 0; r < e.count; r++) {
			let i = y.distToLineSegment(t, e.points[r].point, e.points[(r + 1) % e.count].point).dist;
			n = Math.min(n, i);
		}
		return n;
	}
	GetTangentPoints(e, t) {
		let n = new An(this.GetSequenceDelegate(t), this.count);
		e.leftTangentPoint = n.FindMaximum(), e.rightTangentPoint = n.FindMinimum();
	}
	GetSequenceDelegate(e) {
		let t = this.pnt(0);
		return (n) => {
			let r = y.anglePCP(t, e, this.pnt(n));
			return r < Math.PI ? r : r - 2 * Math.PI;
		};
	}
}, Nn = class e {
	ObstaclesIntersectLine(e, t) {
		return this.ObstaclesIntersectICurve(S.mkPP(e, t));
	}
	static PadCorner(t, n, r, i, a) {
		let o = e.GetPaddedCorner(n, r, i, a);
		return o.numberOfPoints === -1 ? !1 : (t.addPoint(o.a), o.numberOfPoints === 2 && t.addPoint(o.b), !0);
	}
	static CurveIsClockwise(e, t) {
		return y.getTriangleOrientation(t, e.start, e.start.add(e.derivative(e.parStart))) == _.Clockwise;
	}
	static PaddedPolylineBoundaryOfNode(t, n, r = !1) {
		return e.CreatePaddedPolyline(E.polylineAroundClosedCurve(t), n, r);
	}
	static LoosePolylineWithFewCorners(t, n, r) {
		return n < u.distanceEpsilon ? t : e.CreateLoosePolylineOnBisectors(t, n, r);
	}
	static CreateLoosePolylineOnBisectors(t, n, r) {
		let i = Array.from(e.BisectorPoints(t, n));
		r && o();
		let a = cn.CalculateConvexHull(i);
		return D.mkClosedFromPoints(a);
		function o() {
			for (let e = 0; e < i.length; e++) {
				let t = i[e];
				i[e] = new y(t.x + (2 * xn() - 1) * r, t.y + (2 * xn() - 1) * r);
			}
		}
	}
	static CreateRectNodeOfPolyline(e) {
		return I(e, e.boundingBox);
	}
	CreateLooseObstacles() {
		this.tightPolylinesToLooseDistances = /* @__PURE__ */ new Map(), this.LooseObstacles = [];
		for (let t of this.TightObstacles) {
			let n = e.FindMaxPaddingForTightPolyline(this.RootOfTightHierarchy, t, this.LoosePadding);
			this.tightPolylinesToLooseDistances.set(t, n), this.LooseObstacles.push(e.LoosePolylineWithFewCorners(t, n, this.randomizationShift));
		}
		this.RootOfLooseHierarchy = e.CalculateHierarchy(this.LooseObstacles);
	}
	CreateTightObstacles() {
		this.RootOfTightHierarchy = this.CreateTightObstacles_(), this.OverlapsDetected = this.TightObstacles.size < this.Obstacles.length;
	}
	Calculate() {
		this.IgnoreTightPadding ? this.CreateTightObstaclesIgnoringTightPadding() : this.CreateTightObstacles(), this.IsEmpty() || this.CreateLooseObstacles();
	}
	IsEmpty() {
		return this.TightObstacles == null || this.TightObstacles.size === 0;
	}
	constructor(e, t, n, r) {
		this.randomizationShift = .01, this.TightObstacles = /* @__PURE__ */ new Set(), this.Obstacles = e, this.TightPadding = t, this.LoosePadding = n, this.IgnoreTightPadding = r;
	}
	ObstaclesIntersectICurve(t) {
		let n = t.boundingBox;
		return e.CurveIntersectsRectangleNode(t, n, this.RootOfTightHierarchy);
	}
	static CurveIntersectsRectangleNode(t, n, r) {
		if (!r.irect.intersects(n)) return !1;
		if (r.UserData != null) {
			let n = r.UserData;
			return E.intersectionOne(n, t, !1) != null || e.PointIsInside(n.start, t);
		}
		return e.CurveIntersectsRectangleNode(t, n, r.Left) || e.CurveIntersectsRectangleNode(t, n, r.Right);
	}
	static PointIsInside(e, t) {
		return E.PointRelativeToCurveLocation(e, t) === T.Inside;
	}
	CreateTightObstaclesIgnoringTightPadding() {
		let t = this.Obstacles.map((e) => E.polylineAroundClosedCurve(e)), n = e.CalculateHierarchy(t), r = e.GetOverlappedPairSet(n);
		if (this.TightObstacles = /* @__PURE__ */ new Set(), r.size === 0) {
			for (let r of t) {
				let t = e.FindMaxPaddingForTightPolyline(n, r, this.TightPadding);
				this.TightObstacles.add(e.LoosePolylineWithFewCorners(r, t, this.randomizationShift));
			}
			this.RootOfTightHierarchy = e.CalculateHierarchy(Array.from(this.TightObstacles));
		} else {
			for (let n of t) this.TightObstacles.add(e.CreatePaddedPolyline(n, this.TightPadding));
			if (!this.IsEmpty()) for (this.RootOfTightHierarchy = e.CalculateHierarchy(Array.from(this.TightObstacles)), this.OverlapsDetected = !1; e.GetOverlappedPairSet(this.RootOfTightHierarchy).size > 0;) this.RootOfTightHierarchy = e.ReplaceTightObstaclesWithConvexHulls(this.TightObstacles, Array.from(r)), this.OverlapsDetected = !0;
		}
	}
	CreateTightObstacles_() {
		if (this.Obstacles.length === 0) return null;
		for (let t of this.Obstacles) e.CalculateTightPolyline(this.TightObstacles, this.TightPadding, t);
		return e.RemovePossibleOverlapsInTightPolylinesAndCalculateHierarchy(this.TightObstacles);
	}
	static CalculateTightPolyline(t, n, r) {
		let i = e.PaddedPolylineBoundaryOfNode(r, n);
		t.add(i);
	}
	static CalculateHierarchy(t) {
		return F(t.map((t) => e.CreateRectNodeOfPolyline(t)));
	}
	static RemovePossibleOverlapsInTightPolylinesAndCalculateHierarchy(t, n = null) {
		let r = e.CalculateHierarchy(Array.from(t)), i;
		for (; (i = e.GetOverlappedPairSet(r)).size > 0;) r = e.ReplaceTightObstaclesWithConvexHulls(t, Array.from(i), n);
		return r;
	}
	static MapToInt(e) {
		let t = /* @__PURE__ */ new Map();
		for (let n = 0; n < e.length; n++) t.set(e[n], n);
		return t;
	}
	static ReplaceTightObstaclesWithConvexHulls(t, n, r = null) {
		let i = /* @__PURE__ */ new Set();
		for (let e of n) i.add(e[0]), i.add(e[1]);
		let a = Array.from(i), o = e.MapToInt(a), s = Sn(En(Array.from(n).map((e) => new V(o.get(e[0]), o.get(e[1])))));
		for (let e of s) {
			let n = e.map((e) => a[e]), i = Le(n, (e) => e), o = cn.createConvexHullAsClosedPolyline(i), s = [];
			for (let e of n) t.delete(e), r != null && (s.push(...r.get(e)), r.delete(e));
			r?.set(o, s), t.add(o);
		}
		return e.CalculateHierarchy(Array.from(t));
	}
	static OneCurveLiesInsideOfOther(e, t) {
		return E.PointRelativeToCurveLocation(e.start, t) !== T.Outside || E.PointRelativeToCurveLocation(t.start, e) !== T.Outside;
	}
	static PolylinesIntersect(t, n) {
		return E.CurvesIntersect(t, n) || e.OneCurveLiesInsideOfOther(t, n);
	}
	static GetOverlappedPairSet(t) {
		let n = /* @__PURE__ */ new Set();
		return G(t, t, (t, r) => {
			e.PolylinesIntersect(t, r) && n.add([t, r]);
		}), n;
	}
	static *BisectorPoints(t, n) {
		for (let r = t.startPoint; r != null; r = r.next) {
			let t = { skip: !1 }, i = e.GetStickingVertexOnBisector(r, n, t);
			t.skip || (yield i);
		}
	}
	static GetStickingVertexOnBisector(e, t, n) {
		let r = e.polyline.prev(e).point, i = e.point, a = e.polyline.next(e).point, o = i.sub(r).normalize().add(i.sub(a).normalize()), s = o.length;
		return s < u.tolerance ? n.skip = !0 : (n.skip = !1, o = o.div(s)), o.mul(t).add(i);
	}
	static FindMaxPaddingForTightPolyline(t, n, r) {
		let i = r, a = new Mn(n), o = n.boundingBox.clone();
		o.pad(2 * r);
		for (let r of Array.from(t.GetNodeItemsIntersectingRectangle(o)).filter((e) => e !== n)) {
			let t = Mn.Distance(a, new Mn(r)).dist;
			i = Math.min(i, t / e.LooseDistCoefficient);
		}
		return i;
	}
	static GetPaddedCorner(t, n, r, i) {
		let a = t.point, o = n.point, s = r.point;
		if (y.getTriangleOrientation(a, o, s) === _.Counterclockwise) return {
			a: void 0,
			b: void 0,
			numberOfPoints: -1
		};
		let c = o.sub(a).rotate(Math.PI / 2).normalize();
		if (e.CornerIsNotTooSharp(a, o, s)) {
			c = c.mul(i);
			let e = s.sub(o).normalize().mul(i).rotate(Math.PI / 2), t = y.lineLineIntersection(a.add(c), o.add(c), o.add(e), s.add(e));
			return {
				a: t,
				b: t,
				numberOfPoints: 1
			};
		}
		let l = o.sub(a).normalize().add(o.sub(s).normalize());
		if (l.length < u.intersectionEpsilon) {
			let e = o.add(c.mul(i));
			return {
				a: e,
				b: e,
				numberOfPoints: 1
			};
		}
		let d = l.normalize().mul(i), f = d.rotate(Math.PI / 2), p = (i - d.dot(c)) / f.dot(c), m = f.mul(p);
		return {
			a: d.add(m).add(o),
			b: d.sub(m).add(o),
			numberOfPoints: 2
		};
	}
	static CornerIsNotTooSharp(e, t, n) {
		let r = e.sub(t).rotate(Math.PI / 4).add(t);
		return y.getTriangleOrientation(t, r, n) === _.Counterclockwise;
	}
	static CreatePaddedPolyline(t, n, r = !1) {
		let i = new D(), a = r ? Pn(t) : t;
		if (!e.PadCorner(i, a.endPoint.prev, a.endPoint, a.startPoint, n) || !e.PadCorner(i, a.endPoint, a.startPoint, a.startPoint.next, n)) return e.CreatePaddedPolyline(D.mkClosedFromPoints(Array.from(cn.CalculateConvexHull(a))), n);
		for (let t = a.startPoint; t.next.next != null; t = t.next) if (!e.PadCorner(i, t, t.next, t.next.next, n)) return e.CreatePaddedPolyline(D.mkClosedFromPoints(Array.from(cn.CalculateConvexHull(a))), n);
		return i.closed = !0, i;
	}
};
Nn.LooseDistCoefficient = 2.1;
function Pn(e) {
	let t = new D(), n = .01;
	for (let r = e.startPoint; r; r = r.next) {
		let e = r.point.x + n * xn(), i = r.point.y + n * xn();
		t.addPointXY(e, i);
	}
	return t.closed = e.closed, t;
}
//#endregion
//#region node_modules/@msagl/core/dist/routing/TightLooseCouple.js
var Fn = class e {
	get TightPolyline() {
		return this.tightPoly;
	}
	set TightPolyline(e) {
		this.tightPoly = e;
	}
	static mk(t, n, r) {
		let i = new e();
		return i.TightPolyline = t, i.LooseShape = n, i.Distance = r, i;
	}
	toString() {
		return (this.TightPolyline == null ? "null" : this.TightPolyline.toString().substring(0, 5)) + "," + (this.LooseShape == null ? "null" : this.LooseShape.toString().substring(0, 5));
	}
}, In = class e {
	constructor(e, t, n, r) {
		this.loosePolylinesToNodes = /* @__PURE__ */ new Map(), this.MainShape = e, this.TightPadding = t, this.LoosePadding = n, this.ShapesToTightLooseCouples = r;
	}
	Calculate(e) {
		bn(3), this.MainShape.Children.length !== 0 && (this.CreateTightObstacles(), this.CreateTigthLooseCouples(e), this.OverlapsDetected && this.FillTheMapOfShapeToTightLooseCouples());
	}
	FillTheMapOfShapeToTightLooseCouples() {
		un(F(this.MainShape.Children.map((e) => I(e, e.BoundingBox))), this.coupleHierarchy, this.TryMapShapeToTightLooseCouple.bind(this));
	}
	TryMapShapeToTightLooseCouple(t, n) {
		e.ShapeIsInsideOfPoly(t, n.TightPolyline) && this.ShapesToTightLooseCouples.set(t, n);
	}
	static ShapeIsInsideOfPoly(e, t) {
		return E.PointRelativeToCurveLocation(e.BoundaryCurve.start, t) === T.Inside;
	}
	CreateTigthLooseCouples(e) {
		let t = [];
		for (let n of this.tightHierarchy.GetAllLeaves()) {
			let r = Nn.FindMaxPaddingForTightPolyline(this.tightHierarchy, n, this.LoosePadding), i = new vt(Nn.LoosePolylineWithFewCorners(n, r, e)), a = Fn.mk(n, i, r), o = this.tightToShapes.get(n);
			for (let e of o) this.ShapesToTightLooseCouples.set(e, a);
			t.push(a);
		}
		this.coupleHierarchy = F(t.map((e) => I(e, e.TightPolyline.boundingBox)));
	}
	CreateTightObstacles() {
		this.tightToShapes = /* @__PURE__ */ new Map();
		let e = new Set(this.MainShape.Children.map(this.InitialTightPolyline.bind(this))), t = e.size;
		this.tightHierarchy = Nn.RemovePossibleOverlapsInTightPolylinesAndCalculateHierarchy(e, this.tightToShapes), this.OverlapsDetected = t > e.size;
	}
	InitialTightPolyline(e) {
		let t = Nn.PaddedPolylineBoundaryOfNode(e.BoundaryCurve, this.TightPadding), n = Le(this.LoosePolylinesUnderShape(e), (e) => e).filter((e) => E.PointRelativeToCurveLocation(e, t) === T.Outside);
		if (n.length == 0) return this.tightToShapes && this.tightToShapes.set(t, [e]), t;
		let r = Array.from(t).concat(n);
		return t = D.mkClosedFromPoints(cn.CalculateConvexHull(r)), this.tightToShapes && this.tightToShapes.set(t, [e]), t;
	}
	LoosePolylinesUnderShape(e) {
		return e.Children.map((e) => this.ShapesToTightLooseCouples.get(e).LooseShape.BoundaryCurve);
	}
}, Ln = class {
	constructor(e, t, n) {
		this.indexToA = e, this.priority = t, this.v = n;
	}
}, Rn = class {
	get count() {
		return this.heapSize;
	}
	ContainsElement(e) {
		return this.cache.has(e);
	}
	constructor(e = f) {
		this.heapSize = 0, this.compare = e, this.cache = /* @__PURE__ */ new Map(), this.A = [];
	}
	SwapWithParent(e) {
		let t = this.A[e >> 1];
		this.PutAtI(e >> 1, this.A[e]), this.PutAtI(e, t);
	}
	Enqueue(e, t) {
		let n = ++this.heapSize, r = new Ln(n, t, e);
		for (this.cache.set(e, r), this.A[n] = r; n > 1 && this.compare(this.A[n >> 1].priority, t) > 0;) this.SwapWithParent(n), n >>= 1;
	}
	IsEmpty() {
		return this.heapSize === 0;
	}
	PutAtI(e, t) {
		this.A[e] = t, t.indexToA = e;
	}
	Dequeue() {
		if (this.heapSize === 0) throw Error("dequeue on an empty queue");
		let e = this.A[1].v;
		return this.MoveQueueOneStepForward(e), e;
	}
	DequeueAndGetPriority(e) {
		if (this.heapSize === 0) throw Error("dequeue on an empty queue");
		let t = this.A[1].v;
		return e.priority = this.A[1].priority, this.MoveQueueOneStepForward(t), t;
	}
	MoveQueueOneStepForward(e) {
		this.cache.delete(e), this.PutAtI(1, this.A[this.heapSize]);
		let t = 1;
		for (;;) {
			let e = t, n = t << 1;
			n <= this.heapSize && this.compare(this.A[n].priority, this.A[t].priority) < 0 && (e = n);
			let r = n + 1;
			if (r <= this.heapSize && this.compare(this.A[r].priority, this.A[e].priority) < 0 && (e = r), e !== t) this.SwapWithParent(e);
			else break;
			t = e;
		}
		this.heapSize--;
	}
	DecreasePriority(e, t) {
		let n = this.cache.get(e);
		if (!n) return;
		n.priority = t;
		let r = n.indexToA;
		for (; r > 1 && this.compare(this.A[r].priority, this.A[r >> 1].priority) < 0;) this.SwapWithParent(r), r >>= 1;
	}
	*GetEnumerator() {
		for (let e = 1; e <= this.heapSize; e++) yield this.A[e].v;
	}
	Peek(e) {
		if (this.count === 0) {
			e.priority = 0;
			return;
		}
		return e.priority = this.A[1].priority, this.A[1].v;
	}
	toString() {
		let e = new U.StringBuilder();
		for (let t of this.A) e.Append(t + ",");
		return e.ToString();
	}
}, zn = class e {
	constructor(e, t, n) {
		this.upperBound = Infinity, this._visGraph = n, this._visGraph.ClearPrevEdgesTable();
		for (let e of n.Vertices()) e.Distance = Infinity;
		this.source = e, this.targets = new Set(t), this.source.Distance = 0;
	}
	GetPath() {
		let e = new Rn(f);
		for (this.source.Distance = 0, e.Enqueue(this.source, 0); !e.IsEmpty() && (this.current = e.Dequeue(), !this.targets.has(this.current));) {
			for (let t of this.current.OutEdges) this.PassableOutEdge(t) && this.ProcessNeighbor(e, t, t.Target);
			for (let t of this.current.InEdges) this.PassableInEdge(t) && this.ProcessNeighbor(e, t, t.Source);
		}
		return this._visGraph.PreviosVertex(this.current) == null ? null : this.CalculatePath();
	}
	PassableOutEdge(t) {
		return t.Source === this.source || this.targets.has(t.Target) || !e.IsForbidden(t);
	}
	PassableInEdge(t) {
		return this.targets.has(t.Source) || t.Target === this.source || !e.IsForbidden(t);
	}
	static IsForbidden(e) {
		return e.IsPassable != null && !e.IsPassable() || e instanceof Mt;
	}
	ProcessNeighbor(e, t, n) {
		let r = t.Length, i = this.current.Distance + r;
		i >= this.upperBound || (this.targets.has(n) && (this.upperBound = i, this.closestTarget = n), n !== this.source && this._visGraph.PreviosVertex(n) == null ? (n.Distance = i, this._visGraph.SetPreviousEdge(n, t), e.Enqueue(n, i)) : i < n.Distance && (n.Distance = i, this._visGraph.SetPreviousEdge(n, t), e.DecreasePriority(n, i)));
	}
	CalculatePath() {
		if (this.closestTarget == null) return null;
		let e = [], t = this.closestTarget;
		do
			e.push(t), t = this._visGraph.PreviosVertex(t);
		while (t !== this.source);
		return e.push(this.source), e.reverse();
	}
}, Bn = class e {
	get LengthMultiplier() {
		return this._lengthMultiplier;
	}
	set LengthMultiplier(e) {
		this._lengthMultiplier = e;
	}
	get LengthMultiplierForAStar() {
		return this._lengthMultiplierForAStar;
	}
	set LengthMultiplierForAStar(e) {
		this._lengthMultiplierForAStar = e;
	}
	constructor(e, t, n) {
		this._lengthMultiplier = 1, this._lengthMultiplierForAStar = 1, this._visGraph = e, this._source = t, this._target = n, this._source.Distance = 0;
	}
	GetPath(e) {
		let t = new Rn(f);
		for (this._source.Distance = 0, this._target.Distance = Infinity, t.Enqueue(this._source, this.H(this._source)); !t.IsEmpty();) {
			let e = { priority: 0 }, n = t.DequeueAndGetPriority(e);
			if (e.priority >= this._target.Distance) break;
			for (let e of n.OutEdges) if (this.PassableOutEdge(e)) {
				let r = e.Target;
				this.ProcessNeighbor(t, n, e, r);
			}
			for (let e of n.InEdges) if (this.PassableInEdge(e)) {
				let r = e.Source;
				this.ProcessNeighbor(t, n, e, r);
			}
		}
		return this._visGraph.PreviosVertex(this._target) == null ? null : this.CalculatePath(e);
	}
	PassableOutEdge(t) {
		return t.Source === this._source || t.Target === this._target || !e.IsForbidden(t);
	}
	PassableInEdge(t) {
		return t.Source === this._target || t.Target === this._source || !e.IsForbidden(t);
	}
	static IsForbidden(e) {
		return e.IsPassable != null && !e.IsPassable() || e instanceof Mt;
	}
	ProcessNeighborN(e, t, n, r, i) {
		let a = n.Length + i, o = t.Distance + a;
		r !== this._source && this._visGraph.PreviosVertex(r) == null ? (r.Distance = o, this._visGraph.SetPreviousEdge(r, n), r !== this._target && e.Enqueue(r, this.H(r))) : r !== this._source && o < r.Distance && (r.Distance = o, this._visGraph.SetPreviousEdge(r, n), r !== this._target && e.DecreasePriority(r, this.H(r)));
	}
	ProcessNeighbor(e, t, n, r) {
		let i = n.Length, a = t.Distance + i;
		r !== this._source && this._visGraph.PreviosVertex(r) == null ? (r.Distance = a, this._visGraph.SetPreviousEdge(r, n), r !== this._target && e.Enqueue(r, this.H(r))) : r !== this._source && a < r.Distance && (r.Distance = a, this._visGraph.SetPreviousEdge(r, n), r !== this._target && e.DecreasePriority(r, this.H(r)));
	}
	H(e) {
		return e.Distance + e.point.sub(this._target.point).length * this.LengthMultiplierForAStar;
	}
	CalculatePath(e) {
		let t = [], n = this._target;
		do
			t.push(n), e && this._visGraph.ShrinkLengthOfPrevEdge(n, this.LengthMultiplier), n = this._visGraph.PreviosVertex(n);
		while (n !== this._source);
		return t.push(this._source), t.reverse();
	}
}, Vn;
(function(e) {
	e[e.Regular = 0] = "Regular", e[e.Tangent = 1] = "Tangent";
})(Vn ||= {});
//#endregion
//#region node_modules/@msagl/core/dist/routing/visibility/Diagonal.js
var Hn = class {
	toString() {
		return U.String.format("{0},{1}", this.Start, this.End);
	}
	get Start() {
		return this.leftTangent.End.point;
	}
	get End() {
		return this.rightTangent.End.point;
	}
	constructor(e, t) {
		this.LeftTangent = e, this.RightTangent = t;
	}
	get LeftTangent() {
		return this.leftTangent;
	}
	set LeftTangent(e) {
		this.leftTangent = e;
	}
	get RightTangent() {
		return this.rightTangent;
	}
	set RightTangent(e) {
		this.rightTangent = e;
	}
	get RbNode() {
		return this.rbNode;
	}
	set RbNode(e) {
		this.rbNode = e;
	}
}, Un = class {
	get Comp() {
		return this.comp;
	}
	set Comp(e) {
		this.comp = e;
	}
	get IsHigh() {
		return !this.IsLow;
	}
	get IsLow() {
		return this.lowTangent;
	}
	set IsLow(e) {
		this.lowTangent = e;
	}
	get SeparatingPolygons() {
		return this.separatingPolygons;
	}
	set SeparatingPolygons(e) {
		this.separatingPolygons = e;
	}
	get Diagonal() {
		return this.diagonal;
	}
	set Diagonal(e) {
		this.diagonal = e;
	}
	get Start() {
		return this.start;
	}
	set Start(e) {
		this.start = e;
	}
	get End() {
		return this.end;
	}
	set End(e) {
		this.end = e;
	}
	constructor(e, t) {
		this.start = e, this.End = t;
	}
	toString() {
		return U.String.format("{0},{1}", this.Start, this.End);
	}
}, Wn = class {
	get PointOnTangentAndInsertedDiagonal() {
		return this.pointOnTheRay;
	}
	set PointOnTangentAndInsertedDiagonal(e) {
		this.pointOnTheRay = e;
	}
	Compare(e, t) {
		if (e.Start.equal(t.Start)) return 0;
		switch (y.getTriangleOrientation(this.PointOnTangentAndInsertedDiagonal, t.Start, t.End)) {
			case _.Counterclockwise: return -1;
			default: return 1;
		}
	}
	static BelongsToTheDiagonal(e, t, n) {
		return y.closeDistEps(e, y.ClosestPointAtLineSegment(e, t, n));
	}
	static IntersectDiagonalWithRay(e, t, n) {
		let r = t.sub(e), i = n.Start, a = n.End, o = l.solve(a.x - i.x, r.x * -1, e.x - i.x, a.y - i.y, r.y * -1, e.y - i.y);
		return e.add(r.mul(o.y));
	}
}, Gn = class e {
	constructor(e) {
		this.pivot = e;
	}
	IComparer(t, n) {
		if (t === n) return 0;
		if (t == null) return -1;
		if (n == null) return 1;
		let r = t.Start.point.sub(this.pivot), i = n.Start.point.sub(this.pivot);
		return e.CompareVectorsByAngleToXAxis(r, i);
	}
	static CompareVectorsByAngleToXAxis(t, n) {
		return t.y >= 0 ? n.y < 0 ? -1 : e.CompareVectorsPointingToTheSameYHalfPlane(t, n) : n.y >= 0 ? 1 : e.CompareVectorsPointingToTheSameYHalfPlane(t, n);
	}
	static CompareVectorsPointingToTheSameYHalfPlane(e, t) {
		let n = e.x * t.y - e.y * t.x;
		if (n > u.tolerance) return -1;
		if (n < -u.tolerance) return 1;
		if (e.x >= 0) {
			if (t.x < 0) return -1;
		} else if (t.x >= 0) return 1;
		let r = Math.abs(e.x) - Math.abs(t.x);
		return r < 0 ? -1 : r > 0 ? 1 : (r = Math.abs(e.y) - Math.abs(t.y), r < 0 ? -1 : +(r > 0));
	}
}, Kn = class e extends B {
	run() {
		this.useLeftPTangents = !0, this.CalculateAndAddEdges(), this.useLeftPTangents = !1, this.CalculateAndAddEdges();
	}
	CalculateAndAddEdges() {
		for (let e of this.addedPolygons) this.CalculateVisibleTangentsFromPolygon(e);
		this.ProgressStep();
	}
	CalculateVisibleTangentsFromPolygon(e) {
		this.currentPolygon = e, this.AllocateDataStructures(), this.OrganizeTangents(), this.InitActiveDiagonals(), this.Sweep();
	}
	AllocateDataStructures() {
		this.tangents = [], this.diagonals = [], this.activeDiagonalTree = new Ct(this.activeDiagonalComparer.Compare.bind(this.activeDiagonalComparer));
	}
	Sweep() {
		if (!(this.tangents.length < 2)) for (let e = 1; e < this.tangents.length; e++) {
			let t = this.tangents[e];
			t.Diagonal == null ? t.IsLow && (this.activeDiagonalComparer.PointOnTangentAndInsertedDiagonal = t.End.point, this.InsertActiveDiagonal(new Hn(t, t.Comp)), t.Diagonal.RbNode === this.activeDiagonalTree.treeMinimum() && this.AddVisibleEdge(t)) : (t.Diagonal.RbNode === this.activeDiagonalTree.treeMinimum() && this.AddVisibleEdge(t), t.IsHigh && this.RemoveDiagonalFromActiveNodes(t.Diagonal));
		}
	}
	AddVisibleEdge(e) {
		W.AddEdgeVV(qn(this.visibilityGraph, e.start), qn(this.visibilityGraph, e.End));
	}
	InitActiveDiagonals() {
		if (this.tangents.length === 0) return;
		let t = this.tangents[0], n = t.start.point, r = t.End.point;
		for (let t of this.diagonals) e.RayIntersectDiagonal(n, r, t) && (this.activeDiagonalComparer.PointOnTangentAndInsertedDiagonal = Wn.IntersectDiagonalWithRay(n, r, t), this.InsertActiveDiagonal(t));
		if (t.Diagonal.RbNode === this.activeDiagonalTree.treeMinimum() && this.AddVisibleEdge(t), t.IsLow === !1) {
			let e = t.Diagonal;
			this.RemoveDiagonalFromActiveNodes(e);
		}
	}
	RemoveDiagonalFromActiveNodes(e) {
		let t = this.activeDiagonalTree.deleteSubTree(e.RbNode);
		t != null && t.item != null && (t.item.RbNode = t), e.LeftTangent.Diagonal = null, e.RightTangent.Diagonal = null;
	}
	InsertActiveDiagonal(t) {
		t.RbNode = this.activeDiagonalTree.insert(t), e.MarkDiagonalAsActiveInTangents(t);
	}
	static MarkDiagonalAsActiveInTangents(e) {
		e.LeftTangent.Diagonal = e, e.RightTangent.Diagonal = e;
	}
	static RayIntersectDiagonal(e, t, n) {
		let r = n.Start, i = n.End;
		return y.getTriangleOrientation(e, r, i) === _.Counterclockwise && y.getTriangleOrientation(e, t, r) !== _.Counterclockwise && y.getTriangleOrientation(e, t, i) !== _.Clockwise;
	}
	static TangentComparison(e, t) {
		return Gn.CompareVectorsByAngleToXAxis(e.End.point.sub(e.start.point), t.End.point.sub(t.start.point));
	}
	*AllObstacles() {
		for (let e of this.addedPolygons) yield e;
		if (this.polygons) for (let e of this.polygons) yield e;
	}
	OrganizeTangents() {
		for (let e of this.AllObstacles()) e !== this.currentPolygon && this.ProcessPolygonQ(e);
		this.tangents.sort(e.TangentComparison);
	}
	ProcessPolygonQ(e) {
		let t = new jn(this.currentPolygon, e);
		this.useLeftPTangents ? t.CalculateLeftTangents() : t.CalculateRightTangents();
		let n = this.useLeftPTangents ? t.leftPLeftQ : t.rightPLeftQ, r = new Un(this.currentPolygon.pp(n[0]), e.pp(n[1]));
		r.IsLow = !0, r.SeparatingPolygons = !this.useLeftPTangents, n = this.useLeftPTangents ? t.leftPRightQ : t.rightPRightQ;
		let i = new Un(this.currentPolygon.pp(n[0]), e.pp(n[1]));
		i.IsLow = !1, i.SeparatingPolygons = this.useLeftPTangents, r.Comp = i, i.Comp = r, this.tangents.push(r), this.tangents.push(i), this.diagonals.push(new Hn(r, i));
	}
	constructor(e, t, n) {
		super(null), this.polygons = [], this.activeDiagonalComparer = new Wn(), this.polygons = e, this.visibilityGraph = n, this.addedPolygons = t;
	}
};
function qn(e, t) {
	return e.FindVertex(t.point);
}
//#endregion
//#region node_modules/@msagl/core/dist/routing/visibility/ActiveEdgeComparerWithRay.js
var Jn = class e {
	get Pivot() {
		return this.pivot;
	}
	set Pivot(e) {
		this.pivot = e;
	}
	get IntersectionOfTheRayAndInsertedEdge() {
		return this.pointOnTheRay;
	}
	set IntersectionOfTheRayAndInsertedEdge(e) {
		this.pointOnTheRay = e;
	}
	Compare(e, t) {
		switch (y.getTriangleOrientation(this.IntersectionOfTheRayAndInsertedEdge, t.point, t.nextOnPolyline.point)) {
			case _.Counterclockwise: return -1;
			default: return 1;
		}
	}
	IntersectionPointBelongsToTheInsertedEdge(e) {
		let t = e.point.sub(this.IntersectionOfTheRayAndInsertedEdge), n = e.nextOnPolyline.point.sub(this.IntersectionOfTheRayAndInsertedEdge);
		return Math.abs(t.x * n.y - n.x * t.y) < u.distanceEpsilon;
	}
	IntersectEdgeWithRayPPP(e, t, n) {
		let r = l.solve(t.x - e.x, -n.x, this.Pivot.x - e.x, t.y - e.y, -n.y, this.Pivot.y - e.y);
		if (!(-u.tolerance <= r.x && r.x <= 1 + u.tolerance) || !r) throw Error();
		return this.Pivot.add(n.mul(r.y));
	}
	IntersectEdgeWithRay(e, t) {
		return this.IntersectEdgeWithRayPPP(e.point, e.nextOnPolyline.point, t);
	}
	static constructorPP(t, n) {
		let r = new e();
		return r.pivot = t, r.pointOnTheRay = n, r;
	}
}, Yn = class {
	get Start() {
		return this.start;
	}
	set Start(e) {
		this.start = e;
	}
	get End() {
		return this.end;
	}
	set End(e) {
		this.end = e;
	}
	constructor(e, t) {
		this.start = e, this.end = t;
	}
	*Sides() {
		let e = this.start;
		for (; e !== this.end;) {
			let t = e;
			yield t, e = t.nextOnPolyline;
		}
	}
	MoveStartClockwise() {
		return this.Start === this.End ? !1 : (this.Start = this.Start.nextOnPolyline, !0);
	}
	toString() {
		return U.String.format("Stem({0},{1})", this.Start, this.End);
	}
}, Xn = class e {
	get QVertex() {
		return this.qV;
	}
	set QVertex(e) {
		this.qV = e;
	}
	static CalculatePointVisibilityGraph(t, n, r, i) {
		let a = n.FindVertex(r);
		if (a != null) return a;
		let o = new e(t, n, r, i);
		return o.FillGraph(), o.QVertex;
	}
	FillGraph() {
		this.ComputeHoleBoundariesPossiblyVisibleFromQ(), this.visibleBoundaries.size > 0 && (this.SortSAndInitActiveSides(), this.Sweep());
	}
	SortSAndInitActiveSides() {
		this.InitHeapAndInsertActiveSides();
		for (let e = this.heapForSorting.GetMinimum(); this.sortedListOfPolypoints.push(e.Start), e.MoveStartClockwise() ? this.heapForSorting.ChangeMinimum(e) : this.heapForSorting.Dequeue(), this.heapForSorting.Count !== 0; e = this.heapForSorting.GetMinimum());
	}
	InitHeapAndInsertActiveSides() {
		for (let e of this.GetInitialVisibleBoundaryStemsAndInsertActiveSides()) this.heapForSorting.Enqueue(e);
	}
	*GetInitialVisibleBoundaryStemsAndInsertActiveSides() {
		for (let [e, t] of this.visibleBoundaries) {
			let n = !1;
			for (let r of t.Sides()) {
				let i = r;
				if (i.point.y < this.q.y) {
					if (r.nextOnPolyline.point.y >= this.q.y) {
						let e = y.getTriangleOrientation(this.q, i.point, r.nextOnPolyline.point);
						if (e === _.Counterclockwise || e === _.Collinear) {
							n = !0, yield new Yn(t.Start, r), yield new Yn(r.nextOnPolyline, t.End), this.RegisterActiveSide(r);
							break;
						}
					}
				} else if (i.point.y > this.q.y) break;
				else if (r.point.x >= this.q.x) {
					n = !0, yield new Yn(r, t.End), r !== t.Start && (yield new Yn(t.Start, e.prev(i))), this.RegisterActiveSide(r);
					break;
				}
			}
			n || (yield t);
		}
	}
	RegisterActiveSide(e) {
		this.activeEdgeComparer.IntersectionOfTheRayAndInsertedEdge = this.activeEdgeComparer.IntersectEdgeWithRay(e, new y(1, 0)), this.sideNodes.set(e, this.activeSidesTree.insert(e));
	}
	constructor(e, t, n, r) {
		this.sideNodes = /* @__PURE__ */ new Map(), this.visibleBoundaries = /* @__PURE__ */ new Map(), this.sortedListOfPolypoints = [], this.holes = Array.from(e), this.visibilityGraph = t, this.q = n, this.qPolylinePoint = b.mkFromPoint(this.q), this.QVertex = this.visibilityGraph.AddVertexP(this.qPolylinePoint.point), this.visibilityKind = r;
		let i = new Gn(this.q);
		this.heapForSorting = new wt(i.IComparer.bind(i));
	}
	Sweep() {
		for (let e of this.sortedListOfPolypoints) this.SweepPolylinePoint(e);
	}
	SweepPolylinePoint(t) {
		let n = e.GetIncomingSide(t), r = this.GetOutgoingSide(t);
		this.activeEdgeComparer.IntersectionOfTheRayAndInsertedEdge = t.point;
		let i;
		if (i = this.sideNodes.get(n)) {
			if (i === this.activeSidesTree.treeMinimum() && this.AddEdge(t), r != null) i.item = r, this.sideNodes.set(r, i);
			else {
				let e = this.activeSidesTree.deleteSubTree(i);
				e != null && e.item != null && this.sideNodes.set(e.item, e);
			}
			this.sideNodes.delete(n);
		} else if (r != null) {
			let e;
			(e = this.sideNodes.get(r)) || (e = this.activeSidesTree.insert(r), this.sideNodes.set(r, e), e === this.activeSidesTree.treeMinimum() && this.AddEdge(t));
		} else throw Error();
	}
	AddEdge(t) {
		(this.visibilityKind === Vn.Regular || this.visibilityKind === Vn.Tangent && e.LineTouchesPolygon(this.QVertex.point, t)) && this.visibilityGraph.AddEdgeF(this.QVertex.point, t.point, (e, t) => new Mt(e, t));
	}
	static LineTouchesPolygon(e, t) {
		let n = t.polyline.prev(t).point, r = t.polyline.next(t).point, i = t.point;
		return y.signedDoubledTriangleArea(e, i, n) * y.signedDoubledTriangleArea(e, i, r) >= 0;
	}
	GetOutgoingSide(e) {
		return e === this.visibleBoundaries.get(e.polyline).End ? null : e;
	}
	static GetIncomingSide(e) {
		return e.prevOnPolyline;
	}
	ComputeHoleBoundariesPossiblyVisibleFromQ() {
		this.InitActiveEdgesAndActiveEdgesComparer();
		for (let e of this.holes) this.ComputeVisiblePartOfTheHole(e);
	}
	InitActiveEdgesAndActiveEdgesComparer() {
		this.activeEdgeComparer = new Jn(), this.activeEdgeComparer.pivot = this.q, this.activeSidesTree = new Ct(this.activeEdgeComparer.Compare.bind(this.activeEdgeComparer));
	}
	ComputeVisiblePartOfTheHole(e) {
		let t, n = !0;
		for (t = e.startPoint; !this.HoleSideIsVisibleFromQ(e, t); t = e.next(t)) n = !1;
		let r = e.next(t);
		if (n) for (; this.HoleSideIsVisibleFromQ(e, e.prev(t));) t = e.prev(t);
		for (; this.HoleSideIsVisibleFromQ(e, r); r = e.next(r));
		this.visibleBoundaries.set(e, new Yn(t, r));
	}
	HoleSideIsVisibleFromQ(e, t) {
		return y.signedDoubledTriangleArea(this.q, t.point, e.next(t).point) >= -u.squareOfDistanceEpsilon;
	}
}, Zn = class e extends B {
	constructor() {
		super(...arguments), this.IgnoreTightPadding = !0, this.activeRectangle = O.mkEmpty(), this.activePolygons = [], this.alreadyAddedOrExcludedPolylines = /* @__PURE__ */ new Set(), this.UseEdgeLengthMultiplier = !1, this.UseInnerPolylingShortcutting = !0, this.UsePolylineEndShortcutting = !0, this.AllowedShootingStraightLines = !0, this.LookForRoundedVertices = !1;
	}
	rerouteEdge(e) {
		let t = e.smoothedPolyline ? D.mkFromPoints(e.smoothedPolyline) : D.mkFromPoints(e.getSmoothPolyPoints());
		this.pathOptimizer.run(t), e.curve = this.pathOptimizer.poly.toCurve();
	}
	static constructorANNN(t, n, r, i) {
		return e.constructorANNNB(t, n, r, i, !1);
	}
	get Obstacles() {
		return this.obstacles_;
	}
	set Obstacles(e) {
		this.obstacles_ = e;
	}
	get EnteringAngleBound() {
		return this.enteringAngleBound_;
	}
	set EnteringAngleBound(e) {
		this.enteringAngleBound_ = e;
	}
	get SourceTightPolyline() {
		return this._sourceTightPolyline;
	}
	set SourceTightPolyline(e) {
		this._sourceTightPolyline = e;
	}
	get TargetTightPolyline() {
		return this.targetTightPolyline;
	}
	set TargetTightPolyline(e) {
		this.targetTightPolyline = e;
	}
	get TargetLoosePolyline() {
		return this.targetLoosePolyline;
	}
	set TargetLoosePolyline(e) {
		this.targetLoosePolyline = e;
	}
	get VisibilityGraph() {
		return this.visibilityGraph;
	}
	set VisibilityGraph(e) {
		this.visibilityGraph = e;
	}
	get SourcePort() {
		return this.sourcePort;
	}
	set SourcePort(t) {
		if (this.sourcePort = t, this.sourcePort != null) if (this.SourceTightPolyline = e.GetFirstHitPolyline(this.sourcePort.Location, this.ObstacleCalculator.RootOfTightHierarchy), this.sourcePort instanceof bt) this.alreadyAddedOrExcludedPolylines.add(this.SourceLoosePolyline), this.StartPointOfEdgeRouting = this.SourcePort.Location;
		else {
			let e = this.sourcePort;
			this.StartPointOfEdgeRouting = this.TakeBoundaryPortOutsideOfItsLoosePolyline(e.Curve, e.Parameter, this.SourceLoosePolyline);
		}
	}
	get TargetPort() {
		return this.targetPort;
	}
	set TargetPort(e) {
		this.targetPort = e;
	}
	get LoosePadding() {
		return this.loosePadding;
	}
	set LoosePadding(e) {
		this.loosePadding = e, this.ObstacleCalculator != null && (this.ObstacleCalculator.LoosePadding = e);
	}
	get OffsetForPolylineRelaxing() {
		return this.TightPadding * .75;
	}
	get StartPointOfEdgeRouting() {
		return this.startPointOfRouting_;
	}
	set StartPointOfEdgeRouting(e) {
		this.startPointOfRouting_ = e;
	}
	ExtendVisibilityGraphToLocation(e) {
		this.VisibilityGraph ??= new W();
		let t = null;
		if (!this.activeRectangle.contains(e)) {
			this.activeRectangle.isEmpty ? this.activeRectangle = O.mkPP(this.SourcePort.Location, e) : this.activeRectangle.add(e), t = this.GetAddedPolygonesAndMaybeExtendActiveRectangle();
			for (let e of t) this.VisibilityGraph.AddHole(e.Polyline);
		}
		t == null || t.length === 0 ? (this.targetVV != null && this.VisibilityGraph.RemoveVertex(this.targetVV), this.CalculateEdgeTargetVisibilityGraph(e)) : (this.RemovePointVisibilityGraphs(), new Kn(t, this.activePolygons, this.VisibilityGraph).run(), Me(this.activePolygons, t), this.CalculateEdgeTargetVisibilityGraph(e), this.CalculateSourcePortVisibilityGraph());
	}
	RemovePointVisibilityGraphs() {
		this.targetVV != null && this.VisibilityGraph.RemoveVertex(this.targetVV), this.sourceVV != null && this.VisibilityGraph.RemoveVertex(this.sourceVV);
	}
	CalculateEdgeTargetVisibilityGraph(e) {
		this.targetVV = Xn.CalculatePointVisibilityGraph(Array.from(this.GetActivePolylines()), this.VisibilityGraph, e, Vn.Tangent);
	}
	CalculateSourcePortVisibilityGraph() {
		this.sourceVV = Xn.CalculatePointVisibilityGraph(Array.from(this.GetActivePolylines()), this.VisibilityGraph, this.StartPointOfEdgeRouting, Vn.Tangent);
	}
	TakeBoundaryPortOutsideOfItsLoosePolyline(t, n, r) {
		let i = t.value(n), a = t.leftDerivative(n).normalize().add(t.rightDerivative(n).normalize()).normalize();
		y.getTriangleOrientation(e.PointInsideOfConvexCurve(t), i, i.add(a)) == _.Counterclockwise && (a = a.mul(-1)), a = a.rotate(Math.PI / 2);
		let o = r.boundingBox.diagonal, s = S.mkPP(i, i.add(a.mul(o))), c = E.intersectionOne(s, r, !1).x, l = a.mul(c.sub(i).length / 2);
		for (;;) {
			s = S.mkPP(i, c.add(l));
			let t = !1;
			for (let n of e.IntersectionsOfLineAndRectangleNodeOverPolylineLR(s, this.ObstacleCalculator.RootOfLooseHierarchy)) if (n.seg1 !== r) {
				l = l.div(1.5), t = !0;
				break;
			}
			if (!t) break;
		}
		return s.end;
	}
	static PointInsideOfConvexCurve(e) {
		return e.value(0).add(e.value(1.5)).div(2);
	}
	*GetActivePolylines() {
		for (let e of this.activePolygons) yield e.Polyline;
	}
	GetAddedPolygonesAndMaybeExtendActiveRectangle() {
		let e = this.activeRectangle, t = [], n;
		do {
			n = !1;
			for (let r of this.ObstacleCalculator.RootOfLooseHierarchy.GetNodeItemsIntersectingRectangle(this.activeRectangle)) this.alreadyAddedOrExcludedPolylines.has(r) || (e.addRec(r.boundingBox), t.push(new Mn(r)), this.alreadyAddedOrExcludedPolylines.add(r), n = !0);
			n && (this.activeRectangle = e);
		} while (n);
		return t;
	}
	PolylineSegmentIntersectsTightHierarchy(e, t) {
		return this.PolylineIntersectsPolyRectangleNodeOfTightHierarchyPPR(e, t, this.ObstacleCalculator.RootOfTightHierarchy);
	}
	PolylineIntersectsPolyRectangleNodeOfTightHierarchyPPR(e, t, n) {
		return this.PolylineIntersectsPolyRectangleNodeOfTightHierarchy(S.mkPP(e, t), n);
	}
	PolylineIntersectsPolyRectangleNodeOfTightHierarchy(e, t) {
		if (!e.boundingBox.intersects(t.irect)) return !1;
		if (t.UserData != null) {
			for (let n of E.getAllIntersections(e, t.UserData, !1)) if (n.seg1 !== this.SourceTightPolyline && n.seg1 !== this.TargetTightPolyline || (n.seg1 === this.SourceTightPolyline && this.SourcePort) instanceof tn || (n.seg1 === this.TargetTightPolyline && this.TargetPort) instanceof tn) return !0;
			return !1;
		}
		return this.PolylineIntersectsPolyRectangleNodeOfTightHierarchy(e, t.Left) || this.PolylineIntersectsPolyRectangleNodeOfTightHierarchy(e, t.Right);
	}
	static IntersectionsOfLineAndRectangleNodeOverPolylineLR(t, n) {
		let r = [];
		return e.IntersectionsOfLineAndRectangleNodeOverPolyline(t, n, r), r;
	}
	static IntersectionsOfLineAndRectangleNodeOverPolyline(t, n, r) {
		if (n != null && t.boundingBox.intersects(n.irect)) {
			if (n.UserData != null) {
				Me(r, E.getAllIntersections(t, n.UserData, !0));
				return;
			}
			e.IntersectionsOfLineAndRectangleNodeOverPolyline(t, n.Left, r), e.IntersectionsOfLineAndRectangleNodeOverPolyline(t, n.Right, r);
		}
	}
	LineCanBeAcceptedForRouting(t) {
		let n = this.SourcePort instanceof bt, r = this.TargetPort instanceof bt;
		if (!n && !this.targetIsInsideOfSourceTightPolyline && !this.InsideOfTheAllowedConeOfBoundaryPort(t.end, this.SourcePort) || !r && this.TargetPort != null && !this.sourceIsInsideOfTargetTightPolyline && !this.InsideOfTheAllowedConeOfBoundaryPort(t.start, this.TargetPort)) return !1;
		let i = e.IntersectionsOfLineAndRectangleNodeOverPolylineLR(t, this.ObstacleCalculator.RootOfTightHierarchy);
		for (let e of i) if (e.seg1 !== this.SourceTightPolyline && e.seg1 !== this.targetTightPolyline) return !1;
		return !0;
	}
	InsideOfTheAllowedConeOfBoundaryPort(t, n) {
		let r = n.Curve, i = Nn.CurveIsClockwise(r, e.PointInsideOfConvexCurve(r)), a = n.Location, o = this.GetPointOnTheRightBoundaryPortConeSide(a, r, i, n.Parameter), s = this.GetPointOnTheLeftBoundaryPortConeSide(a, r, i, n.Parameter);
		return y.getTriangleOrientation(a, o, t) !== _.Clockwise && y.getTriangleOrientation(a, t, s) !== _.Clockwise;
	}
	GetPointOnTheRightBoundaryPortConeSide(e, t, n, r) {
		let i = n ? t.rightDerivative(r) : t.leftDerivative(r).neg();
		return e.add(i.rotate(this.EnteringAngleBound));
	}
	GetPointOnTheLeftBoundaryPortConeSide(e, t, n, r) {
		let i = n ? t.leftDerivative(r).neg() : t.rightDerivative(r);
		return e.add(i.rotate(-this.EnteringAngleBound));
	}
	SmoothenCorners(e) {
		let t = e.headSite, n = {
			b: null,
			c: null
		};
		for (; n = E.findCorner(t);) t = this.SmoothOneCorner(t, n.c, n.b);
	}
	SmoothOneCorner(e, t, n) {
		let r = 1.5, i = .01, a = .5, o, s, c;
		e.prev == null ? (c = 2, s = 1) : t.next == null ? (c = 1, s = 2) : c = s = 1;
		do
			o = E.createBezierSeg(a * c, a * s, e, n, t), n.previouisBezierCoefficient = a * c, n.nextBezierCoefficient = a * s, a /= r;
		while (l() > this.loosePadding && a > i);
		return a *= r, a < .5 && a > i && (a = .5 * (a + a * r), o = E.createBezierSeg(a * c, a * s, e, n, t), l() > this.loosePadding && (n.previouisBezierCoefficient = a * c, n.nextBezierCoefficient = a * s)), n;
		function l() {
			let e = o.closestParameter(n.point);
			return n.point.sub(o.value(e)).length;
		}
	}
	TryToRemoveInflectionsAndCollinearSegments(e) {
		let t = !0, n = { s: null };
		for (; t;) for (t = !1, n.s = e.headSite; n.s != null && n.s.next != null; n.s = n.s.next) n.s.turn * n.s.next.turn < 0 && (t = this.TryToRemoveInflectionEdge(n) || t);
	}
	TryToRemoveInflectionEdge(e) {
		if (!this.ObstacleCalculator.ObstaclesIntersectLine(e.s.prev.point, e.s.next.point)) {
			let t = e.s.prev, n = e.s.next;
			return t.next = n, n.prev = t, e.s = t, !0;
		}
		if (!this.ObstacleCalculator.ObstaclesIntersectLine(e.s.prev.point, e.s.next.next.point)) {
			let t = e.s.prev, n = e.s.next.next;
			return t.next = n, n.prev = t, e.s = t, !0;
		}
		if (!this.ObstacleCalculator.ObstaclesIntersectLine(e.s.point, e.s.next.next.point)) {
			let t = e.s.next.next;
			return e.s.next = t, t.prev = e.s, !0;
		}
		return !1;
	}
	GetShortestPolyline(e, t) {
		this.CleanTheGraphForShortestPath();
		let n = new Bn(this.visibilityGraph, e, t).GetPath(this.UseEdgeLengthMultiplier);
		if (n == null) return null;
		let r = D.mkFromPoints(Array.from(n).map((e) => e.point)).RemoveCollinearVertices();
		return this.pathOptimizer && (this.pathOptimizer.run(r), r = this.pathOptimizer.poly), r;
	}
	CleanTheGraphForShortestPath() {
		this.visibilityGraph.ClearPrevEdgesTable();
	}
	get OverlapsDetected() {
		return this.ObstacleCalculator.OverlapsDetected;
	}
	get TightHierarchy() {
		return this.ObstacleCalculator.RootOfTightHierarchy;
	}
	set TightHierarchy(e) {
		this.ObstacleCalculator.RootOfTightHierarchy = e;
	}
	get LooseHierarchy() {
		return this.ObstacleCalculator.RootOfLooseHierarchy;
	}
	set LooseHierarchy(e) {
		this.ObstacleCalculator.RootOfLooseHierarchy = e;
	}
	CalculateObstacles() {
		this.ObstacleCalculator = new Nn(this.Obstacles, this.TightPadding, this.LoosePadding, this.IgnoreTightPadding), this.ObstacleCalculator.Calculate();
	}
	static constructorANNNB(t, n, r, i, a) {
		let o = new e(null);
		return o.IgnoreTightPadding = a, o.EnteringAngleBound = Math.PI / 180 * 80, o.TightPadding = n, o.LoosePadding = r, i > 0 ? (z.assert(i > Math.PI / 180), z.assert(i <= Math.PI / 180 * 90), o.UseSpanner = !0, o.ExpectedProgressSteps = Qt.GetTotalSteps(i)) : o.ExpectedProgressSteps = t.length, o.ConeSpannerAngle = i, o.Obstacles = t, o.CalculateObstacles(), o;
	}
	RouteEdgeToLocation(t) {
		this.TargetPort = new bt(null, t), this.TargetTightPolyline = null, this.TargetLoosePolyline = null;
		let n = new be(null), r = S.mkPP(this.SourcePort.Location, t);
		return this.LineCanBeAcceptedForRouting(r) ? (this._polyline = new D(), this._polyline.addPoint(r.start), this._polyline.addPoint(r.end), n.curve = he.mkFromPoints(this._polyline).createCurve(), n) : this.SourcePort instanceof tn && (r = S.mkPP(this.StartPointOfEdgeRouting, t), e.IntersectionsOfLineAndRectangleNodeOverPolylineLR(r, this.ObstacleCalculator.RootOfTightHierarchy).length == 0) ? (this._polyline = new D(), this._polyline.addPoint(this.SourcePort.Location), this._polyline.addPoint(r.start), this._polyline.addPoint(r.end), n.curve = he.mkFromPoints(this._polyline).createCurve(), n) : (this.ExtendVisibilityGraphToLocation(t), this._polyline = this.GetShortestPolyline(this.sourceVV, this.targetVV), this.SourcePort instanceof tn && this._polyline.PrependPoint(this.SourcePort.Location), n.curve = he.mkFromPoints(this._polyline).createCurve(), n);
	}
	RouteEdgeToPort(t, n, r, i) {
		return this.ObstacleCalculator.IsEmpty() ? this.sourcePort != null && this.targetPort != null ? (i.smoothedPolyline = this.SmoothedPolylineFromTwoPoints(this.sourcePort.Location, this.targetPort.Location), S.mkPP(this.sourcePort.Location, this.targetPort.Location)) : null : (this.TargetPort = t, this.TargetTightPolyline = e.GetFirstHitPolyline(t.Location, this.ObstacleCalculator.RootOfTightHierarchy), t instanceof tn ? this.RouteEdgeToBoundaryPort(n, r, i) : this.RouteEdgeToFloatingPortOfNode(n, r, i));
	}
	SmoothedPolylineFromTwoPoints(e, t) {
		return this._polyline = new D(), this._polyline.addPoint(e), this._polyline.addPoint(t), he.mkFromPoints(this._polyline);
	}
	RouteEdgeToFloatingPortOfNode(e, t, n) {
		return this.sourcePort instanceof bt ? this.RouteFromFloatingPortToFloatingPort(e, t, n) : this.RouteFromBoundaryPortToFloatingPort(e, t, n);
	}
	RouteFromBoundaryPortToFloatingPort(e, t, n) {
		let r = this.SourcePort.Location, i = this.targetPort.Location, a = S.mkPP(r, i);
		if (this.LineCanBeAcceptedForRouting(a)) return n.smoothedPolyline = this.SmoothedPolylineFromTwoPoints(a.start, a.end), a;
		if (!this.targetIsInsideOfSourceTightPolyline) {
			let t = this.TakeBoundaryPortOutsideOfItsLoosePolyline(this.SourcePort.Curve, this.SourcePort.Parameter, this.SourceLoosePolyline);
			if (a = S.mkPP(t, i), this.LineAvoidsTightHierarchyLP(a, e)) return n.smoothedPolyline = this.SmoothedPolylineFromTwoPoints(a.start, a.end), a;
		}
		this.ExtendVisibilityGraphToLocationOfTargetFloatingPort(e), this._polyline = this.GetShortestPolyline(this.sourceVV, this.targetVV);
		let o = this.SourceTightPolyline;
		return this.targetIsInsideOfSourceTightPolyline || (this.SourceTightPolyline = null), this.SourceTightPolyline = o, this._polyline.PrependPoint(r), this.SmoothCornersAndReturnCurve(t, n);
	}
	SmoothCornersAndReturnCurve(e, t) {
		return t.smoothedPolyline = he.mkFromPoints(this._polyline), e && this.SmoothenCorners(t.smoothedPolyline), t.smoothedPolyline.createCurve();
	}
	RouteFromFloatingPortToFloatingPort(e, t, n) {
		return this.ExtendVisibilityGraphToLocationOfTargetFloatingPort(e), this._polyline = this.GetShortestPolyline(this.sourceVV, this.targetVV), this._polyline == null ? null : (n.smoothedPolyline = he.mkFromPoints(this._polyline), this.SmoothCornersAndReturnCurve(t, n));
	}
	TryShortcutPolyPoint(e) {
		return this.LineAvoidsTightHierarchyLPP(S.mkPP(e.point, e.next.next.point), this.SourceTightPolyline, this.targetTightPolyline) ? (e.next = e.next.next, e.next.prev = e, !0) : !1;
	}
	ExtendVisibilityGraphToLocationOfTargetFloatingPort(e) {
		this.VisibilityGraph ??= new W();
		let t = null, n = this.targetPort.Location;
		if (!this.activeRectangle.contains(n)) {
			this.activeRectangle.isEmpty ? this.activeRectangle = O.mkPP(this.SourcePort.Location, n) : this.activeRectangle.add(n), t = this.GetAddedPolygonesAndMaybeExtendActiveRectangle();
			for (let e of t) this.VisibilityGraph.AddHole(e.Polyline);
		}
		t == null ? (this.targetVV != null && this.VisibilityGraph.RemoveVertex(this.targetVV), this.CalculateEdgeTargetVisibilityGraphForFloatingPort(n, e), this.sourceVV ?? this.CalculateSourcePortVisibilityGraph()) : (this.RemovePointVisibilityGraphs(), new Kn(t, this.activePolygons, this.VisibilityGraph).run(), Me(this.activePolygons, t), this.CalculateEdgeTargetVisibilityGraphForFloatingPort(n, e), this.CalculateSourcePortVisibilityGraph());
	}
	CalculateEdgeTargetVisibilityGraphForFloatingPort(e, t) {
		this.UseSpanner ? this.targetVV = this.AddTransientVisibilityEdgesForPort(e, t) : this.targetVV = Xn.CalculatePointVisibilityGraph(this.GetActivePolylinesWithException(t), this.VisibilityGraph, e, Vn.Tangent);
	}
	AddTransientVisibilityEdgesForPort(e, t) {
		let n = this.GetVertex(e);
		if (n != null) return n;
		if (n = this.visibilityGraph.AddVertexP(e), t != null) for (let n of t) this.visibilityGraph.AddEdgeF(e, n, (e, t) => new Mt(e, t));
		else n = Xn.CalculatePointVisibilityGraph(this.GetActivePolylines(), this.VisibilityGraph, e, Vn.Tangent);
		return n;
	}
	GetVertex(e) {
		let t = this.visibilityGraph.FindVertex(e);
		return t == null && this.LookForRoundedVertices && (t = this.visibilityGraph.FindVertex(y.RoundPoint(e))), t;
	}
	*GetActivePolylinesWithException(e) {
		for (let t of this.activePolygons) t.Polyline !== e && (yield t.Polyline);
	}
	RouteEdgeToBoundaryPort(e, t, n) {
		return this.TargetLoosePolyline = e, this.sourcePort instanceof bt ? this.RouteFromFloatingPortToBoundaryPort(t, n) : this.RouteFromBoundaryPortToBoundaryPort(t, n);
	}
	RouteFromBoundaryPortToBoundaryPort(e, t) {
		let n = this.SourcePort.Location, r, i = this.targetPort.Location, a = S.mkPP(n, i);
		if (this.LineCanBeAcceptedForRouting(a)) this._polyline = new D(), this._polyline.addPoint(a.start), this._polyline.addPoint(a.end), t.smoothedPolyline = this.SmoothedPolylineFromTwoPoints(a.start, a.end), r = he.mkFromPoints(this._polyline).createCurve();
		else {
			let o = this.TakeBoundaryPortOutsideOfItsLoosePolyline(this.targetPort.Curve, this.targetPort.Parameter, this.TargetLoosePolyline);
			if (a = S.mkPP(n, o), this.InsideOfTheAllowedConeOfBoundaryPort(o, this.SourcePort) && this.LineAvoidsTightHierarchyLP(a, this._sourceTightPolyline)) this._polyline = new D(), this._polyline.addPoint(a.start), this._polyline.addPoint(a.end), this._polyline.addPoint(i), r = this.SmoothCornersAndReturnCurve(e, t);
			else if (a = S.mkPP(this.StartPointOfEdgeRouting, i), this.InsideOfTheAllowedConeOfBoundaryPort(this.StartPointOfEdgeRouting, this.TargetPort) && this.LineAvoidsTightHierarchy(a)) this._polyline = new D(), this._polyline.addPoint(n), this._polyline.addPoint(a.start), this._polyline.addPoint(a.end), r = this.SmoothCornersAndReturnCurve(e, t);
			else {
				let a;
				if (a = S.IntersectPPPP(n, this.StartPointOfEdgeRouting, i, o)) this._polyline = new D(), this._polyline.addPoint(n), this._polyline.addPoint(a), this._polyline.addPoint(i), r = this.SmoothCornersAndReturnCurve(e, t);
				else if (y.closeDistEps(this.StartPointOfEdgeRouting, o)) this._polyline = new D(), this._polyline.addPoint(n), this._polyline.addPoint(o), this._polyline.addPoint(i), r = this.SmoothCornersAndReturnCurve(e, t);
				else if (this.LineAvoidsTightHierarchy(S.mkPP(this.StartPointOfEdgeRouting, o))) this._polyline = new D(), this._polyline.addPoint(n), this._polyline.addPoint(this.StartPointOfEdgeRouting), this._polyline.addPoint(o), this._polyline.addPoint(i), r = this.SmoothCornersAndReturnCurve(e, t);
				else {
					this.ExtendVisibilityGraphToTargetBoundaryPort(o), this._polyline = this.GetShortestPolyline(this.sourceVV, this.targetVV);
					let a = { tmpTargetTight: null }, s = this.HideSourceTargetTightsIfNeeded(a);
					this.RecoverSourceTargetTights(s, a.tmpTargetTight), this._polyline.PrependPoint(n), this._polyline.addPoint(i), r = this.SmoothCornersAndReturnCurve(e, t);
				}
			}
		}
		return r;
	}
	RecoverSourceTargetTights(e, t) {
		this.SourceTightPolyline = e, this.TargetTightPolyline = t;
	}
	HideSourceTargetTightsIfNeeded(e) {
		let t = this.SourceTightPolyline;
		return e.tmpTargetTight = this.TargetTightPolyline, this.TargetTightPolyline = null, this.SourceTightPolyline = null, t;
	}
	LineAvoidsTightHierarchy(t) {
		return e.IntersectionsOfLineAndRectangleNodeOverPolylineLR(t, this.ObstacleCalculator.RootOfTightHierarchy).length === 0;
	}
	RouteFromFloatingPortToBoundaryPort(e, t) {
		let n = this.targetPort.Location, r;
		if (this.InsideOfTheAllowedConeOfBoundaryPort(this.sourcePort.Location, this.targetPort) && (r = S.mkPP(this.SourcePort.Location, n), this.LineCanBeAcceptedForRouting(r))) return t.smoothedPolyline = this.SmoothedPolylineFromTwoPoints(r.start, r.end), r;
		let i = this.TakeBoundaryPortOutsideOfItsLoosePolyline(this.TargetPort.Curve, this.TargetPort.Parameter, this.TargetLoosePolyline);
		return r = S.mkPP(this.SourcePort.Location, i), this.LineAvoidsTightHierarchyLP(r, this._sourceTightPolyline) ? (this._polyline = D.mkFromPoints([
			r.start,
			r.end,
			n
		]), t.smoothedPolyline = he.mkFromPoints(this._polyline), t.smoothedPolyline.createCurve()) : (this.ExtendVisibilityGraphToTargetBoundaryPort(i), this._polyline = this.GetShortestPolyline(this.sourceVV, this.targetVV), this._polyline.addPoint(n), this.SmoothCornersAndReturnCurve(e, { smoothedPolyline: null }));
	}
	LineAvoidsTightHierarchyLP(t, n) {
		let r = !0;
		for (let i of e.IntersectionsOfLineAndRectangleNodeOverPolylineLR(t, this.ObstacleCalculator.RootOfTightHierarchy)) if (i.seg1 !== n) {
			r = !1;
			break;
		}
		return r;
	}
	LineAvoidsTightHierarchyLPP(t, n, r) {
		let i = !0;
		for (let a of e.IntersectionsOfLineAndRectangleNodeOverPolylineLR(t, this.ObstacleCalculator.RootOfTightHierarchy)) if (!(a.seg1 === n || a.seg1 === r)) {
			i = !1;
			break;
		}
		return i;
	}
	LineAvoidsTightHierarchyPPPP(e, t, n, r) {
		return this.LineAvoidsTightHierarchyLPP(S.mkPP(e, t), n, r);
	}
	ExtendVisibilityGraphToTargetBoundaryPort(e) {
		let t = null;
		if (this.VisibilityGraph ??= new W(), !this.activeRectangle.contains(e) || !this.activeRectangle.containsRect(this.TargetLoosePolyline.boundingBox)) {
			this.activeRectangle.isEmpty ? (this.activeRectangle = this.TargetLoosePolyline.boundingBox.clone(), this.activeRectangle.add(this.SourcePort.Location), this.activeRectangle.add(this.StartPointOfEdgeRouting), this.activeRectangle.add(e)) : (this.activeRectangle.add(e), this.activeRectangle.addRec(this.TargetLoosePolyline.boundingBox)), t = this.GetAddedPolygonesAndMaybeExtendActiveRectangle();
			for (let e of t) this.VisibilityGraph.AddHole(e.Polyline);
		}
		t == null ? (this.targetVV != null && this.VisibilityGraph.RemoveVertex(this.targetVV), this.CalculateEdgeTargetVisibilityGraph(e)) : (this.RemovePointVisibilityGraphs(), new Kn(t, this.activePolygons, this.VisibilityGraph).run(), Me(this.activePolygons, t), this.CalculateEdgeTargetVisibilityGraph(e), this.CalculateSourcePortVisibilityGraph());
	}
	GetHitLoosePolyline(t) {
		return this.ObstacleCalculator.IsEmpty() || this.ObstacleCalculator.RootOfLooseHierarchy == null ? null : e.GetFirstHitPolyline(t, this.ObstacleCalculator.RootOfLooseHierarchy);
	}
	static GetFirstHitPolyline(t, n) {
		let r = e.GetFirstHitRectangleNode(t, n);
		return r ? r.UserData : null;
	}
	static GetFirstHitRectangleNode(e, t) {
		return t == null ? null : t.FirstHitNodeWithPredicate(e, (e, t) => E.PointRelativeToCurveLocation(e, t) === T.Outside ? P.Continue : P.Stop);
	}
	Clean() {
		this.TargetPort = null, this.SourcePort = null, this.SourceTightPolyline = null, this.SourceLoosePolyline = null, this.TargetLoosePolyline = null, this.targetTightPolyline = null, this.VisibilityGraph = null, this.targetVV = null, this.sourceVV = null, this.activePolygons = [], this.alreadyAddedOrExcludedPolylines.clear(), this.activeRectangle.setToEmpty();
	}
	SetSourcePortAndSourceLoosePolyline(t, n) {
		this.SourceLoosePolyline = n, this.sourcePort = t, this.sourcePort != null && (this.SourceTightPolyline = e.GetFirstHitPolyline(this.sourcePort.Location, this.ObstacleCalculator.RootOfTightHierarchy), this.sourcePort instanceof bt ? (this.alreadyAddedOrExcludedPolylines.add(this.SourceLoosePolyline), this.StartPointOfEdgeRouting = this.SourcePort.Location) : this.StartPointOfEdgeRouting = this.TakeBoundaryPortOutsideOfItsLoosePolyline(this.SourcePort.Curve, this.sourcePort.Parameter, this.SourceLoosePolyline));
	}
	run() {
		this.CalculateWholeTangentVisibilityGraph();
	}
	CalculateWholeTangentVisibilityGraph() {
		this.VisibilityGraph = new W(), this.CalculateWholeVisibilityGraphOnExistingGraph();
	}
	CalculateWholeVisibilityGraphOnExistingGraph() {
		this.activePolygons = Array.from(this.AllPolygons());
		for (let e of this.ObstacleCalculator.LooseObstacles) this.VisibilityGraph.AddHole(e);
		let e;
		e = this.UseSpanner ? new Qt(this.ObstacleCalculator.LooseObstacles, this.VisibilityGraph) : new Kn([], this.activePolygons, this.visibilityGraph), e.run();
	}
	RouteSplineFromPortToPortWhenTheWholeGraphIsReady(e, t, n, r) {
		let i = e instanceof bt && t instanceof tn || e instanceof $t;
		if (i) {
			let n = e;
			e = t, t = n;
		}
		this.sourcePort = e, this.targetPort = t, this.FigureOutSourceTargetPolylinesAndActiveRectangle();
		let a = this.GetEdgeGeomByRouting(n, r);
		return a == null ? null : (this.targetVV = null, this.sourceVV = null, i && (a = a.reverse()), a);
	}
	GetEdgeGeomByRouting(e, t) {
		this.sourceIsInsideOfTargetTightPolyline = this.TargetTightPolyline == null || E.PointRelativeToCurveLocation(this.sourcePort.Location, this.TargetTightPolyline) === T.Inside;
		let n;
		if (this.sourcePort instanceof tn) {
			let t = this.sourcePort;
			this.StartPointOfEdgeRouting = this.targetIsInsideOfSourceTightPolyline ? t.Location : this.TakeBoundaryPortOutsideOfItsLoosePolyline(t.Curve, t.Parameter, this.SourceLoosePolyline), this.CalculateSourcePortVisibilityGraph();
			let r = { smoothedPolyline: null };
			n = this.targetPort instanceof tn ? this.RouteFromBoundaryPortToBoundaryPort(e, r) : this.RouteFromBoundaryPortToFloatingPort(this.targetLoosePolyline, e, r);
		} else this.targetPort instanceof bt ? (this.ExtendVisibilityGraphFromFloatingSourcePort(), n = this.RouteFromFloatingPortToFloatingPort(this.targetLoosePolyline, e, t)) : n = this.RouteFromFloatingPortToAnywherePort(this.targetPort.LoosePolyline, e, t, this.targetPort);
		return n;
	}
	RouteFromFloatingPortToAnywherePort(e, t, n, r) {
		return r.Curve.boundingBox.contains(this.sourcePort.Location) ? (this.sourceVV = this.GetVertex(this.sourcePort.Location), this._polyline = this.GetShortestPolylineToMulitpleTargets(this.sourceVV, Array.from(this.Targets(e))), this._polyline == null ? null : (this.FixLastPolylinePointForAnywherePort(r), r.HookSize > 0 && this.BuildHook(r), this.SmoothCornersAndReturnCurve(t, n))) : (n.smoothedPolyline = null, null);
	}
	BuildHook(e) {
		let t = e.Curve, n = w.mkFullEllipseNNP(e.HookSize, e.HookSize, this._polyline.end), r = E.getAllIntersections(t, n, !0);
		y.getTriangleOrientation(r[0].x, this._polyline.end, this._polyline.endPoint.prev.point) == _.Counterclockwise && r.reverse();
		let i = this._polyline.end.sub(this._polyline.endPoint.prev.point).normalize(), a = t.derivative(r[0].par0).normalize(), o = a.dot(i);
		if (Math.abs(o) < .2) this.ExtendPolyline(a, r[0], i, e);
		else {
			let n = t.derivative(r[1].par0).normalize();
			n.dot(i) < o ? this.ExtendPolyline(n, r[1], i, e) : this.ExtendPolyline(a, r[0], i, e);
		}
	}
	ExtendPolyline(e, t, n, r) {
		let i = e.rotate(Math.PI / 2);
		i.dot(n) < 0 && (i = i.neg());
		let a = t.x.add(i.mul(r.HookSize)), o;
		(o = y.lineLineIntersection(a, a.add(e), this._polyline.end, this._polyline.end.add(n))) && (this._polyline.addPoint(o), this._polyline.addPoint(a), this._polyline.addPoint(t.x));
	}
	FixLastPolylinePointForAnywherePort(t) {
		for (;;) {
			let n = this.GetLastPointInsideOfCurveOnPolyline(t.Curve);
			n.next.next = null, this._polyline.endPoint = n.next;
			let r = n.next.point.sub(n.point);
			r = r.normalize().mul(t.Curve.boundingBox.diagonal);
			let i = r.rotate(t.AdjustmentAngle * -1), a = r.rotate(t.AdjustmentAngle), o = E.intersectionOne(t.Curve, S.mkPP(n.point, n.point.add(i)), !0), s = E.intersectionOne(t.Curve, S.mkPP(n.point, n.point.add(a)), !0);
			if (o == null || s == null) return;
			let c = e.GetTrimmedCurveForHookingUpAnywhere(t.Curve, n, o, s), l = c.value(c.closestParameter(n.point));
			if (!this.LineAvoidsTightHierarchyLPP(S.mkPP(n.point, l), this.SourceTightPolyline, null)) {
				let e = E.intersectionOne(t.Curve, S.mkPP(n.point, n.next.point), !1);
				if (e == null) return;
				this._polyline.endPoint.point = e.x;
				break;
			}
			if (this._polyline.endPoint.point = l, n.prev == null || !this.TryShortcutPolyPoint(n.prev)) break;
		}
	}
	static GetTrimmedCurveForHookingUpAnywhere(e, t, n, r) {
		let i = y.getTriangleOrientation(r.x, n.x, t.point) === _.Clockwise, a = n.par0, o = r.par0, s, c, l;
		return i ? a < o ? e.trim(a, o) : (c = e.trim(a, e.parEnd), s = e.trim(e.parStart, o), l = new E(), l.addSegs([c, s])) : o < a ? e.trim(o, a) : (c = e.trim(o, e.parEnd), s = e.trim(e.parStart, a), l = new E(), l.addSegs([c, s]));
	}
	GetLastPointInsideOfCurveOnPolyline(e) {
		for (let t = this._polyline.endPoint.prev; t != null; t = t.prev) if (t.prev == null || E.PointRelativeToCurveLocation(t.point, e) === T.Inside) return t;
		throw Error();
	}
	GetShortestPolylineToMulitpleTargets(e, t) {
		this.CleanTheGraphForShortestPath();
		let n = new zn(e, t, this.VisibilityGraph).GetPath();
		if (n == null) return null;
		let r = new D();
		for (let e of n) r.addPoint(e.point);
		return r.RemoveCollinearVertices();
	}
	Targets(e) {
		return Array.from(e).map((e) => this.visibilityGraph.FindVertex(e));
	}
	ExtendVisibilityGraphFromFloatingSourcePort() {
		this.StartPointOfEdgeRouting = this.sourcePort.Location, this.UseSpanner ? this.sourceVV = this.AddTransientVisibilityEdgesForPort(this.sourcePort.Location, this.SourceLoosePolyline) : this.sourceVV = Xn.CalculatePointVisibilityGraph(Array.from(this.GetActivePolylines()).filter((e) => e !== this.SourceLoosePolyline), this.VisibilityGraph, this.StartPointOfEdgeRouting, Vn.Tangent);
	}
	FigureOutSourceTargetPolylinesAndActiveRectangle() {
		let t = this.sourcePort.Curve.value(this.sourcePort.Curve.parStart);
		this._sourceTightPolyline = e.GetFirstHitPolyline(t, this.ObstacleCalculator.RootOfTightHierarchy), this.SourceLoosePolyline = e.GetFirstHitPolyline(t, this.ObstacleCalculator.RootOfLooseHierarchy), t = this.targetPort.Curve.value(this.targetPort.Curve.parStart), this.targetTightPolyline = e.GetFirstHitPolyline(t, this.ObstacleCalculator.RootOfTightHierarchy), this.targetLoosePolyline = e.GetFirstHitPolyline(t, this.ObstacleCalculator.RootOfLooseHierarchy), this.activeRectangle = O.mkPP(new y(-Infinity, Infinity), new y(Infinity, -Infinity));
	}
	*AllPolygons() {
		for (let e of this.ObstacleCalculator.LooseObstacles) yield new Mn(e);
	}
	GetVisibilityGraph() {
		return this.VisibilityGraph;
	}
	AddActivePolygons(e) {
		Me(this.activePolygons, e);
	}
	ClearActivePolygons() {
		this.activePolygons = [];
	}
}, Qn = class e {
	toJSON() {
		let e = "{";
		return this.tipPosition && (e += "\"tipPosition\": " + this.tipPosition.toJSON()), e += "}", e;
	}
	clone() {
		let t = new e();
		return t.length = this.length, t.width = this.width, t.tipPosition = this.tipPosition, t;
	}
	constructor() {
		this.length = e.defaultArrowheadLength, this.width = 0, this.length = e.defaultArrowheadLength;
	}
	static calculateArrowheads(t) {
		if (t.sourceArrowhead == null && t.targetArrowhead == null) return !0;
		let n = e.findTrimStartForArrowheadAtSource(t);
		if (n == null) return !1;
		let r = e.findTrimEndForArrowheadAtTarget(t);
		if (r == null || n > r - u.intersectionEpsilon || E.closeIntersectionPoints(t.curve.value(n), t.curve.value(r))) return !1;
		let i = t.curve.trim(n, r);
		return i == null ? !1 : (t.sourceArrowhead != null && (t.sourceArrowhead.tipPosition = t.curve.start), t.targetArrowhead != null && (t.targetArrowhead.tipPosition = t.curve.end), t.curve = i, !0);
	}
	static getIntersectionsWithArrowheadCircle(e, t, n) {
		let r = w.mkFullEllipseNNP(t, t, n);
		return E.getAllIntersections(r, e, !0);
	}
	static findTrimEndForArrowheadAtTarget(t) {
		let n = u.distanceEpsilon * u.distanceEpsilon, r = t.curve.parEnd;
		if (t.targetArrowhead == null || t.targetArrowhead.length <= u.distanceEpsilon) return r;
		let i = t.curve, a = t.targetArrowhead.length, o, s, c = 10;
		do {
			if (c--, c === 0) return;
			s = e.getIntersectionsWithArrowheadCircle(i, a, i.end), r = s.length === 0 ? i.parEnd : Math.max(...s.map((e) => e.par1)), o = t.curve.value(r), a /= 2;
		} while (o.sub(i.start).lengthSquared < n || s.length === 0);
		return r;
	}
	static findTrimStartForArrowheadAtSource(t) {
		if (t.sourceArrowhead == null || t.sourceArrowhead.length <= u.distanceEpsilon) return t.curve.parStart;
		let n = u.distanceEpsilon * u.distanceEpsilon, r = t.sourceArrowhead.length, i, a = t.curve, o, s = 10, c;
		for (; --s > 0;) {
			if (o = e.getIntersectionsWithArrowheadCircle(a, r, a.start), o.length === 0) return a.parStart;
			if (c = Math.min(...o.map((e) => e.par1)), i = o.filter((e) => e.par1 === c)[0].x, i.sub(a.end).lengthSquared >= n) return c;
			r /= 2;
		}
	}
	static trimSplineAndCalculateArrowheads(t, n, r) {
		return e.trimSplineAndCalculateArrowheadsII(t, t.source.boundaryCurve, t.target.boundaryCurve, n, r);
	}
	static trimSplineAndCalculateArrowheadsII(t, n, r, i, a) {
		if (t.curve = E.trimEdgeSplineWithNodeBoundaries(n, r, i, a), t.curve == null) return !1;
		if ((t.sourceArrowhead == null || t.sourceArrowhead.length < u.distanceEpsilon) && (t.targetArrowhead == null || t.targetArrowhead.length < u.distanceEpsilon)) return !0;
		let o = !1, s = t.sourceArrowhead == null ? 0 : t.sourceArrowhead.length, c = t.targetArrowhead == null ? 0 : t.targetArrowhead.length, l = t.curve.end.sub(t.curve.start).length;
		t.sourceArrowhead != null && (t.sourceArrowhead.length = Math.min(l, s)), t.targetArrowhead != null && (t.targetArrowhead.length = Math.min(l, c));
		let d = 10;
		for (; (t.sourceArrowhead != null && t.sourceArrowhead.length > u.intersectionEpsilon || t.targetArrowhead != null && t.targetArrowhead.length > u.intersectionEpsilon) && !o && (o = e.calculateArrowheads(t), o || (t.sourceArrowhead != null && (t.sourceArrowhead.length *= .5), t.targetArrowhead != null && (t.targetArrowhead.length *= .5)), d--, d !== 0););
		return o || (t.sourceArrowhead != null && (t.sourceArrowhead.tipPosition = i.start), t.targetArrowhead != null && (t.targetArrowhead.tipPosition = i.end)), t.sourceArrowhead != null && (t.sourceArrowhead.length = s), t.targetArrowhead != null && (t.targetArrowhead.length = c), o;
	}
	static createBigEnoughSpline(t) {
		let n = t.source.center, r = t.target.center, i = r.sub(n), a = i.length, o;
		a < .001 ? (o = new y(1, 0), r = n.add(o.rotate(Math.PI / 2))) : o = i.rotate(Math.PI / 2);
		let s = 1;
		t.sourceArrowhead != null && (s += t.sourceArrowhead.length), t.targetArrowhead != null && (s += t.targetArrowhead.length), o = o.normalize().mul(1.5 * s);
		for (let i = 1; i < 1e4; i *= 2) {
			let a = E.createBezierSegN(n, r, o, i);
			if (e.trimSplineAndCalculateArrowheadsII(t, t.source.boundaryCurve, t.target.boundaryCurve, a, !1)) return;
		}
		e.createEdgeCurveWithNoTrimming(t, n, r);
	}
	static createEdgeCurveWithNoTrimming(e, t, n) {
		let r = n.sub(t).normalize(), i = t, a = n, o = e.targetArrowhead;
		o != null && (o.tipPosition = n, a = n.sub(r.mul(o.length)));
		let s = e.sourceArrowhead;
		s != null && (s.tipPosition = t, i = t.add(r.mul(s.length))), e.curve = S.mkPP(i, a);
	}
};
Qn.defaultArrowheadLength = 5;
//#endregion
//#region node_modules/@msagl/core/dist/utils/pointPairMap.js
var $n = class {
	constructor() {
		this.m = /* @__PURE__ */ new Map();
	}
	clear() {
		this.m.clear();
	}
	get size() {
		return this.m.size;
	}
	set(e, t) {
		this.m.set(nr(e), t);
	}
	delete(e) {
		this.m.delete(nr(e));
	}
	has(e) {
		return this.m.has(nr(e));
	}
	getPP(e, t) {
		return this.get(new L(e, t));
	}
	get(e) {
		return this.m.get(nr(e));
	}
	*keys() {
		for (let e of this.m.keys()) yield er(e);
	}
	*[Symbol.iterator]() {
		for (let [e, t] of this.m) yield [er(e), t];
	}
	*values() {
		yield* this.m.values();
	}
};
function er(e) {
	let t = e.split(" "), n = t[0], r = t[1], i = n.split(","), a = new y(Number(i[0]), Number(i[1]));
	return i = r.split(","), new L(a, new y(Number(i[0]), Number(i[1])));
}
function tr(e, t) {
	return [rr(e), rr(t)].sort().join(" ");
}
function nr(e) {
	return tr(e.first, e.second);
}
function rr(e) {
	return e.x.toString() + "," + e.y.toString();
}
//#endregion
//#region node_modules/@msagl/core/dist/routing/ShapeCreator.js
var ir = class e {
	static GetShapes(e, t = Array.from(e.shallowEdges)) {
		let n = /* @__PURE__ */ new Map();
		ar(e, n);
		for (let e of t) {
			let t = n.get(e.source);
			t && e.sourcePort != null && t.Ports.add(e.sourcePort), t = n.get(e.target), t && e.targetPort != null && t.Ports.add(e.targetPort);
		}
		return Array.from(n.values());
	}
	static CreateShapeWithCenterPort(t) {
		let n = new rn(t), r = xt.mk(() => t.boundaryCurve, () => t.center);
		n.Ports.add(r);
		for (let n of t.inEdges()) e.FixPortAtTarget(r, n);
		for (let n of t.outEdges()) e.FixPortAtSource(r, n);
		for (let n of t.selfEdges()) e.FixPortAtSource(r, n), e.FixPortAtTarget(r, n);
		return n;
	}
	static CreateShapeWithClusterBoundaryPort(t) {
		let n = new rn(t), r = en.mk(() => t.boundaryCurve, () => t.center);
		n.Ports.add(r);
		let i;
		for (let n of t.inEdges()) n.EdgeToAncestor() === We.ToAncestor ? (i ??= new $t(() => t.boundaryCurve), n.targetPort = i) : e.FixPortAtTarget(r, n);
		for (let n of t.outEdges()) n.EdgeToAncestor() === We.FromAncestor ? (i ??= new $t(() => t.boundaryCurve), n.sourcePort = i) : e.FixPortAtSource(r, n);
		for (let n of t.selfEdges()) e.FixPortAtSource(r, n), e.FixPortAtTarget(r, n);
		return n;
	}
	static FixPortAtSource(e, t) {
		t != null && (t.sourcePort ??= e);
	}
	static FixPortAtTarget(e, t) {
		t != null && (t.targetPort ??= e);
	}
};
function ar(e, t) {
	for (let n of e.shallowNodes) if (n instanceof mt) {
		let e = ir.CreateShapeWithClusterBoundaryPort(n);
		t.set(n, e);
		let r = n;
		if (!r.isCollapsed) {
			ar(r, t);
			for (let n of r.shallowNodes) e.AddChild(t.get(n));
		}
	} else t.set(n, ir.CreateShapeWithCenterPort(n));
}
//#endregion
//#region node_modules/@msagl/core/dist/layout/layered/CycleRemoval.js
var or;
(function(e) {
	e[e.NotVisited = 0] = "NotVisited", e[e.InStack = 1] = "InStack", e[e.Visited = 2] = "Visited";
})(or ||= {});
var sr = class {
	constructor(e, t) {
		this.v = e, this.i = t;
	}
}, cr = class e {
	static getFeedbackSetWithConstraints(e, t) {
		throw Error("Method not implemented.");
	}
	static push(e, t, n, r) {
		t[n] = or.InStack, e.push(new sr(n, r));
	}
	static getFeedbackSet(t) {
		let n = new gt();
		if (t == null || t.nodeCount === 0) return [];
		let r = Array(t.nodeCount).fill(or.NotVisited);
		for (let i = 0; i < t.nodeCount; i++) {
			if (r[i] === or.Visited) continue;
			let a = new N.Stack(), o = 0;
			for (e.push(a, r, i, o); a.size > 0;) {
				let s = a.pop();
				i = s.v, r[i] = or.Visited, o = s.i;
				let c = t.outEdges[i];
				for (; o < c.length; o++) {
					let s = c[o];
					if (s.source === s.target) continue;
					let l = r[s.target];
					l === or.InStack ? n.set(s.source, s.target, s) : l === or.NotVisited && (e.push(a, r, i, o + 1), i = s.target, r[s.target] = or.Visited, c = t.outEdges[i], o = -1);
				}
			}
		}
		return Array.from(n.values());
	}
}, lr = class {
	constructor() {
		this.isEmpty = !0;
	}
	AddValue(e) {
		this.isEmpty ? (this.max = e, this.min = e, this.isEmpty = !1) : e < this.min ? this.min = e : e > this.max && (this.max = e);
	}
	get length() {
		return this.max - this.min;
	}
	static sign(e) {
		return e > u.distanceEpsilon ? 1 : e < -u.distanceEpsilon ? -1 : 0;
	}
}, ur = class e {
	SetActiveState(e, t) {
		this.IsActive = e, this.VectorIndex = t, this.IsActive ? (this.Left.ActiveConstraintCount++, this.Right.ActiveConstraintCount++) : (this.Left.ActiveConstraintCount--, this.Right.ActiveConstraintCount--);
	}
	SetVectorIndex(e) {
		this.VectorIndex = e;
	}
	Reinitialize() {
		this.IsActive = !1, this.IsUnsatisfiable = !1, this.ClearDfDv();
	}
	UpdateGap(e) {
		this.Gap = e;
	}
	static constructorVVNB(t, n, r, i) {
		let a = new e(t);
		return a.Left = t, a.Right = n, a.Gap = r, a.IsEquality = i, a.Lagrangian = 0, a.IsActive = !1, a;
	}
	constructor(e) {
		this.Right = e, this.Left = e;
	}
	ToString() {
		return U.String.format("  Cst: [{0}] [{1}] {2} {3:F5} vio {4:F5} Lm {5:F5}/{6:F5} {7}actv", this.Left, this.Right, this.IsEquality ? "==" : ">=", this.Gap, this.Violation, this.Lagrangian, this.Lagrangian * 2, this.IsActive ? "+" : this.IsUnsatisfiable ? "!" : "-");
	}
	get Violation() {
		return this.Left.ActualPos * this.Left.Scale + (this.Gap - this.Right.ActualPos * this.Right.Scale);
	}
	ClearDfDv() {
		this.Lagrangian = 0;
	}
	CompareTo(e) {
		let t = this.Left.CompareTo(e.Left);
		return t === 0 && (t = this.Right.CompareTo(e.Right)), t === 0 && (t = f(this.Gap, e.Gap)), t;
	}
}, dr = class e {
	static constructorDCVV(t, n, r, i) {
		let a = new e(n);
		return a.Set(t, n, r, i), a;
	}
	constructor(e) {
		this.ConstraintToEval = e, this.Depth = -1;
	}
	Set(e, t, n, r) {
		return this.Parent = e, this.ConstraintToEval = t, this.VariableToEval = n, this.VariableDoneEval = r, this.Depth = 0, this.ChildrenHaveBeenPushed = !1, t.Lagrangian = 0, this;
	}
	get IsLeftToRight() {
		return this.VariableToEval === this.ConstraintToEval.Right;
	}
	toString() {
		return U.String.format("{0} {1}{2} - {3}{4} ({5})", "", this.IsLeftToRight ? "" : "*", this.ConstraintToEval.Left.Name, this.IsLeftToRight ? "*" : "", this.ConstraintToEval.Right.Name, this.Depth);
	}
}, fr = class {
	constructor(e, t) {
		this.Constraint = e, this.IsForward = t;
	}
}, pr = class e {
	constructor(e, t) {
		this.Variables = [], e != null && this.AddVariable(e), this.allConstraints = t;
	}
	toString() {
		return U.String.format("[Block: nvars = {0} refpos = {1:F5} scale = {2:F5}]", this.Variables.length, this.ReferencePos, this.Scale);
	}
	ComputeDfDv(e) {
		this.allConstraints.DfDvStack = new N.Stack();
		let t = new ur(e);
		this.dfDvDummyParentNode = new dr(t);
		let n = this.GetDfDvNode(this.dfDvDummyParentNode, t, e, null);
		for (this.allConstraints.DfDvStack.push(n);;) {
			let e = this.allConstraints.DfDvStack.top, t = this.allConstraints.DfDvStack.length;
			if (!e.ChildrenHaveBeenPushed) {
				e.ChildrenHaveBeenPushed = !0;
				for (let t of e.VariableToEval.LeftConstraints) if (t.IsActive && t.Right !== e.VariableDoneEval) {
					let n = this.GetDfDvNode(e, t, t.Right, e.VariableToEval);
					t.Right.ActiveConstraintCount === 1 ? this.ProcessDfDvLeafNodeDirectly(n) : this.PushDfDvNode(n);
				}
				for (let t of e.VariableToEval.RightConstraints) if (t.IsActive && t.Left !== e.VariableDoneEval) {
					let n = this.GetDfDvNode(e, t, t.Left, e.VariableToEval);
					t.Left.ActiveConstraintCount === 1 ? this.ProcessDfDvLeafNodeDirectly(n) : this.PushDfDvNode(n);
				}
				if (this.allConstraints.DfDvStack.length > t) continue;
			}
			if (this.allConstraints.DfDvStack.pop(), this.ProcessDfDvLeafNode(e), e === n) break;
		}
	}
	ProcessDfDvLeafNode(e) {
		let t = e.VariableToEval.DfDv;
		e.IsLeftToRight ? (e.ConstraintToEval.Lagrangian = e.ConstraintToEval.Lagrangian + t, e.Parent.ConstraintToEval.Lagrangian = e.Parent.ConstraintToEval.Lagrangian + e.ConstraintToEval.Lagrangian) : (e.ConstraintToEval.Lagrangian = (e.ConstraintToEval.Lagrangian + t) * -1, e.Parent.ConstraintToEval.Lagrangian = e.Parent.ConstraintToEval.Lagrangian - e.ConstraintToEval.Lagrangian), this.CheckForConstraintPathTarget(e), this.Debug_CheckForViolatedActiveConstraint(e.ConstraintToEval), this.allConstraints.RecycleDfDvNode(e);
	}
	Debug_CheckForViolatedActiveConstraint(e) {
		e.Violation, this.allConstraints.SolverParameters.GapTolerance;
	}
	ProcessDfDvLeafNodeDirectly(e) {
		this.ProcessDfDvLeafNode(e);
	}
	GetDfDvNode(e, t, n, r) {
		let i = this.allConstraints.DfDvRecycleStack.size > 0 ? this.allConstraints.DfDvRecycleStack.pop().Set(e, t, n, r) : dr.constructorDCVV(e, t, n, r);
		return i.Depth = i.Parent.Depth + 1, this.allConstraints.MaxConstraintTreeDepth < i.Depth && (this.allConstraints.MaxConstraintTreeDepth = i.Depth), i;
	}
	PushDfDvNode(e) {
		this.PushOnDfDvStack(e);
	}
	AddVariableAndPushDfDvNode(e, t) {
		e.push(t.VariableToEval), this.PushOnDfDvStack(t);
	}
	PushOnDfDvStack(e) {
		this.allConstraints.DfDvStack.push(e);
	}
	CheckForConstraintPathTarget(e) {
		if (this.pathTargetVariable === e.VariableToEval) {
			for (; e.Parent !== this.dfDvDummyParentNode;) this.constraintPath.push(new fr(e.ConstraintToEval, e.IsLeftToRight)), e = e.Parent;
			this.pathTargetVariable = null;
		}
	}
	Expand(e) {
		this.constraintPath ??= [], this.constraintPath = [], this.pathTargetVariable = e.Right, this.ComputeDfDv(e.Left);
		let t = null;
		if (this.constraintPath.length > 0) {
			for (let e of this.constraintPath) e.IsForward && (t == null || e.Constraint.Lagrangian < t.Lagrangian) && (e.Constraint.IsEquality || (t = e.Constraint));
			t != null && this.allConstraints.DeactivateConstraint(t);
		}
		if (this.constraintPath = [], this.pathTargetVariable = null, t == null) {
			e.IsUnsatisfiable = !0, this.allConstraints.NumberOfUnsatisfiableConstraints++;
			return;
		}
		let n = [];
		this.GetConnectedVariables(n, e.Right, e.Left);
		let r = e.Violation, i = n.length;
		for (let e = 0; e < i; e++) n[e].OffsetInBlock = n[e].OffsetInBlock + r;
		this.allConstraints.ActivateConstraint(e), e.ClearDfDv(), this.UpdateReferencePos();
	}
	Split(e) {
		if (e && this.UpdateReferencePos(), this.Variables.length < 2) return null;
		let t = null;
		this.ComputeDfDv(this.Variables[0]);
		let n = this.allConstraints.SolverParameters.Advanced.MinSplitLagrangianThreshold, r = this.Variables.length;
		for (let e = 0; e < r; e++) for (let r of this.Variables[e].LeftConstraints) r.IsActive && !r.IsEquality && r.Lagrangian < n && (t = r, n = r.Lagrangian);
		return t == null ? null : this.SplitOnConstraint(t);
	}
	SplitOnConstraint(t) {
		this.allConstraints.DeactivateConstraint(t);
		let n = new e(null, this.allConstraints);
		return this.TransferConnectedVariables(n, t.Right, t.Left), n.Variables.length > 0 ? (this.UpdateReferencePos(), n.UpdateReferencePos()) : n = null, n;
	}
	AddVariable(e) {
		this.Variables.push(e), e.Block = this, this.Variables.length === 1 ? (this.Scale = e.Scale, this.ReferencePos = e.ActualPos, this.sumAd = e.ActualPos * e.Weight, this.sumAb = 0, this.sumA2 = e.Weight, e.OffsetInBlock = 0) : this.AddVariableToBlockSums(e);
	}
	UpdateReferencePos() {
		this.Scale = this.Variables[0].Scale, this.sumAd = 0, this.sumAb = 0, this.sumA2 = 0;
		let e = this.Variables.length;
		for (let t = 0; t < e; t++) this.AddVariableToBlockSums(this.Variables[t]);
		this.UpdateReferencePosFromSums();
	}
	AddVariableToBlockSums(e) {
		let t = this.Scale / e.Scale, n = e.OffsetInBlock / e.Scale, r = t * e.Weight;
		this.sumAd += r * e.DesiredPos, this.sumAb += r * n, this.sumA2 += r * t;
	}
	UpdateReferencePosFromSums() {
		if (!(Number.isFinite(this.sumAd) && Number.isFinite(this.sumAb) && Number.isFinite(this.sumA2))) throw Error("infinite numbers");
		this.ReferencePos = (this.sumAd - this.sumAb) / this.sumA2, this.UpdateVariablePositions();
	}
	UpdateVariablePositions() {
		let e = this.Scale * this.ReferencePos, t = this.Variables.length;
		for (let n = 0; n < t; n++) {
			let t = this.Variables[n];
			t.ActualPos = (e + t.OffsetInBlock) / t.Scale;
		}
	}
	GetConnectedVariables(e, t, n) {
		this.RecurseGetConnectedVariables(e, t, n);
	}
	RecurseGetConnectedVariables(e, t, n) {
		this.allConstraints.DfDvStack = new N.Stack();
		let r = new ur(t);
		for (this.dfDvDummyParentNode = new dr(r), this.allConstraints.DfDvStack.push(this.GetDfDvNode(this.dfDvDummyParentNode, r, t, n)), e.push(t); this.allConstraints.DfDvStack.length > 0;) {
			let t = this.allConstraints.DfDvStack.top, n = this.allConstraints.DfDvStack.length;
			if (!t.ChildrenHaveBeenPushed) {
				t.ChildrenHaveBeenPushed = !0;
				for (let n of t.VariableToEval.LeftConstraints) n.IsActive && n.Right !== t.VariableDoneEval && (n.Right.ActiveConstraintCount === 1 ? e.push(n.Right) : this.AddVariableAndPushDfDvNode(e, this.GetDfDvNode(t, n, n.Right, t.VariableToEval)));
				for (let n of t.VariableToEval.RightConstraints) n.IsActive && n.Left !== t.VariableDoneEval && (n.Left.ActiveConstraintCount === 1 ? e.push(n.Left) : this.AddVariableAndPushDfDvNode(e, this.GetDfDvNode(t, n, n.Left, t.VariableToEval)));
			}
			this.allConstraints.DfDvStack.length > n || this.allConstraints.RecycleDfDvNode(this.allConstraints.DfDvStack.pop());
		}
	}
	TransferConnectedVariables(e, t, n) {
		this.GetConnectedVariables(e.Variables, t, n);
		let r = e.Variables.length;
		for (let t = 0; t < r; t++) e.Variables[t].Block = e;
		let i = this.Variables.length - 1;
		for (let t = this.Variables.length - 1; t >= 0; t--) this.Variables[t].Block === e && (t < i && (this.Variables[t] = this.Variables[i]), i--);
		if (this.Variables = this.Variables.slice(0, i + 1), this.Variables.length === 0) {
			for (let t = 0; t < r; t++) {
				let n = e.Variables[t];
				this.Variables.push(n), n.Block = this;
			}
			e.Variables = [];
		}
	}
}, mr = class {
	get Count() {
		return this.Vector.length;
	}
	item(e) {
		return this.Vector[e];
	}
	constructor() {
		this.Vector = [];
	}
	Add(e) {
		e.VectorIndex = this.Vector.length, this.Vector.push(e);
	}
	Remove(e) {
		let t = this.Vector[this.Vector.length - 1];
		this.Vector[e.VectorIndex] = t, t.VectorIndex = e.VectorIndex, this.Vector.pop();
	}
	toString() {
		return this.Vector.toString();
	}
}, hr = class {
	constructor() {
		this.nextConstraintIndex = 0, this.DfDvStack = new N.Stack(), this.DfDvRecycleStack = new N.Stack();
	}
	get IsEmpty() {
		return this.Vector == null;
	}
	Create(e) {
		this.Vector = Array(e), this.firstActiveConstraintIndex = e;
	}
	Add(e) {
		e.SetVectorIndex(this.nextConstraintIndex), this.Vector[this.nextConstraintIndex++] = e;
	}
	ActivateConstraint(e) {
		this.firstActiveConstraintIndex--, this.SwapConstraint(e);
	}
	DeactivateConstraint(e) {
		this.SwapConstraint(e), this.firstActiveConstraintIndex++;
	}
	SwapConstraint(e) {
		let t = this.Vector[this.firstActiveConstraintIndex];
		t.SetVectorIndex(e.VectorIndex), this.Vector[e.VectorIndex] = t, this.Vector[this.firstActiveConstraintIndex] = e, e.SetActiveState(!e.IsActive, this.firstActiveConstraintIndex);
	}
	Reinitialize() {
		if (this.Vector != null) {
			for (let e of this.Vector) e.Reinitialize();
			this.firstActiveConstraintIndex = this.Vector.length;
		}
	}
	RecycleDfDvNode(e) {
		this.DfDvRecycleStack.length < 1024 && this.DfDvRecycleStack.push(e);
	}
	toString() {
		return this.Vector.toString();
	}
}, gr = class e {
	constructor() {
		this.GapTolerance = 1e-4, this.QpscConvergenceEpsilon = 1e-5, this.QpscConvergenceQuotient = 1e-6, this.OuterProjectIterationsLimit = -1, this.InnerProjectIterationsLimit = -1, this.TimeLimit = -1, this.Advanced = new _r();
	}
	Clone() {
		let e = this.MemberwiseClone();
		return e.Advanced = this.Advanced.Clone(), e;
	}
	MemberwiseClone() {
		let t = new e();
		return t.GapTolerance = this.GapTolerance, t.QpscConvergenceEpsilon = this.QpscConvergenceEpsilon, t.QpscConvergenceQuotient = this.QpscConvergenceQuotient, t.OuterProjectIterationsLimit = this.OuterProjectIterationsLimit, t.InnerProjectIterationsLimit = this.InnerProjectIterationsLimit, t.TimeLimit = this.TimeLimit, t;
	}
}, _r = class e {
	constructor() {
		this.ForceQpsc = !1, this.ScaleInQpsc = !0, this.MinSplitLagrangianThreshold = -1e-7, this.UseViolationCache = !0, this.ViolationCacheMinBlocksDivisor = 10, this.ViolationCacheMinBlocksCount = 100;
	}
	Clone() {
		let t = new e();
		return t.ForceQpsc = this.ForceQpsc, t.ScaleInQpsc = this.ScaleInQpsc, t.MinSplitLagrangianThreshold = this.MinSplitLagrangianThreshold, t.UseViolationCache = this.UseViolationCache, t.ViolationCacheMinBlocksDivisor = this.ViolationCacheMinBlocksDivisor, t.ViolationCacheMinBlocksCount = this.ViolationCacheMinBlocksCount, t;
	}
}, vr = class {
	constructor(e) {
		this.Variable = e, this.OrigWeight = e.Weight, this.OrigScale = e.Scale, this.OrigDesiredPos = this.Variable.DesiredPos;
	}
}, yr = class {
	constructor(e, t) {
		this.Value = e, this.Column = t;
	}
}, br = class e {
	constructor(e, t) {
		this.newMatrixRow = [], this.previousFunctionValue = Number.MAX_VALUE, this.solverParameters = e, this.matrixQ = Array(t).fill(0), this.vectorWiDi = Array(t).fill(0), this.vectorQpscVars = Array(t).fill(0), this.gradientVector = Array(t).fill(0), this.vectorQg = Array(t).fill(0), this.vectorPrevY = Array(t).fill(0), this.vectorCurY = Array(t).fill(0);
	}
	AddVariable(e) {
		if (this.isFirstProjectCall = !0, this.vectorWiDi[e.Ordinal] = 2 * (e.Weight * e.DesiredPos) * -1, this.vectorPrevY[e.Ordinal] = e.Weight, e.Neighbors != null) for (let t of e.Neighbors) this.vectorPrevY[e.Ordinal] = this.vectorPrevY[e.Ordinal] + t.Weight, this.vectorPrevY[t.Neighbor.Ordinal] = this.vectorPrevY[t.Neighbor.Ordinal] - t.Weight;
		for (let e = 0; e < this.vectorPrevY.length; e++) this.vectorPrevY[e] !== 0 && (this.newMatrixRow.push(new yr(this.vectorPrevY[e] * 2, e)), this.vectorPrevY[e] = 0);
		this.matrixQ[e.Ordinal] = Array.from(this.newMatrixRow), this.newMatrixRow = [], this.vectorQpscVars[e.Ordinal] = new vr(e), e.Weight = 1;
	}
	VariablesComplete() {
		for (let e of this.vectorQpscVars) {
			let t = e.Variable;
			for (let e of this.matrixQ[t.Ordinal]) e.Column === t.Ordinal && (this.solverParameters.Advanced.ScaleInQpsc && (t.Scale = 1 / Math.sqrt(Math.abs(e.Value)), Number.isFinite(t.Scale) || (t.Scale = 1), t.Scale, this.vectorWiDi[t.Ordinal] = this.vectorWiDi[t.Ordinal] * t.Scale), this.vectorCurY[t.Ordinal] = t.ActualPos, t.DesiredPos = t.ActualPos);
		}
		if (this.solverParameters.Advanced.ScaleInQpsc) for (let e = 0; e < this.matrixQ.length; e++) {
			let t = this.matrixQ[e];
			for (let n = 0; n < t.length; n++) t[n].Column === e ? t[n].Value = 1 : t[n].Value = t[n].Value * (this.vectorQpscVars[e].Variable.Scale * this.vectorQpscVars[t[n].Column].Variable.Scale);
		}
	}
	PreProject() {
		if (this.isFirstProjectCall) for (let e of this.vectorQpscVars) this.vectorCurY[e.Variable.Ordinal] = e.Variable.ActualPos;
		if (this.MatrixVectorMultiply(this.vectorCurY, this.gradientVector), this.HasConverged()) return !1;
		e.VectorVectorAdd(this.gradientVector, this.vectorWiDi, this.gradientVector);
		let t = e.VectorVectorMultiply(this.gradientVector, this.gradientVector), n = 0;
		if (t !== 0 && (this.MatrixVectorMultiply(this.gradientVector, this.vectorQg), n = e.VectorVectorMultiply(this.vectorQg, this.gradientVector)), n === 0) return !1;
		let r = t / n;
		e.VectorCopy(this.vectorPrevY, this.vectorCurY), e.VectorScaledVectorSubtract(this.vectorPrevY, r, this.gradientVector, this.vectorCurY);
		for (let e = 0; e < this.vectorCurY.length; e++) this.vectorQpscVars[e].Variable.DesiredPos = this.vectorCurY[e];
		return !0;
	}
	PostProject() {
		for (let e of this.vectorQpscVars) this.vectorCurY[e.Variable.Ordinal] = e.Variable.ActualPos;
		e.VectorVectorSubtract(this.vectorPrevY, this.vectorCurY, this.vectorCurY);
		let t = e.VectorVectorMultiply(this.gradientVector, this.vectorCurY), n = 0;
		if (t !== 0) {
			this.MatrixVectorMultiply(this.vectorCurY, this.vectorQg);
			let r = e.VectorVectorMultiply(this.vectorQg, this.vectorCurY);
			n = r === 0 ? 1 : t / r, n > 1 ? n = 1 : n < 0 && (n = 0);
		}
		return e.VectorScaledVectorSubtract(this.vectorPrevY, n, this.vectorCurY, this.vectorCurY), this.isFirstProjectCall = !1, n > 0;
	}
	QpscComplete() {
		for (let e of this.vectorQpscVars) e.Variable.Weight = e.OrigWeight, e.Variable.DesiredPos = e.OrigDesiredPos, this.solverParameters.Advanced.ScaleInQpsc && (e.Variable.ActualPos = e.Variable.ActualPos * e.Variable.Scale, e.Variable.Scale = e.OrigScale);
		return this.previousFunctionValue;
	}
	HasConverged() {
		let e = this.GetFunctionValue(this.vectorCurY), t = !1;
		if (!this.isFirstProjectCall) {
			let n = this.previousFunctionValue - e, r = 0;
			if (n !== 0) {
				let t = this.previousFunctionValue === 0 ? e : this.previousFunctionValue;
				r = Math.abs(n / t);
			}
			(Math.abs(n) < this.solverParameters.QpscConvergenceEpsilon || Math.abs(r) < this.solverParameters.QpscConvergenceQuotient) && (t = !0);
		}
		return this.previousFunctionValue = e, t;
	}
	GetFunctionValue(t) {
		return e.VectorVectorMultiply(this.gradientVector, t) / 2 + e.VectorVectorMultiply(this.vectorWiDi, t);
	}
	static VectorVectorMultiply(e, t) {
		let n = 0;
		for (let r = 0; r < e.length; r++) n += e[r] * t[r];
		return n;
	}
	MatrixVectorMultiply(e, t) {
		let n = 0;
		for (let r of this.matrixQ) {
			let i = 0;
			for (let t of r) i += t.Value * e[t.Column];
			t[n++] = i;
		}
	}
	static VectorVectorAdd(e, t, n) {
		for (let r = 0; r < e.length; r++) n[r] = e[r] + t[r];
	}
	static VectorVectorSubtract(e, t, n) {
		for (let r = 0; r < e.length; r++) n[r] = e[r] - t[r];
	}
	static VectorScaledVectorSubtract(e, t, n, r) {
		for (let i = 0; i < e.length; i++) r[i] = e[i] - t * n[i];
	}
	static VectorCopy(e, t) {
		for (let n = 0; n < t.length; n++) e[n] = t[n];
	}
}, xr = class e {
	constructor() {
		this.NumberOfUnsatisfiableConstraints = 0, this.OuterProjectIterations = 0, this.InnerProjectIterationsTotal = 0, this.MinInnerProjectIterations = 0, this.MaxInnerProjectIterations = 0, this.MaxConstraintTreeDepth = 0, this.GoalFunctionValue = 0, this.TimeLimitExceeded = !1, this.OuterProjectIterationsLimitExceeded = !1, this.InnerProjectIterationsLimitExceeded = !1;
	}
	get ExecutionLimitExceeded() {
		return this.TimeLimitExceeded || this.OuterProjectIterationsLimitExceeded || this.InnerProjectIterationsLimitExceeded;
	}
	Clone() {
		let t = new e();
		return t.GoalFunctionValue = this.GoalFunctionValue, t.InnerProjectIterationsLimitExceeded = this.InnerProjectIterationsLimitExceeded, t.InnerProjectIterationsTotal = this.InnerProjectIterationsTotal, t.MaxConstraintTreeDepth = this.MaxConstraintTreeDepth, t.OuterProjectIterations = this.OuterProjectIterations, t.OuterProjectIterationsLimitExceeded = this.OuterProjectIterationsLimitExceeded, t.AlgorithmUsed = this.AlgorithmUsed, t.NumberOfUnsatisfiableConstraints = this.NumberOfUnsatisfiableConstraints, t.MaxInnerProjectIterations = this.MaxInnerProjectIterations, t;
	}
}, Sr;
(function(e) {
	e[e.ProjectOnly = 0] = "ProjectOnly", e[e.QpscWithScaling = 1] = "QpscWithScaling", e[e.QpscWithoutScaling = 2] = "QpscWithoutScaling";
})(Sr ||= {});
//#endregion
//#region node_modules/@msagl/core/dist/math/projectionSolver/Variable.js
var Cr = class {
	constructor(e, t) {
		this.Neighbor = e, this.Weight = t;
	}
}, wr = class {
	get DfDv() {
		return 2 * (this.Weight * (this.ActualPos - this.DesiredPos)) / this.Scale;
	}
	constructor(e, t, n, r, i) {
		if (this.ActiveConstraintCount = 0, r <= 0) throw Error("weight");
		if (i <= 0) throw Error("scale");
		let a = n * r;
		if (!Number.isFinite(a) || Number.isNaN(a) || (a = n * i, !Number.isFinite(a) || Number.isNaN(a))) throw Error("desiredPos");
		this.Ordinal = e, this.UserData = t, this.DesiredPos = n, this.Weight = r, this.Scale = i, this.OffsetInBlock = 0, this.ActualPos = this.DesiredPos;
	}
	Reinitialize() {
		this.ActiveConstraintCount = 0, this.OffsetInBlock = 0, this.ActualPos = this.DesiredPos;
	}
	AddNeighbor(e, t) {
		this.Neighbors ??= [], this.Neighbors.push(new Cr(e, t));
	}
	toString() {
		return U.String.format("{0} {1:F5} ({2:F5}) {3:F5} {4:F5}", this.Name, this.ActualPos, this.DesiredPos, this.Weight, this.Scale);
	}
	get Name() {
		return this.UserData == null ? "-0-" : this.UserData.toString();
	}
	SetConstraints(e, t) {
		this.LeftConstraints = e, this.RightConstraints = t;
	}
	CompareTo(e) {
		return f(this.Ordinal, e.Ordinal);
	}
}, Tr = class e {
	get IsFull() {
		return this.numConstraints === e.MaxConstraints;
	}
	Clear() {
		this.LowViolation = 0, this.numConstraints = 0, this.constraints ||= Array(e.MaxConstraints);
	}
	FilterBlock(e) {
		this.LowViolation = Number.MAX_VALUE;
		let t = this.numConstraints > 0;
		for (let t = this.numConstraints - 1; t >= 0; t--) {
			let n = this.constraints[t];
			if (n.Left.Block === e || n.Right.Block === e || n.IsActive || n.IsUnsatisfiable) t < this.numConstraints - 1 && (this.constraints[t] = this.constraints[this.numConstraints - 1]), this.numConstraints--;
			else {
				let e = n.Left.ActualPos * n.Left.Scale + (n.Gap - n.Right.ActualPos * n.Right.Scale);
				e < this.LowViolation && (this.LowViolation = e);
			}
		}
		return this.numConstraints === 0 && (this.LowViolation = 0), t;
	}
	FindIfGreater(e) {
		let t = null;
		for (let n = 0; n < this.numConstraints; n++) {
			let r = this.constraints[n], i = r.Left.ActualPos * r.Left.Scale + (r.Gap - r.Right.ActualPos * r.Right.Scale);
			i > e && (e = i, t = r);
		}
		return t;
	}
	Insert(e, t) {
		let n = 0, r = t, i = t;
		for (let e = 0; e < this.numConstraints; e++) {
			let t = this.constraints[e], a = t.Left.ActualPos * t.Left.Scale + (t.Gap - t.Right.ActualPos * t.Right.Scale);
			a < r ? (i = r, n = e, r = a) : a < i && (i = a);
		}
		this.IsFull ? (this.constraints[n] = e, this.LowViolation = i) : (this.constraints[this.numConstraints++] = e, this.IsFull && (this.LowViolation = r));
	}
};
Tr.MaxConstraints = 20;
//#endregion
//#region node_modules/@msagl/core/dist/math/projectionSolver/Solver.js
var Er = class {
	constructor(e, t) {
		this.NumberOfLeftConstraints = 0, this.Constraints = e, this.NumberOfLeftConstraints = t;
	}
}, Dr = class {
	constructor() {
		this.allBlocks = new mr(), this.allConstraints = new hr(), this.numberOfConstraints = 0, this.numberOfVariables = 0, this.equalityConstraints = [], this.loadedVariablesAndConstraintLists = /* @__PURE__ */ new Map(), this.emptyConstraintList = [], this.updatedConstraints = [], this.violationCache = new Tr(), this.violationCacheMinBlockCutoff = 0, this.nextVariableOrdinal = 0, this.solverParams = new gr(), this.solverSolution = new xr();
	}
	get IsQpsc() {
		return this.hasNeighbourPairs || this.solverParams.Advanced.ForceQpsc;
	}
	AddVariableAN(e, t) {
		return this.AddVariableANNN(e, t, 1, 1);
	}
	AddVariableANN(e, t, n) {
		return this.AddVariableANNN(e, t, n, 1);
	}
	AddVariableANNN(e, t, n, r) {
		if (!this.allConstraints.IsEmpty) throw Error("Cannot add Variables or Constraints once Solve() has been called");
		let i = new wr(this.nextVariableOrdinal++, e, t, n, r), a = new pr(i, this.allConstraints);
		return i.Block = a, this.allBlocks.Add(a), this.numberOfVariables++, this.loadedVariablesAndConstraintLists.set(i, new Er([], 0)), i;
	}
	UpdateVariables() {
		for (let e of this.allBlocks.Vector) e.UpdateReferencePos();
	}
	get Variables() {
		return Le(this.allBlocks.Vector, (e) => e.Variables);
	}
	get VariableCount() {
		return this.numberOfVariables;
	}
	*Constraints() {
		if (this.allConstraints.IsEmpty) for (let e of this.loadedVariablesAndConstraintLists.keys()) {
			let t = this.loadedVariablesAndConstraintLists.get(e);
			if (t.Constraints != null) {
				let n = t.Constraints.length;
				for (let r = 0; r < n; r++) {
					let n = t.Constraints[r];
					if (e === n.Left) return yield, n;
				}
			}
		}
		else for (let e of this.allConstraints.Vector) yield e;
	}
	get ConstraintCount() {
		return this.numberOfConstraints;
	}
	AddEqualityConstraint(e, t, n) {
		return this.AddConstraintVVNB(e, t, n, !0);
	}
	AddConstraintVVNB(e, t, n, r) {
		if (!this.allConstraints.IsEmpty) throw Error("Cannot add Variables or Constraints once Solve() has been called");
		if (e === t) throw Error("Cannot add a constraint between a variable and itself");
		let i = this.loadedVariablesAndConstraintLists.get(e), a = this.loadedVariablesAndConstraintLists.get(t), o = ur.constructorVVNB(e, t, n, r);
		return this.loadedVariablesAndConstraintLists.set(e, new Er(i.Constraints, i.NumberOfLeftConstraints + 1)), i.Constraints.push(o), a.Constraints.push(o), this.numberOfConstraints++, r && this.equalityConstraints.push(o), o;
	}
	AddConstraint(e, t, n) {
		return this.AddConstraintVVNB(e, t, n, !1);
	}
	SetConstraintUpdate(e, t) {
		t !== e.Gap && this.updatedConstraints.push([e, t]);
	}
	AddNeighborPair(e, t, n) {
		if (n <= 0 || Number.isNaN(n) || !Number.isFinite(n)) throw Error("relationshipWeight");
		if (e === t) throw Error();
		e.AddNeighbor(t, n), t.AddNeighbor(e, n), this.hasNeighbourPairs = !0;
	}
	Solve() {
		return this.SolvePar(null);
	}
	SolvePar(e) {
		e && (this.solverParams = e.Clone()), this.solverParams.OuterProjectIterationsLimit < 0 && (this.solverParams.OuterProjectIterationsLimit = 100 * (Math.floor(Math.log2(this.numberOfVariables)) + 1)), this.solverParams.InnerProjectIterationsLimit < 0 && (this.solverParams.InnerProjectIterationsLimit = this.numberOfConstraints * 2 + 100 * (Math.max(0, Math.floor(Math.log2(this.numberOfConstraints))) + 1));
		let t = !this.allConstraints.IsEmpty;
		if (this.CheckForUpdatedConstraints(), this.solverSolution = new xr(), this.solverSolution.MinInnerProjectIterations = Number.MAX_VALUE, this.allConstraints.MaxConstraintTreeDepth = 0, this.allConstraints.SolverParameters = this.solverParams, this.numberOfConstraints === 0) {
			if (!this.IsQpsc) return this.solverSolution.Clone();
		} else t || this.SetupConstraints();
		return this.allConstraints.NumberOfUnsatisfiableConstraints = 0, this.MergeEqualityConstraints(), this.IsQpsc ? this.SolveQpsc() : (this.SolveByStandaloneProject(), this.CalculateStandaloneProjectGoalFunctionValue()), this.solverSolution.MinInnerProjectIterations > this.solverSolution.MaxInnerProjectIterations && (this.solverSolution.MinInnerProjectIterations = this.solverSolution.MaxInnerProjectIterations), this.solverSolution.NumberOfUnsatisfiableConstraints = this.allConstraints.NumberOfUnsatisfiableConstraints, this.solverSolution.MaxConstraintTreeDepth = this.allConstraints.MaxConstraintTreeDepth, this.solverSolution.Clone();
	}
	CheckForUpdatedConstraints() {
		if (this.updatedConstraints.length === 0) return;
		let e = this.IsQpsc;
		for (let [t, n] of this.updatedConstraints) {
			let r = t;
			if (r.UpdateGap(n), !e && !r.IsEquality) {
				this.SplitOnConstraintIfActive(r);
				continue;
			}
			e = !0;
		}
		this.updatedConstraints = [], e && this.ReinitializeBlocks();
	}
	SplitOnConstraintIfActive(e) {
		if (e.IsActive) {
			let t = e.Left.Block.SplitOnConstraint(e);
			t != null && this.allBlocks.Add(t);
		}
	}
	SetupConstraints() {
		this.allConstraints.Create(this.numberOfConstraints);
		for (let e of this.loadedVariablesAndConstraintLists.keys()) {
			let t = this.loadedVariablesAndConstraintLists.get(e), n = t.Constraints, r = 0, i = 0, a = 0;
			n != null && (r = n.length, i = t.NumberOfLeftConstraints, a = r - i);
			let o = this.emptyConstraintList;
			i !== 0 && (o = Array(i));
			let s = this.emptyConstraintList;
			a !== 0 && (s = Array(a)), e.SetConstraints(o, s);
			let c = 0, l = 0;
			for (let t = 0; t < r; t++) {
				let r = n[t];
				e === r.Left ? o[c++] = r : s[l++] = r;
			}
			for (let t of e.LeftConstraints) this.allConstraints.Add(t);
		}
		this.loadedVariablesAndConstraintLists.clear(), this.violationCacheMinBlockCutoff = Number.MAX_VALUE, this.solverParams.Advanced.UseViolationCache && this.solverParams.Advanced.ViolationCacheMinBlocksDivisor > 0 && (this.violationCacheMinBlockCutoff = Math.min(this.allBlocks.Count / this.solverParams.Advanced.ViolationCacheMinBlocksDivisor, this.solverParams.Advanced.ViolationCacheMinBlocksCount));
	}
	SolveByStandaloneProject() {
		for (;;) {
			if (!this.RunProject()) return;
			if (!this.SplitBlocks()) break;
		}
	}
	RunProject() {
		return this.solverSolution.OuterProjectIterations++, this.Project(), !this.CheckForLimitsExceeded();
	}
	CheckForLimitsExceeded() {
		return this.solverParams.OuterProjectIterationsLimit > 0 && this.solverSolution.OuterProjectIterations >= this.solverParams.OuterProjectIterationsLimit ? (this.solverSolution.OuterProjectIterationsLimitExceeded = !0, !0) : !!this.solverSolution.InnerProjectIterationsLimitExceeded;
	}
	CalculateStandaloneProjectGoalFunctionValue() {
		this.solverSolution.GoalFunctionValue = 0;
		let e = this.allBlocks.Count;
		for (let t = 0; t < e; t++) {
			let e = this.allBlocks.item(t), n = e.Variables.length;
			for (let t = 0; t < n; t++) {
				let n = e.Variables[t];
				this.solverSolution.GoalFunctionValue += n.Weight * (n.ActualPos * n.ActualPos), this.solverSolution.GoalFunctionValue -= 2 * (n.Weight * (n.DesiredPos * n.ActualPos));
			}
		}
	}
	SolveQpsc() {
		if (this.solverSolution.AlgorithmUsed = this.solverParams.Advanced.ScaleInQpsc ? Sr.QpscWithScaling : Sr.QpscWithoutScaling, !this.QpscMakeFeasible()) return;
		let e = new br(this.solverParams, this.numberOfVariables);
		for (let t of this.allBlocks.Vector) for (let n of t.Variables) e.AddVariable(n);
		e.VariablesComplete(), this.ReinitializeBlocks(), this.MergeEqualityConstraints();
		let t = !1;
		for (; !(!e.PreProject() && !t || (t = this.SplitBlocks(), !this.RunProject()) || !e.PostProject() && !t););
		this.solverSolution.GoalFunctionValue = e.QpscComplete();
	}
	QpscMakeFeasible() {
		return this.RunProject();
	}
	ReinitializeBlocks() {
		let e = Array.from(this.allBlocks.Vector);
		this.allBlocks.Vector = [];
		for (let t of e) for (let e of t.Variables) {
			e.Reinitialize();
			let t = new pr(e, this.allConstraints);
			this.allBlocks.Add(t);
		}
		this.allConstraints.Reinitialize(), this.violationCache.Clear();
	}
	MergeEqualityConstraints() {
		for (let e of this.equalityConstraints) {
			if (e.Left.Block === e.Right.Block) {
				Math.abs(e.Violation) > this.solverParams.GapTolerance && (e.IsUnsatisfiable = !0, this.allConstraints.NumberOfUnsatisfiableConstraints++);
				continue;
			}
			this.MergeBlocks(e);
		}
	}
	Project() {
		if (this.numberOfConstraints === 0) return !1;
		this.violationCache.Clear(), this.lastModifiedBlock = null;
		let e = this.allBlocks.Count > this.violationCacheMinBlockCutoff, t = 1, n = this.GetMaxViolatedConstraint({ maxViolation: 0 }, e);
		if (!n) return !1;
		for (; n;) {
			if (n.Left.Block === n.Right.Block ? (n.Left.Block.Expand(n), n.IsUnsatisfiable && this.violationCache.Clear(), this.lastModifiedBlock = n.Left.Block) : this.lastModifiedBlock = this.MergeBlocks(n), this.solverParams.InnerProjectIterationsLimit > 0 && t >= this.solverParams.InnerProjectIterationsLimit) {
				this.solverSolution.InnerProjectIterationsLimitExceeded = !0;
				break;
			}
			e = this.allBlocks.Count > this.violationCacheMinBlockCutoff, e || this.violationCache.Clear(), t++, n = this.GetMaxViolatedConstraint({ maxViolation: 0 }, e);
		}
		return this.solverSolution.InnerProjectIterationsTotal = this.solverSolution.InnerProjectIterationsTotal + t, this.solverSolution.MaxInnerProjectIterations < t && (this.solverSolution.MaxInnerProjectIterations = t), this.solverSolution.MinInnerProjectIterations > t && (this.solverSolution.MinInnerProjectIterations = t), !0;
	}
	MergeBlocks(e) {
		let t = e.Left.Block, n = e.Right.Block, r = e.Left.OffsetInBlock + (e.Gap - e.Right.OffsetInBlock);
		n.Variables.length > t.Variables.length && (t = e.Right.Block, n = e.Left.Block, r = -r);
		let i = n.Variables.length;
		for (let e = 0; e < i; e++) {
			let i = n.Variables[e];
			i.OffsetInBlock += r, t.AddVariable(i);
		}
		return t.UpdateReferencePosFromSums(), this.allConstraints.ActivateConstraint(e), this.allBlocks.Remove(n), t;
	}
	SplitBlocks() {
		let e = [], t = this.allBlocks.Count;
		for (let n = 0; n < t; n++) {
			let t = this.allBlocks.item(n).Split(this.IsQpsc);
			t != null && e.push(t);
		}
		let n = e.length;
		for (let t = 0; t < n; t++) {
			let n = e[t];
			this.allBlocks.Add(n);
		}
		return e.length !== 0;
	}
	GetMaxViolatedConstraint(e, t) {
		return e.maxViolation = this.solverParams.GapTolerance, this.SearchViolationCache(e.maxViolation) ?? this.SearchAllConstraints(e.maxViolation, t);
	}
	SearchViolationCache(e) {
		let t = null;
		if (this.lastModifiedBlock == null) return;
		this.lastModifiedBlock.Variables.length < this.numberOfVariables + 1 && this.violationCache.FilterBlock(this.lastModifiedBlock);
		let n = this.lastModifiedBlock.Variables.length;
		for (let r = 0; r < n; r++) {
			let n = this.lastModifiedBlock.Variables[r];
			for (let r of n.LeftConstraints) !r.IsActive && !r.IsUnsatisfiable && h(r.Left.ActualPos * r.Left.Scale + (r.Gap - r.Right.ActualPos * r.Right.Scale), e) && (t != null && e > this.violationCache.LowViolation && this.violationCache.Insert(t, e), e = r.Violation, t = r);
			for (let r of n.RightConstraints) if (!r.IsActive && !r.IsUnsatisfiable && r.Left.Block !== this.lastModifiedBlock) {
				let n = r.Left.ActualPos * r.Left.Scale + (r.Gap - r.Right.ActualPos * r.Right.Scale);
				h(n, e) && (t != null && e > this.violationCache.LowViolation && this.violationCache.Insert(t, e), e = n, t = r);
			}
		}
		let r = this.violationCache.FindIfGreater(e);
		return r != null && (t != null && e > this.violationCache.LowViolation && this.violationCache.Insert(t, e), t = r), t;
	}
	SearchAllConstraints(e, t) {
		let n = null;
		this.violationCache.Clear();
		for (let r of this.allConstraints.Vector) {
			if (r.IsActive) break;
			if (r.IsUnsatisfiable) continue;
			let i = r.Left.ActualPos * r.Left.Scale + (r.Gap - r.Right.ActualPos * r.Right.Scale), a = null, o = 0;
			h(i, e) && (e > this.violationCache.LowViolation && (a = n, o = e), e = i, n = r), t && (a == null && r !== n && (!this.violationCache.IsFull || i > this.violationCache.LowViolation) && (a = r, o = i), a != null && o > this.violationCache.LowViolation && this.violationCache.Insert(a, o));
		}
		return n;
	}
}, Or = class e {
	constructor() {
		this.variables = /* @__PURE__ */ new Map(), this.fixedVars = /* @__PURE__ */ new Map(), this.FailToAdjustEpsilon = .001, this.InitSolver();
	}
	AddVariableWithIdealPositionNNN(e, t, n) {
		this.variables.set(e, this.solver.AddVariableANN(e, t, n));
	}
	AddVariableWithIdealPositionNN(e, t) {
		this.AddVariableWithIdealPositionNNN(e, t, 1);
	}
	AddLeftRightSeparationConstraintNNNB(e, t, n, r) {
		let i = this.GetVariable(e);
		if (i == null) return;
		let a = this.GetVariable(t);
		a != null && this.solver.AddConstraintVVNB(i, a, n, r);
	}
	AddLeftRightSeparationConstraintNNN(e, t, n) {
		this.AddLeftRightSeparationConstraintNNNB(e, t, n, !1);
	}
	AddGoalTwoVariablesAreCloseNNN(e, t, n) {
		let r = this.GetVariable(e);
		if (r == null) return;
		let i = this.GetVariable(t);
		i != null && this.solver.AddNeighborPair(r, i, n);
	}
	AddGoalTwoVariablesAreClose(e, t) {
		this.AddGoalTwoVariablesAreCloseNNN(e, t, 1);
	}
	GetVariable(e) {
		return this.variables.get(e);
	}
	Solve() {
		this.SolveP(null);
	}
	SolveP(e) {
		this.SolvePNS(e, { executionLimitExceeded: !1 });
	}
	SolvePNS(e, t) {
		let n;
		do {
			this.solution = null;
			let r = null;
			if (e != null && (r = e, r == null)) throw Error("parameters");
			this.solution = this.solver.SolvePar(r), t.executionLimitExceeded = this.solution.ExecutionLimitExceeded, n = this.AdjustConstraintsForMovedFixedVars();
		} while (n && this.solution.ExecutionLimitExceeded === !1);
		return this.solution.ExecutionLimitExceeded === !1;
	}
	AdjustConstraintsForMovedFixedVars() {
		let t = /* @__PURE__ */ new Set();
		for (let [n, r] of this.fixedVars.entries()) e.Close(r, this.GetVariableResolvedPosition(n)) || t.add(n);
		return t.size === 0 ? !1 : this.AdjustConstraintsForMovedFixedVarSet(t);
	}
	static Close(e, t) {
		return Math.abs(e - t) < 5e-4;
	}
	AdjustConstraintsForMovedFixedVarSet(e) {
		for (; e.size > 0;) {
			let t;
			for (let n of e) {
				t = n;
				break;
			}
			if (!this.AdjustSubtreeOfFixedVar(t, e)) return !1;
		}
		return !0;
	}
	AdjustSubtreeOfFixedVar(e, t) {
		let n = { successInAdjusting: !1 }, r = this.AdjustConstraintsOfNeighborsOfFixedVariable(e, n);
		if (!n.successInAdjusting || r.length === 0) return !1;
		for (let e of r) t.delete(e);
		return !0;
	}
	AdjustConstraintsOfNeighborsOfFixedVariable(e, t) {
		let n = this.variables.get(e).Block.Variables, r = new lr(), i = new lr(), a = 1;
		for (let e of n) this.fixedVars.has(e.UserData) && (r.AddValue(e.ActualPos), i.AddValue(e.DesiredPos), i.length > 0 && (a = Math.max(a, r.length / i.length)));
		return a === 1 && (a = 2), t.successInAdjusting = this.FixActiveConstraints(n, a), n.map((e) => e.UserData);
	}
	FixActiveConstraints(e, t) {
		let n = !1;
		for (let r of e) for (let e of r.LeftConstraints) e.IsActive && (e.Gap > this.FailToAdjustEpsilon && (n = !0), this.solver.SetConstraintUpdate(e, e.Gap / t));
		return n;
	}
	GetVariableResolvedPosition(e) {
		let t = this.GetVariable(e);
		return t == null ? 0 : t.ActualPos;
	}
	InitSolver() {
		this.solver = new Dr(), this.variables.clear();
	}
	AddFixedVariable(t, n) {
		this.AddVariableWithIdealPositionNNN(t, n, e.FixedVarWeight), this.fixedVars.set(t, n);
	}
	ContainsVariable(e) {
		return this.variables.has(e);
	}
	GetVariableIdealPosition(e) {
		return this.variables.get(e).DesiredPos;
	}
	get Solution() {
		return this.solution;
	}
};
Or.FixedVarWeight = 1e9;
//#endregion
//#region node_modules/@msagl/core/dist/math/projectionSolver/UniformSolverVar.js
var kr = class {
	constructor() {
		this.lowBound = -Infinity, this.upperBound = Infinity;
	}
	get Position() {
		return this.position;
	}
	set Position(e) {
		e < this.lowBound ? this.position = this.lowBound : e > this.upperBound ? this.position = this.upperBound : this.position = e;
	}
	get LowBound() {
		return this.lowBound;
	}
	set LowBound(e) {
		this.lowBound = e;
	}
	get UpperBound() {
		return this.upperBound;
	}
	set UpperBound(e) {
		this.upperBound = e;
	}
	toString() {
		return this.lowBound + (" " + (this.Position + (" " + this.upperBound)));
	}
}, Ar = class {
	constructor(e) {
		this.idealPositions = /* @__PURE__ */ new Map(), this.varList = [], this.constraints = /* @__PURE__ */ new Set(), this.solverShell = new Or(), this.boundsToInt = /* @__PURE__ */ new Map(), this.varSepartion = e;
	}
	SetLowBound(e, t) {
		let n = this.Var(t);
		n.LowBound = Math.max(e, n.LowBound);
	}
	Var(e) {
		return this.varList[e];
	}
	SetUpperBound(e, t) {
		let n = this.Var(e);
		n.UpperBound = Math.min(t, n.UpperBound);
	}
	Solve() {
		this.SolveByRegularSolver();
	}
	SolveByRegularSolver() {
		this.CreateVariablesForBounds();
		for (let e = 0; e < this.varList.length; e++) {
			let t = this.varList[e];
			t.IsFixed ? this.solverShell.AddFixedVariable(e, t.Position) : (this.solverShell.AddVariableWithIdealPositionNN(e, this.idealPositions.get(e)), t.LowBound !== -Infinity && this.constraints.add(new V(this.GetBoundId(t.LowBound), e)), t.UpperBound !== Infinity && this.constraints.add(new V(e, this.GetBoundId(t.UpperBound))));
		}
		this.CreateGraphAndRemoveCycles();
		for (let e of this.graph.edges) {
			let t = 0;
			e.x < this.varList.length && (t += this.varList[e.x].Width), e.y < this.varList.length && (t += this.varList[e.y].Width), t /= 2, this.solverShell.AddLeftRightSeparationConstraintNNN(e.x, e.y, this.varSepartion + t);
		}
		this.solverShell.Solve();
		for (let e = 0; e < this.varList.length; e++) this.varList[e].Position = this.solverShell.GetVariableResolvedPosition(e);
	}
	GetBoundId(e) {
		return this.boundsToInt.get(e);
	}
	CreateVariablesForBounds() {
		for (let e of this.varList) e.IsFixed || (e.LowBound !== -Infinity && this.RegisterBoundVar(e.LowBound), e.UpperBound !== Infinity && this.RegisterBoundVar(e.UpperBound));
	}
	RegisterBoundVar(e) {
		if (!this.boundsToInt.has(e)) {
			let t = this.varList.length + this.boundsToInt.size;
			this.boundsToInt.set(e, t), this.solverShell.AddFixedVariable(t, e);
		}
	}
	CreateGraphAndRemoveCycles() {
		this.graph = Dn(Array.from(this.constraints), this.varList.length + this.boundsToInt.size);
		let e = cr.getFeedbackSet(this.graph);
		if (e != null) for (let t of e) this.graph.removeEdge(t);
	}
	GetVariablePosition(e) {
		return this.varList[e].Position;
	}
	AddConstraint(e, t) {
		this.constraints.add(new V(e, t));
	}
	AddVariableNNNN(e, t, n, r) {
		this.idealPositions.set(e, n), this.AddVariableNNBN(e, t, !1, r);
	}
	AddFixedVariable(e, t) {
		this.AddVariableNNBN(e, t, !0, 0);
	}
	AddVariableNNBN(e, t, n, r) {
		let i = new kr();
		i.Position = t, i.IsFixed = n, i.Width = r, this.varList.push(i);
	}
}, q = class e {
	clone() {
		let t = new e();
		return t.transparency = this.transparency, t.width = this.width, t.color = this.color, t.icurve = this.icurve.clone(), t.label = this.label, t.dashArray = this.dashArray, t.drawPN = this.drawPN, t;
	}
	static mkDebugCurveTWCILD(t, n, r, i, a, o, s = !1) {
		let c = new e();
		return c.transparency = t, c.width = n, c.color = r, c.icurve = i, c.label = a, c.dashArray = o, c.drawPN = s, c;
	}
	static mkDebugCurveTWCI(t, n, r, i) {
		return e.mkDebugCurveTWCILD(t, n, r, i, null, null);
	}
	static mkDebugCurveWCI(t, n, r) {
		return e.mkDebugCurveTWCI(255, t, n, r);
	}
	static mkDebugCurveCI(t, n) {
		return e.mkDebugCurveWCI(1, t, n);
	}
	static mkDebugCurveI(t) {
		return e.mkDebugCurveCI("Black", t);
	}
};
q.colors = /* @__PURE__ */ "DeepSkyBlue.IndianRed.Orange.Gold.DarkRed.Plum.Red.Violet.Indigo.Yellow.OrangeRed.Tomato.Purple.SaddleBrown.Green.Navy.Aqua.Pink.Bisque.Black.BlanchedAlmond.Blue.BlueViolet.Brown.Lime.BurlyWood.Chocolate.Coral.CornflowerBlue.Cornsilk.Crimson.Cyan.CadetBlue.Chartreuse.DarkBlue.DarkCyan.DarkGoldenrod.DarkGray.DarkGreen.DarkKhaki.DarkMagenta.DarkOliveGreen.DarkOrange.DarkOrchid.DarkSalmon.DarkSeaGreen.DarkSlateBlue.DarkSlateGray.DarkTurquoise.DarkViolet.DeepPink.DimGray.DodgerBlue.Firebrick.FloralWhite.ForestGreen.Fuchsia.CodeAnalysis.Gainsboro.GhostWhite.Goldenrod.Gray.GreenYellow.Honeydew.HotPink.Ivory.Lavender.LavenderBlush.LawnGreen.LemonChiffon.LightBlue.LightCoral.LightCyan.LightGoldenrodYellow.LightGray.LightGreen.LightPink.LightSalmon.LightSeaGreen.LightSkyBlue.LightSlateGray.LightSteelBlue.LightYellow.LimeGreen.Linen.Magenta.Maroon.MediumAquamarine.MediumBlue.MediumOrchid.MediumPurple.MediumSeaGreen.MediumSlateBlue.MediumSpringGreen.MediumTurquoise.MediumVioletRed.MidnightBlue.MintCream.MistyRose.Moccasin.NavajoWhite.OldLace.Olive.OliveDrab.Orchid.PaleGoldenrod.PaleGreen.PaleTurquoise.PaleVioletRed.PapayaWhip.PeachPuff.Peru.PowderBlue.RosyBrown.RoyalBlue.Salmon.SandyBrown.SeaGreen.CodeAnalysis.SeaShell.Sienna.Silver.SkyBlue.SlateBlue.SlateGray.Snow.SpringGreen.SteelBlue.Tan.Teal.Thistle.Transparent.Turquoise.Aquamarine.Azure.Beige.Wheat.White.WhiteSmoke.YellowGreen.Khaki.AntiqueWhite".split(".");
//#endregion
//#region node_modules/@msagl/core/dist/routing/rectilinear/nudging/AxisEdge.js
var jr = class extends jt {
	constructor(e, t) {
		super(e, t), this.RightNeighbors = /* @__PURE__ */ new Set(), this.setOfLongestSegs = /* @__PURE__ */ new Set(), this.RightBound = Infinity, this.LeftBound = -Infinity, this.Direction = M.DirectionFromPointToPoint(e.point, t.point);
	}
	AddRightNeighbor(e) {
		this.RightNeighbors.add(e);
	}
	get LongestNudgedSegments() {
		return this.setOfLongestSegs;
	}
	AddLongestNudgedSegment(e) {
		this.setOfLongestSegs.add(e);
	}
	BoundFromRight(e) {
		e = Math.max(e, this.LeftBound), this.RightBound = Math.min(e, this.RightBound);
	}
	BoundFromLeft(e) {
		e = Math.min(e, this.RightBound), this.LeftBound = Math.max(e, this.LeftBound);
	}
}, Mr = class e {
	constructor(e) {
		this.Point = e;
	}
	*GetEnumerator() {
		let e;
		for (e = this; e != null; e = e.Next) yield e.Point;
	}
	get X() {
		return this.Point.x;
	}
	get Y() {
		return this.Point.y;
	}
	InsertVerts(e, t, n) {
		for (t--; e < t; t--) this.SetNewNext(n[t]);
	}
	InsertVertsInReverse(e, t, n) {
		for (e++; e < t; e++) this.SetNewNext(n[e]);
	}
	SetNewNext(t) {
		let n = new e(t), r = this.Next;
		this.Next = n, n.Next = r;
	}
}, Nr = class e {
	toString() {
		return this.Source + (" " + this.Target);
	}
	constructor(e, t) {
		this.IsFixed = !1, this.Reversed = !1, this.index = -1, this.AxisEdge = e, this.Width = t;
	}
	get LongestNudgedSegment() {
		return this.longestNudgedSegment;
	}
	set LongestNudgedSegment(e) {
		this.longestNudgedSegment = e, this.longestNudgedSegment != null && (this.longestNudgedSegment.AddEdge(this), this.AxisEdge.AddLongestNudgedSegment(this.longestNudgedSegment));
	}
	get Source() {
		return this.Reversed ? this.AxisEdge.TargetPoint : this.AxisEdge.SourcePoint;
	}
	get Target() {
		return this.Reversed ? this.AxisEdge.SourcePoint : this.AxisEdge.TargetPoint;
	}
	static VectorsAreParallel(e, t) {
		return m(e.x * t.y - e.y * t.x, 0);
	}
	static EdgesAreParallel(t, n) {
		return e.VectorsAreParallel(t.AxisEdge.TargetPoint.sub(t.AxisEdge.SourcePoint), n.AxisEdge.TargetPoint.sub(n.AxisEdge.SourcePoint));
	}
	get Direction() {
		return this.Reversed ? M.OppositeDir(this.AxisEdge.Direction) : this.AxisEdge.Direction;
	}
	get Index() {
		return this.index;
	}
	set Index(e) {
		this.index = e;
	}
}, Pr = class e {
	get PathVisibilityGraph() {
		return this.pathVisibilityGraph;
	}
	constructor(e) {
		this.pathVisibilityGraph = new W(), this.axisEdgesToPathOrders = /* @__PURE__ */ new Map(), this.OriginalPaths = e;
	}
	GetOrder() {
		return this.FillTheVisibilityGraphByWalkingThePaths(), this.InitPathOrder(), this.OrderPaths(), this.axisEdgesToPathOrders;
	}
	FillTheVisibilityGraphByWalkingThePaths() {
		for (let e of this.OriginalPaths) this.FillTheVisibilityGraphByWalkingPath(e);
	}
	FillTheVisibilityGraphByWalkingPath(e) {
		let t = this.CreatePathEdgesFromPoints(r(), e.Width), n = t.next();
		for (n.done || e.SetFirstEdge(n.value); (n = t.next()).done === !1;) e.AddEdge(n.value);
		function* r() {
			if (e.PathPoints instanceof Mr) for (let t = e.PathPoints; t != null; t = t.Next) yield t.Point;
			else for (let t of e.PathPoints) yield t;
		}
	}
	*CreatePathEdgesFromPoints(e, t) {
		let n = e.next(), r = n.value;
		for (; !(n = e.next()).done;) yield this.CreatePathEdge(r, n.value, t), r = n.value;
	}
	CreatePathEdge(e, t, n) {
		switch (M.DirectionFromPointToPoint(e, t)) {
			case A.East:
			case A.North: return new Nr(this.GetAxisEdge(e, t), n);
			case A.South:
			case A.West: {
				let r = new Nr(this.GetAxisEdge(t, e), n);
				return r.Reversed = !0, r;
			}
			default: throw Error("Not a rectilinear path");
		}
	}
	GetAxisEdge(e, t) {
		return this.PathVisibilityGraph.AddEdgeF(e, t, (e, t) => new jr(e, t));
	}
	InitPathOrder() {
		for (let e of this.PathVisibilityGraph.Edges) this.axisEdgesToPathOrders.set(e, []);
		for (let e of this.OriginalPaths) for (let t of e.PathEdges()) this.axisEdgesToPathOrders.get(t.AxisEdge).push(t);
	}
	OrderPaths() {
		for (let t of e.WalkGraphEdgesInTopologicalOrderIfPossible(this.PathVisibilityGraph)) this.OrderPathEdgesSharingEdge(t);
	}
	OrderPathEdgesSharingEdge(t) {
		let n = this.PathOrderOfVisEdge(t);
		n.sort(e.CompareTwoPathEdges);
		let r = 0;
		for (let e of n) e.Index = r++;
	}
	static CompareTwoPathEdges(t, n) {
		if (t === n) return 0;
		let r = e.CompareInDirectionStartingFromAxisEdge(t, n, t.AxisEdge, t.AxisEdge.Direction);
		return r === 0 ? -e.CompareInDirectionStartingFromAxisEdge(t, n, t.AxisEdge, M.OppositeDir(t.AxisEdge.Direction)) : r;
	}
	static CompareInDirectionStartingFromAxisEdge(t, n, r, i) {
		for (;;) {
			if (t = e.GetNextPathEdgeInDirection(t, r, i), t == null || (n = e.GetNextPathEdgeInDirection(n, r, i), n == null)) return 0;
			if (t.AxisEdge === n.AxisEdge) {
				i = e.FindContinuedDirection(r, i, t.AxisEdge), r = t.AxisEdge;
				let a = e.GetExistingOrder(t, n);
				if (a === e.NotOrdered) continue;
				return i === r.Direction ? a : -a;
			}
			let a = i === r.Direction ? r.Target : r.Source, o = e.OtherVertex(t.AxisEdge, a), s = e.OtherVertex(n.AxisEdge, a), c = e.ProjectionForCompare(r, i !== r.Direction);
			return f(c(o.point), c(s.point));
		}
	}
	static FindContinuedDirection(e, t, n) {
		return e.Direction === t ? n.Source === e.Target ? n.Direction : M.OppositeDir(n.Direction) : n.Source === e.Source ? n.Direction : M.OppositeDir(n.Direction);
	}
	static OtherVertex(e, t) {
		return e.Source === t ? e.Target : e.Source;
	}
	static ProjectionForCompare(e, t) {
		return e.Direction === A.North ? t ? (e) => -e.x : (e) => e.x : t ? (e) => e.y : (e) => -e.y;
	}
	static GetNextPathEdgeInDirection(e, t, n) {
		return t.Direction === n ? e.Reversed ? e.Prev : e.Next : e.Reversed ? e.Next : e.Prev;
	}
	static GetExistingOrder(t, n) {
		let r = t.Index;
		if (r === -1) return e.NotOrdered;
		let i = n.Index;
		return f(r, i);
	}
	PathOrderOfVisEdge(e) {
		return this.axisEdgesToPathOrders.get(e);
	}
	static InitQueueOfSources(e, t, n) {
		for (let r of n.Vertices()) {
			let n = r.InEdgesLength();
			t.set(r, n), n === 0 && e.enqueue(r);
		}
	}
	static *WalkGraphEdgesInTopologicalOrderIfPossible(t) {
		let n = new i.Queue(), r = /* @__PURE__ */ new Map();
		for (e.InitQueueOfSources(n, r, t); n.length > 0;) {
			let e = n.dequeue();
			for (let t of e.OutEdges) {
				let e = r.get(t.Target);
				r.set(t.Target, e - 1), e === 1 && n.enqueue(t.Target), yield t;
			}
		}
	}
};
Pr.NotOrdered = Number.MAX_VALUE;
//#endregion
//#region node_modules/@msagl/core/dist/routing/rectilinear/nudging/AxisEdgeHighPointEvent.js
var Fr = class extends Tt {
	constructor(e, t) {
		super(), this.site = t, this.AxisEdge = e;
	}
	get Site() {
		return this.site;
	}
}, Ir = class extends Tt {
	constructor(e, t) {
		super(), this.site = t, this.AxisEdge = e;
	}
	get Site() {
		return this.site;
	}
}, Lr = class {
	get Edges() {
		return this.edges;
	}
	AddEdge(e) {
		this.UpPoint = e.TargetPoint, this.edges.add(e);
	}
	constructor(e) {
		this.edges = /* @__PURE__ */ new Set(), this.Source = e;
	}
	RemoveAxis(e) {
		this.edges.delete(e);
	}
	IsEmpty() {
		return this.edges.size === 0;
	}
}, Rr = class e extends At {
	constructor(e, t, n, r, i) {
		super(t, new M(e).ToPoint()), this.DirectionPerp = new M(e).Right.ToPoint(), this.PathOrders = r, this.xProjection = e === A.North ? (e) => e.x : (e) => -e.y, this.edgeContainersTree = new Ct((e, t) => this.CompareAA(e, t)), this.SweepPole = M.VectorDirection(this.SweepDirection), this.AxisEdges = i, this.AxisEdgesToObstaclesTheyOriginatedFrom = n;
	}
	FindFreeSpace() {
		this.InitTheQueueOfEvents(), this.ProcessEvents();
	}
	ProcessEvents() {
		for (; this.EventQueue.Count > 0;) this.ProcessEvent(this.EventQueue.Dequeue());
	}
	ProcessEvent(e) {
		e instanceof Et ? this.ProcessVertexEvent(e) : (this.Z = this.GetZP(e.Site), e instanceof Ir ? this.ProcessLowEdgeEvent(e) : this.ProcessHighEdgeEvent(e));
	}
	ProcessHighEdgeEvent(e) {
		let t = e.AxisEdge;
		this.RemoveEdge(t), this.ConstraintEdgeWithObstaclesAtZ(t, t.Target.point);
	}
	ProcessLowEdgeEvent(e) {
		let t = e.AxisEdge, n = this.GetOrCreateAxisEdgesContainer(t);
		n.item.AddEdge(t);
		let r = this.edgeContainersTree.previous(n);
		if (r != null) for (let e of r.item.edges) for (let t of n.item.edges) this.TryToAddRightNeighbor(e, t);
		let i = this.edgeContainersTree.next(n);
		if (i != null) for (let e of n.item.Edges) for (let t of i.item.edges) this.TryToAddRightNeighbor(e, t);
		this.ConstraintEdgeWithObstaclesAtZ(t, t.Source.point);
	}
	TryToAddRightNeighbor(e, t) {
		this.ProjectionsOfEdgesOverlap(e, t) && e.AddRightNeighbor(t);
	}
	ProjectionsOfEdgesOverlap(e, t) {
		return this.SweepPole === A.North ? !(e.TargetPoint.y < t.SourcePoint.y - u.distanceEpsilon || t.TargetPoint.y < e.SourcePoint.y - u.distanceEpsilon) : !(e.TargetPoint.x < t.SourcePoint.x - u.distanceEpsilon || t.TargetPoint.x < e.SourcePoint.x - u.distanceEpsilon);
	}
	GetObstacleBoundaries(e) {
		return this.Obstacles.map((t) => q.mkDebugCurveWCI(1, e, t));
	}
	ConstraintEdgeWithObstaclesAtZ(e, t) {
		this.ConstraintEdgeWithObstaclesAtZFromLeft(e, t), this.ConstraintEdgeWithObstaclesAtZFromRight(e, t);
	}
	ConstraintEdgeWithObstaclesAtZFromRight(e, t) {
		let n = this.GetActiveSideFromRight(t);
		if (n == null || this.NotRestricting(e, n.item.Polyline)) return;
		let r = this.ObstacleSideComparer.IntersectionOfSideAndSweepLine(n.item);
		e.BoundFromRight(r.dot(this.DirectionPerp));
	}
	GetActiveSideFromRight(t) {
		return this.LeftObstacleSideTree.findFirst((n) => e.PointToTheLeftOfLineOrOnLineLocal(t, n.Start, n.End));
	}
	ConstraintEdgeWithObstaclesAtZFromLeft(e, t) {
		let n = this.GetActiveSideFromLeft(t);
		if (n == null || this.NotRestricting(e, n.item.Polyline)) return;
		let r = this.ObstacleSideComparer.IntersectionOfSideAndSweepLine(n.item);
		e.BoundFromLeft(r.dot(this.DirectionPerp));
	}
	static PointToTheLeftOfLineOrOnLineLocal(t, n, r) {
		return y.signedDoubledTriangleArea(t, n, r) > -e.AreaComparisonEpsilon;
	}
	static PointToTheRightOfLineOrOnLineLocal(t, n, r) {
		return y.signedDoubledTriangleArea(n, r, t) < e.AreaComparisonEpsilon;
	}
	GetActiveSideFromLeft(t) {
		return this.RightObstacleSideTree.findLast((n) => e.PointToTheRightOfLineOrOnLineLocal(t, n.Start, n.End));
	}
	static EdgeMidPoint(e) {
		return y.middle(e.SourcePoint, e.TargetPoint);
	}
	GetOrCreateAxisEdgesContainer(e) {
		let t = e.Source.point;
		return this.GetAxisEdgesContainerNode(t) ?? this.edgeContainersTree.insert(new Lr(t));
	}
	GetAxisEdgesContainerNode(e) {
		let t = this.xProjection(e), n = this.edgeContainersTree.findFirst((e) => this.xProjection(e.Source) >= t - u.distanceEpsilon / 2);
		return n != null && this.xProjection(n.item.Source) <= t + u.distanceEpsilon / 2 ? n : null;
	}
	ProcessVertexEvent(e) {
		this.Z = this.GetZS(e), e instanceof qt ? this.ProcessLeftVertex(e, e.Vertex.nextOnPolyline) : (e instanceof Xt || this.ProcessLeftVertex(e, e.Vertex.nextOnPolyline), this.ProcessRightVertex(e, e.Vertex.prevOnPolyline));
	}
	ProcessRightVertex(e, t) {
		let n = e.Site;
		this.ProcessPrevSegmentForRightVertex(e, n);
		let r = t.point.sub(e.Site), i = r.dot(this.DirectionPerp), a = r.dot(this.SweepDirection);
		a <= u.distanceEpsilon ? i > 0 && a >= 0 ? this.EnqueueEvent(new Xt(t)) : this.RestrictEdgeContainerToTheRightOfEvent(e.Vertex) : (this.InsertRightSide(new Yt(e.Vertex)), this.EnqueueEvent(new Xt(t)), this.RestrictEdgeContainerToTheRightOfEvent(e.Vertex));
	}
	RestrictEdgeContainerToTheRightOfEvent(e) {
		let t = e.point, n = this.xProjection(t), r = this.edgeContainersTree.findFirst((e) => n <= this.xProjection(e.Source));
		if (r != null) for (let n of r.item.Edges) this.NotRestricting(n, e.polyline) || n.BoundFromLeft(this.DirectionPerp.dot(t));
	}
	NotRestricting(e, t) {
		return this.AxisEdgesToObstaclesTheyOriginatedFrom.get(e) === t;
	}
	ProcessPrevSegmentForRightVertex(e, t) {
		let n = e.Vertex.nextOnPolyline.point;
		t.sub(n).dot(this.SweepDirection) > u.distanceEpsilon && this.RemoveRightSide(new Yt(e.Vertex.nextOnPolyline));
	}
	RemoveEdge(e) {
		let t = this.GetAxisEdgesContainerNode(e.Source.point);
		t.item.RemoveAxis(e), t.item.IsEmpty() && this.edgeContainersTree.deleteNodeInternal(t);
	}
	ProcessLeftVertex(e, t) {
		let n = e.Site;
		this.ProcessPrevSegmentForLeftVertex(e, n);
		let r = t.point.sub(e.Site), i = r.dot(this.DirectionPerp), a = r.dot(this.SweepDirection);
		a <= u.distanceEpsilon ? i < 0 && a >= 0 && this.EnqueueEvent(new qt(t)) : (this.InsertLeftSide(new Kt(e.Vertex)), this.EnqueueEvent(new qt(t))), this.RestrictEdgeFromTheLeftOfEvent(e.Vertex);
	}
	RestrictEdgeFromTheLeftOfEvent(e) {
		let t = e.point, n = this.GetContainerNodeToTheLeftOfEvent(t);
		if (n != null) for (let r of n.item.Edges) this.NotRestricting(r, e.polyline) || r.BoundFromRight(t.dot(this.DirectionPerp));
	}
	GetContainerNodeToTheLeftOfEvent(e) {
		let t = this.xProjection(e);
		return this.edgeContainersTree.findLast((e) => this.xProjection(e.Source) <= t);
	}
	ProcessPrevSegmentForLeftVertex(e, t) {
		let n = e.Vertex.prevOnPolyline.point;
		t.sub(n).dot(this.SweepDirection) > u.distanceEpsilon && this.RemoveLeftSide(new Kt(e.Vertex.prevOnPolyline));
	}
	InitTheQueueOfEvents() {
		this.InitQueueOfEvents();
		for (let e of this.AxisEdges) this.EnqueueEventsForEdge(e);
	}
	EnqueueEventsForEdge(t) {
		this.EdgeIsParallelToSweepDir(t) && (this.EnqueueEvent(e.EdgeLowPointEvent(t, t.Source.point)), this.EnqueueEvent(e.EdgeHighPointEvent(t, t.Target.point)));
	}
	EdgeIsParallelToSweepDir(e) {
		return e.Direction === this.SweepPole || e.Direction === M.OppositeDir(this.SweepPole);
	}
	static EdgeHighPointEvent(e, t) {
		return new Fr(e, t);
	}
	static EdgeLowPointEvent(e, t) {
		return new Ir(e, t);
	}
	CompareAA(e, t) {
		return f(e.Source.dot(this.DirectionPerp), t.Source.dot(this.DirectionPerp));
	}
};
Rr.AreaComparisonEpsilon = u.intersectionEpsilon;
//#endregion
//#region node_modules/@msagl/core/dist/routing/rectilinear/nudging/LongestNudgedSegment.js
var zr = class extends Wt {
	constructor(e) {
		super(), this.CompassDirection = A.None, this.edges = [], this._isFixed = !1, this.Id = -1, this.IdealPosition = 0, this.Id = e;
	}
	get Start() {
		return this.start;
	}
	get End() {
		return this.end;
	}
	get Edges() {
		return this.edges;
	}
	AddEdge(e) {
		if (this.Edges.length === 0) {
			let t = M.VectorDirectionPP(e.Source, e.Target);
			switch (t) {
				case A.South:
					t = A.North;
					break;
				case A.West:
					t = A.East;
					break;
			}
			this.CompassDirection = t, this.start = e.Source, this.end = e.Source;
		}
		switch (this.CompassDirection) {
			case A.North:
				this.TryPointForStartAndEndNorth(e.Source), this.TryPointForStartAndEndNorth(e.Target);
				break;
			case A.East:
				this.TryPointForStartAndEndEast(e.Source), this.TryPointForStartAndEndEast(e.Target);
				break;
		}
		this.Edges.push(e);
	}
	TryPointForStartAndEndNorth(e) {
		e.y < this.start.y ? this.start = e : e.y > this.end.y && (this.end = e);
	}
	TryPointForStartAndEndEast(e) {
		e.x < this.start.x ? this.start = e : e.x > this.end.x && (this.end = e);
	}
	get IsFixed() {
		return this._isFixed;
	}
	set IsFixed(e) {
		this._isFixed = e;
	}
	get Width() {
		let e = 0;
		for (let t of this.edges) e = Math.max(e, t.Width);
		return e;
	}
	GetLeftBound() {
		if (!this.IsFixed) {
			let e = -Infinity;
			for (let t of this.edges) e = Math.max(e, t.AxisEdge.LeftBound);
			return e;
		}
		return this.CompassDirection === A.North ? this.Edges[0].Source.x : -this.Edges[0].Source.y;
	}
	GetRightBound() {
		if (!this.IsFixed) {
			let e = Infinity;
			for (let t of this.edges) e = Math.min(e, t.AxisEdge.RightBound);
			return e;
		}
		return this.Position();
	}
	Position() {
		return this.CompassDirection === A.North ? this.Edges[0].Source.x : -this.Edges[0].Source.y;
	}
}, Br = class e {
	constructor(e, t) {
		this.tree = new Ct((e, t) => f(e.Point.x, t.Point.x)), this.VerticalPoints = t, this.HorizontalPoints = e;
	}
	SplitPoints() {
		this.VerticalPoints.length === 0 || this.HorizontalPoints.length === 0 || (this.InitEventQueue(), this.ProcessEvents());
	}
	ProcessEvents() {
		for (; !this.Queue.IsEmpty();) {
			let e = { priority: 0 }, t = this.Queue.DequeueAndGetPriority(e);
			this.ProcessEvent(t, e.priority);
		}
	}
	ProcessEvent(t, n) {
		m(t.Next.Point.x, t.Point.x) ? n === e.Low(t) ? this.ProcessLowLinkedPointEvent(t) : this.ProcessHighLinkedPointEvent(t) : this.IntersectWithTree(t);
	}
	IntersectWithTree(t) {
		let n, r, i, a = t.Y;
		if (t.Point.x < t.Next.Point.x ? (r = t.Point.x, n = t.Next.Point.x, i = !0) : (n = t.Point.x, r = t.Next.Point.x, i = !1), i) for (let i = this.tree.findFirst((e) => r <= e.Point.x); i != null && i.item.Point.x <= n; i = this.tree.next(i)) {
			let n = new y(i.item.Point.x, a);
			t = e.TrySplitHorizontalPoint(t, n, !0), e.TrySplitVerticalPoint(i.item, n);
		}
		else for (let i = this.tree.findLast((e) => e.Point.x <= n); i != null && i.item.Point.x >= r; i = this.tree.previous(i)) {
			let n = new y(i.item.Point.x, a);
			t = e.TrySplitHorizontalPoint(t, n, !1), e.TrySplitVerticalPoint(i.item, n);
		}
	}
	static TrySplitVerticalPoint(t, n) {
		e.Low(t) + u.distanceEpsilon < n.y && n.y + u.distanceEpsilon < e.High(t) && t.SetNewNext(n);
	}
	static TrySplitHorizontalPoint(e, t, n) {
		return n && e.X + u.distanceEpsilon < t.x && t.x + u.distanceEpsilon < e.Next.X || !n && e.Next.X + u.distanceEpsilon < t.x && t.x + u.distanceEpsilon < e.X ? (e.SetNewNext(t), e.Next) : e;
	}
	ProcessHighLinkedPointEvent(e) {
		this.tree.remove(e);
	}
	ProcessLowLinkedPointEvent(e) {
		this.tree.insert(e);
	}
	InitEventQueue() {
		this.Queue = new Rn(f);
		for (let t of this.VerticalPoints) this.Queue.Enqueue(t, e.Low(t));
		for (let e of this.HorizontalPoints) this.Queue.Enqueue(e, e.Point.y);
	}
	static Low(e) {
		return Math.min(e.Point.y, e.Next.Point.y);
	}
	static High(e) {
		return Math.max(e.Point.y, e.Next.Point.y);
	}
}, Vr = class e {
	constructor(e) {
		this.verticesToPathOffsets = new Nt(), this.Paths = e;
	}
	MergePaths() {
		this.InitVerticesToPathOffsetsAndRemoveSelfCycles();
		for (let e of this.Paths) this.ProcessPath(e);
	}
	ProcessPath(e) {
		let t = /* @__PURE__ */ new Map(), n = null;
		for (let r = e.PathPoints; r != null; r = r.Next) {
			let i = this.verticesToPathOffsets.get(r.Point);
			if (n != null) {
				if (t.size > 0) for (let [n, a] of i) {
					let i = t.get(n);
					i && (this.CollapseLoopingPath(n, i, a, e, r), t.delete(n));
				}
				for (let [e, r] of n) i.has(e) || t.set(e, r);
			}
			n = i;
		}
	}
	CollapseLoopingPath(t, n, r, i, a) {
		let o = e.FindLinkedPointInPath(i, n.Point), s = Array.from(e.GetPointsInBetween(o, a));
		e.Before(n, r) ? (this.CleanDisappearedPiece(n, r, t), this.ReplacePiece(n, r, s, t)) : (this.CleanDisappearedPiece(r, n, t), this.ReplacePiece(r, n, s.reverse(), t));
	}
	static *GetPointsInBetween(e, t) {
		for (let n = e.Next; n !== t; n = n.Next) yield n.Point;
	}
	ReplacePiece(e, t, n, r) {
		let i = e;
		for (let e of n) {
			let t = new Mr(e);
			i.Next = t, i = t, this.verticesToPathOffsets.get(e).set(r, i);
		}
		i.Next = t;
	}
	CleanDisappearedPiece(t, n, r) {
		for (let i of e.GetPointsInBetween(t, n)) this.verticesToPathOffsets.get(i).delete(r);
	}
	static Before(e, t) {
		for (e = e.Next; e != null; e = e.Next) if (e === t) return !0;
		return !1;
	}
	static FindLinkedPointInPath(e, t) {
		for (let n = e.PathPoints;; n = n.Next) if (n.Point.equal(t)) return n;
	}
	InitVerticesToPathOffsetsAndRemoveSelfCycles() {
		for (let e of this.Paths) for (let t = e.PathPoints; t != null; t = t.Next) {
			let n = this.verticesToPathOffsets.get(t.Point);
			n || this.verticesToPathOffsets.set(t.Point, n = /* @__PURE__ */ new Map());
			let r = n.get(e);
			r ? (this.CleanDisappearedPiece(r, t, e), r.Next = t.Next) : n.set(e, t);
		}
	}
}, Hr = class e {
	static RefinePaths(t, n) {
		e.AdjustPaths(t);
		let r = e.CreatePathsToFirstLinkedVerticesMap(t);
		e.Refine(Array.from(r.values())), e.CrossVerticalAndHorizontalSegs(r.values()), e.ReconstructPathsFromLinkedVertices(r), n && new Vr(t).MergePaths();
	}
	static AdjustPaths(t) {
		for (let n of t) n.PathPoints = e.AdjustPathPoints(n.PathPoints);
	}
	static AdjustPathPoints(e) {
		if (!e || e.length === 0) return;
		let t = [], n = y.RoundPoint(e[0]);
		t.push(n);
		for (let r = 1; r < e.length; r++) {
			let i = y.RoundPoint(e[r]);
			n.equal(i) || (n = i, t.push(n));
		}
		return t;
	}
	static CrossVerticalAndHorizontalSegs(e) {
		let t = [], n = [];
		for (let r of e) for (let e = r; e.Next != null; e = e.Next) m(e.Point.x, e.Next.Point.x) ? n.push(e) : t.push(e);
		new Br(t, n).SplitPoints();
	}
	static ReconstructPathsFromLinkedVertices(e) {
		for (let [t, n] of e) t.PathPoints = n;
	}
	static Refine(t) {
		e.RefineInDirection(A.North, t), e.RefineInDirection(A.East, t);
	}
	static *groupByProj(e, t) {
		let n = /* @__PURE__ */ new Map();
		for (let r of t) {
			let t = e(r.Point), i = n.get(t);
			i || (i = [], n.set(t, i)), i.push(r);
		}
		for (let e of n.values()) yield e;
	}
	static RefineInDirection(t, n) {
		let r = {
			projectionToPerp: void 0,
			projectionToDirection: void 0
		};
		e.GetProjectionsDelegates(t, r);
		let i = Array.from(e.GetAllLinkedVertsInDirection(r.projectionToPerp, n)), a = e.groupByProj(r.projectionToPerp, i);
		for (let t of a) e.RefineCollinearBucket(t, r.projectionToDirection);
	}
	static GetProjectionsDelegates(e, t) {
		e === A.East ? (t.projectionToDirection = (e) => e.x, t.projectionToPerp = (e) => e.y) : (t.projectionToPerp = (e) => e.x, t.projectionToDirection = (e) => e.y);
	}
	static *GetAllLinkedVertsInDirection(e, t) {
		for (let n of t) for (let t = n; t.Next != null; t = t.Next) m(e(t.Point), e(t.Next.Point)) && (yield t);
	}
	static RefineCollinearBucket(t, n) {
		let r = /* @__PURE__ */ new Set(), i = [];
		for (let e of t) {
			let t = n(e.Point);
			r.has(t) || (r.add(t), i.push([e.Point, t])), t = n(e.Next.Point), r.has(t) || (r.add(t), i.push([e.Next.Point, t]));
		}
		i.sort((e, t) => e[1] - t[1]);
		let a = i.map((e) => e[0]), o = /* @__PURE__ */ new Map();
		for (let e = 0; e < i.length; e++) o.set(i[e][1], e);
		for (let r of t) {
			let t = o.get(n(r.Point)), i = o.get(n(r.Next.Point));
			Math.abs(i - t) > 1 && e.InsertPoints(r, a, t, i);
		}
	}
	static InsertPoints(e, t, n, r) {
		n < r ? e.InsertVerts(n, r, t) : e.InsertVertsInReverse(r, n, t);
	}
	static CreatePathsToFirstLinkedVerticesMap(t) {
		let n = /* @__PURE__ */ new Map();
		for (let r of t) n.set(r, e.CreateLinkedVertexOfEdgePath(r));
		return n;
	}
	static CreateLinkedVertexOfEdgePath(e) {
		let t = e.PathPoints, n = new Mr(t[0]), r = n;
		for (let e = 1; e < t.length; e++) n.Next = new Mr(t[e]), n = n.Next;
		return r;
	}
}, Ur = class {
	constructor(e, t) {
		this.Points = e, this.I = t;
	}
	static equal(e, t) {
		return e.I === t.I && e.Points === t.Points;
	}
	get Start() {
		return this.Points[this.I];
	}
	get End() {
		return this.Points[this.I + 1];
	}
}, Wr = class e {
	constructor(e, t) {
		this.segTree = new dt(null), this.crossedOutPaths = /* @__PURE__ */ new Set(), this.HierarchyOfObstacles = new dt(t), this.Paths = e;
	}
	static RemoveStaircases(t, n) {
		new e(t, n).Calculate();
	}
	Calculate() {
		this.InitHierarchies();
		let e;
		do {
			e = !1;
			for (let t of this.Paths.filter((e) => !this.crossedOutPaths.has(e))) this.ProcessPath(t) && (e = !0);
		} while (e);
	}
	ProcessPath(e) {
		let t = {
			pts: e.PathPoints,
			canHaveStaircase: !1
		};
		return this.ProcessPoints(t) ? (e.PathPoints = t.pts, !0) : (t.canHaveStaircase || this.crossedOutPaths.add(e), !1);
	}
	ProcessPoints(e) {
		let t = this.FindStaircaseStart(e);
		return t < 0 ? !1 : (e.pts = this.RemoveStaircasePN(e.pts, t), !0);
	}
	FindStaircaseStart(e) {
		if (e.canHaveStaircase = !1, e.pts.length < 5) return -1;
		let t = [
			new Ur(e.pts, 0),
			new Ur(e.pts, 1),
			new Ur(e.pts, 2),
			new Ur(e.pts, 3)
		], n = 0;
		for (let r = 0;;) {
			let i = { canHaveStaircaseAtI: !1 };
			if (this.IsStaircase(e.pts, r, t, i)) return e.canHaveStaircase = !0, r;
			if (e.canHaveStaircase = e.canHaveStaircase || i.canHaveStaircaseAtI, r++, e.pts.length < r + 5) return -1;
			t[n] = new Ur(e.pts, r + 3), n++, n %= 4;
		}
	}
	static GetFlippedPoint(e, t) {
		return m(e[t].y, e[t + 1].y) ? new y(e[t + 4].x, e[t].y) : new y(e[t].x, e[t + 4].y);
	}
	Crossing(t, n, r) {
		return e.IsCrossing(S.mkPP(t, n), this.segTree, r);
	}
	static IsCrossing(e, t, n) {
		for (let r of t.GetAllIntersecting(e.boundingBox)) if (n.findIndex((e) => e === r) === -1) return !0;
		return !1;
	}
	IntersectObstacleHierarchyPPP(e, t, n) {
		return this.IntersectObstacleHierarchyL(S.mkPP(e, t)) || this.IntersectObstacleHierarchyL(S.mkPP(t, n));
	}
	IntersectObstacleHierarchyL(e) {
		return this.HierarchyOfObstacles.GetAllIntersecting(e.boundingBox).some((t) => E.intersectionOne(e, t, !1) != null);
	}
	IsStaircase(t, n, r, i) {
		let a = t[n], o = t[n + 1], s = t[n + 2], c = t[n + 3], l = t[n + 4];
		return i.canHaveStaircaseAtI = !1, M.DirectionFromPointToPoint(a, o) !== M.DirectionFromPointToPoint(s, c) || M.DirectionFromPointToPoint(o, s) !== M.DirectionFromPointToPoint(c, l) || (s = e.GetFlippedPoint(t, n), this.IntersectObstacleHierarchyPPP(o, s, c)) ? !1 : (i.canHaveStaircaseAtI = !0, !this.Crossing(o, s, r));
	}
	RemoveStaircasePN(e, t) {
		let n = e[t], r = e[t + 1], i = Math.abs(n.y - r.y) < u.distanceEpsilon / 2;
		return this.RemoveStaircasePNB(e, t, i);
	}
	RemoveStaircasePNB(e, t, n) {
		this.RemoveSegs(e);
		let r = Array(e.length - 2);
		Kr(e, r, t + 1);
		let i = e[t + 1], a = e[t + 3];
		return r[t + 1] = n ? new y(a.x, i.y) : new y(i.x, a.y), Gr(e, t + 4, r, t + 2, r.length - t - 2), this.InsertNewSegs(r, t), r;
	}
	RemoveSegs(e) {
		for (let t = 0; t < e.length - 1; t++) this.RemoveSeg(new Ur(e, t));
	}
	RemoveSeg(t) {
		this.segTree.Remove(e.Rect(t), t);
	}
	InsertNewSegs(e, t) {
		this.InsSeg(e, t), this.InsSeg(e, t + 1);
	}
	InitHierarchies() {
		for (let e of this.Paths) this.InsertPathSegs(e);
	}
	InsertPathSegs(e) {
		this.InsertSegs(e.PathPoints);
	}
	InsertSegs(e) {
		for (let t = 0; t < e.length - 1; t++) this.InsSeg(e, t);
	}
	InsSeg(t, n) {
		let r = new Ur(t, n);
		this.segTree.Add(e.Rect(r), r);
	}
	static Rect(e) {
		return O.mkPP(e.Start, e.End);
	}
};
function Gr(e, t, n, r, i) {
	for (; i-- > 0;) n[r++] = e[t++];
}
function Kr(e, t, n) {
	let r = 0;
	for (; n-- > 0;) t[r++] = e[r++];
}
//#endregion
//#region node_modules/@msagl/core/dist/routing/rectilinear/nudging/Nudger.js
var qr = class e {
	get HasGroups() {
		return this.HierarchyOfGroups != null && this.HierarchyOfGroups.Count > 0;
	}
	constructor(e, t, n, r) {
		this.AncestorsSets = r, this.HierarchyOfGroups = F(Array.from(r.keys()).filter((e) => e.IsGroup).map((e) => I(e, e.BoundingBox))), this.Obstacles = n, this.EdgeSeparation = 2 * t, this.Paths = e, this.HierarchyOfObstacles = F(n.map((e) => I(e, e.boundingBox))), this.MapPathsToTheirObstacles();
	}
	MapPathsToTheirObstacles() {
		this.PathToObstacles = /* @__PURE__ */ new Map();
		for (let e of this.Paths) this.MapPathToItsObstacles(e);
	}
	MapPathToItsObstacles(t) {
		if (!t.PathPoints || t.PathPoints.length === 0) return;
		let n = t.PathPoints, r = this.HierarchyOfObstacles.FirstHitNodeWithPredicate(n[0], e.ObstacleTest), i = this.HierarchyOfObstacles.FirstHitNodeWithPredicate(n[n.length - 1], e.ObstacleTest);
		r != null && i != null && this.PathToObstacles.set(t, [r.UserData, i.UserData]);
	}
	static ObstacleTest(e, t) {
		return E.PointRelativeToCurveLocation(e, t) === T.Outside ? P.Continue : P.Stop;
	}
	Calculate(e, t) {
		this.NudgingDirection = e, Hr.RefinePaths(this.Paths, t), this.GetPathOrdersAndPathGraph(), this.MapAxisEdgesToTheirObstacles(), this.DrawPaths();
	}
	MapAxisEdgesToTheirObstacles() {
		this.axisEdgesToObstaclesTheyOriginatedFrom = /* @__PURE__ */ new Map();
		for (let e of this.Paths) this.MapPathEndAxisEdgesToTheirObstacles(e);
		for (let e of this.Paths) this.UmmapPathInteriourFromStrangerObstacles(e);
	}
	UmmapPathInteriourFromStrangerObstacles(e) {
		let t = this.FindFirstUnmappedEdge(e);
		if (t == null) return;
		let n = this.FindLastUnmappedEdge(e);
		for (let e = t; e != null && e !== n; e = e.Next) this.axisEdgesToObstaclesTheyOriginatedFrom.delete(e.AxisEdge);
	}
	FindLastUnmappedEdge(e) {
		for (let t = e.LastEdge; t != null; t = t.Prev) if (t.AxisEdge.Direction !== this.NudgingDirection) return t;
		return null;
	}
	FindFirstUnmappedEdge(e) {
		for (let t = e.FirstEdge; t != null; t = t.Next) if (t.AxisEdge.Direction !== this.NudgingDirection) return t;
		return null;
	}
	MapPathEndAxisEdgesToTheirObstacles(e) {
		let t = this.PathToObstacles.get(e);
		t && (this.ProcessThePathStartToMapAxisEdgesToTheirObstacles(e, t[0]), this.ProcessThePathEndToMapAxisEdgesToTheirObstacles(e, t[1]));
	}
	ProcessThePathEndToMapAxisEdgesToTheirObstacles(e, t) {
		for (let n = e.LastEdge; n != null && M.DirectionsAreParallel(n.Direction, this.NudgingDirection); n = n.Prev) this.axisEdgesToObstaclesTheyOriginatedFrom.set(n.AxisEdge, t);
	}
	ProcessThePathStartToMapAxisEdgesToTheirObstacles(e, t) {
		for (let n = e.FirstEdge; n != null && M.DirectionsAreParallel(n.Direction, this.NudgingDirection); n = n.Next) this.axisEdgesToObstaclesTheyOriginatedFrom.set(n.AxisEdge, t);
	}
	GetPathOrdersAndPathGraph() {
		let e = new Pr(this.Paths);
		this.PathOrders = e.GetOrder(), this.PathVisibilityGraph = e.PathVisibilityGraph;
	}
	static GetCurvesForShow(e, t) {
		let n = [];
		for (let t of e) {
			let e = new D();
			for (let n of t.PathPoints) e.addPoint(n);
			n.push(e);
		}
		return n.concat(Array.from(t));
	}
	DrawPaths() {
		this.SetWidthsOfArrowheads(), this.CreateLongestNudgedSegments(), this.FindFreeSpaceInDirection(Array.from(this.PathVisibilityGraph.Edges)), this.MoveLongestSegsIdealPositionsInsideFeasibleIntervals(), this.PositionShiftedEdqges();
	}
	SetWidthsOfArrowheads() {
		for (let t of this.Paths) e.SetWidthsOfArrowheadsForEdge(t);
	}
	static SetWidthsOfArrowheadsForEdge(e) {
		let t = e.GeomEdge;
		if (t.targetArrowhead != null) {
			let n = e.LastEdge;
			n.Width = Math.max(t.targetArrowhead.width, n.Width);
		}
		if (t.sourceArrowhead != null) {
			let n = e.FirstEdge;
			n.Width = Math.max(t.sourceArrowhead.width, n.Width);
		}
	}
	PositionShiftedEdqges() {
		this.Solver = new Ar(this.EdgeSeparation);
		for (let e = 0; e < this.LongestNudgedSegs.length; e++) this.CreateVariablesOfLongestSegment(this.LongestNudgedSegs[e]);
		this.CreateConstraintsOfTheOrder(), this.CreateConstraintsBetweenLongestSegments(), this.Solver.SolveByRegularSolver(), this.ShiftPathEdges();
	}
	MoveLongestSegsIdealPositionsInsideFeasibleIntervals() {
		for (let t = 0; t < this.LongestNudgedSegs.length; t++) {
			let n = this.LongestNudgedSegs[t];
			e.MoveLongestSegIdealPositionsInsideFeasibleInterval(n);
		}
	}
	static MoveLongestSegIdealPositionsInsideFeasibleInterval(e) {
		if (e.IsFixed) return;
		let t = e.GetLeftBound(), n = e.GetRightBound();
		e.IdealPosition < t ? e.IdealPosition = t : e.IdealPosition > n && (e.IdealPosition = n);
	}
	ShiftPathEdges() {
		for (let e of this.Paths) e.PathPoints = this.GetShiftedPoints(e);
	}
	GetShiftedPoints(t) {
		return e.RemoveSwitchbacksAndMiddlePoints(this.GetShiftedPointsSimple(t));
	}
	static Rectilinearise(e, t) {
		return e.x === t.x || e.y === t.y ? t : Math.abs(e.x - t.x) < Math.abs(e.y - t.y) ? new y(e.x, t.y) : new y(t.x, e.y);
	}
	GetShiftedPointsSimple(e) {
		let t = [], n = e.FirstEdge;
		t.push(this.ShiftedPoint(n.Source, n.LongestNudgedSegment));
		for (let n of e.PathEdges()) t.push(this.ShiftedEdgePositionOfTarget(n));
		return t;
	}
	ShiftedEdgePositionOfTarget(e) {
		return e.LongestNudgedSegment != null || e.Next == null ? this.ShiftedPoint(e.Target, e.LongestNudgedSegment) : this.ShiftedPoint(e.Next.Source, e.Next.LongestNudgedSegment);
	}
	ShiftedPoint(e, t) {
		if (t == null) return e;
		let n = this.Solver.GetVariablePosition(t.Id);
		return this.NudgingDirection === A.North ? new y(n, e.y) : new y(e.x, -n);
	}
	static LineSegOfLongestSeg(t, n) {
		let r = n === A.East ? (e) => e.x : (e) => e.y, i = {
			min: Infinity,
			max: -Infinity
		};
		for (let n of t.Edges) e.UpdateMinMaxWithPoint(i, r, n.Source), e.UpdateMinMaxWithPoint(i, r, n.Target);
		return n === A.East ? new S(i.min, -t.IdealPosition, i.max, -t.IdealPosition) : new S(t.IdealPosition, i.min, t.IdealPosition, i.max);
	}
	static UpdateMinMaxWithPoint(e, t, n) {
		let r = t(n);
		e.min > r && (e.min = r), e.max < r && (e.max = r);
	}
	CreateConstraintsBetweenLongestSegments() {
		for (let e of this.LongestNudgedSegs) this.CreateConstraintsBetweenLongestSegmentsForSegment(e);
	}
	CreateConstraintsBetweenLongestSegmentsForSegment(e) {
		let t = /* @__PURE__ */ new Set();
		for (let n of e.Edges) {
			let e = n.AxisEdge;
			if (e != null) for (let n of e.RightNeighbors) for (let e of n.LongestNudgedSegments) t.add(e);
		}
		for (let n of t) this.ConstraintTwoLongestSegs(e, n);
	}
	CreateConstraintsOfTheOrder() {
		for (let t of this.PathOrders) e.ParallelToDirection(t[0], this.NudgingDirection) && this.CreateConstraintsOfThePathOrder(t[1]);
	}
	static ParallelToDirection(e, t) {
		switch (t) {
			case A.North:
			case A.South: return m(e.SourcePoint.x, e.TargetPoint.x);
			default: return m(e.SourcePoint.y, e.TargetPoint.y);
		}
	}
	CreateConstraintsOfThePathOrder(e) {
		let t = null;
		for (let n of e.filter((e) => e.LongestNudgedSegment != null)) t != null && this.ConstraintTwoLongestSegs(t.LongestNudgedSegment, n.LongestNudgedSegment), t = n;
	}
	ConstraintTwoLongestSegs(e, t) {
		(!e.IsFixed || !t.IsFixed) && this.Solver.AddConstraint(e.Id, t.Id);
	}
	CreateVariablesOfLongestSegment(t) {
		if (t.IsFixed) this.Solver.AddFixedVariable(t.Id, e.SegmentPosition(t, this.NudgingDirection));
		else {
			let n = t.GetLeftBound(), r = t.GetRightBound();
			n >= r ? (this.Solver.AddFixedVariable(t.Id, e.SegmentPosition(t, this.NudgingDirection)), t.IsFixed = !0) : (this.Solver.AddVariableNNNN(t.Id, e.SegmentPosition(t, this.NudgingDirection), t.IdealPosition, t.Width), n !== -Infinity && this.Solver.SetLowBound(n, t.Id), r !== Infinity && this.Solver.SetUpperBound(t.Id, r));
		}
	}
	static SegmentPosition(e, t) {
		return t === A.North ? e.Start.x : -e.Start.y;
	}
	FindFreeSpaceInDirection(e) {
		this.BoundAxisEdgesByRectsKnownInAdvance(), new Rr(this.NudgingDirection, this.Obstacles, this.axisEdgesToObstaclesTheyOriginatedFrom, this.PathOrders, e).FindFreeSpace();
	}
	BoundAxisEdgesByRectsKnownInAdvance() {
		for (let e of this.Paths) this.HasGroups && this.BoundPathByMinCommonAncestors(e), this.BoundAxisEdgesAdjacentToSourceAndTargetOnEdge(e);
	}
	BoundPathByMinCommonAncestors(e) {
		for (let t of this.GetMinCommonAncestors(e.GeomEdge)) {
			let n = t.BoundingBox;
			for (let t of e.PathEdges()) {
				let e = t.AxisEdge;
				e.Direction === this.NudgingDirection && this.BoundAxisEdgeByRect(n, e);
			}
		}
	}
	GetMinCommonAncestors(t) {
		this.PortToShapes ??= e.MapPortsToShapes(this.AncestorsSets.keys());
		let n = Jr(this.AncestorsForPort(t.sourcePort), this.AncestorsForPort(t.targetPort));
		return Array.from(n).filter((e) => !e.Children.some((e) => n.has(e)));
	}
	AncestorsForPort(e) {
		let t = this.PortToShapes.get(e);
		return t ? this.AncestorsSets.get(t) : new Set(this.HierarchyOfGroups.AllHitItems(O.mkPP(e.Location, e.Location), null));
	}
	BoundAxisEdgeAdjacentToObstaclePort(e, t) {
		e.Curve == null ? this.BoundAxisByPoint(e.Location, t) : e.Curve.boundingBox.contains(e.Location) && this.BoundAxisEdgeByRect(e.Curve.boundingBox, t);
	}
	BoundAxisByPoint(e, t) {
		t != null && t.Direction === this.NudgingDirection && (this.NudgingDirection === A.North ? (t.BoundFromLeft(e.x), t.BoundFromRight(e.x)) : (t.BoundFromLeft(-e.y), t.BoundFromRight(-e.y)));
	}
	BoundAxisEdgesAdjacentToSourceAndTargetOnEdge(e) {
		this.BoundAxisEdgeAdjacentToObstaclePort(e.GeomEdge.sourcePort, e.FirstEdge.AxisEdge), this.BoundAxisEdgeAdjacentToObstaclePort(e.GeomEdge.targetPort, e.LastEdge.AxisEdge);
	}
	BoundAxisEdgeByRect(e, t) {
		t != null && t.Direction === this.NudgingDirection && (this.NudgingDirection === A.North ? (t.BoundFromLeft(e.left), t.BoundFromRight(e.right)) : (t.BoundFromLeft(e.top * -1), t.BoundFromRight(e.bottom * -1)));
	}
	CreateLongestNudgedSegments() {
		let e = this.NudgingDirection === A.East ? (e) => -e.y : (e) => e.x;
		this.LongestNudgedSegs = [];
		for (let t = 0; t < this.Paths.length; t++) this.CreateLongestNudgedSegmentsForPath(this.Paths[t], e);
	}
	CreateLongestNudgedSegmentsForPath(t, n) {
		this.GoOverPathAndCreateLongSegs(t), e.CalculateIdealPositionsForLongestSegs(t, n);
	}
	static CalculateIdealPositionsForLongestSegs(t, n) {
		let r = null, i = null, a = n(t.Start);
		for (let o of t.PathEdges()) if (o.LongestNudgedSegment != null) {
			if (r = o.LongestNudgedSegment, i != null) {
				let t;
				e.SetIdealPositionForSeg(i, t = n(i.start), a, n(r.Start)), a = t, i = null;
			}
		} else r != null && (i = r, r = null);
		i == null ? r != null && (r.IdealPosition = n(r.Start)) : e.SetIdealPositionForSeg(i, n(i.Start), a, n(t.End));
	}
	static SetIdealPositionForSeg(e, t, n, r) {
		let i = Math.max(n, r), a = Math.min(n, r);
		a + u.distanceEpsilon < t ? t < i ? e.IdealPosition = .5 * (i + a) : e.IdealPosition = i : e.IdealPosition = a;
	}
	GoOverPathAndCreateLongSegs(e) {
		let t = null, n = M.OppositeDir(this.NudgingDirection);
		for (let r of e.PathEdges()) {
			let e = r.Direction;
			e === this.NudgingDirection || e === n ? (t == null ? (r.LongestNudgedSegment = t = new zr(this.LongestNudgedSegs.length), this.LongestNudgedSegs.push(t)) : r.LongestNudgedSegment = t, r.IsFixed && (t.IsFixed = !0)) : (r.LongestNudgedSegment = null, t = null);
		}
	}
	static BuildPolylineForPath(t) {
		let n = { points: t.PathPoints.map((e) => e.clone()) };
		return e.ExtendPolylineToPorts(n, t), n.points;
	}
	static ExtendPolylineToPorts(t, n) {
		e.ExtendPolylineToSourcePort(t, n.GeomEdge.sourcePort.Location), e.ExtendPolylineToTargetPort(t, n.GeomEdge.targetPort.Location), t.points.length < 2 && (t.points = [, ,], t.points[0] = n.GeomEdge.sourcePort.Location, t.points[1] = n.GeomEdge.targetPort.Location);
	}
	static ExtendPolylineToTargetPort(t, n) {
		let r = t.points.length - 1, i = M.VectorDirectionPP(t.points[r - 1], t.points[r]);
		if (e.ProjectionsAreClose(t.points[r - 1], i, n)) {
			t.points = t.points.slice(0, r);
			return;
		}
		let a = t.points[r];
		i === A.East || i === A.West ? t.points[r] = new y(n.x, a.y) : t.points[r] = new y(a.x, n.y);
	}
	static ProjectionsAreClose(e, t, n) {
		return t === A.East || t === A.West ? m(e.x, n.x) : m(e.y, n.y);
	}
	static ExtendPolylineToSourcePort(t, n) {
		let r = M.VectorDirectionPP(t.points[0], t.points[1]);
		if (e.ProjectionsAreClose(t.points[1], r, n)) {
			t.points = t.points.slice(1);
			return;
		}
		let i = t.points[0];
		r === A.East || r === A.West ? t.points[0] = new y(n.x, i.y) : t.points[0] = new y(i.x, n.y);
	}
	static RemoveSwitchbacksAndMiddlePoints(t) {
		let n = [], r = t[0];
		n.push(r);
		let i = t[1], a = M.VectorDirectionPP(r, i), o = 1;
		for (; ++o < t.length;) {
			let s = M.VectorDirectionPP(i, t[o]);
			s === a || M.OppositeDir(s) === a || s === A.None || (y.closeDistEps(r, i) || n.push(r = e.Rectilinearise(r, i)), a = s), i = t[o];
		}
		return y.closeDistEps(r, i) || n.push(e.Rectilinearise(r, i)), n;
	}
	static NudgePaths(t, n, r, i, a) {
		if (t.length === 0) return;
		let o = new e(t, n, r, i);
		o.Calculate(A.North, !0), o.Calculate(A.East, !1), o.Calculate(A.North, !1), a && o.RemoveStaircases();
		for (let n of t) n.GeomEdge.curve = D.mkFromPoints(e.BuildPolylineForPath(n));
	}
	RemoveStaircases() {
		Wr.RemoveStaircases(this.Paths, this.HierarchyOfObstacles);
	}
	static MapPortsToShapes(e) {
		let t = /* @__PURE__ */ new Map();
		for (let n of e) for (let e of n.Ports) t.set(e, n);
		return t;
	}
	static *GetEdgePathFromPathEdgesAsDebugCurves(e, t, n, r) {
		let i = r.ArrayOfPathPoints(), a = i.length, o = a > 1 ? (t - e) / (a - 1) : 1;
		for (let t = 0; t < i.length - 1; t++) yield q.mkDebugCurveTWCI(200, e + o * t, n, S.mkPP(i[t], i[t + 1]));
	}
};
function Jr(e, t) {
	let n = /* @__PURE__ */ new Set();
	if (e.size < t.size) for (let r of e) t.has(r) && n.add(r);
	else for (let r of t) e.has(r) && n.add(r);
	return n;
}
//#endregion
//#region node_modules/@msagl/core/dist/routing/rectilinear/PointAndCrossings.js
var Yr = class {
	constructor(e, t) {
		this.Crossings = [], this.Location = e, this.Crossings = t;
	}
}, Xr = class {
	Count() {
		return this.ListOfPointsAndCrossings.length;
	}
	constructor() {
		this.ListOfPointsAndCrossings = [], this.index = 0, this.ListOfPointsAndCrossings = [];
	}
	Add(e, t) {
		this.ListOfPointsAndCrossings.push(new Yr(e, t));
	}
	Pop() {
		return this.ListOfPointsAndCrossings[this.index++];
	}
	CurrentIsBeforeOrAt(e) {
		return this.index >= this.ListOfPointsAndCrossings.length ? !1 : j.ComparePP(this.ListOfPointsAndCrossings[this.index].Location, e) <= 0;
	}
	get First() {
		return this.ListOfPointsAndCrossings[0];
	}
	get Last() {
		return this.ListOfPointsAndCrossings[this.ListOfPointsAndCrossings.length - 1];
	}
	Reset() {
		this.index = 0;
	}
	MergeFrom(e) {
		if (this.Reset(), e == null) return;
		let t = this.ListOfPointsAndCrossings.length, n = 0, r = e.ListOfPointsAndCrossings.length, i = 0, a = Array(this.ListOfPointsAndCrossings.length);
		for (; n < t || i < r;) {
			if (n >= t) {
				a.push(e.ListOfPointsAndCrossings[i++]);
				continue;
			}
			if (i >= r) {
				a.push(this.ListOfPointsAndCrossings[n++]);
				continue;
			}
			let o = this.ListOfPointsAndCrossings[n], s = e.ListOfPointsAndCrossings[i], c = j.ComparePP(o.Location, s.Location);
			c === 0 ? (a.push(o), ++n, ++i) : c === -1 ? (a.push(o), ++n) : (a.push(s), ++i);
		}
		this.ListOfPointsAndCrossings = a;
	}
	Trim(e, t) {
		this.Reset(), !(this.ListOfPointsAndCrossings == null || this.ListOfPointsAndCrossings.length === 0) && (this.ListOfPointsAndCrossings = this.ListOfPointsAndCrossings.filter((n) => j.ComparePP(n.Location, e) >= 0 && j.ComparePP(n.Location, t) <= 0));
	}
	static ToCrossingArray(e, t) {
		let n = 0, r = e.length;
		for (let i = 0; i < r; i++) e[i].DirectionToInside === t && n++;
		if (n === 0) return null;
		let i = Array(n), a = 0;
		for (let n = 0; n < r; n++) e[n].DirectionToInside === t && (i[a++] = e[n]);
		return i;
	}
	ToString() {
		return U.String.format("{0} [{1}]", this.ListOfPointsAndCrossings.length, this.index);
	}
}, J = class e {
	static EdgeDirectionVE(t) {
		return e.EdgeDirectionVV(t.Source, t.Target);
	}
	static EdgeDirectionVV(e, t) {
		return j.GetDirections(e.point, t.point);
	}
	static GetEdgeEnd(t, n) {
		return n === e.EdgeDirectionVE(t) ? t.Target : t.Source;
	}
	static FindAdjacentVertex(e, t) {
		for (let n of e.InEdges) if (j.GetDirections(e.point, n.SourcePoint) === t) return n.Source;
		for (let n of e.OutEdges) if (j.GetDirections(e.point, n.TargetPoint) === t) return n.Target;
		return null;
	}
	static FindAdjacentEdge(e, t) {
		for (let n of e.InEdges) if (j.GetDirections(n.SourcePoint, e.point) === t) return n;
		for (let n of e.OutEdges) if (j.GetDirections(e.point, n.TargetPoint) === t) return n;
		return null;
	}
	static FindBendPointBetween(t, n, r) {
		return e.IsVerticalD(r) ? new y(n.x, t.y) : new y(t.x, n.y);
	}
	static SegmentIntersectionPPP(t, n, r) {
		let i = j.GetDirections(t, n);
		return e.IsVerticalD(i) ? new y(t.x, r.y) : new y(r.x, t.y);
	}
	static SegmentIntersectionSP(t, n) {
		return e.SegmentIntersectionPPP(t.Start, t.End, n);
	}
	static SegmentsIntersection(t, n) {
		return e.IntervalsIntersect(t.Start, t.End, n.Start, n.End);
	}
	static SegmentsIntersectLL(t, n) {
		return e.IntervalsIntersect(t.start, t.end, n.start, n.end);
	}
	static IntervalsOverlapSS(t, n) {
		return e.IntervalsOverlapPPPP(t.Start, t.End, n.Start, n.End);
	}
	static IntervalsOverlapPPPP(t, n, r, i) {
		return e.IntervalsAreCollinear(t, n, r, i) && j.ComparePP(t, i) !== j.ComparePP(n, r);
	}
	static IntervalsAreCollinear(t, n, r, i) {
		let a = e.IsVerticalPP(t, n);
		return e.IsVerticalPP(r, i) === a ? a ? j.Equal(t.x, r.x) : j.Equal(t.y, r.y) : !1;
	}
	static IntervalsAreSame(e, t, n, r) {
		return j.EqualPP(e, n) && j.EqualPP(t, r);
	}
	static IntervalsIntersect(t, n, r, i) {
		let a = e.SegmentIntersectionPPP(t, n, r);
		return e.PointIsOnSegmentPPP(t, n, a) && e.PointIsOnSegmentPPP(r, i, a) ? a : void 0;
	}
	static SegmentIntersectionEP(t, n) {
		return e.SegmentIntersectionPPP(t.SourcePoint, t.TargetPoint, n);
	}
	static PointIsOnSegmentPPP(e, t, n) {
		return j.EqualPP(e, n) || j.EqualPP(t, n) || j.GetDirections(e, n) === j.GetDirections(n, t);
	}
	static PointIsOnSegmentSP(t, n) {
		return e.PointIsOnSegmentPPP(t.Start, t.End, n);
	}
	static IsVerticalD(e) {
		return (e & (A.North | A.South)) !== 0;
	}
	static IsVerticalE(t) {
		return e.IsVerticalD(j.GetDirections(t.SourcePoint, t.TargetPoint));
	}
	static IsVerticalPP(t, n) {
		return e.IsVerticalD(j.GetDirections(t, n));
	}
	static IsVertical(t) {
		return e.IsVerticalD(j.GetDirections(t.start, t.end));
	}
	static IsAscending(e) {
		return (e & (A.North | A.East)) !== 0;
	}
	static Slope(e, t, n) {
		let r = t.sub(e);
		return r.dot(n.PerpDirectionAsPoint) / r.dot(n.DirectionAsPoint);
	}
	static SortAscending(t, n) {
		let r = j.GetDirections(t, n);
		return A.None === r || e.IsAscending(r) ? [t, n] : [n, t];
	}
	static RectangleBorderIntersect(t, n, r) {
		switch (r) {
			case A.North:
			case A.South: return new y(n.x, e.GetRectangleBound(t, r));
			case A.East:
			case A.West: return new y(e.GetRectangleBound(t, r), n.y);
			default: throw Error();
		}
	}
	static GetRectangleBound(e, t) {
		switch (t) {
			case A.North: return e.top;
			case A.South: return e.bottom;
			case A.East: return e.right;
			case A.West: return e.left;
			default: throw Error();
		}
	}
	static RectangleInteriorsIntersect(e, t) {
		return j.Compare(e.bottom, t.top) < 0 && j.Compare(t.bottom, e.top) < 0 && j.Compare(e.left, t.right) < 0 && j.Compare(t.left, e.right) < 0;
	}
	static PointIsInRectangleInterior(e, t) {
		return j.Compare(e.y, t.top) < 0 && j.Compare(t.bottom, e.y) < 0 && j.Compare(e.x, t.right) < 0 && j.Compare(t.left, e.x) < 0;
	}
}, Y = class e {
	get Dir() {
		return this.dir;
	}
	set Dir(e) {
		this.dir = e;
	}
	constructor(e) {
		this.Dir = e, this.DirectionAsPoint = M.toPoint(this.Dir), this.PerpDirection = A.North === e ? A.East : A.North, this.PerpDirectionAsPoint = M.toPoint(this.PerpDirection), this.OppositeDirection = M.OppositeDir(e);
	}
	get IsHorizontal() {
		return A.East === this.Dir;
	}
	get IsVertical() {
		return A.North === this.Dir;
	}
	Compare(e, t) {
		let n = this.ComparePerpCoord(e, t);
		return n === 0 ? this.CompareScanCoord(e, t) : n;
	}
	CompareScanCoord(e, t) {
		return j.Compare(e.sub(t).dot(this.DirectionAsPoint), 0);
	}
	ComparePerpCoord(e, t) {
		return j.Compare(e.sub(t).dot(this.PerpDirectionAsPoint), 0);
	}
	IsFlatS(e) {
		return this.IsFlatPP(e.Start, e.End);
	}
	IsFlatPP(e, t) {
		return j.Equal(t.sub(e).dot(this.PerpDirectionAsPoint), 0);
	}
	IsPerpendicularS(e) {
		return this.IsPerpendicularPP(e.Start, e.End);
	}
	IsPerpendicularPP(e, t) {
		return j.Equal(t.sub(e).dot(this.DirectionAsPoint), 0);
	}
	Coord(e) {
		return e.dot(this.DirectionAsPoint);
	}
	Min(e, t) {
		return this.Compare(e, t) <= 0 ? e : t;
	}
	Max(e, t) {
		return this.Compare(e, t) >= 0 ? e : t;
	}
	get PerpendicularInstance() {
		return this.IsHorizontal ? e.VerticalInstance : e.HorizontalInstance;
	}
	static GetInstance(t) {
		return J.IsVerticalD(t) ? e.VerticalInstance : e.HorizontalInstance;
	}
	ToString() {
		return this.Dir.toString();
	}
};
Y.HorizontalInstance = new Y(A.East), Y.VerticalInstance = new Y(A.North);
//#endregion
//#region node_modules/@msagl/core/dist/routing/rectilinear/ScanSegment.js
var X = class e extends Wt {
	static mk(t, n) {
		return new e(t, n, e.NormalWeight, null);
	}
	constructor(e, t, n, r) {
		super(), this.Update(e, t), this.Weight = n, this.GroupBoundaryPointAndCrossingsList = r;
	}
	get Start() {
		return this.startPoint;
	}
	get End() {
		return this.endPoint;
	}
	get IsVertical() {
		return e.IsVerticalSegment(this.Start, this.End);
	}
	get ScanDirection() {
		return this.IsVertical ? Y.VerticalInstance : Y.HorizontalInstance;
	}
	get IsOverlapped() {
		return e.OverlappedWeight === this.Weight;
	}
	get IsReflection() {
		return e.ReflectionWeight === this.Weight;
	}
	static IsVerticalSegment(e, t) {
		return e.x === t.x;
	}
	MergeGroupBoundaryCrossingList(e) {
		e != null && (this.GroupBoundaryPointAndCrossingsList ??= new Xr(), this.GroupBoundaryPointAndCrossingsList.MergeFrom(e));
	}
	TrimGroupBoundaryCrossingList() {
		this.GroupBoundaryPointAndCrossingsList != null && this.GroupBoundaryPointAndCrossingsList.Trim(this.Start, this.End);
	}
	Update(e, t) {
		this.startPoint = e, this.endPoint = t;
	}
	SetInitialVisibilityVertex(e) {
		this.LowestVisibilityVertex = e, this.HighestVisibilityVertex = e;
	}
	AppendVisibilityVertex(e, t) {
		if (this.HighestVisibilityVertex == null) this.AddGroupCrossingsBeforeHighestVisibilityVertex(e, t) || this.SetInitialVisibilityVertex(t);
		else {
			if (j.IsPureLower(t.point, this.HighestVisibilityVertex.point)) return;
			this.AddGroupCrossingsBeforeHighestVisibilityVertex(e, t) || this.AppendHighestVisibilityVertex(t);
		}
	}
	AddVisibilityEdge(e, t) {
		let n = new jt(e, t, this.Weight);
		return W.AddEdge(n), n;
	}
	AppendHighestVisibilityVertex(e) {
		j.EqualPP(this.HighestVisibilityVertex.point, e.point) || (this.AddVisibilityEdge(this.HighestVisibilityVertex, e), this.HighestVisibilityVertex = e);
	}
	LoadStartOverlapVertexIfNeeded(e) {
		if (this.NeedStartOverlapVertex) {
			let t = e.FindVertex(this.Start);
			this.AppendVisibilityVertex(e, t ?? e.AddVertexP(this.Start));
		}
	}
	LoadEndOverlapVertexIfNeeded(e) {
		if (this.NeedEndOverlapVertex) {
			let t = e.FindVertex(this.End);
			this.AppendVisibilityVertex(e, t ?? e.AddVertexP(this.End));
		}
	}
	OnSegmentIntersectorBegin(e) {
		this.AppendGroupCrossingsThroughPoint(e, this.Start) || this.LoadStartOverlapVertexIfNeeded(e);
	}
	OnSegmentIntersectorEnd(e) {
		this.AppendGroupCrossingsThroughPoint(e, this.End), this.GroupBoundaryPointAndCrossingsList = null, (this.HighestVisibilityVertex == null || j.IsPureLower(this.HighestVisibilityVertex.point, this.End)) && this.LoadEndOverlapVertexIfNeeded(e);
	}
	static Subsume(e, t, n, r, i, a, o, s) {
		return s.extendStart = !0, s.extendEnd = !0, e.seg == null || !J.IntervalsOverlapPPPP(e.seg.Start, e.seg.End, t, n) ? !1 : e.seg.Weight === r ? (s.extendStart = a.CompareScanCoord(t, e.seg.Start) === -1, s.extendEnd = a.CompareScanCoord(n, e.seg.End) === 1, (s.extendStart || s.extendEnd) && (o.Remove(e.seg), e.seg.startPoint = a.Min(e.seg.Start, t), e.seg.endPoint = a.Max(e.seg.End, n), e.seg = o.InsertUnique(e.seg).item, e.seg.MergeGroupBoundaryCrossingList(i)), !0) : e.seg.Start === t && e.seg.End === n ? (e.seg.Weight = Math.min(e.seg.Weight, r), !0) : !1;
	}
	IntersectsSegment(e) {
		return J.SegmentsIntersection(this, e) !== void 0;
	}
	toString() {
		return "[" + this.Start + " -> " + this.End + (this.IsOverlapped ? " olap" : " free") + "]";
	}
	ContainsPoint(e) {
		return j.EqualPP(this.Start, e) || j.EqualPP(this.End, e) || j.GetDirections(this.Start, e) === j.GetDirections(e, this.End);
	}
	get HasSparsePerpendicularCoords() {
		return this.sparsePerpendicularCoords == null ? !1 : this.sparsePerpendicularCoords.size > 0;
	}
	CreatePointFromPerpCoord(e) {
		return this.IsVertical ? new y(this.Start.x, e) : new y(e, this.Start.y);
	}
	AddSparseVertexCoord(e) {
		this.sparsePerpendicularCoords ??= /* @__PURE__ */ new Set(), this.sparsePerpendicularCoords.add(e);
	}
	AddSparseEndpoint(e) {
		return this.sparsePerpendicularCoords.has(e) ? !1 : (this.sparsePerpendicularCoords.add(e), !0);
	}
	CreateSparseVerticesAndEdges(e) {
		if (this.sparsePerpendicularCoords != null) {
			this.AppendGroupCrossingsThroughPoint(e, this.Start);
			for (let t of Array.from(this.sparsePerpendicularCoords.values()).sort(f)) {
				let n = this.CreatePointFromPerpCoord(t);
				this.AppendVisibilityVertex(e, e.FindVertex(n) ?? e.AddVertexP(n));
			}
			this.AppendGroupCrossingsThroughPoint(e, this.End), this.GroupBoundaryPointAndCrossingsList = null, this.sparsePerpendicularCoords.clear(), this.sparsePerpendicularCoords = null;
		}
	}
	HasVisibility() {
		return this.LowestVisibilityVertex != null;
	}
	AddGroupCrossingsBeforeHighestVisibilityVertex(e, t) {
		return this.AppendGroupCrossingsThroughPoint(e, t.point) ? (j.IsPureLower(this.HighestVisibilityVertex.point, t.point) && (this.AddVisibilityEdge(this.HighestVisibilityVertex, t), this.HighestVisibilityVertex = t), !0) : !1;
	}
	AppendGroupCrossingsThroughPoint(e, t) {
		if (this.GroupBoundaryPointAndCrossingsList == null) return !1;
		let n = !1;
		for (; this.GroupBoundaryPointAndCrossingsList.CurrentIsBeforeOrAt(t);) {
			let t = this.GroupBoundaryPointAndCrossingsList.Pop(), r = null, i = null;
			j.ComparePP(t.Location, this.Start) > 0 && (r = Xr.ToCrossingArray(t.Crossings, this.ScanDirection.OppositeDirection)), j.ComparePP(t.Location, this.End) < 0 && (i = Xr.ToCrossingArray(t.Crossings, this.ScanDirection.Dir)), n = !0;
			let a = e.FindVertex(t.Location) ?? e.AddVertexP(t.Location);
			e.AddVertexP(t.Location), r != null || i != null ? (this.AddLowCrossings(e, a, r), this.AddHighCrossings(e, a, i)) : this.LowestVisibilityVertex == null ? this.SetInitialVisibilityVertex(a) : this.AppendHighestVisibilityVertex(a);
		}
		return n;
	}
	static GetCrossingInteriorVertex(e, t, n) {
		let r = n.GetInteriorVertexPoint(t.point);
		return e.FindVertex(r) ?? e.AddVertexP(r);
	}
	AddCrossingEdge(e, t, n, r) {
		let i = null;
		this.HighestVisibilityVertex != null && (j.EqualPP(this.HighestVisibilityVertex.point, n.point) ? i = e.FindEdgePP(t.point, n.point) : this.AppendHighestVisibilityVertex(t)), i ??= this.AddVisibilityEdge(t, n);
		let a = r.map((e) => e.Group.InputShape), o = i.IsPassable;
		o == null ? i.IsPassable = () => {
			for (let e of a) if (e.IsTransparent) return !0;
			return !1;
		} : i.IsPassable = () => {
			for (let e of a) if (e.IsTransparent || o()) return !0;
			return !1;
		}, this.LowestVisibilityVertex ?? this.SetInitialVisibilityVertex(t), this.HighestVisibilityVertex = n;
	}
	AddLowCrossings(t, n, r) {
		if (r != null) {
			let i = e.GetCrossingInteriorVertex(t, n, r[0]);
			this.AddCrossingEdge(t, i, n, r);
		}
	}
	AddHighCrossings(t, n, r) {
		if (r != null) {
			let i = e.GetCrossingInteriorVertex(t, n, r[0]);
			this.AddCrossingEdge(t, n, i, r);
		}
	}
};
X.NormalWeight = jt.DefaultWeight, X.ReflectionWeight = 5, X.OverlappedWeight = 500;
//#endregion
//#region node_modules/@msagl/core/dist/routing/rectilinear/VertexEntry.js
var Zr = class {
	constructor(e, t, n, r, i) {
		this.IsClosed = !1, this.Vertex = e, this.Direction = t == null ? A.None : M.DirectionFromPointToPoint(t.Vertex.point, e.point), this.ResetEntry(t, n, r, i);
	}
	ResetEntry(e, t, n, r) {
		this.PreviousEntry = e, this.Length = t, this.NumberOfBends = n, this.Cost = r;
	}
	get PreviousVertex() {
		return this.PreviousEntry == null ? null : this.PreviousEntry.Vertex;
	}
	toString() {
		return this.Vertex.point + (" " + (this.Direction + (" " + (this.IsClosed + (" " + this.Cost)))));
	}
}, Qr = class {
	constructor() {
		this.Clear();
	}
	Set(e, t) {
		this.Vertex = e, this.Weight = t;
	}
	Clear() {
		this.Vertex = null, this.Weight = NaN;
	}
}, $r = class e {
	CombinedCost(e, t) {
		return this.LengthImportance * e + this.BendsImportance * t;
	}
	TotalCostFromSourceToVertex(e, t) {
		return this.CombinedCost(e, t) + this.sourceCostAdjustment;
	}
	constructor() {
		this.nextNeighbors = [
			new Qr(),
			new Qr(),
			new Qr()
		], this.LengthImportance = 1, this.BendsImportance = 1;
	}
	InitPath(e, t, n) {
		if (t === n || !this.InitEntryDirectionsAtTarget(n)) return !1;
		this.Target = n, this.Source = t;
		let r = this.TotalCostFromSourceToVertex(0, 0) + this.HeuristicDistanceFromVertexToTarget(t.point, A.None);
		return r >= this.upperBoundOnCost ? !1 : (this.queue = new Rn(f), this.visitedVertices = [t], e == null ? this.EnqueueInitialVerticesFromSource(r) : this.EnqueueInitialVerticesFromSourceEntries(e), this.queue.count > 0);
	}
	InitEntryDirectionsAtTarget(e) {
		this.EntryDirectionsToTarget = A.None;
		for (let t of e.OutEdges) this.EntryDirectionsToTarget |= M.DirectionFromPointToPoint(t.TargetPoint, e.point);
		for (let t of e.InEdges) this.EntryDirectionsToTarget |= M.DirectionFromPointToPoint(t.SourcePoint, e.point);
		return this.EntryDirectionsToTarget !== A.None;
	}
	static IsInDirs(e, t) {
		return e === (e & t);
	}
	MultistageAdjustedCostBound(e) {
		return Number.isFinite(e) ? e + this.BendsImportance : e;
	}
	HeuristicDistanceFromVertexToTarget(t, n) {
		let r = this.Target.point.sub(t);
		if (m(r.x, 0) && m(r.y, 0)) return this.targetCostAdjustment;
		let i = M.VectorDirection(r), a;
		return n === A.None && (n = A.East | (A.North | (A.West | A.South))), a = this.GetNumberOfBends(n, i), this.CombinedCost(e.ManhattanDistance(t, this.Target.point), a) + this.targetCostAdjustment;
	}
	GetNumberOfBends(t, n) {
		return M.IsPureDirection(n) ? this.GetNumberOfBendsForPureDirection(t, n) : e.GetBendsForNotPureDirection(n, t, this.EntryDirectionsToTarget);
	}
	GetNumberOfBendsForPureDirection(t, n) {
		return (n & t) === n ? e.IsInDirs(n, this.EntryDirectionsToTarget) ? 0 : e.IsInDirs(e.Left(n), this.EntryDirectionsToTarget) || e.IsInDirs(e.Right(n), this.EntryDirectionsToTarget) ? 2 : 4 : this.GetNumberOfBendsForPureDirection(e.AddOneTurn[t], n) + 1;
	}
	static GetBendsForNotPureDirection(t, n, r) {
		let i = t & n;
		if (i === A.None) return e.GetBendsForNotPureDirection(t, e.AddOneTurn[n], r) + 1;
		let a = t & r;
		return a === A.None ? e.GetBendsForNotPureDirection(t, n, e.AddOneTurn[r]) + 1 : (i | a) === t ? 1 : 2;
	}
	static Left(e) {
		switch (e) {
			case A.None: return A.None;
			case A.North: return A.West;
			case A.East: return A.North;
			case A.South: return A.East;
			case A.West: return A.South;
			default: throw Error("direction");
		}
	}
	static Right(e) {
		switch (e) {
			case A.None: return A.None;
			case A.North: return A.East;
			case A.East: return A.South;
			case A.South: return A.West;
			case A.West: return A.North;
			default: throw Error("direction");
		}
	}
	static RestorePathV(t) {
		return e.RestorePath(t, null);
	}
	static RestorePath(e, t) {
		if (e.entry == null) return [];
		let n = [], r = !1, i = A.None;
		for (;;) {
			i === e.entry.Direction ? r = !0 : (r = !1, n.push(e.entry.Vertex.point), i = e.entry.Direction);
			let a = e.entry.PreviousEntry;
			if (a == null || e.entry.Vertex === t) break;
			e.entry = a;
		}
		return r && n.push(e.entry.Vertex.point), n.reverse(), n;
	}
	QueueReversedEntryToNeighborVertexIfNeeded(t, n, r) {
		let i = {
			numberOfBends: 0,
			length: 0
		}, a = n.PreviousVertex, o = e.GetLengthAndNumberOfBendsToNeighborVertex(t, a, r, i);
		if (this.CombinedCost(i.length, i.numberOfBends) < this.CombinedCost(n.Length, n.NumberOfBends) || t.Vertex.Degree === 1) {
			let e = this.TotalCostFromSourceToVertex(i.length, i.numberOfBends) + this.HeuristicDistanceFromVertexToTarget(a.point, o);
			this.EnqueueEntry(t, a, i.length, i.numberOfBends, e);
		}
	}
	UpdateEntryToNeighborVertexIfNeeded(t, n, r) {
		let i = {
			numberOfBends: 0,
			length: 0
		}, a = e.GetLengthAndNumberOfBendsToNeighborVertex(t, n.Vertex, r, i);
		if (this.CombinedCost(i.length, i.numberOfBends) < this.CombinedCost(n.Length, n.NumberOfBends)) {
			let e = this.TotalCostFromSourceToVertex(i.length, i.numberOfBends) + this.HeuristicDistanceFromVertexToTarget(n.Vertex.point, a);
			n.ResetEntry(t, i.length, i.numberOfBends, e), this.queue.DecreasePriority(n, e);
		}
	}
	CreateAndEnqueueEntryToNeighborVertex(t, n, r) {
		let i = {
			numberOfBends: 0,
			length: 0
		}, a = e.GetLengthAndNumberOfBendsToNeighborVertex(t, n, r, i), o = this.TotalCostFromSourceToVertex(i.length, i.numberOfBends) + this.HeuristicDistanceFromVertexToTarget(n.point, a);
		o < this.upperBoundOnCost && (n.VertexEntries ?? this.visitedVertices.push(n), this.EnqueueEntry(t, n, i.length, i.numberOfBends, o));
	}
	EnqueueEntry(e, t, n, r, i) {
		let a = new Zr(t, e, n, r, i);
		t.SetVertexEntry(a), this.queue.Enqueue(a, a.Cost);
	}
	static GetLengthAndNumberOfBendsToNeighborVertex(t, n, r, i) {
		i.length = t.Length + e.ManhattanDistance(t.Vertex.point, n.point) * r;
		let a = M.DirectionFromPointToPoint(t.Vertex.point, n.point);
		return i.numberOfBends = t.NumberOfBends, t.Direction !== A.None && a !== t.Direction && i.numberOfBends++, a;
	}
	static ManhattanDistance(e, t) {
		return Math.abs(t.x - e.x) + Math.abs(t.y - e.y);
	}
	GetPathWithCost(t, n, r, i, a, o, s) {
		if (this.upperBoundOnCost = s, this.sourceCostAdjustment = r, this.targetCostAdjustment = o, !this.InitPath(t, n, a)) return null;
		for (; this.queue.count > 0;) {
			let t = this.queue.Dequeue(), n = t.Vertex;
			if (n === this.Target) {
				if (i == null) return this.Cleanup(), t;
				if (t.Direction, this.EntryDirectionsToTarget === A.None) {
					let e = 0;
					for (let t of this.Target.VertexEntries) i[e++] = t;
					return this.Cleanup(), null;
				}
				this.upperBoundOnCost = Math.min(this.MultistageAdjustedCostBound(t.Cost), this.upperBoundOnCost);
				continue;
			}
			t.IsClosed = !0;
			for (let e of this.nextNeighbors) e.Clear();
			let r = e.Right(t.Direction);
			this.ExtendPathAlongInEdges(t, n.InEdges, r), this.ExtendPathAlongOutEdges(t, n.OutEdges, r);
			for (let e of this.nextNeighbors) e.Vertex != null && this.ExtendPathToNeighborVertex(t, e.Vertex, e.Weight);
		}
		if (i != null && this.Target.VertexEntries != null) for (let e = 0; e < this.Target.VertexEntries.length; e++) i[e] = this.Target.VertexEntries[e];
		return this.Cleanup(), null;
	}
	ExtendPathAlongInEdges(e, t, n) {
		for (let r of t) this.ExtendPathAlongEdge(e, r, !0, n);
	}
	ExtendPathAlongOutEdges(e, t, n) {
		let r = t.isEmpty() ? null : t.treeMinimum();
		for (; r != null; r = t.next(r)) this.ExtendPathAlongEdge(e, r.item, !1, n);
	}
	ExtendPathAlongEdge(t, n, r, i) {
		if (!e.IsPassable(n)) return;
		let a = r ? n.Source : n.Target;
		if (a === t.PreviousVertex) {
			if (t.Vertex.Degree > 1 || t.Vertex !== this.Source) return;
			this.ExtendPathToNeighborVertex(t, a, n.Weight);
			return;
		}
		let o = M.DirectionFromPointToPoint(t.Vertex.point, a.point), s = this.nextNeighbors[2];
		o !== t.Direction && (s = this.nextNeighbors[+(o === i)]), s.Set(a, n.Weight);
	}
	EnqueueInitialVerticesFromSource(t) {
		let n = new Zr(this.Source, null, 0, 0, t);
		n.IsClosed = !0;
		for (let t of this.Source.OutEdges) e.IsPassable(t) && this.ExtendPathToNeighborVertex(n, t.Target, t.Weight);
		for (let t of this.Source.InEdges) e.IsPassable(t) && this.ExtendPathToNeighborVertex(n, t.Source, t.Weight);
	}
	EnqueueInitialVerticesFromSourceEntries(e) {
		for (let t of e) t != null && this.queue.Enqueue(t, t.Cost);
	}
	ExtendPathToNeighborVertex(e, t, n) {
		let r = M.DirectionFromPointToPoint(e.Vertex.point, t.point), i = t.VertexEntries == null ? null : t.VertexEntries[M.ToIndex(r)];
		i == null ? this.CreateAndEnqueueReversedEntryToNeighborVertex(e, t, n) || this.CreateAndEnqueueEntryToNeighborVertex(e, t, n) : i.IsClosed || this.UpdateEntryToNeighborVertexIfNeeded(e, i, n);
	}
	CreateAndEnqueueReversedEntryToNeighborVertex(e, t, n) {
		if (e.Vertex.VertexEntries != null) {
			let r = M.DirectionFromPointToPoint(t.point, e.Vertex.point), i = e.Vertex.VertexEntries[M.ToIndex(r)];
			if (i != null) return this.QueueReversedEntryToNeighborVertexIfNeeded(e, i, n), !0;
		}
		return !1;
	}
	static IsPassable(e) {
		return e.IsPassable == null || e.IsPassable();
	}
	Cleanup() {
		for (let e of this.visitedVertices) e.RemoveVertexEntries();
		this.visitedVertices = [], this.queue = null;
	}
};
$r.DefaultBendPenaltyAsAPercentageOfDistance = 4, $r.AddOneTurn = [
	A.None,
	A.North | A.East | A.West,
	A.North | A.East | A.South,
	15,
	A.East | A.South | A.West,
	15,
	15,
	15,
	13,
	15,
	15,
	15,
	15,
	15,
	15,
	15
];
//#endregion
//#region node_modules/@msagl/core/dist/routing/rectilinear/MsmtRectilinearPath.js
var ei = class e {
	constructor(e) {
		this.bendPenaltyAsAPercentageOfDistance = $r.DefaultBendPenaltyAsAPercentageOfDistance, this.currentPassTargetEntries = [
			,
			,
			,
			,
		], this.bendPenaltyAsAPercentageOfDistance = e;
	}
	GetPath(e, t) {
		let n = { entry: this.GetPathStage(null, e, null, t) };
		return $r.RestorePathV(n);
	}
	GetPathStage(t, n, r, i) {
		let a = new $r(), o = {
			bestEntry: null,
			bestCost: Number.MAX_VALUE / X.OverlappedWeight
		}, s = Infinity, c = e.Barycenter(n), l = e.Barycenter(i), u = $r.ManhattanDistance(c, l);
		a.BendsImportance = Math.max(.001, u * (this.bendPenaltyAsAPercentageOfDistance * .01));
		let d = a.LengthImportance, f = r == null ? null : this.currentPassTargetEntries, p = [];
		for (let e of n) for (let t of i) p.push([e, t]);
		p.sort(([e, t], [n, r]) => h(e, t) - h(n, r));
		for (let [n, i] of p) {
			if (y.closeDistEps(n.point, i.point)) continue;
			let u = g(n, c) * d, p = g(i, l) * d, _ = o.bestCost;
			if (r != null) {
				for (let e = 0; e < f.length; e++) f[e] = null;
				_ = a.MultistageAdjustedCostBound(o.bestCost);
			}
			let v = a.GetPathWithCost(t, n, u, f, i, p, _);
			if (f != null) {
				e.UpdateTargetEntriesForEachDirection(r, f, o);
				continue;
			}
			if (v == null) continue;
			let b = v.Cost / h(n, i);
			(v.Cost < o.bestCost || m(v.Cost, o.bestCost) && b < s) && (o.bestCost = v.Cost, o.bestEntry = v, s = v.Cost / h(n, i));
		}
		return o.bestEntry;
		function h(e, t) {
			return $r.ManhattanDistance(e.point, t.point);
		}
		function g(e, t) {
			return $r.ManhattanDistance(e.point, t);
		}
	}
	static UpdateTargetEntriesForEachDirection(e, t, n) {
		for (let r = 0; r < t.length; r++) {
			let i = t[r];
			i != null && (e[r] == null || i.Cost < e[r].Cost) && (e[r] = i, i.Cost < n.bestCost && (n.bestCost = i.Cost, n.bestEntry = i));
		}
	}
	static Barycenter(e) {
		let t = new y(0, 0);
		for (let n of e) t = t.add(n.point);
		return t.div(e.length);
	}
}, ti = class {
	get PathPoints() {
		return this._pathPoints;
	}
	set PathPoints(e) {
		this._pathPoints = e;
	}
	get Width() {
		return this.GeomEdge.lineWidth;
	}
	constructor(e) {
		this.GeomEdge = e;
	}
	get End() {
		return this.LastEdge.Target;
	}
	get Start() {
		return this.FirstEdge.Source;
	}
	ArrayOfPathPoints() {
		return this._pathPoints instanceof Mr ? Array.from(ni(this._pathPoints)) : this._pathPoints;
	}
	*PathEdges() {
		for (let e = this.FirstEdge; e != null; e = e.Next) yield e;
	}
	AddEdge(e) {
		e.Path = this, this.LastEdge.Next = e, e.Prev = this.LastEdge, this.LastEdge = e;
	}
	SetFirstEdge(e) {
		this.FirstEdge = e, this.LastEdge = e, e.Path = this;
	}
	toString() {
		let e = new U.StringBuilder();
		this.PathPoints instanceof Mr && e.Append("L");
		for (let t of ni(this.PathPoints)) e.Append(t.toString());
		return e.ToString();
	}
};
function* ni(e) {
	if (e instanceof Mr) for (let t = e; t != null; t = t.Next) yield t.Point;
	else for (let t of e) yield t;
}
//#endregion
//#region node_modules/@msagl/core/dist/routing/rectilinear/BasicObstacleSide.js
var ri = class extends Gt {
	get Obstacle() {
		return this.obstacle;
	}
	set Obstacle(e) {
		this.obstacle = e;
	}
	constructor(e, t, n, r) {
		super(t), this.Slope = 0, this.SlopeInverse = 0, this.Obstacle = e, this.endVertex = r ? t.nextOnPolyline : t.prevOnPolyline, n.IsPerpendicularPP(t.point, this.endVertex.point) || (this.Slope = J.Slope(t.point, this.endVertex.point, n), this.SlopeInverse = 1 / this.Slope);
	}
	get EndVertex() {
		return this.endVertex;
	}
}, ii = class extends ri {
	constructor(e, t, n) {
		super(e, t, n, n.IsHorizontal);
	}
}, ai = class extends ri {
	constructor(e, t, n) {
		super(e, t, n, n.IsVertical);
	}
}, oi = class e {
	get PaddedPolyline() {
		return this._PaddedPolyline;
	}
	set PaddedPolyline(e) {
		this._PaddedPolyline = e;
	}
	get looseVisibilityPolyline() {
		return this._looseVisibilityPolyline ??= e.CreateLoosePolyline(this.VisibilityPolyline), this._looseVisibilityPolyline;
	}
	set looseVisibilityPolyline(e) {
		this._looseVisibilityPolyline = e;
	}
	GetPortChanges(e) {
		return e.addedPorts = ke(this.InputShape.Ports, this.Ports), e.removedPorts = ke(this.Ports, this.InputShape.Ports), e.addedPorts.size === 0 && e.removedPorts.size === 0 ? !1 : (this.Ports = new Set(this.InputShape.Ports), !0);
	}
	get IsInConvexHull() {
		return this.ConvexHull != null;
	}
	get IsGroup() {
		return this.InputShape != null && this.InputShape.IsGroup;
	}
	get VisibilityBoundingBox() {
		return this.VisibilityPolyline.boundingBox;
	}
	get VisibilityPolyline() {
		return this.ConvexHull == null ? this.PaddedPolyline : this.ConvexHull.Polyline;
	}
	static CreateSentinel(t, n, r, i) {
		let a = e.mk(t, n, i);
		return a.CreateInitialSides(a.PaddedPolyline.startPoint, r), a;
	}
	CreateInitialSides(e, t) {
		this.ActiveLowSide = new ii(this, e, t), this.ActiveHighSide = new ai(this, e, t), t.IsFlatS(this.ActiveHighSide) && (this.ActiveHighSide = new ai(this, this.ActiveHighSide.EndVertex, t));
	}
	constructor(t, n) {
		t != null && (this.PaddedPolyline = Nn.PaddedPolylineBoundaryOfNode(t.BoundaryCurve, n), e.RoundVerticesAndSimplify(this.PaddedPolyline), this.IsRectangle = this.IsPolylineRectangle(), this.InputShape = t, this.Ports = new Set(this.InputShape.Ports));
	}
	static mk(t, n, r) {
		let i = new e(null, 0);
		return i.PaddedPolyline = D.mkClosedFromPoints([y.RoundPoint(t), y.RoundPoint(n)]), i.Ordinal = r, i;
	}
	IsPolylineRectangle() {
		if (this.PaddedPolyline.count !== 4) return !1;
		let e = this.PaddedPolyline.startPoint, t = e.nextOnPolyline, n = M.VectorDirectionPP(e.point, t.point);
		if (!M.IsPureDirection(n)) return !1;
		do {
			e = t, t = e.nextOnPolyline;
			let r = M.DirectionFromPointToPoint(e.point, t.point);
			if (r !== M.RotateRight(n)) return !1;
			n = r;
		} while (e !== this.PaddedPolyline.startPoint);
		return !0;
	}
	static RoundVerticesAndSimplify(t) {
		let n = t.startPoint;
		do
			n.point = y.RoundPoint(n.point), n = n.nextOnPolyline;
		while (n !== t.startPoint);
		e.RemoveCloseAndCollinearVerticesInPlace(t), t.setInitIsRequired();
	}
	get IsPrimaryObstacle() {
		return this.ConvexHull == null || this === this.ConvexHull.PrimaryObstacle;
	}
	static RemoveCloseAndCollinearVerticesInPlace(e) {
		let t = u.intersectionEpsilon * 10;
		for (let n = e.startPoint.next; n != null; n = n.next) y.close(n.prev.point, n.point, t) && (n.next == null ? e.RemoveEndPoint() : (n.prev.next = n.next, n.next.prev = n.prev));
		return y.close(e.start, e.end, t) && e.RemoveStartPoint(), e = e.RemoveCollinearVertices(), e.endPoint.prev != null && e.endPoint.prev !== e.startPoint && y.getTriangleOrientation(e.endPoint.prev.point, e.end, e.start) === _.Collinear && e.RemoveEndPoint(), e.startPoint.next != null && e.endPoint.prev !== e.startPoint && y.getTriangleOrientation(e.end, e.start, e.startPoint.next.point) === _.Collinear && e.RemoveStartPoint(), e.setInitIsRequired(), e;
	}
	get isOverlapped() {
		return this.clump !== void 0 && this.clump.length > 0;
	}
	get IsSentinel() {
		return this.InputShape == null;
	}
	IsInSameClump(e) {
		return this.isOverlapped && this.clump === e.clump;
	}
	Close() {
		this.ActiveLowSide = null, this.ActiveHighSide = null;
	}
	SetConvexHull(e) {
		this.clump = null, this.IsRectangle = !1, this.ConvexHull = e, this.looseVisibilityPolyline = null;
	}
	static CreateLoosePolyline(t) {
		let n = Nn.CreatePaddedPolyline(t, u.intersectionEpsilon * 10);
		return e.RoundVerticesAndSimplify(n), n;
	}
	get IsTransparentAncestor() {
		return this.InputShape == null ? !1 : this.InputShape.IsTransparent;
	}
	set IsTransparentAncestor(e) {
		this.InputShape.IsTransparent = e;
	}
};
oi.FirstSentinelOrdinal = 1, oi.FirstNonSentinelOrdinal = 10;
//#endregion
//#region node_modules/@msagl/core/dist/routing/rectilinear/ObstaclePortEntrance.js
var si = class {
	get Obstacle() {
		return this.ObstaclePort.Obstacle;
	}
	get InitialWeight() {
		return this.IsOverlapped ? X.OverlappedWeight : X.NormalWeight;
	}
	get IsCollinearWithPort() {
		return M.IsPureDirection(j.GetDirections(this.VisibilityBorderIntersect, this.ObstaclePort.Location));
	}
	get IsVertical() {
		return J.IsVertical(this.MaxVisibilitySegment);
	}
	get WantVisibilityIntersection() {
		return !this.IsOverlapped && this.CanExtend && (!this.ObstaclePort.HasCollinearEntrances || this.IsCollinearWithPort);
	}
	get CanExtend() {
		return j.GetDirections(this.MaxVisibilitySegment.start, this.MaxVisibilitySegment.end) !== A.None;
	}
	constructor(e, t, n, r) {
		this.IsOverlapped = !1, this.unpaddedToPaddedBorderWeight = X.NormalWeight, this.ObstaclePort = e, this.UnpaddedBorderIntersect = t, this.OutwardDirection = n;
		let i = S.mkPP(this.UnpaddedBorderIntersect, J.RectangleBorderIntersect(e.Obstacle.VisibilityBoundingBox, this.UnpaddedBorderIntersect, n)), a = E.getAllIntersections(i, e.Obstacle.VisibilityPolyline, !0);
		this.VisibilityBorderIntersect = y.RoundPoint(a[0].x);
		let o = { pacList: null };
		this.MaxVisibilitySegment = r.CreateMaxVisibilitySegment(this.VisibilityBorderIntersect, this.OutwardDirection, o), this.pointAndCrossingsList = o.pacList, (this.Obstacle.isOverlapped || this.Obstacle.IsGroup && !this.Obstacle.IsInConvexHull) && (this.IsOverlapped = r.IntersectionIsInsideAnotherObstacle(null, this.Obstacle, this.VisibilityBorderIntersect, Y.GetInstance(this.OutwardDirection)), (!this.Obstacle.IsGroup || this.IsOverlapped || this.InteriorEdgeCrossesObstacle(r)) && (this.unpaddedToPaddedBorderWeight = X.OverlappedWeight)), this.Obstacle.IsInConvexHull && this.unpaddedToPaddedBorderWeight === X.NormalWeight && this.SetUnpaddedToPaddedBorderWeightFromHullSiblingOverlaps(r);
	}
	SetUnpaddedToPaddedBorderWeightFromHullSiblingOverlaps(e) {
		(this.Obstacle.IsGroup ? this.InteriorEdgeCrossesObstacle(e) : this.InteriorEdgeCrossesConvexHullSiblings()) && (this.unpaddedToPaddedBorderWeight = X.OverlappedWeight);
	}
	InteriorEdgeCrossesObstacle(e) {
		let t = O.mkPP(this.UnpaddedBorderIntersect, this.VisibilityBorderIntersect);
		return this.InteriorEdgeCrossesObstacleRFI(t, (e) => e.VisibilityPolyline, Array.from(e.Root.GetLeafRectangleNodesIntersectingRectangle(t)).filter((e) => !e.UserData.IsGroup && e.UserData !== this.Obstacle).map((e) => e.UserData));
	}
	InteriorEdgeCrossesConvexHullSiblings() {
		let e = O.mkPP(this.UnpaddedBorderIntersect, this.VisibilityBorderIntersect);
		return this.InteriorEdgeCrossesObstacleRFI(e, (e) => e.PaddedPolyline, this.Obstacle.ConvexHull.Obstacles.filter((e) => e !== this.Obstacle));
	}
	InteriorEdgeCrossesObstacleRFI(e, t, n) {
		let r = null;
		for (let i of n) {
			let n = t(i);
			if (J.RectangleInteriorsIntersect(e, n.boundingBox) && (r ??= S.mkPP(this.UnpaddedBorderIntersect, this.VisibilityBorderIntersect), E.intersectionOne(r, n, !1) != null || T.Outside !== E.PointRelativeToCurveLocation(this.UnpaddedBorderIntersect, n))) return !0;
		}
		return !1;
	}
	get HasGroupCrossings() {
		return this.pointAndCrossingsList != null && this.pointAndCrossingsList.Count() > 0;
	}
	HasGroupCrossingBeforePoint(e) {
		if (!this.HasGroupCrossings) return !1;
		let t = J.IsAscending(this.OutwardDirection) ? this.pointAndCrossingsList.First : this.pointAndCrossingsList.Last;
		return j.GetDirections(this.MaxVisibilitySegment.start, t.Location) === j.GetDirections(t.Location, e);
	}
	AddToAdjacentVertex(e, t, n, r) {
		let i = e.VisGraph.FindVertex(this.VisibilityBorderIntersect);
		if (i != null) {
			this.ExtendEdgeChain(e, i, i, n, r);
			return;
		}
		this.OutwardDirection === j.GetDirections(t.point, this.VisibilityBorderIntersect) ? (this.VisibilityBorderIntersect = t.point, i = t) : (i = e.FindOrAddVertex(this.VisibilityBorderIntersect), e.FindOrAddEdge(i, t, this.InitialWeight)), this.ExtendEdgeChain(e, i, t, n, r);
	}
	ExtendEdgeChain(e, t, n, r, i) {
		e.ExtendEdgeChainVRLPB(n, r, this.MaxVisibilitySegment, this.pointAndCrossingsList, this.IsOverlapped);
		let a = e.FindOrAddVertex(this.UnpaddedBorderIntersect);
		e.FindOrAddEdge(a, t, this.unpaddedToPaddedBorderWeight), i && e.ConnectVertexToTargetVertex(this.ObstaclePort.CenterVertex, a, this.OutwardDirection, this.InitialWeight);
	}
	toString() {
		return U.String.format("{0} {1}~{2} {3}", this.ObstaclePort.Location, this.UnpaddedBorderIntersect, this.VisibilityBorderIntersect, this.OutwardDirection);
	}
}, ci = class {
	constructor(e, t) {
		this.HasCollinearEntrances = !1, this.VisibilityRectangle = O.mkEmpty(), this.Port = e, this.Obstacle = t, this.PortEntrances = [], this.Location = y.RoundPoint(this.Port.Location);
	}
	CreatePortEntrance(e, t, n) {
		let r = new si(this, e, t, n);
		this.PortEntrances.push(r), this.VisibilityRectangle.add(r.MaxVisibilitySegment.end), this.HasCollinearEntrances = this.HasCollinearEntrances || r.IsCollinearWithPort;
	}
	ClearVisibility() {
		this.PortEntrances = [];
	}
	AddToGraph(e, t) {
		t && (this.CenterVertex = e.FindOrAddVertex(this.Location));
	}
	RemoveFromGraph() {
		this.CenterVertex = null;
	}
	get LocationHasChanged() {
		return !y.closeDistEps(this.Location, y.RoundPoint(this.Port.Location));
	}
	get PortCurve() {
		return this.Port.Curve;
	}
	get PortLocation() {
		return this.Port.Location;
	}
	toString() {
		return this.Port + this.Obstacle.toString();
	}
}, li = class {
	get Point() {
		return this.Vertex.point;
	}
	get InitialWeight() {
		return this.IsOverlapped ? X.OverlappedWeight : X.NormalWeight;
	}
	get IsOutOfBounds() {
		return A.None !== this.OutOfBoundsDirectionFromGraph;
	}
	constructor(e, t) {
		this.maxVisibilitySegmentsAndCrossings = [
			,
			,
			,
			,
		], this.OutOfBoundsDirectionFromGraph = A.None, this.GetVertex(e, t);
	}
	GetVertex(e, t) {
		this.Vertex = e.FindOrAddVertex(t);
	}
	AddEdgeToAdjacentEdge(e, t, n, r) {
		let i = J.SegmentIntersectionEP(t, this.Point), a = e.VisGraph.FindVertex(i);
		return a == null ? a = e.AddEdgeToTargetEdge(this.Vertex, t, i) : this.AddToAdjacentVertex(e, a, n, r), this.ExtendEdgeChain(e, a, n, r), a;
	}
	AddToAdjacentVertex(e, t, n, r) {
		j.EqualPP(this.Point, t.point) || e.FindOrAddEdge(this.Vertex, t, this.InitialWeight), this.ExtendEdgeChain(e, t, n, r);
	}
	ExtendEdgeChain(e, t, n, r) {
		let i = this.IsOverlapped;
		i &&= e.ObstacleTree.PointIsInsideAnObstaclePD(t.point, n);
		let a = this.GetSegmentAndCrossings(this.IsOverlapped ? t : this.Vertex, n, e);
		e.ExtendEdgeChainVRLPB(t, r, a[0], a[1], i);
	}
	GetSegmentAndCrossings(e, t, n) {
		let r = M.ToIndex(t), i = this.maxVisibilitySegmentsAndCrossings[r];
		if (i == null) {
			let a = { pacList: null };
			i = [n.ObstacleTree.CreateMaxVisibilitySegment(e.point, t, a), a.pacList], this.maxVisibilitySegmentsAndCrossings[r] = i;
		} else j.GetDirections(e.point, i[0].start) === t && (i[0].start = e.point);
		return i;
	}
	MaxVisibilityInDirectionForNonOverlappedFreePoint(e, t) {
		return this.GetSegmentAndCrossings(this.Vertex, e, t)[0].end;
	}
	AddOobEdgesFromGraphCorner(e, t) {
		let n = j.GetDirections(t, this.Vertex.point), r = e.VisGraph.FindVertex(t);
		e.ConnectVertexToTargetVertex(r, this.Vertex, n & (A.North | A.South), X.NormalWeight), e.ConnectVertexToTargetVertex(r, this.Vertex, n & (A.East | A.West), X.NormalWeight);
	}
	RemoveFromGraph() {
		this.Vertex = null;
	}
	toString() {
		return this.Vertex.toString();
	}
}, ui = class {
	constructor(e, t) {
		this.BoundaryWidth = u.distanceEpsilon, this.Group = e, this.DirectionToInside = t;
	}
	GetInteriorVertexPoint(e) {
		return y.RoundPoint(e.add(M.toPoint(this.DirectionToInside).mul(this.BoundaryWidth)));
	}
	toString() {
		return U.String.format("{0} {1}", this.DirectionToInside, this.Group);
	}
};
ui.BoundaryWidth = u.distanceEpsilon;
//#endregion
//#region node_modules/@msagl/core/dist/routing/rectilinear/AxisCoordinateEvent.js
var di = class extends Tt {
	constructor(e) {
		super(), this.site = e;
	}
	get Site() {
		return this.site;
	}
}, fi = class extends Et {
	constructor(e, t) {
		super(t), this.Obstacle = e;
	}
}, pi = class extends fi {
	constructor(e, t) {
		super(e, t);
	}
}, mi = class {
	AddPendingPerpendicularCoord(e) {
		this.pendingPerpCoords ??= [], this.pendingPerpCoords.push(e);
	}
	ResetForIntersections() {
		this.CurrentSegment = this.FirstSegment;
	}
	get IsHorizontal() {
		return !this.FirstSegment.IsVertical;
	}
	constructor(e) {
		this.Coord = e;
	}
	TraverseToSegmentContainingPoint(e) {
		if (this.CurrentSegment.ContainsPoint(e)) return !0;
		let t = this.IsHorizontal ? e.y : e.x;
		if (!j.Equal(this.Coord, t)) {
			for (; this.MoveNext(););
			return !1;
		}
		for (;;) {
			if ((this.CurrentSegment.NextSegment == null || j.GetDirections(this.CurrentSegment.End, e) == j.GetDirections(e, this.CurrentSegment.NextSegment.Start)) && y.closeIntersections(this.CurrentSegment.End, e)) return this.CurrentSegment.Update(this.CurrentSegment.Start, e), !0;
			if (!this.MoveNext()) return !1;
			if (this.CurrentSegment.ContainsPoint(e)) return !0;
			if (j.IsPureLower(e, this.CurrentSegment.Start)) return this.CurrentSegment.Update(e, this.CurrentSegment.End), !0;
		}
	}
	MoveNext() {
		return this.CurrentSegment = this.CurrentSegment.NextSegment, this.HasCurrent;
	}
	get HasCurrent() {
		return this.CurrentSegment != null;
	}
	PointIsCurrentEndAndNextStart(e) {
		return e.equal(this.CurrentSegment.End) && this.CurrentSegment.NextSegment != null && e.equal(this.CurrentSegment.NextSegment.Start);
	}
	AddPerpendicularCoord(e) {
		let t = this.IsHorizontal ? new y(e, this.Coord) : new y(this.Coord, e);
		this.TraverseToSegmentContainingPoint(t), this.CurrentSegment.AddSparseVertexCoord(e);
	}
	toString() {
		return this.FirstSegment == null ? "-0- " + this.Coord : this.IsHorizontal ? "(H) Y === " + this.Coord : "(V) X === ";
	}
	AppendScanSegment(e) {
		this.FirstSegment == null ? this.FirstSegment = e : this.CurrentSegment.NextSegment = e, this.CurrentSegment = e;
	}
	AddPendingPerpendicularCoordsToScanSegments() {
		if (this.pendingPerpCoords != null) {
			this.ResetForIntersections();
			for (let e of this.pendingPerpCoords) this.AddPerpendicularCoord(e);
		}
	}
}, hi = class {
	constructor(e, t) {
		this.CurrentSlotIndex = 0, this.vector = [], this.IsHorizontal = t;
		let n = Array.from(e).sort((e, t) => e > t ? 1 : e < t ? -1 : 0);
		for (let e of n) this.vector.push(new mi(e));
	}
	get Length() {
		return this.vector.length;
	}
	get CurrentSlot() {
		return this.vector[this.CurrentSlotIndex];
	}
	Item(e) {
		return this.vector[e];
	}
	CreateScanSegment(e, t, n, r) {
		this.CurrentSlot.AppendScanSegment(new X(e, t, n, r));
	}
	ScanSegmentsCompleteForCurrentSlot() {
		this.CurrentSlotIndex++;
	}
	ScanSegmentsComplete() {
		for (let e of this.vector) e.AddPendingPerpendicularCoordsToScanSegments();
	}
	Items() {
		return this.vector;
	}
	ResetForIntersections() {
		for (let e of this.vector) e.ResetForIntersections();
	}
	FindNearest(e, t) {
		let n = 0, r = this.vector.length - 1;
		if (e <= this.vector[n].Coord) return n;
		if (e >= this.vector[r].Coord) return r;
		for (; r - n > 2;) {
			let t = n + (r - n >> 1), i = this.vector[t];
			if (e < i.Coord) {
				r = t;
				continue;
			}
			if (e > i.Coord) {
				n = t;
				continue;
			}
			return t;
		}
		for (n++; n <= r; n++) {
			let r = this.vector[n];
			if (e < r.Coord) return t > 0 ? n : n - 1;
			if (e === r.Coord) break;
		}
		return n;
	}
	CreateSparseVerticesAndEdges(e) {
		for (let t of this.vector) {
			t.ResetForIntersections();
			for (let n = t.FirstSegment; n != null; n = n.NextSegment) n.CreateSparseVerticesAndEdges(e);
		}
	}
	GetParallelCoord(e) {
		return this.IsHorizontal ? e.y : e.x;
	}
	GetPerpendicularCoord(e) {
		return this.IsHorizontal ? e.x : e.y;
	}
	ConnectAdjoiningSegmentEndpoints() {
		for (let e of this.vector) {
			e.ResetForIntersections();
			let t = e.FirstSegment;
			for (let e = t.NextSegment; e != null; e = e.NextSegment) {
				if (e.HasSparsePerpendicularCoords && t.HasSparsePerpendicularCoords && e.Start === t.End) {
					let n = this.GetPerpendicularCoord(e.Start);
					t.AddSparseEndpoint(n), e.AddSparseEndpoint(n);
				}
				t = e;
			}
		}
	}
	toString() {
		return (this.IsHorizontal ? "(H) count" : "(V) count === ") + this.vector.length;
	}
}, gi = class e extends Tt {
	constructor(e, t, n) {
		super(), this.InitialObstacle = e, this.ReflectingObstacle = t, this.site = n;
	}
	static mk(t, n, r) {
		let i = new e(t.ReflectingObstacle, n, r);
		return i.PreviousSite = t, i;
	}
	IsStaircaseStep(e) {
		return this.InitialObstacle === e;
	}
	get Site() {
		return this.site;
	}
}, _i = class {
	constructor() {
		this.eventTree = new wt((e, t) => this.Compare(e, t));
	}
	Reset(e) {
		this.scanDirection = e;
	}
	Enqueue(e) {
		this.eventTree.Enqueue(e);
	}
	Dequeue() {
		return this.eventTree.Dequeue();
	}
	get Count() {
		return this.eventTree.Count;
	}
	Compare(e, t) {
		if (e === t) return 0;
		if (e == null) return -1;
		if (t == null) return 1;
		let n = this.scanDirection.ComparePerpCoord(e.Site, t.Site);
		return n || (n = (e instanceof gi ? 0 : 1) - (t instanceof gi ? 0 : 1), n) ? n : this.scanDirection.CompareScanCoord(e.Site, t.Site);
	}
}, vi = class {
	constructor() {
		this.pointCrossingMap = new Nt(), this.pointList = [];
	}
	AddIntersection(e, t, n) {
		let r = this.pointCrossingMap.get(e);
		r || (r = [], this.pointCrossingMap.set(e, r));
		let i = r.length;
		for (let e = 0; e < i; e++) {
			let n = r[e];
			if (n.Group === t) return n;
		}
		let a = new ui(t, n);
		return r.push(a), a;
	}
	Clear() {
		this.pointCrossingMap.clear();
	}
	GetOrderedListBetween(e, t) {
		if (this.pointCrossingMap.size === 0) return null;
		if (j.ComparePP(e, t) > 0) {
			let n = e;
			e = t, t = n;
		}
		this.pointList = [];
		for (let n of this.pointCrossingMap.keys()) j.ComparePP(n, e) >= 0 && j.ComparePP(n, t) <= 0 && this.pointList.push(n);
		this.pointList.sort((e, t) => e.compareTo(t));
		let n = new Xr(), r = this.pointList.length;
		for (let e = 0; e < r; e++) {
			let t = this.pointList[e];
			n.Add(t, this.pointCrossingMap.get(t));
		}
		return n;
	}
	toString() {
		return U.String.format("{0}", this.pointCrossingMap.size);
	}
}, yi = class extends gi {
	constructor(e, t, n) {
		super(e.ReflectingObstacle, t.Obstacle, n), this.Side = t;
	}
}, bi = class {
	constructor(e) {
		this.staleSites = [], this.scanDirection = e, this.eventTree = new Ct((e, t) => this.CompareBB(e, t)), this.findFirstPred = (e) => this.CompareToFindFirstPoint(e.Site) >= 0;
	}
	Add(e) {
		this.eventTree.insert(e);
	}
	MarkStaleSite(e) {
		this.staleSites.push(e);
	}
	RemoveStaleSites() {
		let e = this.staleSites.length;
		if (e > 0) {
			for (let t = 0; t < e; t++) this.RemoveExact(this.staleSites[t]);
			this.staleSites = [];
		}
	}
	RemoveSitesForFlatBottom(e, t) {
		for (let n = this.FindFirstInRange(e, t); n != null; n = this.FindNextInRange(n, t)) this.MarkStaleSite(n.item);
		this.RemoveStaleSites();
	}
	Find(e) {
		return this.FindFirstInRange(e, e);
	}
	RemoveExact(e) {
		let t = this.eventTree.find(e);
		return t != null && t.item.Site === e.Site ? (this.eventTree.deleteNodeInternal(t), !0) : !1;
	}
	FindFirstInRange(e, t) {
		this.findFirstPoint = e;
		let n = this.eventTree.findFirst(this.findFirstPred);
		return n != null && this.Compare(n.item.Site, t) <= 0 ? n : null;
	}
	CompareToFindFirstPoint(e) {
		return this.Compare(e, this.findFirstPoint);
	}
	FindNextInRange(e, t) {
		let n = this.eventTree.next(e);
		return n != null && this.Compare(n.item.Site, t) <= 0 ? n : null;
	}
	CompareBB(e, t) {
		return this.scanDirection.CompareScanCoord(e.Site, t.Site);
	}
	Compare(e, t) {
		return this.scanDirection.CompareScanCoord(e, t);
	}
}, xi = class extends fi {
	constructor(e, t) {
		super(e, t);
	}
}, Si = class extends fi {
	constructor(e, t) {
		super(e, t);
	}
}, Ci = class extends fi {
	constructor(e, t) {
		super(e, t);
	}
}, wi = class extends gi {
	constructor(e, t, n) {
		super(e.ReflectingObstacle, t.obstacle, n), this.Side = t;
	}
}, Ti = class {
	get LowNeighborSide() {
		return this.LowNeighbor == null ? null : this.LowNeighbor.item;
	}
	get HighNeighborSide() {
		return this.HighNeighbor == null ? null : this.HighNeighbor.item;
	}
	Clear() {
		this.LowNeighbor = null, this.LowOverlapEnd = null, this.GroupSideInterveningBeforeLowNeighbor = null, this.HighNeighbor = null, this.HighOverlapEnd = null, this.GroupSideInterveningBeforeHighNeighbor = null;
	}
	SetSides(e, t, n, r) {
		if (J.IsAscending(e)) {
			this.HighNeighbor = t, this.HighOverlapEnd = n, this.GroupSideInterveningBeforeHighNeighbor = r;
			return;
		}
		this.LowNeighbor = t, this.LowOverlapEnd = n, this.GroupSideInterveningBeforeLowNeighbor = r;
	}
}, Ei = class e {
	has(e) {
		return this.hasxy(e.x, e.y);
	}
	remove(e) {
		if (!(e.x < 0 || e.x >= this.arrayOfSets.length)) return this.arrayOfSets[e.x].delete(e.y);
	}
	hasxy(e, t) {
		if (e < 0 || e >= this.arrayOfSets.length) return !1;
		let n = this.arrayOfSets[e];
		return n !== void 0 && n.has(t);
	}
	constructor() {
		this.arrayOfSets = [];
	}
	static mk(t) {
		let n = new e();
		for (let e of t) n.add(e);
		return n;
	}
	*values() {
		for (let e = 0; e < this.arrayOfSets.length; e++) {
			let t = this.arrayOfSets[e];
			if (t) for (let n of t.values()) yield new V(e, n);
		}
	}
	add(e) {
		let t = this.arrayOfSets[e.x];
		t ?? (this.arrayOfSets[e.x] = t = /* @__PURE__ */ new Set()), t.add(e.y);
	}
	addNN(e, t) {
		let n = this.arrayOfSets[e];
		n ?? (this.arrayOfSets[e] = n = /* @__PURE__ */ new Set()), n.add(t);
	}
	clear() {
		for (let e of this.arrayOfSets) e && e.clear();
	}
}, Di = class {
	constructor(e, t) {
		this.Polyline = e, this.Obstacles = Array.from(t), this.PrimaryObstacle = this.Obstacles[0], oi.RoundVerticesAndSimplify(this.Polyline);
	}
}, Oi = class e {
	static MungeClosestIntersectionInfo(t, n, r) {
		let i = n.seg1.boundingBox, a = y.RoundPoint(n.x).clone();
		return r ? new y(e.MungeIntersect(t.x, a.x, i.left, i.right), a.y) : new y(a.x, e.MungeIntersect(t.y, a.y, i.bottom, i.top));
	}
	static MungeIntersect(e, t, n, r) {
		if (e < t) {
			let e = Math.min(n, r);
			t < e && (t = e);
		} else if (e > t) {
			let e = Math.max(n, r);
			t > e && (t = e);
		}
		return y.RoundDouble(t);
	}
}, ki = class e {
	constructor() {
		this.CurrentGroupBoundaryCrossingMap = new vi(), this.overlapPairs = new Ei(), this.hasOverlaps = !1, this.lookupIntPair = new V(-1, -1);
	}
	get GraphBox() {
		return this.Root.irect;
	}
	Init(e, t, n) {
		this.CreateObstacleListAndOrdinals(e), this.AncestorSets = t, this.CreateRoot(), this.shapeIdToObstacleMap = n;
	}
	CreateObstacleListAndOrdinals(e) {
		this.allObstacles = Array.from(e);
		let t = oi.FirstNonSentinelOrdinal;
		for (let e of this.allObstacles) e.Ordinal = t++;
	}
	OrdinalToObstacle(e) {
		return this.allObstacles[e - oi.FirstNonSentinelOrdinal];
	}
	CreateRoot() {
		this.Root = e.CalculateHierarchy(this.GetAllObstacles()), this.OverlapsExist() && (this.AccreteClumps(), this.AccreteConvexHulls(), this.GrowGroupsToAccommodateOverlaps(), this.Root = e.CalculateHierarchy(this.GetAllObstacles().filter((e) => e.IsPrimaryObstacle)));
	}
	OverlapsExist() {
		return this.Root == null ? !1 : (G(this.Root, this.Root, (e, t) => this.CheckForInitialOverlaps(e, t)), this.hasOverlaps);
	}
	OverlapPairAlreadyFound(e, t) {
		return this.lookupIntPair.x = t.Ordinal, this.lookupIntPair.y = e.Ordinal, this.overlapPairs.has(this.lookupIntPair);
	}
	CheckForInitialOverlaps(t, n) {
		if (this.hasOverlaps) return;
		let r = {
			bIsInsideA: !1,
			aIsInsideB: !1
		};
		if (e.ObstaclesIntersect(t, n, r)) {
			this.hasOverlaps = !0;
			return;
		}
		!r.aIsInsideB && !r.bIsInsideA || t.IsGroup && n.IsGroup || t.IsGroup && r.bIsInsideA || n.IsGroup && r.aIsInsideB || (this.hasOverlaps = !0);
	}
	AccreteClumps() {
		this.AccumulateObstaclesForClumps(), this.CreateClumps();
	}
	AccreteConvexHulls() {
		for (;;) if (this.AccumulateObstaclesForConvexHulls(), !this.CreateConvexHulls()) return;
	}
	static CalculateHierarchy(e) {
		return F(Array.from(e).map((e) => I(e, e.VisibilityBoundingBox)));
	}
	AccumulateObstaclesForClumps() {
		this.overlapPairs.clear();
		let t = e.CalculateHierarchy(this.GetAllObstacles().filter((e) => !e.IsGroup && e.IsRectangle));
		t != null && un(t, t, (e, t) => this.EvaluateOverlappedPairForClump(e, t));
	}
	EvaluateOverlappedPairForClump(t, n) {
		if (t === n || this.OverlapPairAlreadyFound(t, n)) return;
		let r = {
			bIsInsideA: !1,
			aIsInsideB: !1
		};
		!e.ObstaclesIntersect(t, n, r) && !r.aIsInsideB && !r.bIsInsideA || this.overlapPairs.add(new V(t.Ordinal, n.Ordinal));
	}
	AccumulateObstaclesForConvexHulls() {
		this.overlapPairs.clear();
		let t = e.CalculateHierarchy(this.GetAllObstacles().filter((e) => e.IsPrimaryObstacle && !e.IsGroup));
		t != null && un(t, t, (e, t) => this.EvaluateOverlappedPairForConvexHull(e, t));
	}
	EvaluateOverlappedPairForConvexHull(t, n) {
		if (t === n || this.OverlapPairAlreadyFound(t, n)) return;
		let r = {
			bIsInsideA: !1,
			aIsInsideB: !1
		};
		!e.ObstaclesIntersect(t, n, r) && !r.aIsInsideB && !r.bIsInsideA || !t.IsInConvexHull && !n.IsInConvexHull && t.IsRectangle && n.IsRectangle || (this.overlapPairs.add(new V(t.Ordinal, n.Ordinal)), this.AddClumpToConvexHull(t), this.AddClumpToConvexHull(n), this.AddConvexHullToConvexHull(t), this.AddConvexHullToConvexHull(n));
	}
	GrowGroupsToAccommodateOverlaps() {
		for (;;) if (this.AccumulateObstaclesForGroupOverlaps(), !this.GrowGroupsToResolveOverlaps()) return;
	}
	AccumulateObstaclesForGroupOverlaps() {
		let t = e.CalculateHierarchy(this.GetAllObstacles().filter((e) => e.IsGroup)), n = e.CalculateHierarchy(this.GetAllObstacles().filter((e) => e.IsPrimaryObstacle));
		t == null || n == null || un(t, n, (e, t) => this.EvaluateOverlappedPairForGroup(e, t));
	}
	EvaluateOverlappedPairForGroup(t, n) {
		if (t === n || this.OverlapPairAlreadyFound(t, n)) return;
		let r = {
			bIsInsideA: !1,
			aIsInsideB: !1
		}, i = e.ObstaclesIntersect(t, n, r);
		if (!(!i && !r.aIsInsideB && !r.bIsInsideA)) {
			if (t.IsRectangle && n.IsRectangle) {
				n.IsGroup || (r.aIsInsideB || e.FirstRectangleContainsACornerOfTheOther(n.VisibilityBoundingBox, t.VisibilityBoundingBox)) && (n.OverlapsGroupCorner = !0);
				return;
			}
			!i && (n.IsGroup || r.bIsInsideA) || this.overlapPairs.add(new V(t.Ordinal, n.Ordinal));
		}
	}
	static FirstRectangleContainsACornerOfTheOther(e, t) {
		return e.contains(t.leftBottom) || e.contains(t.leftTop) || e.contains(t.rightTop) || e.contains(t.rightBottom);
	}
	static FirstPolylineStartIsInsideSecondPolyline(e, t) {
		return E.PointRelativeToCurveLocation(e.start, t) !== T.Outside;
	}
	AddClumpToConvexHull(e) {
		if (e.isOverlapped) {
			for (let t of e.clump.filter((t) => t.Ordinal !== e.Ordinal)) this.overlapPairs.add(new V(e.Ordinal, t.Ordinal));
			e.clump = [];
		}
	}
	AddConvexHullToConvexHull(e) {
		if (e.IsInConvexHull) {
			for (let t of e.ConvexHull.Obstacles.filter((t) => t.Ordinal !== e.Ordinal)) this.overlapPairs.add(new V(e.Ordinal, t.Ordinal));
			e.ConvexHull.Obstacles = [];
		}
	}
	CreateClumps() {
		let e = Sn(Tn(Array.from(this.overlapPairs.values())));
		for (let t of e) {
			if (t.length === 1) continue;
			let e = t.map((e) => this.OrdinalToObstacle(e));
			for (let t of e) t.clump = e;
		}
	}
	CreateConvexHulls() {
		let e = !1, t = Sn(Tn(Array.from(this.overlapPairs.values())));
		for (let n of t) {
			if (n.length === 1) continue;
			e = !0;
			let t = n.map(this.OrdinalToObstacle), r = Le(t, (e) => e.VisibilityPolyline), i = new Di(cn.createConvexHullAsClosedPolyline(r), t);
			for (let e of t) e.SetConvexHull(i);
		}
		return e;
	}
	GrowGroupsToResolveOverlaps() {
		let t = !1;
		for (let n of this.overlapPairs.values()) {
			t = !0;
			let r = this.OrdinalToObstacle(n.x), i = this.OrdinalToObstacle(n.y);
			e.ResolveGroupAndGroupOverlap(r, i) || e.ResolveGroupAndObstacleOverlap(r, i);
		}
		return this.overlapPairs.clear(), t;
	}
	static ResolveGroupAndGroupOverlap(t, n) {
		return n.IsGroup ? (t.VisibilityPolyline.boundingBox.area > n.VisibilityPolyline.boundingBox.area ? e.ResolveGroupAndObstacleOverlap(t, n) : e.ResolveGroupAndObstacleOverlap(n, t), !0) : !1;
	}
	static ResolveGroupAndObstacleOverlap(t, n) {
		let r = n.looseVisibilityPolyline;
		e.GrowGroupAroundLoosePolyline(t, r);
		let i = {
			bIsInsideA: !1,
			aIsInsideB: !1
		};
		for (; e.ObstaclesIntersect(n, t, i) || !i.aIsInsideB;) r = oi.CreateLoosePolyline(r), e.GrowGroupAroundLoosePolyline(t, r);
	}
	static GrowGroupAroundLoosePolyline(e, t) {
		let n = Array.from(e.VisibilityPolyline).concat(Array.from(t));
		e.SetConvexHull(new Di(cn.createConvexHullAsClosedPolyline(n), [e]));
	}
	static ObstaclesIntersect(t, n, r) {
		return E.CurvesIntersect(t.VisibilityPolyline, n.VisibilityPolyline) ? (r.aIsInsideB = !1, r.bIsInsideA = !1, !0) : (r.aIsInsideB = e.FirstPolylineStartIsInsideSecondPolyline(t.VisibilityPolyline, n.VisibilityPolyline), r.bIsInsideA = !r.aIsInsideB && e.FirstPolylineStartIsInsideSecondPolyline(n.VisibilityPolyline, t.VisibilityPolyline), t.IsRectangle && n.IsRectangle ? !1 : e.ObstaclesAreCloseEnoughToBeConsideredTouching(t, n, r.aIsInsideB, r.bIsInsideA) ? (r.aIsInsideB = !1, r.bIsInsideA = !1, !0) : !1);
	}
	static ObstaclesAreCloseEnoughToBeConsideredTouching(e, t, n, r) {
		if (!n && !r) return E.CurvesIntersect(e.looseVisibilityPolyline, t.VisibilityPolyline);
		let i = n ? e.looseVisibilityPolyline : t.looseVisibilityPolyline, a = n ? t.VisibilityPolyline : e.VisibilityPolyline;
		for (let e of i) if (E.PointRelativeToCurveLocation(e, a) === T.Outside) {
			let t = E.ClosestPoint(a, e);
			if (!y.closeIntersections(e, t)) return !0;
		}
		return !1;
	}
	AdjustSpatialAncestors() {
		if (this.SpatialAncestorsAdjusted) return !1;
		for (let e of this.GetAllGroups()) {
			let t = e.VisibilityBoundingBox;
			for (let n of this.Root.GetNodeItemsIntersectingRectangle(t)) if (n !== e && E.ClosedCurveInteriorsIntersect(n.VisibilityPolyline, e.VisibilityPolyline)) {
				if (n.IsInConvexHull) for (let t of n.ConvexHull.Obstacles) this.AncestorSets.get(t.InputShape).add(e.InputShape);
				this.AncestorSets.get(n.InputShape).add(e.InputShape);
			}
		}
		let e = [];
		for (let t of this.Root.GetAllLeaves()) {
			let n = t.VisibilityBoundingBox;
			e = e.concat(Array.from(this.AncestorSets.get(t.InputShape)).filter((e) => !n.intersects(this.shapeIdToObstacleMap.get(e).VisibilityBoundingBox)));
			for (let n of e) this.AncestorSets.get(t.InputShape).delete(n);
			e = [];
		}
		return this.SpatialAncestorsAdjusted = !0, !0;
	}
	GetAllGroups() {
		return this.GetAllObstacles().filter((e) => e.IsGroup);
	}
	Clear() {
		this.Root = null, this.AncestorSets = null;
	}
	CreateMaxVisibilitySegment(e, t, n) {
		let r = J.RectangleBorderIntersect(this.GraphBox, e, t);
		if (j.GetDirections(e, r) === A.None) return n.pacList = null, S.mkPP(e, e);
		let i = this.RestrictSegmentWithObstacles(e, r);
		return n.pacList = this.CurrentGroupBoundaryCrossingMap.GetOrderedListBetween(i.start, i.end), i;
	}
	GetAllObstacles() {
		return this.allObstacles;
	}
	GetAllPrimaryObstacles() {
		return this.Root.GetAllLeaves();
	}
	IntersectionIsInsideAnotherObstacle(e, t, n, r) {
		return this.insideHitTestIgnoreObstacle1 = t, this.insideHitTestIgnoreObstacle2 = e, this.insideHitTestScanDirection = r, this.Root.FirstHitNodeWithPredicate(n, this.InsideObstacleHitTest.bind(this)) != null;
	}
	PointIsInsideAnObstaclePD(e, t) {
		return this.PointIsInsideAnObstacle(e, Y.GetInstance(t));
	}
	PointIsInsideAnObstacle(e, t) {
		return this.insideHitTestIgnoreObstacle1 = null, this.insideHitTestIgnoreObstacle2 = null, this.insideHitTestScanDirection = t, this.Root.FirstHitNodeWithPredicate(e, this.InsideObstacleHitTest.bind(this)) != null;
	}
	InsideObstacleHitTest(e, t) {
		if (t === this.insideHitTestIgnoreObstacle1 || t === this.insideHitTestIgnoreObstacle2 || t.IsGroup || !J.PointIsInRectangleInterior(e, t.VisibilityBoundingBox)) return P.Continue;
		let n = J.RectangleBorderIntersect(t.VisibilityBoundingBox, e, this.insideHitTestScanDirection.dir).add(this.insideHitTestScanDirection.DirectionAsPoint), r = J.RectangleBorderIntersect(t.VisibilityBoundingBox, e, this.insideHitTestScanDirection.OppositeDirection).sub(this.insideHitTestScanDirection.DirectionAsPoint), i = S.mkPP(r, n), a = E.getAllIntersections(i, t.VisibilityPolyline, !0);
		if (a.length === 2) {
			let t = y.RoundPoint(a[0].x), n = y.RoundPoint(a[1].x);
			if (!j.EqualPP(e, t) && !j.EqualPP(e, n) && e.compareTo(t) !== e.compareTo(n) && !m(Math.floor(a[0].par1), Math.floor(a[1].par1))) return P.Stop;
		}
		return P.Continue;
	}
	SegmentCrossesAnObstacle(e, t) {
		this.stopAtGroups = !0, this.wantGroupCrossings = !1;
		let n = this.RestrictSegmentPrivate(e, t);
		return !j.EqualPP(n.end, t);
	}
	SegmentCrossesANonGroupObstacle(e, t) {
		this.stopAtGroups = !1, this.wantGroupCrossings = !1;
		let n = this.RestrictSegmentPrivate(e, t);
		return !j.EqualPP(n.end, t);
	}
	RestrictSegmentWithObstacles(e, t) {
		return this.stopAtGroups = !1, this.wantGroupCrossings = !0, this.RestrictSegmentPrivate(e, t);
	}
	RestrictSegmentPrivate(e, t) {
		return this.GetRestrictedIntersectionTestSegment(e, t), this.currentRestrictedRay = S.mkPP(e, t), this.restrictedRayLengthSquared = e.sub(t).lengthSquared, this.CurrentGroupBoundaryCrossingMap.Clear(), this.RecurseRestrictRayWithObstacles(this.Root), this.currentRestrictedRay;
	}
	GetRestrictedIntersectionTestSegment(e, t) {
		let n = j.GetDirections(e, t), r = A.West === n ? this.GraphBox.right : A.East === n ? this.GraphBox.left : e.x, i = A.West === n ? this.GraphBox.left : A.East === n ? this.GraphBox.right : t.x, a = A.South === n ? this.GraphBox.top * 2 : A.North === n ? this.GraphBox.bottom : e.y, o = A.South === n ? this.GraphBox.bottom : A.North === n ? this.GraphBox.top : e.y;
		this.restrictedIntersectionTestSegment = S.mkPP(new y(r, a), new y(i, o));
	}
	RecurseRestrictRayWithObstacles(e) {
		if (!J.RectangleInteriorsIntersect(this.currentRestrictedRay.boundingBox, e.irect)) return;
		let t = e.UserData;
		if (t != null) {
			let e = E.getAllIntersections(this.restrictedIntersectionTestSegment, t.VisibilityPolyline, !0);
			if (!t.IsGroup || this.stopAtGroups) {
				this.LookForCloserNonGroupIntersectionToRestrictRay(e);
				return;
			}
			this.wantGroupCrossings && this.AddGroupIntersectionsToRestrictedRay(t, e);
			return;
		}
		this.RecurseRestrictRayWithObstacles(e.Left), this.RecurseRestrictRayWithObstacles(e.Right);
	}
	LookForCloserNonGroupIntersectionToRestrictRay(e) {
		let t = 0, n = null, r = this.restrictedRayLengthSquared, i = j.GetDirections(this.restrictedIntersectionTestSegment.start, this.restrictedIntersectionTestSegment.end);
		for (let a of e) {
			let e = y.RoundPoint(a.x), o = j.GetDirections(this.currentRestrictedRay.start, e);
			if (o === M.OppositeDir(i)) continue;
			if (t++, A.None === o) {
				r = 0, n = a;
				continue;
			}
			let s = e.sub(this.currentRestrictedRay.start).lengthSquared;
			if (s < r) {
				if (a.x.sub(this.currentRestrictedRay.start).lengthSquared < u.squareOfDistanceEpsilon) continue;
				r = s, n = a;
			}
		}
		if (n != null) {
			if (t === 1) {
				let e = y.RoundPoint(n.x);
				if (y.closeIntersections(e, this.currentRestrictedRay.start) || y.closeIntersections(e, this.currentRestrictedRay.end)) return;
			}
			this.restrictedRayLengthSquared = r, this.currentRestrictedRay.end = Oi.MungeClosestIntersectionInfo(this.currentRestrictedRay.start, n, !J.IsVerticalPP(this.currentRestrictedRay.start, this.currentRestrictedRay.end));
		}
	}
	AddGroupIntersectionsToRestrictedRay(e, t) {
		for (let n of t) {
			let t = y.RoundPoint(n.x);
			if (t.sub(this.currentRestrictedRay.start).lengthSquared > this.restrictedRayLengthSquared) continue;
			let r = j.GetDirections(this.currentRestrictedRay.start, this.currentRestrictedRay.end), i = n.seg1, a = M.VectorDirection(i.derivative(n.par1)), o = r;
			(a & M.RotateRight(r)) !== 0 && (o = M.OppositeDir(o)), this.CurrentGroupBoundaryCrossingMap.AddIntersection(t, e, o);
		}
	}
}, Ai = class {
	constructor(e, t) {
		this.scanDirection = e, this.SideTree = new Ct((e, t) => this.Compare(e, t)), this.linePositionAtLastInsertOrRemove = t;
	}
	Insert(e, t) {
		return this.linePositionAtLastInsertOrRemove = t, this.SideTree.insert(e);
	}
	get Count() {
		return this.SideTree.count;
	}
	Remove(e, t) {
		this.linePositionAtLastInsertOrRemove = t, this.SideTree.remove(e);
	}
	Find(e) {
		return this.scanDirection.ComparePerpCoord(this.linePositionAtLastInsertOrRemove, e.Start) === -1 ? null : this.SideTree.find(e);
	}
	NextLowB(e) {
		return this.NextLowR(this.Find(e));
	}
	NextLowR(e) {
		return this.SideTree.previous(e);
	}
	NextHighB(e) {
		return this.NextHighR(this.Find(e));
	}
	NextHighR(e) {
		return this.SideTree.next(e);
	}
	Next(e, t) {
		return J.IsAscending(e) ? this.SideTree.next(t) : this.SideTree.previous(t);
	}
	Lowest() {
		return this.SideTree.treeMinimum();
	}
	Compare(e, t) {
		if (e.Obstacle === t.Obstacle) return e === t ? 0 : e instanceof ii ? -1 : 1;
		let n = Ni.ScanLineIntersectSidePBS(this.linePositionAtLastInsertOrRemove, e, this.scanDirection), r = Ni.ScanLineIntersectSidePBS(this.linePositionAtLastInsertOrRemove, t, this.scanDirection), i = n.compareTo(r);
		return i === 0 && (i = d(e instanceof ii, t instanceof ii), i === 0 && (i = f(e.Obstacle.Ordinal, t.Obstacle.Ordinal))), i;
	}
}, ji = class {
	constructor(e) {
		this.lookupSegment = X.mk(new y(0, 0), new y(0, 1)), this.ScanDirection = e, this.segmentTree = new Ct((e, t) => this.Compare(e, t)), this.findIntersectorPred = (e) => this.CompareIntersector(e), this.findPointPred = (e) => this.CompareToPoint(e);
	}
	get Segments() {
		return this.segmentTree.allNodes();
	}
	InsertUnique(e) {
		return this.AssertValidSegmentForInsertion(e), this.segmentTree.find(e) ?? this.segmentTree.insert(e);
	}
	AssertValidSegmentForInsertion(e) {}
	Remove(e) {
		this.segmentTree.remove(e);
	}
	Find(e, t) {
		this.lookupSegment.Update(e, t);
		let n = this.segmentTree.find(this.lookupSegment);
		return n != null && j.EqualPP(n.item.End, t) ? n.item : null;
	}
	FindLowestIntersector(e, t) {
		let n = this.FindLowestIntersectorNode(e, t);
		return n == null ? null : n.item;
	}
	FindLowestIntersectorNode(e, t) {
		this.lookupSegment.Update(e, e);
		let n = this.segmentTree.findLast(this.findIntersectorPred);
		if (j.EqualPP(e, t)) n != null && this.ScanDirection.Compare(n.item.End, e) < 0 && (n = null);
		else for (this.lookupSegment.Update(e, t); n != null && !n.item.IntersectsSegment(this.lookupSegment);) {
			if (this.ScanDirection.Compare(n.item.Start, t) > 0) return null;
			n = this.segmentTree.next(n);
		}
		return n;
	}
	FindHighestIntersector(e, t) {
		this.lookupSegment.Update(t, t);
		let n = this.segmentTree.findLast(this.findIntersectorPred);
		if (j.EqualPP(e, t)) n != null && this.ScanDirection.Compare(n.item.End, e) < 0 && (n = null);
		else for (this.lookupSegment.Update(e, t); n != null && !n.item.IntersectsSegment(this.lookupSegment);) {
			if (this.ScanDirection.Compare(n.item.End, e) < 0) return null;
			n = this.segmentTree.previous(n);
		}
		return n == null ? null : n.item;
	}
	CompareIntersector(e) {
		return this.ScanDirection.Compare(e.Start, this.lookupSegment.Start) <= 0;
	}
	FindSegmentContainingPoint(e, t) {
		return this.FindSegmentOverlappingPoints(e, e, t);
	}
	FindSegmentOverlappingPoints(e, t, n) {
		this.lookupSegment.Update(e, t);
		let r = this.segmentTree.findFirst(this.findPointPred);
		if (r != null) {
			let e = r.item;
			if (this.ScanDirection.Compare(e.Start, t) <= 0) return e;
		}
		return null;
	}
	CompareToPoint(e) {
		return this.ScanDirection.Compare(e.End, this.lookupSegment.Start) >= 0;
	}
	MergeAndRemoveNextNode(e, t) {
		return this.ScanDirection.Compare(e.End, t.item.End) === -1 && e.Update(e.Start, t.item.End), e.MergeGroupBoundaryCrossingList(t.item.GroupBoundaryPointAndCrossingsList), this.segmentTree.deleteNodeInternal(t), this.segmentTree.find(e);
	}
	MergeSegments() {
		if (this.segmentTree.count < 2) return;
		let e = this.segmentTree.treeMinimum(), t = this.segmentTree.next(e);
		for (; t != null; t = this.segmentTree.next(e)) switch (this.ScanDirection.Compare(t.item.Start, e.item.End)) {
			case 1:
				e = t;
				break;
			case 0:
				t.item.IsOverlapped === e.item.IsOverlapped ? e = this.MergeAndRemoveNextNode(e.item, t) : (e.item.NeedEndOverlapVertex = !0, t.item.NeedStartOverlapVertex = !0, e = t);
				break;
			default:
				if (e.item.IsOverlapped !== t.item.IsOverlapped) {
					if (e.item.IsOverlapped) e.item.Start === t.item.Start ? e = this.MergeAndRemoveNextNode(t.item, e) : (e.item.Update(e.item.Start, t.item.Start), e = t);
					else if (e.item.End === t.item.End) e = this.MergeAndRemoveNextNode(e.item, t);
					else {
						let n = t.item, r = e.item;
						this.segmentTree.deleteNodeInternal(t), n.Update(r.End, n.End), this.segmentTree.insert(n), n.TrimGroupBoundaryCrossingList(), e = this.segmentTree.find(r);
					}
					break;
				}
				e = this.MergeAndRemoveNextNode(e.item, t);
				break;
		}
	}
	Compare(e, t) {
		if (e === t) return 0;
		if (e == null) return -1;
		if (t == null) return 1;
		let n = this.ScanDirection.Compare(e.Start, t.Start);
		return n === 0 && (n = this.ScanDirection.Compare(e.End, t.End) * -1), n;
	}
}, Mi = class extends Ft {
	constructor(e) {
		super(e);
	}
	SetVertexEntry(e) {
		this.VertexEntries ??= [
			,
			,
			,
			,
		], this.VertexEntries[M.ToIndex(e.Direction)] = e;
	}
	RemoveVertexEntries() {
		this.VertexEntries = null;
	}
}, Ni = class e {
	constructor(e) {
		this.ObstacleTree = new ki(), this.CurrentGroupBoundaryCrossingMap = new vi(), this.LowNeighborSides = new Ti(), this.HighNeighborSides = new Ti(), this.ScanDirection = Y.HorizontalInstance, this.eventQueue = new _i(), this.HorizontalScanSegments = new ji(Y.HorizontalInstance), this.VerticalScanSegments = new ji(Y.VerticalInstance), this.wantReflections = e;
	}
	get ParallelScanSegments() {
		return this.ScanDirection.IsHorizontal ? this.HorizontalScanSegments : this.VerticalScanSegments;
	}
	get PerpendicularScanSegments() {
		return this.ScanDirection.IsHorizontal ? this.VerticalScanSegments : this.HorizontalScanSegments;
	}
	static NewVisibilityGraph() {
		let e = new W();
		return e.VertexFactory = (e) => new Mi(e), e;
	}
	GenerateVisibilityGraph() {
		if (this.ObstacleTree.Root == null) return;
		this.InitializeEventQueue(Y.HorizontalInstance);
		let t = oi.FirstSentinelOrdinal, n = new y(this.ObstacleTree.GraphBox.left - e.SentinelOffset, this.ObstacleTree.GraphBox.bottom - e.SentinelOffset), r = new y(this.ObstacleTree.GraphBox.left - e.SentinelOffset, this.ObstacleTree.GraphBox.top + e.SentinelOffset), i = oi.CreateSentinel(n, r, this.ScanDirection, t++);
		this.scanLine.Insert(i.ActiveHighSide, this.ObstacleTree.GraphBox.leftBottom), n = new y(this.ObstacleTree.GraphBox.right + e.SentinelOffset, this.ObstacleTree.GraphBox.bottom - e.SentinelOffset), r = new y(this.ObstacleTree.GraphBox.right + e.SentinelOffset, this.ObstacleTree.GraphBox.top + e.SentinelOffset), i = oi.CreateSentinel(n, r, this.ScanDirection, t++), this.scanLine.Insert(i.ActiveLowSide, this.ObstacleTree.GraphBox.leftBottom), this.ProcessEvents(), this.InitializeEventQueue(Y.VerticalInstance), n = new y(this.ObstacleTree.GraphBox.left - e.SentinelOffset, this.ObstacleTree.GraphBox.bottom - e.SentinelOffset), r = new y(this.ObstacleTree.GraphBox.right + e.SentinelOffset, this.ObstacleTree.GraphBox.bottom - e.SentinelOffset), i = oi.CreateSentinel(n, r, this.ScanDirection, t++), this.scanLine.Insert(i.ActiveHighSide, this.ObstacleTree.GraphBox.leftBottom), n = new y(this.ObstacleTree.GraphBox.left - e.SentinelOffset, this.ObstacleTree.GraphBox.top + e.SentinelOffset), r = new y(this.ObstacleTree.GraphBox.right + e.SentinelOffset, this.ObstacleTree.GraphBox.top + e.SentinelOffset), i = oi.CreateSentinel(n, r, this.ScanDirection, t), this.scanLine.Insert(i.ActiveLowSide, this.ObstacleTree.GraphBox.leftBottom), this.ProcessEvents();
	}
	static ScanLineIntersectSidePBS(e, t, n) {
		let r = t.Direction, i = t.Start.x, a = t.Start.y;
		return n.IsHorizontal ? (i += r.x / r.y * (e.y - t.Start.y), i = Oi.MungeIntersect(e.x, i, t.Start.x, t.End.x), a = e.y) : (i = e.x, a += r.y / r.x * (e.x - t.Start.x), a = Oi.MungeIntersect(e.y, a, t.Start.y, t.End.y)), new y(i, a);
	}
	GetOpenVertex(e) {
		let t = e.startPoint, n = this.TraversePolylineForEvents(t), r = this.PointCompare(n.point, t.point);
		for (;; n = this.TraversePolylineForEvents(n)) {
			let e = this.PointCompare(n.point, t.point);
			if (e <= 0) t = n;
			else if (e > 0 && r <= 0) break;
			r = e;
		}
		return t;
	}
	TraversePolylineForEvents(e) {
		return this.ScanDirection.IsHorizontal ? e.nextOnPolyline : e.prevOnPolyline;
	}
	InitializeEventQueue(e) {
		this.ScanDirection = e, this.eventQueue.Reset(this.ScanDirection), this.EnqueueBottomVertexEvents(), this.scanLine = new Ai(this.ScanDirection, this.ObstacleTree.GraphBox.leftBottom), this.lookaheadScan = new bi(this.ScanDirection);
	}
	EnqueueBottomVertexEvents() {
		for (let e of this.ObstacleTree.GetAllPrimaryObstacles()) {
			let t = this.GetOpenVertex(e.VisibilityPolyline);
			this.eventQueue.Enqueue(new pi(e, t));
		}
	}
	IsFlat(e) {
		return this.ScanDirection.IsFlatS(e);
	}
	IsPerpendicular(e) {
		return this.ScanDirection.IsPerpendicularS(e);
	}
	ScanLineIntersectSide(t, n) {
		return e.ScanLineIntersectSidePBS(t, n, this.ScanDirection);
	}
	SideReflectsUpward(e) {
		return e instanceof ii ? this.ScanDirection.Coord(e.End) > this.ScanDirection.Coord(e.Start) : this.ScanDirection.Coord(e.End) < this.ScanDirection.Coord(e.Start);
	}
	SideReflectsDownward(e) {
		return e instanceof ii ? this.ScanDirection.Coord(e.End) < this.ScanDirection.Coord(e.Start) : this.ScanDirection.Coord(e.End) > this.ScanDirection.Coord(e.Start);
	}
	StoreLookaheadSite(e, t, n, r) {
		if (this.wantReflections && !this.IsPerpendicular(t)) {
			if (!r && !J.PointIsInRectangleInterior(n, t.Obstacle.VisibilityBoundingBox)) return;
			this.SideReflectsUpward(t) && (this.lookaheadScan.Find(n) ?? this.lookaheadScan.Add(new gi(e, t.Obstacle, n)));
		}
	}
	LoadReflectionEvents(e) {
		this.LoadReflectionEventsBB(e, e);
	}
	LoadReflectionEventsBB(t, n) {
		if (t == null || this.SideReflectsUpward(t) || this.IsPerpendicular(t)) return;
		let r = O.mkPP(t.Start, t.End), i = O.mkPP(n.Start, n.End);
		if (this.ScanDirection.IsHorizontal ? !r.intersectsOnX(i) : !r.intersectsOnY(i)) return;
		let a = O.intersect(r, i), o = a.leftBottom, s = a.rightTop, c = this.lookaheadScan.FindFirstInRange(o, s);
		for (; c != null;) {
			let n = e.ScanLineIntersectSidePBS(c.item.Site, t, this.ScanDirection.PerpendicularInstance);
			this.ScanDirection.ComparePerpCoord(n, c.item.Site) > 0 ? this.AddReflectionEvent(c.item, t, n) : c.item.ReflectingObstacle !== t.Obstacle && this.lookaheadScan.MarkStaleSite(c.item), c = this.lookaheadScan.FindNextInRange(c, s);
		}
		this.lookaheadScan.RemoveStaleSites();
	}
	AddPerpendicularReflectionSegment(e, t, n) {
		if (this.lookaheadScan.RemoveExact(e.PreviousSite)) {
			if (t == null) return !1;
			if (e.PreviousSite.IsStaircaseStep(e.ReflectingObstacle)) {
				if (!J.PointIsInRectangleInterior(e.Site, e.ReflectingObstacle.VisibilityBoundingBox) || !this.InsertPerpendicularReflectionSegment(e.PreviousSite.Site, e.Site)) return !1;
				if (n != null && e.IsStaircaseStep(n.Obstacle)) return this.ScanLineCrossesObstacle(e.Site, n.Obstacle);
			}
		}
		return !1;
	}
	AddParallelReflectionSegment(e, t, n, r) {
		{
			let i = this.ScanLineIntersectSide(r.Site, t ?? n), a = t == null ? r.Site : i, o = t == null ? i : r.Site;
			return t == null ? t = this.scanLine.NextLowB(n).item : n = this.scanLine.NextHighB(t).item, this.InsertParallelReflectionSegment(a, o, e, t, n, r);
		}
	}
	AddReflectionEvent(e, t, n) {
		let r = t;
		r == null ? this.eventQueue.Enqueue(new yi(e, t, n)) : this.eventQueue.Enqueue(new wi(e, r, n));
	}
	AddSideToScanLine(e, t) {
		let n = this.scanLine.Insert(e, t);
		return this.LoadReflectionEvents(e), n;
	}
	RemoveSideFromScanLine(e, t) {
		this.scanLine.Remove(e.item, t);
	}
	PointCompare(e, t) {
		return this.ScanDirection.Compare(e, t);
	}
	Clear() {
		this.ObstacleTree.Clear(), this.eventQueue = new _i(), this.HorizontalScanSegments = new ji(Y.HorizontalInstance), this.VerticalScanSegments = new ji(Y.VerticalInstance), this.VisibilityGraph = null;
	}
	ProcessEvents() {
		for (; this.eventQueue.Count > 0;) {
			let e = this.eventQueue.Dequeue();
			e instanceof pi ? this.ProcessEventO(e) : e instanceof xi ? this.ProcessEventLB(e) : e instanceof Si ? this.ProcessEventHB(e) : e instanceof Ci ? this.ProcessEventCV(e) : e instanceof wi ? this.ProcessEventLR(e) : e instanceof yi ? this.ProcessEventHR(e) : this.ProcessCustomEvent(e), this.LowNeighborSides.Clear(), this.HighNeighborSides.Clear();
		}
	}
	ProcessCustomEvent(e) {}
	ScanLineCrossesObstacle(e, t) {
		return this.ScanDirection.ComparePerpCoord(e, t.VisibilityBoundingBox.leftBottom) > 0 && this.ScanDirection.ComparePerpCoord(e, t.VisibilityBoundingBox.rightTop) < 0;
	}
	FindInitialNeighborSides(e, t) {
		t.lowNborSideNode = this.scanLine.NextLowR(e), t.highNborSideNode = this.scanLine.NextHighR(e);
	}
	FindNeighborsBRR(e, t, n) {
		this.LowNeighborSides.Clear(), this.HighNeighborSides.Clear(), this.FindNeighbors(e, t, this.LowNeighborSides), this.FindNeighbors(e, n, this.HighNeighborSides);
	}
	FindNeighbors(e, t, n) {
		let r = e instanceof pi ? t.item.Start : t.item.End, i = {
			lowNborSideNode: null,
			highNborSideNode: null
		};
		this.FindInitialNeighborSides(t, i), this.SkipToNeighbor(this.ScanDirection.OppositeDirection, t.item, r, i.lowNborSideNode, n), this.SkipToNeighbor(this.ScanDirection.Dir, t.item, r, i.highNborSideNode, n);
	}
	SkipToNeighbor(e, t, n, r, i) {
		let a = null, o = null;
		for (;; r = this.scanLine.Next(e, r)) if (r.item.Obstacle !== t.Obstacle) {
			if (r.item.Obstacle.IsGroup) {
				this.ProcessGroupSideEncounteredOnTraversalToNeighbor(r, n, e) && (o ??= r.item);
				continue;
			}
			if (r.item instanceof ai === J.IsAscending(e)) {
				this.ScanLineCrossesObstacle(n, r.item.Obstacle) && (a = r, o = null);
				continue;
			}
			break;
		}
		i.SetSides(e, r, a, o);
	}
	ProcessGroupSideEncounteredOnTraversalToNeighbor(e, t, n) {
		if (!this.ScanLineCrossesObstacle(t, e.item.Obstacle)) return !1;
		let r = e.item instanceof ii === J.IsAscending(n) ? n : M.OppositeDir(n), i = this.ScanLineIntersectSide(t, e.item);
		return this.CurrentGroupBoundaryCrossingMap.AddIntersection(i, e.item.Obstacle, r), !0;
	}
	FindNeighborsAndProcessVertexEvent(e, t, n) {
		this.CurrentGroupBoundaryCrossingMap.Clear(), this.FindNeighborsBRR(n, e, t), this.ProcessVertexEvent(e, t, n), this.CurrentGroupBoundaryCrossingMap.Clear();
	}
	ProcessEventO(e) {
		let t = e.Obstacle;
		t.CreateInitialSides(e.Vertex, this.ScanDirection), this.AddSideToScanLine(t.ActiveLowSide, e.Site);
		let n = this.AddSideToScanLine(t.ActiveHighSide, e.Site), r = this.scanLine.Find(t.ActiveLowSide);
		this.FindNeighborsAndProcessVertexEvent(r, n, e);
		let i = this.LowNeighborSides.GroupSideInterveningBeforeLowNeighbor ?? this.LowNeighborSides.LowNeighborSide;
		this.SideReflectsUpward(i) && this.LoadReflectionEvents(t.ActiveLowSide);
		let a = this.HighNeighborSides.GroupSideInterveningBeforeHighNeighbor ?? this.HighNeighborSides.HighNeighborSide;
		if (this.SideReflectsUpward(a) && this.LoadReflectionEvents(t.ActiveHighSide), t.ActiveHighSide.Start !== t.ActiveLowSide.Start) {
			let n = new ai(t, e.Vertex, this.ScanDirection);
			this.lookaheadScan.RemoveSitesForFlatBottom(n.Start, n.End);
		}
		this.EnqueueLowBendVertexEvent(t.ActiveLowSide), this.EnqueueHighBendOrCloseVertexEvent(t.ActiveHighSide);
	}
	ProcessEventLB(e) {
		let t = e.Obstacle, n = new ii(t, e.Vertex, this.ScanDirection);
		this.ScanDirection.ComparePerpCoord(n.End, n.Start) > 0 && (this.RemoveSideFromScanLine(this.scanLine.Find(t.ActiveLowSide), e.Site), this.AddSideToScanLine(n, e.Site), t.ActiveLowSide = n, this.EnqueueLowBendVertexEvent(n));
	}
	EnqueueLowBendVertexEvent(e) {
		this.eventQueue.Enqueue(new xi(e.Obstacle, e.EndVertex));
	}
	ProcessEventHB(e) {
		let t = e.Obstacle, n = new ai(t, e.Vertex, this.ScanDirection);
		this.RemoveSideFromScanLine(this.scanLine.Find(t.ActiveHighSide), e.Site);
		let r = this.AddSideToScanLine(n, e.Site);
		if (t.ActiveHighSide = n, this.EnqueueHighBendOrCloseVertexEvent(t.ActiveHighSide), this.wantReflections && this.ScanDirection.IsHorizontal && n.Start.x === t.VisibilityBoundingBox.right && this.SideReflectsUpward(n)) {
			let e = this.scanLine.NextHighR(r);
			e.item instanceof ii && this.SideReflectsDownward(e.item) && (!t.isOverlapped || !this.ObstacleTree.PointIsInsideAnObstacle(n.Start, this.ScanDirection)) && (this.StoreLookaheadSite(e.item.Obstacle, n, n.Start, !0), this.LoadReflectionEvents(e.item));
		}
	}
	EnqueueHighBendOrCloseVertexEvent(e) {
		let t = e.Obstacle, n = this.ScanDirection.IsHorizontal ? e.EndVertex.prevOnPolyline : e.EndVertex.nextOnPolyline;
		this.ScanDirection.ComparePerpCoord(n.point, e.End) > 0 ? this.eventQueue.Enqueue(new Si(t, e.EndVertex)) : this.eventQueue.Enqueue(new Ci(t, e.EndVertex));
	}
	CreateCloseEventSegmentsAndFindNeighbors(e) {
		let t = e.Obstacle, n = this.scanLine.Find(t.ActiveLowSide), r = this.scanLine.Find(t.ActiveHighSide);
		if (this.scanLine.Compare(t.ActiveLowSide, t.ActiveHighSide) === 1) {
			let e = n;
			n = r, r = e;
		}
		if (this.FindNeighborsAndProcessVertexEvent(n, r, e), this.wantReflections && t.isOverlapped) for (let e = this.scanLine.NextHighR(n); e.item !== r.item; e = this.scanLine.NextHighR(e)) this.LoadReflectionEvents(e.item);
		this.scanLine.Remove(t.ActiveLowSide, e.Site), this.scanLine.Remove(t.ActiveHighSide, e.Site);
	}
	ProcessEventCV(e) {
		this.CreateCloseEventSegmentsAndFindNeighbors(e);
		let t = this.LowNeighborSides.LowNeighbor.item, n = this.HighNeighborSides.HighNeighbor.item, r = e.Obstacle;
		this.LoadReflectionEvents(t), this.LoadReflectionEvents(n), r.Close();
	}
	ProcessEventLR(e) {
		let t = e.Side.Obstacle, n = this.scanLine.NextLowB(e.Side).item;
		this.AddPerpendicularReflectionSegment(e, e.Side, n) && this.AddParallelReflectionSegment(t, n, null, e) && this.LoadReflectionEvents(t.ActiveLowSide);
	}
	ProcessEventHR(e) {
		let t = e.Side.Obstacle, n = this.scanLine.NextHighB(e.Side).item;
		this.AddPerpendicularReflectionSegment(e, e.Side, n) && this.AddParallelReflectionSegment(t, null, n, e) && this.LoadReflectionEvents(t.ActiveHighSide);
	}
	MakeInBoundsLocation(e) {
		let t = Math.max(e.x, this.ObstacleTree.GraphBox.left), n = Math.max(e.y, this.ObstacleTree.GraphBox.bottom);
		return new y(Math.min(t, this.ObstacleTree.GraphBox.right), Math.min(n, this.ObstacleTree.GraphBox.top));
	}
	IsInBoundsV(e) {
		return this.IsInBoundsP(e.point);
	}
	IsInBoundsP(e) {
		return j.EqualPP(e, this.MakeInBoundsLocation(e));
	}
};
Ni.SentinelOffset = 1;
//#endregion
//#region node_modules/@msagl/core/dist/routing/rectilinear/SparseVisibiltyGraphGenerator.js
var Pi = class e extends Ni {
	constructor() {
		super(!1), this.horizontalVertexPoints = new R(), this.verticalVertexPoints = new R(), this.boundingBoxSteinerPoints = new R(), this.xCoordAccumulator = /* @__PURE__ */ new Set(), this.yCoordAccumulator = /* @__PURE__ */ new Set(), this.horizontalCoordMap = /* @__PURE__ */ new Map(), this.verticalCoordMap = /* @__PURE__ */ new Map();
	}
	Clear() {
		super.Clear(), this.Cleanup();
	}
	Cleanup() {
		this.horizontalVertexPoints.clear(), this.verticalVertexPoints.clear(), this.boundingBoxSteinerPoints.clear(), this.xCoordAccumulator.clear(), this.yCoordAccumulator.clear(), this.horizontalCoordMap.clear(), this.verticalCoordMap.clear();
	}
	GenerateVisibilityGraph() {
		this.AccumulateVertexCoords(), this.CreateSegmentVectorsAndPopulateCoordinateMaps(), this.RunScanLineToCreateSegmentsAndBoundingBoxSteinerPoints(), this.GenerateSparseIntersectionsFromVertexPoints(), this.CreateScanSegmentTrees(), this.Cleanup();
	}
	AccumulateVertexCoords() {
		for (let e of this.ObstacleTree.GetAllObstacles()) this.xCoordAccumulator.add(e.VisibilityBoundingBox.left), this.xCoordAccumulator.add(e.VisibilityBoundingBox.right), this.yCoordAccumulator.add(e.VisibilityBoundingBox.top), this.yCoordAccumulator.add(e.VisibilityBoundingBox.bottom);
	}
	CreateSegmentVectorsAndPopulateCoordinateMaps() {
		this.horizontalScanSegmentVector = new hi(this.yCoordAccumulator, !0), this.verticalScanSegmentVector = new hi(this.xCoordAccumulator, !1);
		for (let e = 0; e < this.horizontalScanSegmentVector.Length; e++) this.horizontalCoordMap.set(this.horizontalScanSegmentVector.Item(e).Coord, e);
		for (let e = 0; e < this.verticalScanSegmentVector.Length; e++) this.verticalCoordMap.set(this.verticalScanSegmentVector.Item(e).Coord, e);
	}
	RunScanLineToCreateSegmentsAndBoundingBoxSteinerPoints() {
		super.GenerateVisibilityGraph(), this.horizontalScanSegmentVector.ScanSegmentsComplete(), this.verticalScanSegmentVector.ScanSegmentsComplete(), this.xCoordAccumulator.clear(), this.yCoordAccumulator.clear();
	}
	InitializeEventQueue(e) {
		super.InitializeEventQueue(e), this.SetVectorsAndCoordMaps(e), this.AddAxisCoordinateEvents(e);
	}
	AddAxisCoordinateEvents(t) {
		if (t.IsHorizontal) {
			for (let t of this.yCoordAccumulator) this.eventQueue.Enqueue(new di(new y(this.ObstacleTree.GraphBox.left - e.SentinelOffset, t)));
			return;
		}
		for (let t of this.xCoordAccumulator) this.eventQueue.Enqueue(new di(new y(t, this.ObstacleTree.GraphBox.bottom - e.SentinelOffset)));
	}
	ProcessCustomEvent(e) {
		this.ProcessAxisCoordinate(e) || this.ProcessCustomEvent(e);
	}
	ProcessAxisCoordinate(e) {
		return e instanceof di ? (this.CreateScanSegmentsOnAxisCoordinate(e.Site), !0) : !1;
	}
	InsertPerpendicularReflectionSegment(e, t) {
		return !1;
	}
	InsertParallelReflectionSegment(e, t, n, r, i, a) {
		return !1;
	}
	ProcessVertexEvent(t, n, r) {
		let i = this.ScanDirection.IsHorizontal ? this.horizontalVertexPoints : this.verticalVertexPoints;
		i.add(r.Site);
		let a = this.LowNeighborSides.LowNeighbor.item, o = this.HighNeighborSides.HighNeighbor.item, s = this.ScanDirection.Dir, c = this.ScanDirection.OppositeDirection, l = this.ScanLineIntersectSide(r.Site, a), u = this.ScanLineIntersectSide(r.Site, o);
		if (this.ObstacleTree.GraphBox.contains(l)) {
			let e = J.RectangleBorderIntersect(a.Obstacle.VisibilityBoundingBox, l, s);
			j.IsPureLower(e, r.Site) && this.boundingBoxSteinerPoints.add(e);
		}
		if (this.ObstacleTree.GraphBox.contains(u)) {
			let e = J.RectangleBorderIntersect(o.Obstacle.VisibilityBoundingBox, u, c);
			j.IsPureLower(r.Site, e) && this.boundingBoxSteinerPoints.add(e);
		}
		let d = {
			lowCorner: void 0,
			highCorner: void 0
		};
		e.GetBoundingCorners(t.item.Obstacle.VisibilityBoundingBox, r instanceof pi, this.ScanDirection.IsHorizontal, d), (j.IsPureLower(l, d.lowCorner) || a.Obstacle.IsInSameClump(r.Obstacle)) && i.add(d.lowCorner), (j.IsPureLower(d.highCorner, u) || o.Obstacle.IsInSameClump(r.Obstacle)) && i.add(d.highCorner);
	}
	static GetBoundingCorners(e, t, n, r) {
		if (t) {
			r.lowCorner = e.leftBottom, r.highCorner = n ? e.rightBottom : e.leftTop;
			return;
		}
		r.lowCorner = n ? e.leftTop : e.rightBottom, r.highCorner = e.rightTop;
	}
	CreateScanSegmentsOnAxisCoordinate(t) {
		this.CurrentGroupBoundaryCrossingMap.Clear();
		let n = this.scanLine.Lowest(), r = this.scanLine.NextHighR(n), i = 0, a = t, o = !1;
		for (; r != null; r = this.scanLine.NextHighR(r)) if (!this.SkipSide(a, r.item)) {
			if (r.item.Obstacle.IsGroup) {
				(i === 0 || o) && this.HandleGroupCrossing(t, r.item);
				continue;
			}
			if (r.item instanceof ii) {
				if (i > 0) {
					i++;
					continue;
				}
				a = this.CreateScanSegment(a, r.item, X.NormalWeight), this.CurrentGroupBoundaryCrossingMap.Clear(), i = 1, o = r.item.Obstacle.isOverlapped;
				continue;
			}
			i++, !(i > 0) && (a = r.item.Obstacle.isOverlapped || r.item.Obstacle.OverlapsGroupCorner ? this.CreateScanSegment(a, r.item, X.OverlappedWeight) : this.ScanLineIntersectSide(a, r.item), this.CurrentGroupBoundaryCrossingMap.Clear(), o = !1);
		}
		let s = this.ScanDirection.IsHorizontal ? new y(this.ObstacleTree.GraphBox.right + e.SentinelOffset, a.y) : new y(a.x, this.ObstacleTree.GraphBox.top + e.SentinelOffset);
		this.parallelSegmentVector.CreateScanSegment(a, s, X.NormalWeight, this.CurrentGroupBoundaryCrossingMap.GetOrderedListBetween(a, s)), this.parallelSegmentVector.ScanSegmentsCompleteForCurrentSlot();
	}
	HandleGroupCrossing(e, t) {
		if (!this.ScanLineCrossesObstacle(e, t.Obstacle)) return;
		let n = t instanceof ii ? this.ScanDirection.Dir : this.ScanDirection.OppositeDirection, r = this.ScanLineIntersectSide(e, t), i = this.CurrentGroupBoundaryCrossingMap.AddIntersection(r, t.Obstacle, n);
		this.AddPerpendicularCoordForGroupCrossing(r);
		let a = i.GetInteriorVertexPoint(r);
		this.AddPerpendicularCoordForGroupCrossing(a);
	}
	AddPerpendicularCoordForGroupCrossing(e) {
		let t = this.FindPerpendicularSlot(e, 0);
		t !== -1 && this.perpendicularSegmentVector.Item(t).AddPendingPerpendicularCoord(this.parallelSegmentVector.CurrentSlot.Coord);
	}
	SkipSide(e, t) {
		if (t.Obstacle.IsSentinel) return !0;
		let n = t.Obstacle.VisibilityBoundingBox;
		return this.ScanDirection.IsHorizontal ? e.y === n.bottom || e.y === n.top : e.x === n.left || e.x === n.right;
	}
	CreateScanSegment(e, t, n) {
		let r = this.ScanLineIntersectSide(e, t);
		return e !== r && this.parallelSegmentVector.CreateScanSegment(e, r, n, this.CurrentGroupBoundaryCrossingMap.GetOrderedListBetween(e, r)), r;
	}
	GenerateSparseIntersectionsFromVertexPoints() {
		this.VisibilityGraph = e.NewVisibilityGraph(), this.GenerateSparseIntersectionsAlongHorizontalAxis(), this.GenerateSparseIntersectionsAlongVerticalAxis(), this.ConnectAdjoiningScanSegments(), this.horizontalScanSegmentVector.CreateSparseVerticesAndEdges(this.VisibilityGraph), this.verticalScanSegmentVector.CreateSparseVerticesAndEdges(this.VisibilityGraph);
	}
	GenerateSparseIntersectionsAlongHorizontalAxis() {
		this.currentAxisPointComparer = p;
		let e = Array.from(this.horizontalVertexPoints.values()).sort(this.currentAxisPointComparer), t = Array.from(this.boundingBoxSteinerPoints.values()).sort(this.currentAxisPointComparer);
		this.ScanDirection = Y.HorizontalInstance, this.SetVectorsAndCoordMaps(this.ScanDirection), this.GenerateSparseIntersections(e, t);
	}
	GenerateSparseIntersectionsAlongVerticalAxis() {
		this.currentAxisPointComparer = (e, t) => e.compareTo(t);
		let e = Array.from(this.verticalVertexPoints.values()).sort(this.currentAxisPointComparer), t = Array.from(this.boundingBoxSteinerPoints.values()).sort(this.currentAxisPointComparer);
		this.ScanDirection = Y.VerticalInstance, this.SetVectorsAndCoordMaps(this.ScanDirection), this.GenerateSparseIntersections(e, t);
	}
	SetVectorsAndCoordMaps(e) {
		e.IsHorizontal ? (this.parallelSegmentVector = this.horizontalScanSegmentVector, this.perpendicularSegmentVector = this.verticalScanSegmentVector, this.perpendicularCoordMap = this.verticalCoordMap) : (this.parallelSegmentVector = this.verticalScanSegmentVector, this.perpendicularSegmentVector = this.horizontalScanSegmentVector, this.perpendicularCoordMap = this.horizontalCoordMap);
	}
	ConnectAdjoiningScanSegments() {
		this.horizontalScanSegmentVector.ConnectAdjoiningSegmentEndpoints(), this.verticalScanSegmentVector.ConnectAdjoiningSegmentEndpoints();
	}
	GenerateSparseIntersections(e, t) {
		this.perpendicularSegmentVector.ResetForIntersections(), this.parallelSegmentVector.ResetForIntersections();
		let n = 1, r = { j: 0 };
		for (let i of this.parallelSegmentVector.Items()) for (; !(!i.CurrentSegment.ContainsPoint(e[n]) && (!this.AddSteinerPointsToInterveningSegments(e[n], t, r, i) || !i.TraverseToSegmentContainingPoint(e[n])));) {
			if (this.AddPointsToCurrentSegmentIntersections(t, r, i), this.GenerateIntersectionsFromVertexPointForCurrentSegment(e[n], i), i.PointIsCurrentEndAndNextStart(e[n])) {
				i.MoveNext();
				continue;
			}
			if (++n >= e.length) return;
		}
	}
	AddSteinerPointsToInterveningSegments(e, t, n, r) {
		for (; n.j < t.length && this.currentAxisPointComparer(t[n.j], e) === -1;) {
			if (!r.TraverseToSegmentContainingPoint(t[n.j])) return !1;
			this.AddPointsToCurrentSegmentIntersections(t, n, r);
		}
		return !0;
	}
	AddPointsToCurrentSegmentIntersections(e, t, n) {
		for (; t.j < e.length && n.CurrentSegment.ContainsPoint(e[t.j]); t.j++) {
			let r = this.FindPerpendicularSlot(e[t.j], 0);
			this.AddSlotToSegmentIntersections(n, r);
		}
	}
	GenerateIntersectionsFromVertexPointForCurrentSegment(e, t) {
		let n = this.FindPerpendicularSlot(t.CurrentSegment.Start, 1), r = this.FindPerpendicularSlot(t.CurrentSegment.End, -1), i = this.FindPerpendicularSlot(e, 0);
		n >= r || (this.AddSlotToSegmentIntersections(t, n), this.AddSlotToSegmentIntersections(t, r), i > n && i < r && (this.AddSlotToSegmentIntersections(t, i), this.AddBinaryDivisionSlotsToSegmentIntersections(t, n, i, r)));
	}
	FindPerpendicularSlot(t, n) {
		return e.FindIntersectingSlot(this.perpendicularSegmentVector, this.perpendicularCoordMap, t, n);
	}
	static FindIntersectingSlot(e, t, n, r) {
		let i = e.GetParallelCoord(n), a = t.get(i);
		return a === void 0 ? r === 0 ? -1 : e.FindNearest(i, r) : a;
	}
	AddSlotToSegmentIntersections(e, t) {
		let n = this.perpendicularSegmentVector.Item(t);
		e.CurrentSegment.AddSparseVertexCoord(n.Coord), n.AddPerpendicularCoord(e.Coord);
	}
	AddBinaryDivisionSlotsToSegmentIntersections(e, t, n, r) {
		let i = 0, a = this.perpendicularSegmentVector.Length - 1;
		for (; a - i > 1;) {
			let o = i + Math.floor((a - i) / 2);
			if (n <= o) {
				a = o, n < a && a <= r && this.AddSlotToSegmentIntersections(e, a);
				continue;
			}
			i = o, n > i && i >= t && this.AddSlotToSegmentIntersections(e, i);
		}
	}
	CreateScanSegmentTrees() {
		e.CreateScanSegmentTree(this.horizontalScanSegmentVector, this.HorizontalScanSegments), e.CreateScanSegmentTree(this.verticalScanSegmentVector, this.VerticalScanSegments);
	}
	static CreateScanSegmentTree(e, t) {
		for (let n of e.Items()) for (let e = n.FirstSegment; e != null; e = e.NextSegment) e.HasVisibility() && t.InsertUnique(e);
	}
}, Fi = class e {
	get ObstacleTree() {
		return this.GraphGenerator.ObstacleTree;
	}
	get VisGraph() {
		return this.GraphGenerator.VisibilityGraph;
	}
	get IsSparseVg() {
		return this.GraphGenerator instanceof Pi;
	}
	constructor(e) {
		this.AddedVertices = [], this.AddedEdges = [], this.edgesToRestore = [], this.LimitPortVisibilitySpliceToEndpointBoundingBox = !1, this.GraphGenerator = e;
	}
	AddVertex(e) {
		let t = this.VisGraph.AddVertexP(e);
		return this.AddedVertices.push(t), t;
	}
	FindOrAddVertex(e) {
		return this.VisGraph.FindVertex(e) ?? this.AddVertex(e);
	}
	FindOrAddEdgeVV(e, t) {
		return this.FindOrAddEdge(e, t, X.NormalWeight);
	}
	FindOrAddEdge(t, n, r) {
		let i = j.GetPureDirectionVV(t, n), a = {
			bracketSource: void 0,
			bracketTarget: void 0,
			splitVertex: void 0
		};
		e.GetBrackets(t, n, i, a);
		let o = this.VisGraph.FindEdgePP(a.bracketSource.point, a.bracketTarget.point);
		return o = o == null ? this.CreateEdge(a.bracketSource, a.bracketTarget, r) : this.SplitEdge(o, a.splitVertex), o;
	}
	static GetBrackets(t, n, r, i) {
		if (i.splitVertex = n, !e.FindBracketingVertices(t, n.point, r, i)) {
			let a = {
				bracketSource: null,
				bracketTarget: null
			};
			e.FindBracketingVertices(n, t.point, M.OppositeDir(r), a) && (i.bracketSource = a.bracketTarget, i.splitVertex = t), i.bracketTarget = a.bracketSource;
		}
	}
	static FindBracketingVertices(e, t, n, r) {
		for (r.bracketSource = e; r.bracketTarget = J.FindAdjacentVertex(r.bracketSource, n), r.bracketTarget != null;) {
			if (y.closeDistEps(r.bracketTarget.point, t)) return !0;
			if (n !== j.GetDirections(r.bracketTarget.point, t)) break;
			r.bracketSource = r.bracketTarget;
		}
		return r.bracketTarget != null;
	}
	CreateEdge(e, t, n) {
		let r = e, i = t;
		j.IsPureLower(r.point, i.point) || (r = t, i = e);
		let a = new Mt(r, i, n);
		return W.AddEdge(a), this.AddedEdges.push(a), a;
	}
	RemoveFromGraph() {
		this.RemoveAddedVertices(), this.RemoveAddedEdges(), this.RestoreRemovedEdges();
	}
	RemoveAddedVertices() {
		for (let e of this.AddedVertices) this.VisGraph.FindVertex(e.point) != null && this.VisGraph.RemoveVertex(e);
		this.AddedVertices = [];
	}
	RemoveAddedEdges() {
		for (let e of this.AddedEdges) this.VisGraph.FindVertex(e.SourcePoint) != null && W.RemoveEdge(e);
		this.AddedEdges = [];
	}
	RestoreRemovedEdges() {
		for (let e of this.edgesToRestore) W.AddEdge(e);
		this.edgesToRestore = [];
	}
	FindNextEdge(e, t) {
		return J.FindAdjacentEdge(e, t);
	}
	FindPerpendicularOrContainingEdge(e, t, n) {
		for (;;) {
			let r = J.FindAdjacentVertex(e, t);
			if (r == null) break;
			let i = j.GetDirections(r.point, n);
			if ((M.OppositeDir(t) & i) !== 0) return this.VisGraph.FindEdgePP(e.point, r.point);
			e = r;
		}
		return null;
	}
	FindNearestPerpendicularOrContainingEdge(e, t, n) {
		t & j.GetDirections(e.point, n);
		let r = e;
		for (; A.None !== void 0;) {
			let e = J.FindAdjacentVertex(r, void 0);
			if (e == null || (M.OppositeDir(void 0) & j.GetDirections(e.point, n)) !== 0) break;
			r = e, t & j.GetDirections(r.point, n);
		}
		let i;
		for (; i = this.FindPerpendicularOrContainingEdge(r, t, n), !(i != null || r === e);) r = J.FindAdjacentVertex(r, M.OppositeDir(void 0));
		return i;
	}
	ConnectVertexToTargetVertex(e, t, n, r) {
		if (y.closeDistEps(e.point, t.point)) return;
		let i = j.GetDirections(e.point, t.point);
		if (j.IsPureDirectionD(i)) {
			this.FindOrAddEdgeVV(e, t);
			return;
		}
		let a = J.FindBendPointBetween(e.point, t.point, n), o = this.FindOrAddVertex(a);
		this.FindOrAddEdge(e, o, r), this.FindOrAddEdge(o, t, r);
	}
	AddEdgeToTargetEdge(e, t, n) {
		let r = this.VisGraph.FindVertex(n);
		return r ?? (r = this.AddVertex(n), this.SplitEdge(t, r)), this.FindOrAddEdgeVV(e, r), r;
	}
	SplitEdge(e, t) {
		return e == null ? null : y.closeDistEps(e.Source.point, t.point) || y.closeDistEps(e.Target.point, t.point) ? e : (e instanceof Mt || this.edgesToRestore.push(e), W.RemoveEdge(e), (this.IsSparseVg || e.Weight === X.OverlappedWeight) && t.Degree > 0 ? (this.FindOrAddEdge(t, e.Source, e.Weight), this.FindOrAddEdge(t, e.Target, e.Weight)) : (this.CreateEdge(t, e.Target, e.Weight), this.CreateEdge(e.Source, t, e.Weight)));
	}
	ExtendEdgeChainVRLPB(e, t, n, r, i) {
		let a = j.GetDirections(n.start, n.end);
		if (a === A.None) return;
		let o = J.GetRectangleBound(t, a), s = J.IsVerticalD(a) ? y.RoundPoint(new y(e.point.x, o)) : y.RoundPoint(new y(o, e.point.y));
		if (y.closeDistEps(s, e.point) || j.GetDirections(e.point, s) !== a) return;
		let c = n;
		j.GetDirections(s, c.end) === a && (c = S.mkPP(c.start, s)), this.ExtendEdgeChain(e, a, c, n, r, i);
	}
	ExtendEdgeChain(e, t, n, r, i, a) {
		if (j.GetDirections(e.point, n.end) !== t) return;
		let o = M.RotateLeft(t), s = J.FindAdjacentVertex(e, o);
		if (s == null && (o = M.OppositeDir(o), s = J.FindAdjacentVertex(e, o), s == null)) return;
		let c = M.OppositeDir(o), l = { spliceTarget: null };
		this.ExtendSpliceWorker(s, t, c, n, r, a, l) && this.ExtendSpliceWorker(l.spliceTarget, t, o, n, r, a, l), this.SpliceGroupBoundaryCrossings(i, e, n);
	}
	SpliceGroupBoundaryCrossings(t, n, r) {
		if (t == null || t.Count() === 0) return;
		t.Reset();
		let i = r.start, a = r.end, o = j.GetDirections(i, a);
		J.IsAscending(o) || (i = r.end, a = r.start, o = M.OppositeDir(o)), n = e.TraverseToFirstVertexAtOrAbove(n, i, M.OppositeDir(o));
		for (let e = n; e != null; e = J.FindAdjacentVertex(e, o)) {
			let r = j.ComparePP(e.point, a) >= 0;
			for (; t.CurrentIsBeforeOrAt(e.point);) {
				let r = t.Pop();
				j.ComparePP(r.Location, n.point) > 0 && j.ComparePP(r.Location, a) <= 0 && this.SpliceGroupBoundaryCrossing(e, r, M.OppositeDir(o)), j.ComparePP(r.Location, n.point) >= 0 && j.ComparePP(r.Location, a) < 0 && this.SpliceGroupBoundaryCrossing(e, r, o);
			}
			if (r) break;
		}
	}
	static TraverseToFirstVertexAtOrAbove(e, t, n) {
		let r = e, i = M.OppositeDir(n);
		for (;;) {
			let e = J.FindAdjacentVertex(r, n);
			if (e == null || j.GetDirections(e.point, t) === i) break;
			r = e;
		}
		return r;
	}
	SpliceGroupBoundaryCrossing(e, t, n) {
		let r = Xr.ToCrossingArray(t.Crossings, n);
		if (r != null) {
			let n = this.VisGraph.FindVertex(t.Location) ?? this.AddVertex(t.Location);
			e.point.equal(n.point) || this.FindOrAddEdgeVV(e, n);
			let i = r[0].GetInteriorVertexPoint(t.Location), a = this.VisGraph.FindVertex(i) ?? this.AddVertex(i), o = this.FindOrAddEdgeVV(n, a), s = r.map((e) => e.Group.InputShape);
			o.IsPassable = () => s.some((e) => e.IsTransparent);
		}
	}
	ExtendSpliceWorker(t, n, r, i, a, o, s) {
		let c = J.FindAdjacentVertex(t, r);
		s.spliceTarget = J.FindAdjacentVertex(c, r);
		let l = { spliceSource: t };
		for (; e.GetNextSpliceSource(l, r, n);) {
			let t = J.FindBendPointBetween(c.point, l.spliceSource.point, M.OppositeDir(r));
			if (e.IsPointPastSegmentEnd(a, t)) break;
			if (s.spliceTarget = e.GetSpliceTarget(l, r, t), s.spliceTarget == null) {
				if (this.IsSkippableSpliceSourceWithNullSpliceTarget(l.spliceSource, n)) continue;
				if (this.ObstacleTree.SegmentCrossesAnObstacle(l.spliceSource.point, t)) return !1;
			}
			let u = this.VisGraph.FindVertex(t);
			if (u != null) {
				if (s.spliceTarget == null || this.VisGraph.FindEdgePP(c.point, t) != null) return s.spliceTarget ?? this.FindOrAddEdge(c, u, o ? X.OverlappedWeight : X.NormalWeight), !1;
			} else u = this.AddVertex(t);
			if (this.FindOrAddEdge(c, u, o ? X.OverlappedWeight : X.NormalWeight), this.FindOrAddEdge(l.spliceSource, u, o ? X.OverlappedWeight : X.NormalWeight), o &&= this.SeeIfSpliceIsStillOverlapped(n, u), c = u, (n & j.GetDirections(t, i.end)) === 0) {
				s.spliceTarget = null;
				break;
			}
		}
		return s.spliceTarget != null;
	}
	static GetNextSpliceSource(e, t, n) {
		let r = J.FindAdjacentVertex(e.spliceSource, n);
		if (r == null) for (r = e.spliceSource;;) {
			if (r = J.FindAdjacentVertex(r, M.OppositeDir(t)), r == null) return !1;
			let e = J.FindAdjacentVertex(r, n);
			if (e != null) {
				r = e;
				break;
			}
		}
		return e.spliceSource = r, !0;
	}
	static GetSpliceTarget(e, t, n) {
		let r = j.GetDirections(e.spliceSource.point, n), i = r, a = e.spliceSource;
		for (; i === r && (e.spliceSource = a, a = J.FindAdjacentVertex(e.spliceSource, t), a != null);) {
			if (y.closeDistEps(a.point, n)) {
				a = J.FindAdjacentVertex(a, t);
				break;
			}
			i = j.GetDirections(a.point, n);
		}
		return a;
	}
	SeeIfSpliceIsStillOverlapped(e, t) {
		let n = this.FindNextEdge(t, M.RotateLeft(e)), r = n == null ? !1 : X.NormalWeight === n.Weight;
		return r ||= (n = this.FindNextEdge(t, M.RotateRight(e)), n == null ? !1 : X.NormalWeight === n.Weight), !r || this.ObstacleTree.PointIsInsideAnObstaclePD(t.point, e);
	}
	IsSkippableSpliceSourceWithNullSpliceTarget(t, n) {
		if (e.IsSkippableSpliceSourceEdgeWithNullTarget(J.FindAdjacentEdge(t, n))) return !0;
		let r = J.FindAdjacentEdge(t, M.OppositeDir(n));
		return e.IsSkippableSpliceSourceEdgeWithNullTarget(r) || e.IsReflectionEdge(r);
	}
	static IsSkippableSpliceSourceEdgeWithNullTarget(e) {
		return e != null && e.IsPassable != null && m(e.Length, ui.BoundaryWidth);
	}
	static IsReflectionEdge(e) {
		return e != null && e.Weight === X.ReflectionWeight;
	}
	static IsPointPastSegmentEnd(e, t) {
		return j.GetDirections(e.start, e.end) === j.GetDirections(e.end, t);
	}
	toString() {
		return U.String.format("{0} {1}", this.AddedVertices.length, this.edgesToRestore.length);
	}
}, Ii = class e {
	get LimitPortVisibilitySpliceToEndpointBoundingBox() {
		return this.TransUtil.LimitPortVisibilitySpliceToEndpointBoundingBox;
	}
	set LimitPortVisibilitySpliceToEndpointBoundingBox(e) {
		this.TransUtil.LimitPortVisibilitySpliceToEndpointBoundingBox = e;
	}
	get VisGraph() {
		return this.graphGenerator.VisibilityGraph;
	}
	get HScanSegments() {
		return this.graphGenerator.HorizontalScanSegments;
	}
	get VScanSegments() {
		return this.graphGenerator.VerticalScanSegments;
	}
	get ObstacleTree() {
		return this.graphGenerator.ObstacleTree;
	}
	get AncestorSets() {
		return this.ObstacleTree.AncestorSets;
	}
	constructor(e) {
		this.obstaclePortMap = /* @__PURE__ */ new Map(), this.freePointMap = new Nt(), this.freePointLocationsUsedByRouteEdges = new R(), this.RouteToCenterOfObstacles = !1, this.obstaclePortsInGraph = [], this.freePointsInGraph = /* @__PURE__ */ new Set(), this.activeAncestors = [], this.TransUtil = new Fi(e), this.graphGenerator = e;
	}
	Clear() {
		this.TransUtil.RemoveFromGraph(), this.obstaclePortMap.clear();
	}
	CreateObstaclePorts(e) {
		for (let t of e.Ports) this.CreateObstaclePort(e, t);
	}
	CreateObstaclePort(e, t) {
		if (t.Curve == null) return null;
		let n = y.RoundPoint(t.Location);
		if (T.Outside === E.PointRelativeToCurveLocation(n, e.InputShape.BoundaryCurve) || e.InputShape.BoundaryCurve !== t.Curve && T.Outside === E.PointRelativeToCurveLocation(n, t.Curve)) return null;
		let r = new ci(t, e);
		return this.obstaclePortMap.set(t, r), r;
	}
	FindVertices(e) {
		let t = [], n = this.obstaclePortMap.get(e);
		if (n) if (this.RouteToCenterOfObstacles) t.push(n.CenterVertex);
		else for (let e of n.PortEntrances) {
			let n = this.VisGraph.FindVertex(e.UnpaddedBorderIntersect);
			n != null && t.push(n);
		}
		else t.push(this.VisGraph.FindVertex(y.RoundPoint(e.Location)));
		return t;
	}
	RemoveObstaclePorts(e) {
		for (let t of e.Ports) this.RemoveObstaclePort(t);
	}
	RemoveObstaclePort(e) {
		this.obstaclePortMap.delete(e);
	}
	AddControlPointsToGraph(e, t) {
		this.GetPortSpliceLimitRectangle(e), this.activeAncestors = [];
		let n = { oport: null }, r = { oport: null }, i = this.FindAncestorsAndObstaclePort(e.sourcePort, n), a = this.FindAncestorsAndObstaclePort(e.targetPort, r);
		if (this.AncestorSets.size > 0 && n.oport != null && r.oport != null) {
			let e = ke(a, i), n = ke(i, a);
			this.ActivateAncestors(n, e, t);
		}
		this.AddPortToGraph(e.sourcePort, n.oport), this.AddPortToGraph(e.targetPort, r.oport);
	}
	ConnectOobWaypointToEndpointVisibilityAtGraphBoundary(e, t) {
		if (e == null || !e.IsOutOfBounds) return;
		let n = this.FindVertices(t), r = e.OutOfBoundsDirectionFromGraph & (A.North | A.South);
		this.ConnectToGraphAtPointsCollinearWithVertices(e, r, n), r = e.OutOfBoundsDirectionFromGraph & (A.East | A.West), this.ConnectToGraphAtPointsCollinearWithVertices(e, r, n);
	}
	ConnectToGraphAtPointsCollinearWithVertices(e, t, n) {
		if (A.None === t) return;
		let r = M.OppositeDir(t);
		for (let i of n) {
			let n = this.InBoundsGraphBoxIntersect(i.point, t), a = this.VisGraph.FindVertex(n);
			a != null && this.TransUtil.ConnectVertexToTargetVertex(e.Vertex, a, r, X.NormalWeight);
		}
	}
	SetAllAncestorsActive(e, t) {
		if (this.AncestorSets.size === 0) return !1;
		this.ObstacleTree.AdjustSpatialAncestors(), this.ClearActiveAncestors();
		let n = { oport: null }, r = this.FindAncestorsAndObstaclePort(e.sourcePort, { oport: null }), i = this.FindAncestorsAndObstaclePort(e.targetPort, n);
		return this.AncestorSets.size > 0 && r != null && i != null ? (this.ActivateAncestors(r, i, t), !0) : !1;
	}
	SetAllGroupsActive() {
		this.ClearActiveAncestors();
		for (let e of this.ObstacleTree.GetAllGroups()) e.IsTransparentAncestor = !0, this.activeAncestors.push(e);
	}
	FindAncestorsAndObstaclePort(e, t) {
		return t.oport = this.FindObstaclePort(e), this.AncestorSets.size === 0 ? null : t.oport == null ? new Set(Array.from(this.ObstacleTree.Root.AllHitItems(O.mkPP(e.Location, e.Location), (e) => e.IsGroup)).map((e) => e.InputShape)) : this.AncestorSets.get(t.oport.Obstacle.InputShape);
	}
	ActivateAncestors(e, t, n) {
		for (let r of je(e, t)) {
			let e = n.get(r);
			e.IsTransparentAncestor = !0, this.activeAncestors.push(e);
		}
	}
	ClearActiveAncestors() {
		for (let e of this.activeAncestors) e.IsTransparentAncestor = !1;
		this.activeAncestors = [];
	}
	RemoveControlPointsFromGraph() {
		this.ClearActiveAncestors(), this.RemoveObstaclePortsFromGraph(), this.RemoveFreePointsFromGraph(), this.TransUtil.RemoveFromGraph(), this.portSpliceLimitRectangle = O.mkEmpty();
	}
	RemoveObstaclePortsFromGraph() {
		for (let e of this.obstaclePortsInGraph) e.RemoveFromGraph();
		this.obstaclePortsInGraph = [];
	}
	RemoveFreePointsFromGraph() {
		for (let e of this.freePointsInGraph) e.RemoveFromGraph();
		this.freePointsInGraph.clear();
	}
	RemoveStaleFreePoints() {
		if (this.freePointMap.size > this.freePointLocationsUsedByRouteEdges.size) {
			let e = Array.from(this.freePointMap).filter((e) => !this.freePointLocationsUsedByRouteEdges.has(e[0]));
			for (let t of e) this.freePointMap.deleteP(t[0]);
		}
	}
	ClearVisibility() {
		this.freePointMap.clear();
		for (let e of this.obstaclePortMap.values()) e.ClearVisibility();
	}
	BeginRouteEdges() {
		this.RemoveControlPointsFromGraph(), this.freePointLocationsUsedByRouteEdges.clear();
	}
	EndRouteEdges() {
		this.RemoveStaleFreePoints();
	}
	FindObstaclePort(e) {
		let t = this.obstaclePortMap.get(e);
		if (t) {
			let n = {
				removedPorts: null,
				addedPorts: null
			};
			if (t.Obstacle.GetPortChanges(n)) {
				for (let e of n.addedPorts) this.CreateObstaclePort(t.Obstacle, e);
				for (let e of n.removedPorts) this.RemoveObstaclePort(e);
				t = this.obstaclePortMap.get(e);
			}
		}
		return t;
	}
	AddPortToGraph(e, t) {
		if (t != null) {
			this.AddObstaclePortToGraph(t);
			return;
		}
		this.AddFreePointToGraph(e.Location);
	}
	AddObstaclePortToGraph(e) {
		if (!(e.LocationHasChanged && (this.RemoveObstaclePort(e.Port), e = this.CreateObstaclePort(e.Obstacle, e.Port), e == null))) {
			e.AddToGraph(this.TransUtil, this.RouteToCenterOfObstacles), this.obstaclePortsInGraph.push(e), this.CreateObstaclePortEntrancesIfNeeded(e);
			for (let t of e.PortEntrances) this.AddObstaclePortEntranceToGraph(t);
		}
	}
	CreateObstaclePortEntrancesIfNeeded(e) {
		e.PortEntrances.length > 0 || this.CreateObstaclePortEntrancesFromPoints(e);
	}
	GetPortVisibilityIntersection(t) {
		let n = this.FindObstaclePort(t.sourcePort), r = this.FindObstaclePort(t.targetPort);
		if (n == null || r == null || n.Obstacle.IsInConvexHull || r.Obstacle.IsInConvexHull || (this.CreateObstaclePortEntrancesIfNeeded(n), this.CreateObstaclePortEntrancesIfNeeded(r), !n.VisibilityRectangle.intersects(r.VisibilityRectangle))) return null;
		for (let t of n.PortEntrances) if (t.WantVisibilityIntersection) for (let n of r.PortEntrances) {
			if (!n.WantVisibilityIntersection) continue;
			let r = t.IsVertical === n.IsVertical ? e.GetPathPointsFromOverlappingCollinearVisibility(t, n) : e.GetPathPointsFromIntersectingVisibility(t, n);
			if (r != null) return r;
		}
		return null;
	}
	static GetPathPointsFromOverlappingCollinearVisibility(e, t) {
		return !J.IntervalsAreSame(e.MaxVisibilitySegment.start, e.MaxVisibilitySegment.end, t.MaxVisibilitySegment.end, t.MaxVisibilitySegment.start) || e.HasGroupCrossings || t.HasGroupCrossings || y.closeDistEps(e.UnpaddedBorderIntersect, t.UnpaddedBorderIntersect) ? null : [e.UnpaddedBorderIntersect, t.UnpaddedBorderIntersect];
	}
	static GetPathPointsFromIntersectingVisibility(e, t) {
		let n = J.SegmentsIntersectLL(e.MaxVisibilitySegment, t.MaxVisibilitySegment);
		return !n || e.HasGroupCrossingBeforePoint(n) || t.HasGroupCrossingBeforePoint(n) ? null : [
			e.UnpaddedBorderIntersect,
			n,
			t.UnpaddedBorderIntersect
		];
	}
	CreateObstaclePortEntrancesFromPoints(e) {
		let t = this.graphGenerator.ObstacleTree.GraphBox, n = O.mkPP(y.RoundPoint(e.PortCurve.boundingBox.leftBottom), y.RoundPoint(e.PortCurve.boundingBox.rightTop)), r = y.RoundPoint(e.PortLocation), i = !1, a = {
			xx0: null,
			xx1: null
		};
		if (!j.Equal(r.y, n.top) && !j.Equal(r.y, n.bottom)) {
			i = !0;
			let o = new S(t.left, r.y, t.right, r.y);
			this.GetBorderIntersections(r, o, e.PortCurve, a);
			let s = new y(Math.min(a.xx0.x, a.xx1.x), r.y);
			s.x < n.left && (s = new y(n.left, s.y));
			let c = new y(Math.max(a.xx0.x, a.xx1.x), r.y);
			c.x > n.right && (c = new y(n.right, c.y)), this.CreatePortEntrancesAtBorderIntersections(n, e, r, s, c);
		}
		if (!j.Equal(r.x, n.left) && !j.Equal(r.x, n.right)) {
			i = !0;
			let o = new S(r.x, t.bottom, r.x, t.top);
			this.GetBorderIntersections(r, o, e.PortCurve, a);
			let s = new y(r.x, Math.min(a.xx0.y, a.xx1.y));
			s.y < t.bottom && (s = new y(s.x, t.bottom));
			let c = new y(r.x, Math.max(a.xx0.y, a.xx1.y));
			c.y > t.top && (c = new y(c.x, t.top)), this.CreatePortEntrancesAtBorderIntersections(n, e, r, s, c);
		}
		i || this.CreateEntrancesForCornerPort(n, e, r);
	}
	GetBorderIntersections(e, t, n, r) {
		let i = E.getAllIntersections(t, n, !0);
		r.xx0 = y.RoundPoint(i[0].x), r.xx1 = y.RoundPoint(i[1].x);
	}
	CreatePortEntrancesAtBorderIntersections(e, t, n, r, i) {
		let a = j.GetDirections(r, i);
		j.EqualPP(r, n) || this.CreatePortEntrance(e, t, i, a), j.EqualPP(i, n) || this.CreatePortEntrance(e, t, r, M.OppositeDir(a));
	}
	static GetDerivative(e, t) {
		let n = e.PortCurve.closestParameter(t), r = e.PortCurve.derivative(n), i = (e.PortCurve.parStart + e.PortCurve.parEnd) / 2;
		return Nn.CurveIsClockwise(e.PortCurve, e.PortCurve.value(i)) || (r = r.mul(-1)), r;
	}
	CreatePortEntrance(t, n, r, i) {
		n.CreatePortEntrance(r, i, this.ObstacleTree);
		let a = Y.GetInstance(i), o = J.GetRectangleBound(t, i) - a.Coord(r);
		if (o < 0 && (o = -o), o > u.intersectionEpsilon) {
			let t = M.VectorDirection(e.GetDerivative(n, r)), a;
			i | M.OppositeDir(i), A.None !== (i & t) && (a = M.OppositeDir(a)), n.CreatePortEntrance(r, a, this.ObstacleTree);
		}
	}
	CreateEntrancesForCornerPort(e, t, n) {
		let r = A.North;
		j.EqualPP(n, e.leftBottom) ? r = A.South : j.EqualPP(n, e.leftTop) ? r = A.West : j.EqualPP(n, e.rightTop) ? r = A.North : j.EqualPP(n, e.rightBottom) && (r = A.East), t.CreatePortEntrance(n, r, this.ObstacleTree), t.CreatePortEntrance(n, M.RotateRight(r), this.ObstacleTree);
	}
	AddObstaclePortEntranceToGraph(e) {
		let t = this.VisGraph.FindVertex(e.VisibilityBorderIntersect);
		if (t) {
			e.ExtendEdgeChain(this.TransUtil, t, t, this.portSpliceLimitRectangle, this.RouteToCenterOfObstacles);
			return;
		}
		let n = { targetVertex: null }, r = e.IsOverlapped ? X.OverlappedWeight : X.NormalWeight;
		this.FindorCreateNearestPerpEdgePPDNT(e.MaxVisibilitySegment.end, e.VisibilityBorderIntersect, e.OutwardDirection, r, n) != null && e.AddToAdjacentVertex(this.TransUtil, n.targetVertex, this.portSpliceLimitRectangle, this.RouteToCenterOfObstacles);
	}
	InBoundsGraphBoxIntersect(e, t) {
		return J.RectangleBorderIntersect(this.graphGenerator.ObstacleTree.GraphBox, e, t);
	}
	FindorCreateNearestPerpEdgePPDN(e, t, n, r) {
		return this.FindorCreateNearestPerpEdgePPDNT(e, t, n, r, { targetVertex: null });
	}
	FindorCreateNearestPerpEdgePPDNT(e, t, n, r, i) {
		let a = J.SortAscending(e, t), o = a[0], s = a[1], c = J.IsVerticalD(n) ? this.HScanSegments : this.VScanSegments, l = J.IsAscending(n) ? c.FindLowestIntersector(o, s) : c.FindHighestIntersector(o, s);
		if (l == null) return i.targetVertex = null, null;
		let u = J.SegmentIntersectionSP(l, o);
		return this.FindOrCreateNearestPerpEdgeFromNearestPerpSegment(J.IsAscending(n) ? o : s, l, u, r, i);
	}
	FindOrCreateNearestPerpEdgeFromNearestPerpSegment(e, t, n, r, i) {
		let a = {
			segsegVertex: this.VisGraph.FindVertex(n),
			targetVertex: null
		};
		if (a.segsegVertex == null) {
			let i = this.FindOrCreateSegmentIntersectionVertexAndAssociatedEdge(e, n, t, r, a);
			if (i != null) return i;
		} else if (j.EqualPP(e, n)) return i.targetVertex = a.segsegVertex, this.TransUtil.FindNextEdge(i.targetVertex, M.OppositeDir(t.ScanDirection.Dir));
		let o = j.GetDirections(n, e), s = j.GetDirections(a.segsegVertex.point, e);
		if (o === s) {
			let t = {
				bracketTarget: null,
				bracketSource: null
			};
			return Fi.FindBracketingVertices(a.segsegVertex, e, o, t), this.TransUtil.FindNextEdge(t.bracketSource, M.RotateLeft(o)) ?? this.TransUtil.FindNextEdge(t.bracketSource, M.RotateRight(o));
		}
		s &= ~o;
		let c = this.TransUtil.FindNearestPerpendicularOrContainingEdge(a.segsegVertex, s, e);
		return c == null ? (i.targetVertex = this.TransUtil.AddVertex(n), this.TransUtil.FindOrAddEdge(i.targetVertex, t.HighestVisibilityVertex, t.Weight)) : (a.segsegVertex = J.GetEdgeEnd(c, M.OppositeDir(s)), n = J.SegmentIntersectionPPP(e, n, a.segsegVertex.point), j.EqualPP(a.segsegVertex.point, n) ? (i.targetVertex = a.segsegVertex, this.TransUtil.FindNextEdge(a.segsegVertex, s)) : (i.targetVertex = this.TransUtil.FindOrAddVertex(n), this.TransUtil.FindOrAddEdge(a.segsegVertex, i.targetVertex, r)));
	}
	FindOrCreateSegmentIntersectionVertexAndAssociatedEdge(e, t, n, r, i) {
		let a = (n.IsVertical ? this.HScanSegments : this.VScanSegments).FindHighestIntersector(n.Start, t);
		if (a == null) return i.segsegVertex = null, i.targetVertex = this.TransUtil.AddVertex(t), this.TransUtil.FindOrAddEdge(i.targetVertex, n.LowestVisibilityVertex, n.Weight);
		let o = J.SegmentsIntersection(n, a);
		if (i.segsegVertex = this.VisGraph.FindVertex(o), !i.segsegVertex) {
			i.segsegVertex = this.TransUtil.AddVertex(o);
			let e = this.AddEdgeToClosestSegmentEnd(n, i.segsegVertex, n.Weight);
			if (this.AddEdgeToClosestSegmentEnd(a, i.segsegVertex, a.Weight), j.EqualPP(i.segsegVertex.point, t)) return i.targetVertex = i.segsegVertex, e;
		}
		return j.EqualPP(e, t) ? (i.targetVertex = this.TransUtil.FindOrAddVertex(t), this.TransUtil.FindOrAddEdge(i.segsegVertex, i.targetVertex, r)) : (i.targetVertex = null, null);
	}
	AddEdgeToClosestSegmentEnd(e, t, n) {
		return j.IsPureLower(e.HighestVisibilityVertex.point, t.point) ? this.TransUtil.FindOrAddEdge(e.HighestVisibilityVertex, t, n) : j.IsPureLower(t.point, e.LowestVisibilityVertex.point) ? this.TransUtil.FindOrAddEdge(t, e.LowestVisibilityVertex, n) : this.TransUtil.FindOrAddEdgeVV(e.LowestVisibilityVertex, t);
	}
	GetPortSpliceLimitRectangle(e) {
		if (!this.LimitPortVisibilitySpliceToEndpointBoundingBox) {
			this.portSpliceLimitRectangle = this.graphGenerator.ObstacleTree.GraphBox;
			return;
		}
		this.portSpliceLimitRectangle = this.GetPortRectangle(e.sourcePort), this.portSpliceLimitRectangle.addRecSelf(this.GetPortRectangle(e.targetPort));
	}
	GetPortRectangle(e) {
		let t = this.obstaclePortMap.get(e);
		return t ? t.Obstacle.VisibilityBoundingBox.clone() : O.mkOnPoints([y.RoundPoint(e.Location)]);
	}
	AddToLimitRectangle(e) {
		this.graphGenerator.IsInBoundsP(e) && this.portSpliceLimitRectangle.add(e);
	}
	FindOrCreateFreePoint(e) {
		let t = this.freePointMap.get(e);
		return t ? t.GetVertex(this.TransUtil, e) : (t = new li(this.TransUtil, e), this.freePointMap.set(e, t)), this.freePointsInGraph.add(t), this.freePointLocationsUsedByRouteEdges.add(e), t;
	}
	AddFreePointToGraph(e) {
		e = y.RoundPoint(e);
		let t = this.VisGraph.FindVertex(e), n = this.FindOrCreateFreePoint(e);
		if (t != null) return n;
		if (!this.graphGenerator.IsInBoundsP(e)) return this.CreateOutOfBoundsFreePoint(n), n;
		n.IsOverlapped = this.ObstacleTree.PointIsInsideAnObstacle(n.Point, this.HScanSegments.ScanDirection), this.VScanSegments.FindSegmentContainingPoint(e, !0);
		let r = A.South;
		for (let e = 0; e < 4; e++) this.ConnectFreePointToLateralEdge(n, r), r = M.RotateLeft(r);
		return n;
	}
	CreateOutOfBoundsFreePoint(e) {
		let t = e.Point, n = this.graphGenerator.MakeInBoundsLocation(t), r = j.GetDirections(n, t);
		if (e.OutOfBoundsDirectionFromGraph = r, !j.IsPureDirectionD(r)) {
			e.AddOobEdgesFromGraphCorner(this.TransUtil, n);
			return;
		}
		let i = this.VisGraph.FindVertex(n), a = M.OppositeDir(r);
		if (i != null) e.AddToAdjacentVertex(this.TransUtil, i, a, this.portSpliceLimitRectangle);
		else {
			let o = this.FindorCreateNearestPerpEdgePPDN(t, n, r, X.NormalWeight);
			o != null && (i = e.AddEdgeToAdjacentEdge(this.TransUtil, o, a, this.portSpliceLimitRectangle));
		}
		let o = J.FindAdjacentVertex(i, M.RotateLeft(a));
		o != null && this.TransUtil.ConnectVertexToTargetVertex(e.Vertex, o, a, X.NormalWeight);
		let s = J.FindAdjacentVertex(i, M.RotateRight(a));
		s != null && this.TransUtil.ConnectVertexToTargetVertex(e.Vertex, s, a, X.NormalWeight);
	}
	ConnectFreePointToLateralEdge(e, t) {
		let n = e.IsOverlapped ? this.InBoundsGraphBoxIntersect(e.Point, t) : e.MaxVisibilityInDirectionForNonOverlappedFreePoint(t, this.TransUtil), r = this.FindorCreateNearestPerpEdgePPDN(n, e.Point, t, e.InitialWeight);
		r != null && e.AddEdgeToAdjacentEdge(this.TransUtil, r, t, this.portSpliceLimitRectangle);
	}
}, Li = class e extends B {
	get RouteToCenterOfObstacles() {
		return this.PortManager.RouteToCenterOfObstacles;
	}
	set RouteToCenterOfObstacles(e) {
		this.PortManager.RouteToCenterOfObstacles = e;
	}
	get LimitPortVisibilitySpliceToEndpointBoundingBox() {
		return this.PortManager.LimitPortVisibilitySpliceToEndpointBoundingBox;
	}
	set LimitPortVisibilitySpliceToEndpointBoundingBox(e) {
		this.PortManager.LimitPortVisibilitySpliceToEndpointBoundingBox = e;
	}
	AddEdgeGeometryToRoute(e) {
		y.closeDistEps(y.RoundPoint(e.sourcePort.Location), y.RoundPoint(e.targetPort.Location)) ? this.selfEdges.push(e) : this.EdgesToRoute.push(e);
	}
	get EdgeGeometriesToRoute() {
		return this.EdgesToRoute;
	}
	RemoveAllEdgeGeometriesToRoute() {
		this.EdgesToRoute = [];
	}
	get UseSparseVisibilityGraph() {
		return this.GraphGenerator instanceof Pi;
	}
	get Obstacles() {
		return Array.from(this.ShapeToObstacleMap.values()).map((e) => e.InputShape);
	}
	get PaddedObstacles() {
		return Array.from(this.ShapeToObstacleMap.values()).map((e) => e.PaddedPolyline);
	}
	AddObstacles(e) {
		this.AddShapes(e), this.RebuildTreeAndGraph();
	}
	AddShapes(e) {
		for (let t of e) this.AddObstacleWithoutRebuild(t);
	}
	AddObstacle(e) {
		this.AddObstacleWithoutRebuild(e), this.RebuildTreeAndGraph();
	}
	UpdateObstacles(e) {
		for (let t of e) this.UpdateObstacleWithoutRebuild(t);
		this.RebuildTreeAndGraph();
	}
	UpdateObstacle(e) {
		this.UpdateObstacleWithoutRebuild(e), this.RebuildTreeAndGraph();
	}
	RemoveObstacles(e) {
		for (let t of e) this.RemoveObstacleWithoutRebuild(t);
		this.RebuildTreeAndGraph();
	}
	RemoveObstacle(e) {
		this.RemoveObstacleWithoutRebuild(e), this.RebuildTreeAndGraph();
	}
	AddObstacleWithoutRebuild(e) {
		if (e.BoundaryCurve == null) throw Error("Shape must have a BoundaryCurve");
		this.CreatePaddedObstacle(e);
	}
	UpdateObstacleWithoutRebuild(e) {
		if (e.BoundaryCurve == null) throw Error("Shape must have a BoundaryCurve");
		this.PortManager.RemoveObstaclePorts(this.ShapeToObstacleMap.get(e)), this.CreatePaddedObstacle(e);
	}
	CreatePaddedObstacle(e) {
		let t = new oi(e, this.Padding);
		this.ShapeToObstacleMap.set(e, t), this.PortManager.CreateObstaclePorts(t);
	}
	RemoveObstacleWithoutRebuild(e) {
		let t = this.ShapeToObstacleMap.get(e);
		this.ShapeToObstacleMap.delete(e), this.PortManager.RemoveObstaclePorts(t);
	}
	RemoveAllObstacles() {
		this.InternalClear(!1);
	}
	RebuildTreeAndGraph() {
		let e = this.ObsTree.Root != null, t = this.GraphGenerator.VisibilityGraph != null;
		this.InternalClear(!0), e && this.GenerateObstacleTree(), t && this.GenerateVisibilityGraph();
	}
	get VisibilityGraph() {
		return this.GenerateVisibilityGraph(), this.GraphGenerator.VisibilityGraph;
	}
	Clear() {
		this.InternalClear(!1);
	}
	static constructorEmpty() {
		return e.constructorC(null);
	}
	static constructorC(t) {
		return new e([], e.DefaultPadding, e.DefaultCornerFitRadius);
	}
	static constructorI(t) {
		return new e(t, e.DefaultPadding, e.DefaultCornerFitRadius);
	}
	static constructorINN(t, n, r) {
		return new e(t, n, r);
	}
	constructor(e, t, n) {
		super(null), this.Padding = 0, this.CornerFitRadius = 0, this.edgeSeparatian = 3, this.BendPenaltyAsAPercentageOfDistance = 0, this.ShapeToObstacleMap = /* @__PURE__ */ new Map(), this.EdgesToRoute = [], this.removeStaircases = !0, this.selfEdges = [], this.Padding = t, this.CornerFitRadius = n, this.BendPenaltyAsAPercentageOfDistance = $r.DefaultBendPenaltyAsAPercentageOfDistance, this.GraphGenerator = new Pi(), this.PortManager = new Ii(this.GraphGenerator), this.AddShapes(e);
	}
	static constructorGNAN(t, n, r, i) {
		let a = new e(ir.GetShapes(t), r, i);
		if (n == null) for (let e of t.deepEdges) a.AddEdgeGeometryToRoute(e);
		else for (let e of n) a.AddEdgeGeometryToRoute(e);
		return a;
	}
	run() {
		this.GenerateVisibilityGraph(), this.GeneratePaths();
	}
	GeneratePaths() {
		let e = this.EdgesToRoute.map((e) => new ti(e));
		this.FillEdgePathsWithShortestPaths(e), this.NudgePaths(e), this.RouteSelfEdges(), this.FinaliseEdgeGeometries();
	}
	RouteSelfEdges() {
		for (let e of this.selfEdges) e.curve = be.RouteSelfEdge(e.sourcePort.Curve, Math.max(this.Padding, 2 * e.GetMaxArrowheadLength()), { smoothedPolyline: null });
	}
	FillEdgePathsWithShortestPaths(e) {
		this.PortManager.BeginRouteEdges();
		let t = new ei(this.BendPenaltyAsAPercentageOfDistance);
		for (let n of e) this.AddControlPointsAndGeneratePath(t, n);
		this.PortManager.EndRouteEdges();
	}
	AddControlPointsAndGeneratePath(e, t) {
		let n = this.PortManager.GetPortVisibilityIntersection(t.GeomEdge);
		if (n != null) {
			this.GeneratePathThroughVisibilityIntersection(t, n);
			return;
		}
		this.SpliceVisibilityAndGeneratePath(e, t);
	}
	GeneratePathThroughVisibilityIntersection(e, t) {
		e.PathPoints = t;
	}
	SpliceVisibilityAndGeneratePath(e, t) {
		this.PortManager.AddControlPointsToGraph(t.GeomEdge, this.ShapeToObstacleMap), this.GeneratePath(e, t, !1) || this.RetryPathsWithAdditionalGroupsEnabled(e, t), this.PortManager.RemoveControlPointsFromGraph();
	}
	GeneratePath(t, n, r) {
		let i = this.PortManager.FindVertices(n.GeomEdge.sourcePort), a = this.PortManager.FindVertices(n.GeomEdge.targetPort);
		return e.GetSingleStagePath(n, t, i, a, r);
	}
	static GetSingleStagePath(t, n, r, i, a) {
		return t.PathPoints = n.GetPath(r, i), a && e.EnsureNonNullPath(t), t.PathPoints != null && t.PathPoints.length > 0;
	}
	static EnsureNonNullPath(e) {
		e.PathPoints ?? (j.IsPureDirection(e.GeomEdge.sourcePort.Location, e.GeomEdge.targetPort.Location) ? e.PathPoints = [e.GeomEdge.sourcePort.Location, e.GeomEdge.targetPort.Location] : e.PathPoints = [
			e.GeomEdge.sourcePort.Location,
			new y(e.GeomEdge.sourcePort.Location.x, e.GeomEdge.targetPort.Location.y),
			e.GeomEdge.targetPort.Location
		]);
	}
	RetryPathsWithAdditionalGroupsEnabled(e, t) {
		(!this.PortManager.SetAllAncestorsActive(t.GeomEdge, this.ShapeToObstacleMap) || !this.GeneratePath(e, t, !1)) && (this.PortManager.SetAllGroupsActive(), this.GeneratePath(e, t, !0));
	}
	NudgePaths(e) {
		let t = this.ObsTree.SpatialAncestorsAdjusted ? gs.GetAncestorSetsMap(this.Obstacles) : this.AncestorsSets;
		qr.NudgePaths(e, this.edgeSeparatian, this.PaddedObstacles, t, this.RemoveStaircases);
	}
	get RemoveStaircases() {
		return this.removeStaircases;
	}
	set RemoveStaircases(e) {
		this.removeStaircases = e;
	}
	FinaliseEdgeGeometries() {
		for (let t of this.EdgesToRoute.concat(this.selfEdges)) t.curve != null && (t.curve instanceof D && (t.curve = e.FitArcsIntoCorners(this.CornerFitRadius, Array.from(t.curve))), e.CalculateArrowheads(t));
	}
	CreateVisibilityGraph() {
		this.GraphGenerator.Clear(), this.InitObstacleTree(), this.GraphGenerator.GenerateVisibilityGraph();
	}
	static CalculateArrowheads(e) {
		Qn.trimSplineAndCalculateArrowheadsII(e, e.sourcePort.Curve, e.targetPort.Curve, e.curve, !0);
	}
	get ObsTree() {
		return this.GraphGenerator.ObstacleTree;
	}
	GenerateObstacleTree() {
		if (this.Obstacles == null || this.Obstacles.length === 0) throw Error("No obstacles have been added");
		this.ObsTree.Root ?? this.InitObstacleTree();
	}
	InitObstacleTree() {
		this.AncestorsSets = gs.GetAncestorSetsMap(this.Obstacles), this.ObsTree.Init(this.ShapeToObstacleMap.values(), this.AncestorsSets, this.ShapeToObstacleMap);
	}
	InternalClear(e) {
		this.GraphGenerator.Clear(), this.ClearShortestPaths(), e ? this.PortManager.ClearVisibility() : (this.PortManager.Clear(), this.ShapeToObstacleMap.clear(), this.EdgesToRoute = []);
	}
	ClearShortestPaths() {
		for (let e of this.EdgesToRoute) e.curve = null;
	}
	GenerateVisibilityGraph() {
		if (this.Obstacles == null || this.Obstacles.length === 0) throw Error("No obstacles have been set");
		this.GraphGenerator.VisibilityGraph ?? this.CreateVisibilityGraph();
	}
	static FitArcsIntoCorners(t, n) {
		if (t == 0) return D.mkFromPoints(n);
		let r = e.GetFittedArcSegs(t, n), i = new E(), a = null;
		for (let t of r) {
			let r = e.EllipseIsAlmostLineSegment(t);
			a == null ? r ? E.addLineSegment(i, n[0], e.CornerPoint(t)) : (E.addLineSegment(i, n[0], t.start), i.addSegment(t)) : r ? E.continueWithLineSegmentP(i, e.CornerPoint(t)) : (E.continueWithLineSegmentP(i, t.start), i.addSegment(t)), a = t;
		}
		return i.segs.length > 0 ? E.continueWithLineSegmentP(i, n[n.length - 1]) : E.addLineSegment(i, n[0], n[n.length - 1]), i;
	}
	static CornerPoint(e) {
		return e.center.add(e.aAxis.add(e.bAxis));
	}
	static EllipseIsAlmostLineSegment(e) {
		return e.aAxis.lengthSquared < 1e-4 || e.aAxis.lengthSquared < 1e-4;
	}
	static *GetFittedArcSegs(e, t) {
		let n = t[1].sub(t[0]), r = n.normalize(), i = Math.min(e, n.length / 2);
		for (let a = 1; a < t.length - 1; a++) {
			n = t[a + 1].sub(t[a]);
			let o = n.length;
			if (o < u.intersectionEpsilon) {
				yield new w(0, 0, new y(0, 0), new y(0, 0), t[a]);
				continue;
			}
			let s = n.div(o);
			Math.abs(s.dot(r)) > .9 && (yield new w(0, 0, new y(0, 0), new y(0, 0), t[a]));
			let c = Math.min(e, n.length / 2), l = s.mul(-c), d = r.mul(i);
			yield new w(0, Math.PI / 2, l, d, t[a].sub(d.add(l))), r = s, i = c;
		}
	}
};
Li.DefaultPadding = 1, Li.DefaultCornerFitRadius = 3;
//#endregion
//#region node_modules/@msagl/core/dist/layout/layered/layerEdge.js
var Ri = class {
	constructor(e, t, n, r = 1) {
		this.Source = e, this.Target = t, this.CrossingWeight = n, this.Weight = r;
	}
	toString() {
		return U.String.format("{0}->{1}", this.Source, this.Target);
	}
}, zi = class e {
	static FindClosestPoints(e, t) {
		let n = E.minDistWithinIntervals(e, t, e.parStart, e.parEnd, t.parStart, t.parEnd, (e.parStart + e.parEnd) / 2, (t.parStart + t.parEnd) / 2);
		if (n) return {
			curveClosestPoint: n.aX,
			labelSideClosest: n.bX
		};
	}
	static GetSegmentInFrontOfLabel(e, t) {
		if (e instanceof E) {
			for (let n of e.segs) if ((n.start.y - t) * (n.end.y - t) <= 0) return n;
		}
		return null;
	}
	static ShiftLabel(e, t, n) {
		let r = e.lineWidth / 2, i = t.sub(n), a = i.length;
		a > r && e.label.positionCenter(e.label.center.add(i.div(a * (a - r))));
	}
	static updateLabel(t, n) {
		let r = null;
		n.labelIsToTheRightOfTheSpline ? (t.label.positionCenter(new y(n.x + n.rightAnchor / 2, n.y)), r = S.mkPP(t.label.boundingBox.leftTop, t.label.boundingBox.leftBottom)) : n.labelIsToTheLeftOfTheSpline && (t.label.positionCenter(new y(n.x - n.leftAnchor / 2, n.y)), r = S.mkPP(t.label.boundingBox.rightTop, t.label.boundingBox.rightBottom));
		let i = e.GetSegmentInFrontOfLabel(t.curve, t.label.center.y);
		if (i != null && E.getAllIntersections(t.curve, E.polyFromBox(t.label.boundingBox), !1).length === 0) {
			let n = e.FindClosestPoints(i, r);
			if (n) e.ShiftLabel(t, n.curveClosestPoint, n.labelSideClosest);
			else {
				let n, a, o = i.closestParameter(r.start), s = i.closestParameter(r.end);
				i.value(o).sub(r.start).length < i.value(s).sub(r.end).length ? (n = i.value(o), a = r.start) : (n = i.value(s), a = r.end), e.ShiftLabel(t, n, a);
			}
		}
	}
}, Bi = class e {
	get CrossingWeight() {
		return 1;
	}
	constructor(e, t, n, r = 1, i = 1) {
		this.reversed = !1, this.source = e, this.target = t, this.edge = n, this.weight = r, this.separation = i;
	}
	get hasLabel() {
		return this.edge.label != null;
	}
	get labelWidth() {
		return this.edge.label.width;
	}
	get labelHeight() {
		return this.edge.label.height;
	}
	reverse() {
		let e = this.source;
		this.source = this.target, this.target = e, this.reversed = !this.reversed;
	}
	toString() {
		return "edge(" + this.source + "->" + this.target + ")";
	}
	get curve() {
		return this.edge.curve;
	}
	set curve(e) {
		this.edge.curve = e;
	}
	get underlyingPolyline() {
		return this.edge.smoothedPolyline;
	}
	get LayerSpan() {
		return this.LayerEdges == null ? 0 : this.LayerEdges.length;
	}
	isSelfEdge() {
		return this.source === this.target;
	}
	reversedClone() {
		let t = new e(this.target, this.source, this.edge);
		if (this.LayerEdges != null) {
			let e = this.LayerEdges.length;
			t.LayerEdges = Array(e);
			for (let n = 0; n < e; n++) {
				let r = this.LayerEdges[e - 1 - n];
				t.LayerEdges[n] = new Ri(r.Target, r.Source, r.CrossingWeight);
			}
			t.LayerEdges[0].Source = this.target, t.LayerEdges[this.LayerEdges.length - 1].Target = this.source;
		}
		return t;
	}
	get count() {
		return this.LayerEdges.length;
	}
	getNode(e) {
		if (e >= 0) {
			if (e < this.LayerEdges.length) return this.LayerEdges[e].Source;
			if (e === this.LayerEdges.length) return this.LayerEdges[e - 1].Target;
		}
		throw Error("wrong index " + e);
	}
	updateEdgeLabelPosition(e) {
		if (this.edge.label != null) {
			let t = this.LayerEdges.length / 2, n = this.LayerEdges[t];
			zi.updateLabel(this.edge, e[n.Source]);
		}
	}
	[Symbol.iterator]() {
		return this.nodes();
	}
	*nodes() {
		yield this.LayerEdges[0].Source;
		for (let e of this.LayerEdges) yield e.Target;
	}
}, Vi = class {
	constructor() {
		this.maxLayerOfGeomGraph = /* @__PURE__ */ new Set(), this.minLayerOfGeomGraph = /* @__PURE__ */ new Set(), this.sameLayerConstraints = [], this.upDownConstraints = [], this.gluedUpDownIntConstraints = new Ei(), this.sameLayerDictionaryOfRepresentatives = /* @__PURE__ */ new Map(), this.representativeToItsLayer = /* @__PURE__ */ new Map(), this.maxLayerInt = [], this.minLayerInt = [], this.sameLayerInts = [], this.upDownInts = [];
	}
	getFeedbackSetExternal(e, t) {
		throw Error("Method not implemented.");
	}
	pinNodeToMaxLayer(e) {
		this.maxLayerOfGeomGraph.add(e);
	}
	pinNodeToMinLayer(e) {
		this.minLayerOfGeomGraph.add(e);
	}
	get isEmpty() {
		return this.maxLayerOfGeomGraph.size === 0 && this.minLayerOfGeomGraph.size === 0 && this.sameLayerConstraints.length === 0 && this.upDownConstraints.length === 0;
	}
	clear() {
		this.maxLayerOfGeomGraph.clear(), this.minLayerOfGeomGraph.clear(), this.sameLayerConstraints = [], this.upDownConstraints = [];
	}
	getFeedbackSetImp(e, t) {
		return this.nodeIdToIndex = t, this.intGraph = e, this.maxRepresentative = -1, this.minRepresentative = -1, this.createIntegerConstraints(), this.glueTogetherSameConstraintsMaxAndMin(), this.addMaxMinConstraintsToGluedConstraints(), this.removeCyclesFromGluedConstraints(), this.getFeedbackSet();
	}
	removeCyclesFromGluedConstraints() {
		let e = Dn(Array.from(this.gluedUpDownIntConstraints.values()), this.intGraph.nodeCount), t = cr.getFeedbackSetWithConstraints(e, null);
		for (let e of t) this.gluedUpDownIntConstraints.remove(e);
	}
	addMaxMinConstraintsToGluedConstraints() {
		if (this.maxRepresentative !== -1) for (let e = 0; e < this.intGraph.nodeCount; e++) {
			let t = this.nodeToRepr(e);
			t !== this.maxRepresentative && this.gluedUpDownIntConstraints.add(new V(this.maxRepresentative, t));
		}
		if (this.minRepresentative !== -1) for (let e = 0; e < this.intGraph.nodeCount; e++) {
			let t = this.nodeToRepr(e);
			t !== this.minRepresentative && this.gluedUpDownIntConstraints.add(new V(t, this.minRepresentative));
		}
	}
	glueTogetherSameConstraintsMaxAndMin() {
		this.createDictionaryOfSameLayerRepresentatives(), this.upDownInts.map(this.gluedIntPairNN), this.gluedUpDownIntConstraints = new Ei();
	}
	gluedIntPairNN(e) {
		return new V(this.nodeToRepr(e[0]), this.nodeToRepr(e[1]));
	}
	gluedIntPairI(e) {
		return new V(this.nodeToRepr(e.source), this.nodeToRepr(e.target));
	}
	gluedIntPair(e) {
		return new V(this.nodeToRepr(e.source), this.nodeToRepr(e.target));
	}
	gluedIntEdge(e) {
		let t = new Bi(this.nodeToRepr(e.source), this.nodeToRepr(e.target), e.edge);
		return t.separation = e.separation, t.weight = 0, t;
	}
	nodeToRepr(e) {
		return this.sameLayerDictionaryOfRepresentatives.get(e) || e;
	}
	createDictionaryOfSameLayerRepresentatives() {
		let e = this.createGraphOfSameLayers();
		for (let t of Sn(e)) this.glueSameLayerNodesOfALayer(t);
	}
	createGraphOfSameLayers() {
		return Dn(this.createEdgesOfSameLayers(), this.intGraph.nodeCount);
	}
	createEdgesOfSameLayers() {
		let e = [];
		return this.maxRepresentative !== -1 && this.maxLayerInt.filter((e) => e !== this.maxRepresentative).map((e) => new V(this.maxRepresentative, e)).forEach((t) => e.push(t)), this.minRepresentative !== -1 && this.minLayerInt.filter((e) => e !== this.minRepresentative).map((e) => new V(this.minRepresentative, e)).forEach((t) => e.push(t)), this.sameLayerInts.forEach((t) => e.push(new V(t[0], t[1]))), e;
	}
	glueSameLayerNodesOfALayer(e) {
		if (e.length > 1) {
			let t = -1;
			if (this.componentsIsMaxLayer(e)) for (let n of e) this.sameLayerDictionaryOfRepresentatives.set(n, t = this.maxRepresentative);
			else if (this.componentIsMinLayer(e)) for (let n of e) this.sameLayerDictionaryOfRepresentatives.set(n, t = this.minRepresentative);
			else for (let n of e) t === -1 && (t = n), this.sameLayerDictionaryOfRepresentatives.set(n, t);
			this.representativeToItsLayer.set(t, e);
		}
	}
	componentIsMinLayer(e) {
		return e.findIndex((e) => this.minRepresentative === e) >= 0;
	}
	componentsIsMaxLayer(e) {
		return e.findIndex((e) => this.maxRepresentative === e) >= 0;
	}
	createIntegerConstraints() {
		this.createMaxIntConstraints(), this.createMinIntConstraints(), this.createUpDownConstraints(), this.createSameLayerConstraints();
	}
	createSameLayerConstraints() {
		this.sameLayerInts = this.createIntConstraintsFromStringCouples(this.sameLayerConstraints);
	}
	createUpDownConstraints() {
		this.upDownInts = this.createIntConstraintsFromStringCouples(this.upDownConstraints);
	}
	createIntConstraintsFromStringCouples(e) {
		return e.map((e) => [this.nodeIndex(e[0]), this.nodeIndex(e[1])]).filter((e) => e[0] !== -1 && e[1] !== -1);
	}
	createMinIntConstraints() {
		this.minLayerInt = this.createIntConstraintsFromExtremeLayer(this.minLayerOfGeomGraph), this.minLayerInt.length > 0 && (this.minRepresentative = this.minLayerInt[0]);
	}
	createMaxIntConstraints() {
		this.maxLayerInt = this.createIntConstraintsFromExtremeLayer(this.maxLayerOfGeomGraph), this.maxLayerInt.length > 0 && (this.maxRepresentative = this.maxLayerInt[0]);
	}
	createIntConstraintsFromExtremeLayer(e) {
		return Array.from(e).map((e) => this.nodeIndex(e)).filter((e) => e !== -1);
	}
	nodeIndex(e) {
		return this.nodeIdToIndex.get(e.node.id) || -1;
	}
	getFeedbackSet() {
		return this.gluedIntGraph = this.createGluedGraph(), Array.from(this.unglueIntPairs(cr.getFeedbackSetWithConstraints(this.gluedIntGraph, this.gluedUpDownIntConstraints)));
	}
	*unglueIntPairs(e) {
		for (let t of e) for (let e of this.unglueEdge(t)) yield e;
	}
	*unglueEdge(e) {
		for (let t of this.unglueNode(e.source)) for (let n of this.intGraph.outEdges[t]) this.nodeToRepr(n.target) === e.target && (yield n);
	}
	createGluedGraph() {
		let e = new Ei();
		return this.intGraph.edges.forEach((t) => e.add(this.gluedIntPairI(t))), Dn(Array.from(e.values()), this.intGraph.nodeCount);
	}
	unglueNode(e) {
		return this.representativeToItsLayer.get(e) || [e];
	}
	getGluedNodeCounts() {
		let e = Array(this.nodeIdToIndex.size).fill(0);
		for (let t = 0; t < e.length; t++) e[this.nodeToRepr(t)]++;
		return e;
	}
};
//#endregion
//#region node_modules/@msagl/core/dist/layout/layered/HorizontalConstraintsForSugiyama.js
function Hi(e, t) {
	return [e, t];
}
var Ui = class {
	constructor() {
		this.leftRightConstraints = [], this.leftRightNeighbors = [], this.nodeToBlockRoot = /* @__PURE__ */ new Map(), this.upDownVerticalConstraints = [], this.BlockRootToBlock = /* @__PURE__ */ new Map();
	}
	get IsEmpty() {
		return this.leftRightNeighbors.length === 0 && this.upDownVerticalConstraints.length === 0 && this.leftRightConstraints.length === 0;
	}
	AddSameLayerNeighbors(e) {
		for (let t = 0; t < e.length - 1; t++) this.AddSameLayerNeighborsPair(e[t], e[t + 1]);
	}
	AddSameLayerNeighborsPair(e, t) {
		this.leftRightNeighbors.push([e, t]);
	}
	NodeToBlockRootSoft(e) {
		return this.nodeToBlockRoot.get(e) || e;
	}
	CreateMappingOfNeibBlocks() {
		let e = this.BasicGraphFromLeftRightIntNeibs();
		for (let t = 0; t < e.nodeCount; t++) if (e.inEdges[t].length === 0 && !this.nodeToBlockRoot.has(t)) {
			let n = [], r = t;
			for (let i = e.outEdges[r]; i.length > 0; i = e.outEdges[r]) r = i[0].y, n.push(r), this.nodeToBlockRoot.set(r, t);
			n.length > 0 && this.BlockRootToBlock.set(t, n);
		}
	}
	BasicGraphFromLeftRightIntNeibs() {
		return Tn(Array.from(this.LeftRightIntNeibs.values()).map((e) => new V(e.x, e.y)));
	}
	NodeIndex(e) {
		return this.nodeIdToIndex.get(e.id) || -1;
	}
	PrepareForOrdering(e, t) {
		this.nodeIdToIndex = e, this.MapNodesToToIntegers(t), this.CreateMappingOfNeibBlocks(), this.LiftLeftRightRelationsToNeibBlocks();
	}
	LiftLeftRightRelationsToNeibBlocks() {
		this.LeftRighInts = Ei.mk(this.leftRightConstraints.map((e) => Hi(this.NodeIndex(e[0]), this.NodeIndex(e[1]))).filter((e) => e[0] !== -1 && e[1] !== -1).map((e) => new V(this.NodeToBlockRootSoft(e[0]), this.NodeToBlockRootSoft(e[1]))).filter((e) => e.x !== e.x));
		let e = cr.getFeedbackSet(Tn(Array.from(this.LeftRighInts.values())));
		for (let t of e) this.LeftRighInts.remove(new V(t.source, t.target));
	}
	MapNodesToToIntegers(e) {
		this.LeftRightIntNeibs = Ei.mk(Array.from(this.leftRightNeighbors.values()).map((e) => [this.NodeIndex(e[0]), this.NodeIndex(e[1])]).filter((e) => e[0] !== -1 && e[1] !== -1).map((e) => new V(e[0], e[1]))), this.VerticalInts = Ei.mk(this.upDownVerticalConstraints.map((e) => [this.NodeIndex(e[0]), this.NodeIndex(e[1])]).filter((t) => t[0] !== -1 && t[1] !== -1 && e[t[0]] > e[t[1]]).map((e) => new V(e[0], e[1])));
	}
}, Wi;
(function(e) {
	e[e.TB = 0] = "TB", e[e.LR = 1] = "LR", e[e.BT = 2] = "BT", e[e.RL = 3] = "RL", e[e.None = 4] = "None";
})(Wi ||= {});
//#endregion
//#region node_modules/@msagl/core/dist/routing/EdgeRoutingMode.js
var Z;
(function(e) {
	e[e.Spline = 0] = "Spline", e[e.SplineBundling = 1] = "SplineBundling", e[e.StraightLine = 2] = "StraightLine", e[e.SugiyamaSplines = 3] = "SugiyamaSplines", e[e.Rectilinear = 4] = "Rectilinear", e[e.RectilinearToCenter = 5] = "RectilinearToCenter", e[e.None = 6] = "None";
})(Z ||= {});
//#endregion
//#region node_modules/@msagl/core/dist/routing/EdgeRoutingSettings.js
var Gi = class e {
	toJSON() {
		let e = {};
		return this.EdgeRoutingMode != Z.Spline && (e.edgeRoutingMode = Z.Spline), this.ConeAngle != Math.PI / 180 * 30 && (e.coneAngle = this.ConeAngle), this.padding != 3 && (e.padding = this.padding), this.polylinePadding != 1.5 && (e.polylinePadding = this.polylinePadding), this.bundlingSettings && (e.bundlingSettingsJSON = this.bundlingSettings.toJSON()), e;
	}
	static fromJSON(t) {
		let n = new e();
		return t.edgeRoutingMode &&= n.edgeRoutingMode, t.coneAngle && (n.coneAngle = t.coneAngle), t.padding && (n.padding = t.padding), t.polylinePadding && (n.polylinePadding = t.polylinePadding), t.bundlingSettingsJSON && (n.bundlingSettings = nn.createFromJSON(t.bundlingSettingsJSON)), t.routingToParentConeAngle && (n.routingToParentConeAngle = t.routingToParentConeAngle), t.simpleSelfLoopsForParentEdgesThreshold && (n.simpleSelfLoopsForParentEdgesThreshold = t.simpleSelfLoopsForParentEdgesThreshold), t.incrementalRoutingThreshold && (n.incrementalRoutingThreshold = t.incrementalRoutingThreshold), t.routeMultiEdgesAsBundles && (n.routeMultiEdgesAsBundles = t.routeMultiEdgesAsBundles), t.KeepOriginalSpline && (n.KeepOriginalSpline = t.KeepOriginalSpline), n;
	}
	constructor() {
		this.coneAngle = Math.PI / 180 * 30, this.padding = 2, this.polylinePadding = 1, this.routingToParentConeAngle = Math.PI / 6, this.simpleSelfLoopsForParentEdgesThreshold = 200, this.incrementalRoutingThreshold = 5e6, this.routeMultiEdgesAsBundles = !0, this.KeepOriginalSpline = !1, this.EdgeRoutingMode = Z.Spline;
	}
	get EdgeRoutingMode() {
		return this.edgeRoutingMode;
	}
	set EdgeRoutingMode(e) {
		e === Z.SplineBundling && this.bundlingSettings == null && (this.bundlingSettings ??= new nn()), this.edgeRoutingMode = e;
	}
	get ConeAngle() {
		return this.coneAngle;
	}
	set ConeAngle(e) {
		this.coneAngle = e;
	}
	get Padding() {
		return this.padding;
	}
	set Padding(e) {
		this.padding = e;
	}
	get PolylinePadding() {
		return this.polylinePadding;
	}
	set PolylinePadding(e) {
		this.polylinePadding = e;
	}
	get RoutingToParentConeAngle() {
		return this.routingToParentConeAngle;
	}
	set RoutingToParentConeAngle(e) {
		this.routingToParentConeAngle = e;
	}
	get SimpleSelfLoopsForParentEdgesThreshold() {
		return this.simpleSelfLoopsForParentEdgesThreshold;
	}
	set SimpleSelfLoopsForParentEdgesThreshold(e) {
		this.simpleSelfLoopsForParentEdgesThreshold = e;
	}
	get IncrementalRoutingThreshold() {
		return this.incrementalRoutingThreshold;
	}
	set IncrementalRoutingThreshold(e) {
		this.incrementalRoutingThreshold = e;
	}
	get RouteMultiEdgesAsBundles() {
		return this.routeMultiEdgesAsBundles;
	}
	set RouteMultiEdgesAsBundles(e) {
		this.routeMultiEdgesAsBundles = e;
	}
}, Ki = class e {
	constructor() {
		this.edgeRoutingSettings = new Gi(), this.nodeSeparation = 10, this.packingAspectRatio = 1.5;
	}
	static fromJSON(t) {
		let n = new e();
		return t.nodeSeparation != 10 && (n.nodeSeparation = t.nodeSeparation), t.packingAspectRatio && (n.packingAspectRatio = t.packingAspectRatio), t.edgeRoutingSettings && (n.edgeRoutingSettings = Gi.fromJSON(t.edgeRoutingSettings)), n;
	}
	toJSON() {
		let e = !1, t = {};
		return this.nodeSeparation != 10 && (t.nodeSeparation = this.nodeSeparation, e = !0), this.packingAspectRatio != 1.5 && (t.packingAspectRatio = this.packingAspectRatio, e = !0), (t.edgeRoutingSettings = this.edgeRoutingSettings.toJSON()) && (e = !0), e ? t : void 0;
	}
	get NodeSeparation() {
		return this.nodeSeparation;
	}
	set NodeSeparation(e) {
		this.nodeSeparation = e;
	}
	get PackingAspectRatio() {
		return this.packingAspectRatio;
	}
	set PackingAspectRatio(e) {
		this.packingAspectRatio = e;
	}
}, qi;
(function(e) {
	e[e.None = 0] = "None", e[e.Top = 1] = "Top", e[e.Bottom = 2] = "Bottom";
})(qi ||= {});
var Ji = class e {
	get NodeSeparation() {
		return this.commonSettings.NodeSeparation;
	}
	get edgeRoutingSettings() {
		return this.commonSettings.edgeRoutingSettings;
	}
	set edgeRoutingSettings(e) {
		this.commonSettings.edgeRoutingSettings = e;
	}
	toJSON() {
		let e = {};
		return this.sameRanks && (e.sameRanks = this.sameRanks), this.verticalConstraints && (e.verticalConstraints = this.verticalConstraints), this.horizontalConstraints && (e.horizontalConstraints = this.horizontalConstraints), this.NoGainAdjacentSwapStepsBound != 5 && (e.horizontalConstraints = this.horizontalConstraints), this.NoGainStepsForOrderingMultiplier != 1 && (e.RepetitionCoefficientForOrdering = this.NoGainStepsForOrderingMultiplier), this.AspectRatio && (e.AspectRatio = this.AspectRatio), this.MaxNumberOfPassesInOrdering != 24 && (e.MaxNumberOfPassesInOrdering = this.MaxNumberOfPassesInOrdering), this.BrandesThreshold != 600 && (e.BrandesThreshold = this.BrandesThreshold), this.LabelCornersPreserveCoefficient != .1 && (e.LabelCornersPreserveCoefficient = this.LabelCornersPreserveCoefficient), this.MinNodeHeight != 72 * .5 / 4 && (e.MinNodeHeight = this.MinNodeHeight), this.MinNodeWidth != 72 * .75 / 4 && (e.MinNodeWidth = this.MinNodeWidth), this.SnapToGridByY != qi.None && (e.SnapToGridByY = this.SnapToGridByY), this.yLayerSep != 30 && (e.yLayerSep = this.yLayerSep), this.transform && (e.transform = this.transform.elements), this.GridSizeByY && (e.GridSizeByY = this.GridSizeByY), this.GridSizeByX && (e.GridSizeByX = this.GridSizeByX), e.commonLayoutSettings = this.commonSettings.toJSON(), e;
	}
	static fromJSON(t) {
		let n = new e();
		return t.sameRanks && (n.sameRanks = t.sameRanks), t.verticalConstraints && (n.verticalConstraints = t.verticalConstraints), t.horizontalConstraints && (n.horizontalConstraints = t.horizontalConstraints), t.NoGainAdjacentSwapStepsBound && (n.horizontalConstraints = t.horizontalConstraints), t.RepetitionCoefficientForOrdering && (n.NoGainStepsForOrderingMultiplier = t.RepetitionCoefficientForOrdering), t.AspectRatio && (n.AspectRatio = t.AspectRatio), t.MaxNumberOfPassesInOrdering && (n.MaxNumberOfPassesInOrdering = t.MaxNumberOfPassesInOrdering), t.BrandesThreshold && (n.BrandesThreshold = t.BrandesThreshold), t.LabelCornersPreserveCoefficient && (n.LabelCornersPreserveCoefficient = t.LabelCornersPreserveCoefficient), t.MinNodeHeight && (n.MinNodeHeight = t.MinNodeHeight), t.MinNodeWidth && (n.MinNodeWidth = n.MinNodeWidth), t.SnapToGridByY && (n.SnapToGridByY = t.SnapToGridByY), t.yLayerSep && (n.yLayerSep = t.yLayerSep), t.transform && (n.transform = new ge(t.transform[0][0], t.transform[0][1], t.transform[0][2], t.transform[1][0], t.transform[1][1], t.transform[1][2])), t.GridSizeByY && (n.GridSizeByY = t.GridSizeByY), t.GridSizeByX && (n.GridSizeByX = t.GridSizeByX), t.commonLayoutSettings && (n.commonSettings = Ki.fromJSON(t.commonLayoutSettings)), n;
	}
	get LayerSeparation() {
		return this.yLayerSep;
	}
	set LayerSeparation(e) {
		this.yLayerSep = Math.max(30, e);
	}
	ActualLayerSeparation(e) {
		return e ? this.LayerSeparation / 2 : this.LayerSeparation;
	}
	constructor() {
		this.commonSettings = new Ki(), this.verticalConstraints = new Vi(), this.horizontalConstraints = new Ui(), this.NoGainAdjacentSwapStepsBound = 5, this.NoGainStepsForOrderingMultiplier = 1, this.AspectRatio = 0, this.MaxNumberOfPassesInOrdering = 24, this.BrandesThreshold = 600, this.LabelCornersPreserveCoefficient = .1, this.MinNodeHeight = 72 * .5 / 4, this.MinNodeWidth = 72 * .75 / 4, this.SnapToGridByY = qi.None, this.yLayerSep = 30, this.transform = ge.getIdentity(), this.GridSizeByY = 0, this.GridSizeByX = 0, this.commonSettings.edgeRoutingSettings.EdgeRoutingMode = Z.SugiyamaSplines;
	}
	transformIsRotation(e) {
		let t = ge.rotation(e);
		for (let e = 0; e < 2; e++) for (let n = 0; n < 3; n++) if (!m(t.elements[e][n], this.transform.elements[e][n])) return !1;
		return !0;
	}
	get layerDirection() {
		if (this.transformIsRotation(0)) return Wi.TB;
		if (this.transformIsRotation(Math.PI / 2)) return Wi.LR;
		if (this.transformIsRotation(-Math.PI / 2)) return Wi.RL;
		if (this.transformIsRotation(Math.PI)) return Wi.BT;
		throw Error("unexpected layout direction");
	}
	set layerDirection(e) {
		switch (e) {
			case Wi.TB:
				this.transform = ge.getIdentity();
				break;
			case Wi.LR:
				this.transform = ge.rotation(Math.PI / 2);
				break;
			case Wi.RL:
				this.transform = ge.rotation(-Math.PI / 2);
				break;
			case Wi.BT:
				this.transform = ge.rotation(Math.PI);
				break;
			default: throw Error("unexpected layout direction");
		}
	}
}, Yi = class extends B {
	constructor(e, t, n) {
		super(null), this.graph = e, this.source = t, this.length = n;
	}
	get Result() {
		return this.result;
	}
	run() {
		let e = new Rn((e, t) => e - t), t = /* @__PURE__ */ new Map();
		for (let n of this.graph.shallowNodes) {
			let r = n === this.source ? 0 : Infinity;
			e.Enqueue(n, r), t.set(n, r);
		}
		for (; e.count > 0;) {
			let n = { priority: 0 }, r = e.DequeueAndGetPriority(n);
			t.set(r, n.priority);
			let i = t.get(r);
			for (let n of r.inEdges()) {
				let r = n.source, a = i + this.length(n);
				t.get(r) > a && (t.set(r, a), e.DecreasePriority(r, a));
			}
			for (let n of r.outEdges()) {
				let r = n.target, a = i + this.length(n);
				t.get(r) > a && (t.set(r, a), e.DecreasePriority(r, a));
			}
		}
		this.result = Array(this.graph.shallowNodeCount);
		let n = 0;
		for (let e of this.graph.shallowNodes) {
			let r = t.get(e);
			r === void 0 ? this.result[n++] = Infinity : this.result[n++] = r;
		}
	}
}, Xi = class e extends B {
	get Result() {
		return this.result;
	}
	set Result(e) {
		this.result = e;
	}
	constructor(e, t) {
		super(null), this.graph = e, this.length = t;
	}
	run() {
		this.result = Array(this.graph.shallowNodeCount);
		let e = 0;
		for (let t of this.graph.shallowNodes) {
			let n = new Yi(this.graph, t, this.length);
			n.run(), this.Result[e++] = n.Result;
		}
	}
	static Stress(t, n) {
		let r = 0;
		if (t.edgeCount === 0) return r;
		let i = new e(t, n);
		i.run();
		let a = i.Result, o = 0;
		for (let e of t.shallowEdges) o += n(e);
		o /= t.edgeCount;
		let s = 0;
		for (let e of t.shallowNodes) {
			let n = 0;
			for (let i of t.shallowNodes) {
				if (s !== n) {
					let t = e.center.sub(i.center).length, c = o * a[s][n], l = c - t;
					r += l * l / (c * c);
				}
				n++;
			}
			s++;
		}
		return r;
	}
}, Zi = class extends B {
	get Result() {
		return this.result;
	}
	constructor(e, t, n) {
		super(null), this.graph = e, this.pivotArray = t, this.length = n;
	}
	run() {
		this.result = Array(this.pivotArray.length);
		let e = Array.from(this.graph.shallowNodes), t = Array(this.graph.shallowNodeCount).fill(Infinity), n = e[0];
		this.pivotArray[0] = 0;
		for (let r = 0;; r++) {
			let i = new Yi(this.graph, n, this.length);
			if (i.run(), this.Result[r] = i.Result, r + 1 < this.pivotArray.length) {
				let i = 0;
				for (let e = 0; e < this.Result[r].length; e++) t[e] = Math.min(t[e], this.Result[r][e]), t[e] > t[i] && (i = e);
				n = e[i], this.pivotArray[r + 1] = i;
			} else break;
		}
	}
}, Qi = class {
	static Rotate(e, t, n) {
		let r = Math.sin(Math.PI / 180 * n), i = Math.cos(Math.PI / 180 * n);
		for (let n = 0; n < e.length; n++) {
			let a = i * e[n] + r * t[n];
			t[n] = i * t[n] - r * e[n], e[n] = a;
		}
	}
}, $i = class e {
	static DoubleCenter(e) {
		let t = Array(e.length).fill(0), n = Array(e[0].length).fill(0), r = 0;
		for (let i = 0; i < e.length; i++) for (let a = 0; a < e[0].length; a++) t[i] += e[i][a], n[a] += e[i][a], r += e[i][a];
		for (let n = 0; n < e.length; n++) t[n] /= e.length;
		for (let t = 0; t < e[0].length; t++) n[t] /= e[0].length;
		r /= e.length, r /= e[0].length;
		for (let i = 0; i < e.length; i++) for (let a = 0; a < e[0].length; a++) e[i][a] -= t[i] + n[a] - r;
	}
	static SquareEntries(e) {
		for (let t = 0; t < e.length; t++) for (let n = 0; n < e[0].length; n++) e[t][n] = e[t][n] ** 2;
	}
	static Multiply(e, t) {
		for (let n = 0; n < e.length; n++) for (let r = 0; r < e[0].length; r++) e[n][r] *= t;
	}
	static MultiplyX(e, t) {
		if (e[0].length !== t.length) return null;
		let n = Array(t.length).fill(0);
		for (let r = 0; r < e.length; r++) for (let i = 0; i < e[0].length; i++) n[r] += e[r][i] * t[i];
		return n;
	}
	static Norm(e) {
		let t = 0;
		for (let n = 0; n < e.length; n++) t += e[n] ** 2;
		return Math.sqrt(t);
	}
	static Normalize(t) {
		let n = e.Norm(t);
		if (n <= 0) return 0;
		for (let e = 0; e < t.length; e++) t[e] /= n;
		return n;
	}
	static RandomUnitLengthVector(t) {
		let n = Array(t);
		for (let e = 0; e < t; e++) n[e] = xn();
		return e.Normalize(n), n;
	}
	static SpectralDecomposition(t, n) {
		e.SpectralDecompositionIE(t, n, 30, 1e-6);
	}
	static SpectralDecompositionIE(t, n, r, i) {
		let a = t[0].length;
		n.u1 = e.RandomUnitLengthVector(a), n.lambda1 = 0, n.u2 = e.RandomUnitLengthVector(a), n.lambda2 = 0;
		let o = 0, s = 1 - i;
		for (let i = 0; i < r && o < s; i++) {
			let r = e.MultiplyX(t, n.u1), i = e.MultiplyX(t, n.u2);
			n.lambda1 = e.Normalize(r), n.lambda2 = e.Normalize(i), e.MakeOrthogonal(i, r), e.Normalize(i), o = Math.min(e.DotProduct(n.u1, r), e.DotProduct(n.u2, i)), n.u1 = r, n.u2 = i;
		}
	}
	static DotProduct(e, t) {
		if (e.length !== t.length) return 0;
		let n = 0;
		for (let r = 0; r < e.length; r++) n += e[r] * t[r];
		return n;
	}
	static MakeOrthogonal(t, n) {
		if (t.length !== n.length) return;
		let r = e.DotProduct(t, n) / e.DotProduct(n, n);
		for (let e = 0; e < t.length; e++) t[e] -= r * n[e];
	}
	static ClassicalScaling(t, n) {
		let r = Array(t.length);
		for (let e = 0; e < t.length; e++) r[e] = t[e].slice();
		e.SquareEntries(r), e.DoubleCenter(r), e.Multiply(r, -.5), e.SpectralDecomposition(r, n), n.lambda1 = Math.sqrt(Math.abs(n.lambda1)), n.lambda2 = Math.sqrt(Math.abs(n.lambda2));
		for (let e = 0; e < n.u1.length; e++) n.u1[e] *= n.lambda1, n.u2[e] *= n.lambda2;
	}
	static DistanceScalingSubset(e, t, n, r, i) {
		let a = t.length, o = e.length, s = Array(o);
		for (let t = 0; t < o; t++) for (let n = 0; n < a; n++) e[t][n] === 0 && (s[t] = n);
		let c = Array(o).fill(0);
		for (let e = 0; e < o; e++) for (let t = 0; t < a; t++) s[e] !== t && (c[e] += r[e][t]);
		for (let l = 0; l < i; l++) for (let i = 0; i < o; i++) {
			let o = 0, l = 0;
			for (let c = 0; c < a; c++) if (i !== c) {
				let a = Math.sqrt((t[s[i]] - t[c]) ** 2 + (n[s[i]] - n[c]) ** 2);
				a > 0 && (a = 1 / a), o += r[i][c] * (t[c] + e[i][c] * (t[s[i]] - t[c]) * a), l += r[i][c] * (n[c] + e[i][c] * (n[s[i]] - n[c]) * a);
			}
			t[s[i]] = o / c[i], n[s[i]] = l / c[i];
		}
	}
	static DistanceScaling(e, t, n, r, i) {
		let a = t.length, o = Array(a).fill(0);
		for (let e = 0; e < a; e++) for (let t = 0; t < a; t++) e !== t && (o[e] += r[e][t]);
		for (let s = 0; s < i; s++) for (let i = 0; i < a; i++) {
			let s = 0, c = 0;
			for (let o = 0; o < a; o++) if (i !== o) {
				let a = Math.sqrt((t[i] - t[o]) ** 2 + (n[i] - n[o]) ** 2);
				a > 0 && (a = 1 / a), s += r[i][o] * (t[o] + e[i][o] * (t[i] - t[o]) * a), c += r[i][o] * (n[o] + e[i][o] * (n[i] - n[o]) * a);
			}
			t[i] = s / o[i], n[i] = c / o[i];
		}
	}
	static ExponentialWeightMatrix(e, t) {
		let n = Array(e.length);
		for (let r = 0; r < e.length; r++) {
			n[r] = Array(e[r].length).fill(0);
			for (let i = 0; i < e[r].length; i++) e[r][i] > 0 && (n[r][i] = e[r][i] ** +t);
		}
		return n;
	}
	static EuclideanDistanceMatrix(e, t) {
		let n = Array(e.length);
		for (let r = 0; r < e.length; r++) {
			n[r] = Array(e.length);
			for (let i = 0; i < e.length; i++) n[r][i] = Math.sqrt((e[r] - e[i]) ** 2 + (t[r] - t[i]) ** 2);
		}
		return n;
	}
	static LandmarkClassicalScaling(t, n, r) {
		let i = Array(t.length);
		for (let e = 0; e < t.length; e++) {
			i[e] = Array(t.length);
			for (let n = 0; n < t.length; n++) i[e][n] = t[e][r[n]];
		}
		e.SquareEntries(i);
		let a = Array(t.length).fill(0);
		for (let e = 0; e < t.length; e++) {
			for (let n = 0; n < t.length; n++) a[e] += i[e][n];
			a[e] /= t.length;
		}
		e.DoubleCenter(i), e.Multiply(i, -.5);
		let o = {
			u1: [],
			u2: [],
			lambda1: 0,
			lambda2: 0
		};
		e.SpectralDecomposition(i, o), o.lambda1 = Math.sqrt(Math.abs(o.lambda1)), o.lambda2 = Math.sqrt(Math.abs(o.lambda2)), n.x = Array(t[0].length).fill(0), n.y = Array(t[0].length).fill(0);
		for (let e = 0; e < n.x.length; e++) for (let r = 0; r < i.length; r++) {
			let i = (t[r][e] ** 2 - a[r]) / 2;
			n.x[e] -= o.u1[r] * i, n.y[e] -= o.u2[r] * i;
		}
	}
}, ea = class {
	constructor(e, t) {
		this.constrained = !1, this.Capacity = 1e6, fa.AbovePP(e.point, t.point) === 1 ? (this.upperSite = e, this.lowerSite = t) : (this.lowerSite = e, this.upperSite = t), this.upperSite.AddEdgeToSite(this);
	}
	get CcwTriangle() {
		return this.ccwTriangle;
	}
	set CcwTriangle(e) {
		this.ccwTriangle = e;
	}
	get CwTriangle() {
		return this.cwTriangle;
	}
	set CwTriangle(e) {
		this.cwTriangle = e;
	}
	GetOtherTriangle_c(e) {
		return this.cwTriangle.Contains(e) ? this.ccwTriangle : this.cwTriangle;
	}
	IsAdjacent(e) {
		return e === this.upperSite || e === this.lowerSite;
	}
	GetOtherTriangle_T(e) {
		return this.ccwTriangle === e ? this.cwTriangle : this.ccwTriangle;
	}
	toString() {
		return U.String.format("({0},{1})", this.upperSite, this.lowerSite);
	}
	OtherSite(e) {
		return this.upperSite === e ? this.lowerSite : this.upperSite;
	}
}, ta = class e {
	cleanRemovedEdges() {
		for (let e of this.Edges) e.CcwTriangle === null && e.CwTriangle === null && this.Edges.splice(this.Edges.indexOf(e), 1);
	}
	constructor(e) {
		this.Owner = null, this.InEdges = [], this.point = e;
	}
	static mkSO(t, n) {
		let r = new e(t);
		return r.Owner = n, r;
	}
	AddEdgeToSite(e) {
		this.Edges ??= [], this.Edges.push(e);
	}
	EdgeBetweenUpperSiteAndLowerSite(e) {
		if (this.Edges != null) {
			for (let t of this.Edges) if (t.lowerSite === e) return t;
		}
		return null;
	}
	AddInEdge(e) {
		this.InEdges.push(e);
	}
	*Triangles() {
		let e;
		if (this.Edges != null && this.Edges.length > 0) e = this.Edges[0];
		else if (this.InEdges != null && this.InEdges.length > 0) e = this.InEdges[0];
		else return;
		let t = e;
		do {
			let e = t.upperSite === this ? t.CcwTriangle : t.CwTriangle;
			if (e == null) {
				t = null;
				break;
			}
			yield e, t = e.Edges.getItem(e.Edges.index(t) + 2);
		} while (t !== e);
		if (t !== e) {
			t = e;
			do {
				let e = t.upperSite === this ? t.CwTriangle : t.CcwTriangle;
				if (e == null) break;
				yield e, t = e.Edges.getItem(e.Edges.index(t) + 1);
			} while (!0);
		}
	}
	toString() {
		return this.point.toString();
	}
}, na = class {
	get x() {
		return this.LeftSite.point.x;
	}
	constructor(e, t) {
		this.RightSite = t.upperSite === e ? t.lowerSite : t.upperSite, this.LeftSite = e, this.Edge = t;
	}
	toString() {
		return "(" + this.LeftSite.toString() + ", " + this.Edge.toString() + "," + this.RightSite.toString() + ")";
	}
}, ra = class {
	has(e) {
		return e === this.item0 || e === this.item1 || e === this.item2;
	}
	index(e) {
		return e === this.item0 ? 0 : e === this.item1 ? 1 : e === this.item2 ? 2 : -1;
	}
	getItem(e) {
		switch (e) {
			case 0:
			case 3:
			case -3: return this.item0;
			case 1:
			case 4:
			case -2: return this.item1;
			case 2:
			case 5:
			case -1: return this.item2;
			default: throw Error();
		}
	}
	setItem(e, t) {
		switch (e) {
			case 0:
			case 3:
			case -3:
				this.item0 = t;
				break;
			case 1:
			case 4:
			case -2:
				this.item1 = t;
				break;
			case 2:
			case 5:
			case -1:
				this.item2 = t;
				break;
			default: throw Error();
		}
	}
	[Symbol.iterator]() {
		return this.GetEnumerator();
	}
	*GetEnumerator() {
		yield this.item0, yield this.item1, yield this.item2;
	}
}, ia = class e {
	constructor() {
		this.Edges = new ra(), this.Sites = new ra();
	}
	containsPoint(t) {
		return e.PointLocationForTriangle(t, this) !== T.Outside;
	}
	static PointLocationForTriangle(e, t) {
		let n = !1;
		for (let r = 0; r < 3; r++) {
			let i = y.signedDoubledTriangleArea(e, t.Sites.getItem(r).point, t.Sites.getItem(r + 1).point);
			if (i < -u.distanceEpsilon) return T.Outside;
			i < u.distanceEpsilon && (n = !0);
		}
		return n ? T.Boundary : T.Inside;
	}
	intersectsLine(t, n, r) {
		if (e.PointLocationForTriangle(t, this) != T.Outside || e.PointLocationForTriangle(n, this) != T.Outside) return !0;
		for (let e of this.Edges) if (this.abIntersectsTrianglSide(t, n, e)) return !0;
		return !1;
	}
	abIntersectsTrianglSide(e, t, n) {
		return ne(e, t, n.lowerSite.point, n.upperSite.point);
	}
	static mkSSSD(t, n, r, i) {
		let a = y.getTriangleOrientation(t.point, n.point, r.point), o = new e();
		switch (a) {
			case _.Counterclockwise:
				o.FillCcwTriangle(t, n, r, i);
				break;
			case _.Clockwise:
				o.FillCcwTriangle(t, r, n, i);
				break;
			default: throw Error();
		}
		return o;
	}
	static mkSED(t, n, r) {
		let i = new e();
		switch (y.getTriangleOrientation(n.upperSite.point, n.lowerSite.point, t.point)) {
			case _.Counterclockwise:
				n.CcwTriangle = i, i.Sites.setItem(0, n.upperSite), i.Sites.setItem(1, n.lowerSite);
				break;
			case _.Clockwise:
				n.CwTriangle = i, i.Sites.setItem(0, n.lowerSite), i.Sites.setItem(1, n.upperSite);
				break;
			default: throw Error();
		}
		return i.Edges.setItem(0, n), i.Sites.setItem(2, t), i.CreateEdge(1, r), i.CreateEdge(2, r), i;
	}
	static mkSSSEE(t, n, r, i, a, o) {
		let s = e.mkSSSD(t, n, r, o);
		return s.Edges.setItem(0, i), s.Edges.setItem(1, a), s.BindEdgeToTriangle(t, i), s.BindEdgeToTriangle(n, a), s.CreateEdge(2, o), s;
	}
	BindEdgeToTriangle(e, t) {
		e === t.upperSite ? t.CcwTriangle = this : t.CwTriangle = this;
	}
	FillCcwTriangle(e, t, n, r) {
		this.Sites.setItem(0, e), this.Sites.setItem(1, t), this.Sites.setItem(2, n);
		for (let e = 0; e < 3; e++) this.CreateEdge(e, r);
	}
	CreateEdge(e, t) {
		let n = this.Sites.getItem(e), r = t(n, this.Sites.getItem(e + 1));
		this.Edges.setItem(e, r), this.BindEdgeToTriangle(n, r);
	}
	Contains(e) {
		return this.Sites.has(e);
	}
	OppositeEdge(e) {
		let t = this.Sites.index(e);
		return this.Edges.getItem(t + 1);
	}
	OppositeSite(e) {
		let t = this.Edges.index(e);
		return this.Sites.getItem(t + 2);
	}
	BoundingBox() {
		let e = O.mkPP(this.Sites.getItem(0).point, this.Sites.getItem(1).point);
		return e.add(this.Sites.getItem(2).point), e;
	}
	static mkSSSEED(t, n, r, i, a, o) {
		let s = new e();
		return s.Sites.setItem(0, t), s.Sites.setItem(1, n), s.Sites.setItem(2, r), s.Edges.setItem(0, i), s.Edges.setItem(1, a), s.BindEdgeToTriangle(t, i), s.BindEdgeToTriangle(n, a), s.CreateEdge(2, o), s;
	}
	toString() {
		return this.Sites.getItem(0).toString() + "," + this.Sites.getItem(1).toString() + "," + this.Sites.getItem(2).toString();
	}
}, aa = class {
	constructor(e) {
		this.Edge = e;
	}
}, oa = class e extends B {
	constructor(e, t, n, r) {
		if (super(null), this.front = new Ct((e, t) => e.x - t.x), this.triangles = /* @__PURE__ */ new Set(), this.listOfSites = e, this.listOfSites.length === 0) return;
		this.p_1 = t, this.p_2 = n, this.createEdgeDelegate = r;
		let i = ia.mkSSSD(t, n, this.listOfSites[0], r);
		this.triangles.add(i), this.front.insert(new na(t, i.Edges.getItem(2))), this.front.insert(new na(this.listOfSites[0], i.Edges.getItem(1)));
	}
	run() {
		if (this.listOfSites.length !== 0) {
			for (let e = 1; e < this.listOfSites.length; e++) this.ProcessSite(this.listOfSites[e]);
			this.FinalizeTriangulation();
		}
	}
	FinalizeTriangulation() {
		this.RemoveP1AndP2Triangles(), this.triangles.size > 0 && this.MakePerimeterConvex();
	}
	MakePerimeterConvex() {
		let e = this.CreateDoubleLinkedListOfPerimeter();
		do {
			let t = this.FindConcaveEdge(e);
			if (t == null) return;
			e = this.ShortcutTwoListElements(t);
		} while (!0);
	}
	FindConcaveEdge(e) {
		let t = e, n;
		do {
			if (n = t.Next, y.getTriangleOrientation(t.Start.point, t.End.point, n.End.point) === _.Counterclockwise) return t;
			t = n;
		} while (n !== e);
		return null;
	}
	static FindPivot(e) {
		let t = e, n = e;
		do
			n = n.Next, (n.Start.point.x < t.Start.point.x || n.Start.point.x === t.Start.point.x && n.Start.point.y < t.Start.point.y) && (t = n);
		while (n !== e);
		return t;
	}
	FindFirsePerimeterEdge() {
		for (let e of this.triangles) for (let t of e.Edges) if (t.GetOtherTriangle_T(e) == null) return t;
		return null;
	}
	CreateDoubleLinkedListOfPerimeter() {
		let t = this.FindFirsePerimeterEdge(), n = t, r = null, i, a = null, o = [];
		do
			i = e.CreatePerimeterElementFromEdge(n), o.push(S.mkPP(i.Start.point, i.End.point)), n = e.FindNextEdgeOnPerimeter(n), a == null ? r = i : (i.Prev = a, a.Next = i), a = i;
		while (n !== t);
		return r.Prev = i, i.Next = r, r;
	}
	static FindNextEdgeOnPerimeter(e) {
		let t = e.CwTriangle ?? e.CcwTriangle;
		for (e = t.Edges.getItem(t.Edges.index(e) + 2); e.CwTriangle != null && e.CcwTriangle != null;) t = e.GetOtherTriangle_T(t), e = t.Edges.getItem(t.Edges.index(e) + 2);
		return e;
	}
	static CreatePerimeterElementFromEdge(e) {
		let t = new aa(e);
		return e.CwTriangle == null ? (t.End = e.upperSite, t.Start = e.lowerSite) : (t.Start = e.upperSite, t.End = e.lowerSite), t;
	}
	RemoveP1AndP2Triangles() {
		let t = /* @__PURE__ */ new Set();
		for (let e of this.triangles) (e.Sites.has(this.p_1) || e.Sites.has(this.p_2)) && t.add(e);
		for (let n of t) e.RemoveTriangleWithEdges(this.triangles, n);
	}
	static RemoveTriangleWithEdges(e, t) {
		e.delete(t);
		for (let e of t.Edges) e.CwTriangle === t ? e.CwTriangle = null : e.CcwTriangle = null, e.CwTriangle == null && e.CcwTriangle == null && sa(e.upperSite.Edges, e);
	}
	static RemoveTriangleButLeaveEdges(e, t) {
		e.delete(t);
		for (let e of t.Edges) e.CwTriangle === t ? e.CwTriangle = null : e.CcwTriangle = null;
	}
	ProcessSite(e) {
		this.PointEvent(e);
		for (let t = 0; t < e.Edges.length; t++) {
			let n = e.Edges[t];
			n.constrained && this.EdgeEvent(n);
		}
	}
	EdgeEvent(t) {
		e.EdgeIsProcessed(t) || (this.traversingEdge = t, this.runEdgeInserter());
	}
	static EdgeIsProcessed(e) {
		return e.CwTriangle != null || e.CcwTriangle != null;
	}
	ShowFrontWithSite(e, t = null) {
		let n = [];
		if (e.Edges != null) for (let t of e.Edges) n.push(q.mkDebugCurveTWCI(200, .8, t.constrained ? "Pink" : "Brown", S.mkPP(t.upperSite.point, t.lowerSite.point)));
		n.push(q.mkDebugCurveTWCI(200, 1, "Brown", w.mkFullEllipseNNP(.5, .5, e.point)));
		for (let e of this.triangles) for (let t = 0; t < 3; t++) {
			let r = e.Edges.getItem(t);
			n.push(q.mkDebugCurveTWCI(r.constrained ? 155 : 100, r.constrained ? .8 : .4, r.constrained ? "Pink" : "Navy", S.mkPP(r.upperSite.point, r.lowerSite.point)));
		}
		if (t != null) for (let e of t) n.push(q.mkDebugCurveTWCI(100, .5, "Red", e));
		for (let e of this.front) n.push(q.mkDebugCurveTWCI(100, 5.5, "Green", S.mkPP(e.Edge.upperSite.point, e.Edge.lowerSite.point)));
	}
	Show(t) {
		e.ShowCdt(Array.from(this.triangles.values()), this.front, null, null, [], t);
	}
	static ShowCdt(t, n, r, i, a, o) {
		let s = [];
		if (r != null) for (let e of r) s.push(q.mkDebugCurveTWCI(200, .1, "Red", e));
		if (i != null) for (let e of i) s.push(q.mkDebugCurveTWCI(200, .1, "Blue", e));
		if (n != null) for (let e of n) s.push(q.mkDebugCurveTWCI(200, .1, "Green", S.mkPP(e.Edge.upperSite.point, e.Edge.lowerSite.point)));
		for (let n of t) for (let t = 0; t < 3; t++) {
			let r = n.Edges.getItem(t);
			s.push(e.GetDebugCurveOfCdtEdge(r));
		}
		s = s.concat(a);
	}
	static GetDebugCurveOfCdtEdge(e) {
		return e.CcwTriangle == null || e.CwTriangle == null ? q.mkDebugCurveTWCI(255, .5, e.constrained ? "Brown" : "Black", S.mkPP(e.upperSite.point, e.lowerSite.point)) : q.mkDebugCurveTWCI(200, e.constrained ? .8 : .2, e.constrained ? "Pink" : "Navy", S.mkPP(e.upperSite.point, e.lowerSite.point));
	}
	PointEvent(t) {
		let n = this.ProjectToFront(t), r = { rightSite: null }, i = n.item.x + u.distanceEpsilon < t.point.x ? this.MiddleCase(t, n, r) : this.LeftCase(t, n, r), a = this.InsertSiteIntoFront(i, t, r.rightSite);
		this.TriangulateEmptySpaceToTheRight(a), a = e.FindNodeInFrontBySite(this.front, i), this.TriangulateEmptySpaceToTheLeft(a);
	}
	LeftCase(e, t, n) {
		let r = t.item;
		this.InsertAndLegalizeTriangle(e, r);
		let i = this.front.previous(t), a = i.item.LeftSite;
		return n.rightSite = t.item.RightSite, this.InsertAndLegalizeTriangle(e, i.item), this.front.deleteNodeInternal(i), this.front.remove(r), a;
	}
	MiddleCase(e, t, n) {
		let r = t.item.LeftSite;
		return n.rightSite = t.item.RightSite, this.InsertAndLegalizeTriangle(e, t.item), this.front.deleteNodeInternal(t), r;
	}
	TriangulateEmptySpaceToTheLeft(e) {
		let t = e.item.RightSite, n = this.front.previous(e);
		for (; n != null;) {
			let r = n.item, i = r.LeftSite, a = r.RightSite;
			if (a.point.sub(t.point).dot(i.point.sub(a.point)) < 0) e = this.ShortcutTwoFrontElements(n, e), n = this.front.previous(e);
			else {
				this.TryTriangulateBasinToTheLeft(e);
				break;
			}
		}
	}
	ShortcutTwoListElements(e) {
		let t = e.Next, n = ia.mkSSSEE(e.Start, e.End, t.End, e.Edge, t.Edge, this.createEdgeDelegate);
		this.triangles.add(n);
		let r = n.Edges.getItem(2);
		this.LegalizeEdge(e.Start, n.OppositeEdge(e.Start)), n = r.CcwTriangle ?? r.CwTriangle, this.LegalizeEdge(t.End, n.OppositeEdge(t.End));
		let i = new aa(r);
		return i.Start = e.Start, i.End = t.End, e.Prev.Next = i, i.Prev = e.Prev, i.Next = t.Next, t.Next.Prev = i, i;
	}
	ShortcutTwoFrontElements(e, t) {
		let n = e.item, r = t.item, i = ia.mkSSSEED(n.LeftSite, n.RightSite, r.RightSite, n.Edge, r.Edge, this.createEdgeDelegate);
		this.triangles.add(i), this.front.deleteNodeInternal(e), this.front.remove(r);
		let a = i.Edges.getItem(2);
		return this.LegalizeEdge(n.LeftSite, i.OppositeEdge(n.LeftSite)), i = a.CcwTriangle ?? a.CwTriangle, this.LegalizeEdge(r.RightSite, i.OppositeEdge(r.RightSite)), this.front.insert(new na(n.LeftSite, a));
	}
	TryTriangulateBasinToTheLeft(t) {
		if (!e.DropsSharpEnoughToTheLeft(t.item)) return;
		let n = new N.Stack();
		for (n.push(t.item.LeftSite);;) {
			let r = n.pop();
			t = e.FindNodeInFrontBySite(this.front, r);
			let i = this.front.previous(t);
			if (i == null) return;
			if (y.getTriangleOrientation(i.item.LeftSite.point, t.item.LeftSite.point, t.item.RightSite.point) == _.Counterclockwise) n.push(i.item.LeftSite), this.ShortcutTwoFrontElements(i, t);
			else if (t.item.LeftSite.point.y > t.item.RightSite.point.y) n.push(i.item.LeftSite);
			else {
				if (i.item.LeftSite.point.y <= i.item.RightSite.point.y) return;
				n.push(i.item.LeftSite);
			}
		}
	}
	static DropsSharpEnoughToTheLeft(e) {
		let t = e.Edge;
		if (e.RightSite !== t.upperSite) return !1;
		let n = t.lowerSite.point.sub(t.upperSite.point);
		return n.x >= .5 * n.y;
	}
	InsertSiteIntoFront(e, t, n) {
		let r = null, i = null;
		for (let a of t.Edges) if (i == null && a.lowerSite === e && (i = a), r == null && a.lowerSite === n && (r = a), i != null && r != null) break;
		return this.front.insert(new na(e, i)), this.front.insert(new na(t, r));
	}
	TriangulateEmptySpaceToTheRight(e) {
		let t = e.item.LeftSite.point, n = this.front.next(e);
		for (; n != null;) {
			let r = n.item, i = r.LeftSite, a = r.RightSite;
			if (i.point.sub(t).dot(a.point.sub(i.point)) < 0) e = this.ShortcutTwoFrontElements(e, n), n = this.front.next(e);
			else {
				this.TryTriangulateBasinToTheRight(e);
				break;
			}
		}
	}
	TryTriangulateBasinToTheRight(t) {
		if (!e.DropsSharpEnoughToTheRight(t.item)) return;
		let n = new N.Stack();
		for (n.push(t.item.LeftSite);;) {
			let r = n.pop();
			t = e.FindNodeInFrontBySite(this.front, r);
			let i = this.front.next(t);
			if (i == null) return;
			if (y.getTriangleOrientation(t.item.LeftSite.point, t.item.RightSite.point, i.item.RightSite.point) == _.Counterclockwise) this.ShortcutTwoFrontElements(t, i), n.push(r);
			else if (t.item.LeftSite.point.y > t.item.RightSite.point.y) n.push(t.item.RightSite);
			else {
				if (i.item.LeftSite.point.y >= i.item.RightSite.point.y) return;
				n.push(t.item.RightSite);
			}
		}
	}
	static DropsSharpEnoughToTheRight(e) {
		let t = e.Edge;
		if (e.LeftSite !== t.upperSite) return !1;
		let n = t.lowerSite.point.sub(t.upperSite.point);
		return n.x <= -.5 * n.y;
	}
	static FindNodeInFrontBySite(e, t) {
		return e.findLast((e) => e.LeftSite.point.x <= t.point.x);
	}
	InsertAndLegalizeTriangle(t, n) {
		if (y.getTriangleOrientation(t.point, n.LeftSite.point, n.RightSite.point) !== _.Collinear) {
			let e = ia.mkSED(t, n.Edge, this.createEdgeDelegate);
			this.triangles.add(e), this.LegalizeEdge(t, e.Edges.getItem(0));
		} else {
			let r = n.Edge;
			sa(r.upperSite.Edges, r);
			let i = r.CcwTriangle ?? r.CwTriangle, a = i.OppositeSite(r);
			e.RemoveTriangleButLeaveEdges(this.triangles, i), i = ia.mkSSSD(n.LeftSite, a, t, this.createEdgeDelegate);
			let o = ia.mkSSSD(n.RightSite, a, t, this.createEdgeDelegate);
			this.triangles.add(i), this.triangles.add(o), this.LegalizeEdge(t, i.OppositeEdge(t)), this.LegalizeEdge(t, o.OppositeEdge(t));
		}
	}
	LegalizeEdge(e, t) {
		t.constrained || t.CcwTriangle == null || t.CwTriangle == null || (t.CcwTriangle.Contains(e) ? this.LegalizeEdgeForOtherCwTriangle(e, t) : this.LegalizeEdgeForOtherCcwTriangle(e, t));
	}
	LegalizeEdgeForOtherCwTriangle(e, t) {
		let n = t.CwTriangle.Edges.index(t);
		if (ca(e, t.upperSite, t.CwTriangle.Sites.getItem(n + 2), t.lowerSite)) {
			let n = da(e, t);
			this.LegalizeEdge(e, n.CwTriangle.OppositeEdge(e)), this.LegalizeEdge(e, n.CcwTriangle.OppositeEdge(e));
		}
	}
	LegalizeEdgeForOtherCcwTriangle(e, t) {
		let n = t.CcwTriangle.Edges.index(t);
		if (ca(e, t.lowerSite, t.CcwTriangle.Sites.getItem(n + 2), t.upperSite)) {
			let n = da(e, t);
			this.LegalizeEdge(e, n.CwTriangle.OppositeEdge(e)), this.LegalizeEdge(e, n.CcwTriangle.OppositeEdge(e));
		}
	}
	ProjectToFront(e) {
		return this.front.findLast((t) => t.x <= e.point.x);
	}
	runEdgeInserter() {
		this.initEdgeInserter(), this.TraceEdgeThroughTriangles(), this.TriangulatePolygon0(this.rightPolygon, this.traversingEdge.upperSite, this.traversingEdge.lowerSite, !0), this.TriangulatePolygon0(this.leftPolygon, this.traversingEdge.upperSite, this.traversingEdge.lowerSite, !1), this.UpdateFront();
	}
	initEdgeInserter() {
		this.rightPolygon = [], this.leftPolygon = [], this.addedTriangles = [], this.piercedEdge = null, this.piercedTriangle = null, this.piercedToTheLeftFrontElemNode = null, this.piercedToTheRightFrontElemNode = null;
	}
	UpdateFront() {
		let e = /* @__PURE__ */ new Set();
		for (let t of this.addedTriangles) for (let n of t.Edges) if (n.CwTriangle == null || n.CcwTriangle == null) {
			if (n.lowerSite == this.p_2 && n.upperSite == this.p_1) continue;
			e.add(n);
		}
		for (let t of e) this.AddEdgeToFront(t);
	}
	AddEdgeToFront(e) {
		let t = e.upperSite.point.x < e.lowerSite.point.x ? e.upperSite : e.lowerSite;
		this.front.insert(new na(t, e));
	}
	TriangulatePolygon0(e, t, n, r) {
		e.length > 0 && this.TriangulatePolygon1(0, e.length - 1, e, t, n, r);
	}
	TriangulatePolygon1(e, t, n, r, i, a) {
		let o = n[e], s = e;
		for (let r = e + 1; r <= t; r++) {
			let e = n[r];
			l(e) && (s = r, o = e);
		}
		let c = ia.mkSSSD(r, i, o, this.createEdgeDelegate);
		this.triangles.add(c), this.addedTriangles.push(c), e < s && this.TriangulatePolygon1(e, s - 1, n, r, o, a), s < t && this.TriangulatePolygon1(s + 1, t, n, o, i, a);
		function l(e) {
			return a ? ua(e, r, o, i) : ua(e, r, i, o);
		}
	}
	TraceEdgeThroughTriangles() {
		this.initEdgeTracer(), this.Traverse();
	}
	Traverse() {
		for (; !this.BIsReached();) this.piercedToTheLeftFrontElemNode == null ? this.piercedToTheRightFrontElemNode == null ? this.ProcessPiercedEdge() : this.ProcessRightFrontPiercedElement() : this.ProcessLeftFrontPiercedElement();
		this.piercedTriangle != null && this.removePiercedTriangle(this.piercedTriangle), this.FindMoreRemovedFromFrontElements();
		for (let e of this.elementsToBeRemovedFromFront) this.front.remove(e);
	}
	ProcessLeftFrontPiercedElement() {
		let e = this.piercedToTheLeftFrontElemNode;
		do
			this.elementsToBeRemovedFromFront.push(e.item), this.AddSiteToLeftPolygon(e.item.LeftSite), e = this.front.previous(e);
		while (y.pointToTheLeftOfLine(e.item.LeftSite.point, this.a.point, this.b.point));
		if (this.elementsToBeRemovedFromFront.push(e.item), this.AddSiteToRightPolygon(e.item.LeftSite), e.item.LeftSite === this.b) {
			this.piercedToTheLeftFrontElemNode = e;
			return;
		}
		this.FindPiercedTriangle(e), this.piercedToTheLeftFrontElemNode = null;
	}
	FindPiercedTriangle(e) {
		let t = e.item.Edge, n = t.CcwTriangle ?? t.CwTriangle, r = n.Edges.index(t);
		for (let e = 1; e <= 2; e++) {
			let t = n.Edges.getItem(e + r), i = lr.sign(y.signedDoubledTriangleArea(t.lowerSite.point, this.a.point, this.b.point));
			if (lr.sign(y.signedDoubledTriangleArea(t.upperSite.point, this.a.point, this.b.point)) * i <= 0) {
				this.piercedTriangle = n, this.piercedEdge = t;
				break;
			}
		}
	}
	FindMoreRemovedFromFrontElements() {
		for (let t of this.removedTriangles) for (let n of t.Edges) if (n.CcwTriangle == null && n.CwTriangle == null) {
			let t = n.upperSite.point.x < n.lowerSite.point.x ? n.upperSite : n.lowerSite, r = e.FindNodeInFrontBySite(this.front, t);
			r.item.Edge === n && this.elementsToBeRemovedFromFront.push(r.item);
		}
	}
	ProcessPiercedEdge() {
		this.piercedEdge.CcwTriangle === this.piercedTriangle ? (this.AddSiteToLeftPolygon(this.piercedEdge.lowerSite), this.AddSiteToRightPolygon(this.piercedEdge.upperSite)) : (this.AddSiteToLeftPolygon(this.piercedEdge.upperSite), this.AddSiteToRightPolygon(this.piercedEdge.lowerSite)), this.removePiercedTriangle(this.piercedTriangle), this.PrepareNextStateAfterPiercedEdge();
	}
	PrepareNextStateAfterPiercedEdge() {
		let t = this.piercedEdge.CwTriangle ?? this.piercedEdge.CcwTriangle, n = t.Edges.index(this.piercedEdge);
		for (let r = 1; r <= 2; r++) {
			let i = t.Edges.getItem(r + n), a = lr.sign(y.signedDoubledTriangleArea(i.lowerSite.point, this.a.point, this.b.point));
			if (lr.sign(y.signedDoubledTriangleArea(i.upperSite.point, this.a.point, this.b.point)) * a <= 0) {
				if (i.CwTriangle != null && i.CcwTriangle != null) {
					this.piercedTriangle = t, this.piercedEdge = i;
					break;
				}
				this.piercedTriangle = null, this.piercedEdge = null;
				let n = i.upperSite.point.x < i.lowerSite.point.x ? i.upperSite : i.lowerSite, r = e.FindNodeInFrontBySite(this.front, n);
				n.point.x < this.a.point.x ? this.piercedToTheLeftFrontElemNode = r : this.piercedToTheRightFrontElemNode = r, this.removePiercedTriangle(i.CwTriangle ?? i.CcwTriangle);
				break;
			}
		}
	}
	removePiercedTriangle(e) {
		this.triangles.delete(e);
		for (let t of e.Edges) t.CwTriangle === e ? t.CwTriangle = null : t.CcwTriangle = null, this.removedTriangles.push(e);
	}
	ProcessRightFrontPiercedElement() {
		let e = this.piercedToTheRightFrontElemNode;
		do
			this.elementsToBeRemovedFromFront.push(e.item), this.AddSiteToRightPolygon(e.item.RightSite), e = this.front.next(e);
		while (y.pointToTheRightOfLine(e.item.RightSite.point, this.a.point, this.b.point));
		if (this.elementsToBeRemovedFromFront.push(e.item), this.AddSiteToLeftPolygon(e.item.RightSite), e.item.RightSite === this.b) {
			this.piercedToTheRightFrontElemNode = e;
			return;
		}
		this.FindPiercedTriangle(e), this.piercedToTheRightFrontElemNode = null;
	}
	AddSiteToLeftPolygon(e) {
		this.AddSiteToPolygonWithCheck(e, this.leftPolygon);
	}
	AddSiteToPolygonWithCheck(e, t) {
		e !== this.b && (t.length === 0 || t[t.length - 1] !== e) && t.push(e);
	}
	AddSiteToRightPolygon(e) {
		this.AddSiteToPolygonWithCheck(e, this.rightPolygon);
	}
	BIsReached() {
		let e = this.piercedToTheLeftFrontElemNode ?? this.piercedToTheRightFrontElemNode;
		return e == null ? this.piercedEdge.IsAdjacent(this.b) : e.item.Edge.IsAdjacent(this.b);
	}
	initEdgeTracer() {
		this.elementsToBeRemovedFromFront = [], this.a = this.traversingEdge.upperSite, this.b = this.traversingEdge.lowerSite, this.removedTriangles = [];
		let t = e.FindNodeInFrontBySite(this.front, this.a), n = this.front.previous(t);
		if (y.pointToTheLeftOfLine(this.b.point, n.item.LeftSite.point, n.item.RightSite.point)) this.piercedToTheLeftFrontElemNode = n;
		else if (y.pointToTheRightOfLine(this.b.point, t.item.RightSite.point, t.item.LeftSite.point)) this.piercedToTheRightFrontElemNode = t;
		else for (let e of this.a.Edges) {
			let t = e.CcwTriangle;
			if (t == null || y.pointToTheLeftOfLine(this.b.point, e.lowerSite.point, e.upperSite.point)) continue;
			let n = t.Edges.index(e), r = t.Sites.getItem(n + 2);
			if (y.pointToTheLeftOfLineOrOnLine(this.b.point, r.point, e.upperSite.point)) {
				this.piercedEdge = t.Edges.getItem(n + 1), this.piercedTriangle = t;
				break;
			}
		}
	}
};
function sa(e, t) {
	if (e.length === 0) return;
	let n = e.findIndex((e) => t === e);
	n >= 0 && (n !== e.length - 1 && (e[n] = e[e.length - 1]), e.pop());
}
function ca(e, t, n, r) {
	return la(e, t, n, r) && ua(e, t, n, r);
}
function la(e, t, n, r) {
	return y.getTriangleOrientation(t.point, e.point, n.point) === _.Clockwise && y.getTriangleOrientation(n.point, e.point, r.point) === _.Clockwise;
}
function ua(e, t, n, r) {
	let i = t.point.x - e.point.x, a = t.point.y - e.point.y, o = n.point.x - e.point.x, s = n.point.y - e.point.y, c = r.point.x - e.point.x, l = r.point.y - e.point.y, d = i * i + a * a, f = o * o + s * s, p = c * c + l * l;
	return i * (s * p - l * f) - o * (a * p - l * d) + c * (a * f - s * d) > u.tolerance;
}
function da(e, t) {
	let n, r;
	t.CcwTriangle.Contains(e) ? (n = t.CcwTriangle, r = t.CwTriangle) : (n = t.CwTriangle, r = t.CcwTriangle);
	let i = n.Edges.index(t), a = r.Edges.index(t), o = r.Sites.getItem(a + 2), s = n.Edges.getItem(i + 1), c = r.Edges.getItem(a + 1), l = fa.GetOrCreateEdge(e, o);
	return n.Sites.setItem(i + 1, o), n.Edges.setItem(i, c), n.Edges.setItem(i + 1, l), r.Sites.setItem(a + 1, e), r.Edges.setItem(a, s), r.Edges.setItem(a + 1, l), c.lowerSite === o ? c.CcwTriangle = n : c.CwTriangle = n, s.lowerSite === e ? s.CcwTriangle = r : s.CwTriangle = r, l.upperSite === e ? (l.CcwTriangle = r, l.CwTriangle = n) : (l.CcwTriangle = n, l.CwTriangle = r), sa(t.upperSite.Edges, t), l;
}
//#endregion
//#region node_modules/@msagl/core/dist/routing/ConstrainedDelaunayTriangulation/Cdt.js
var fa = class e extends B {
	constructor(e, t, n) {
		super(null), this.isolatedSites = [], this.obstacles = [], this.PointsToSites = new Nt(), this.simplifyObstacles = !0, this.rectangleNodeOnTriangles = null, this.isolatedSites = e, this.obstacles = t, this.isolatedSegments = n;
	}
	static constructor_(t) {
		let n = new e(null, null, null);
		return n.isolatedSitesWithObject = t, n;
	}
	FillAllInputSites() {
		if (this.isolatedSitesWithObject != null) for (let e of this.isolatedSitesWithObject) this.AddSite(e[0], e[1]);
		if (this.isolatedSites != null) for (let e of this.isolatedSites) this.AddSite(e, null);
		if (this.obstacles != null) for (let e of this.obstacles) this.AddPolylineToAllInputSites(e);
		if (this.isolatedSegments != null) for (let e of this.isolatedSegments) this.AddConstrainedEdge(e.A, e.B, null);
		this.AddP1AndP2(), this.allInputSites = Array.from(this.PointsToSites.values());
	}
	AddSite(e, t) {
		let n;
		return (n = this.PointsToSites.get(e)) ? n.Owner = t : (n = ta.mkSO(e, t), this.PointsToSites.set(e, n)), n;
	}
	AddP1AndP2() {
		let e = O.mkEmpty();
		for (let t of this.PointsToSites.keys()) e.add(t);
		this.P1 = new ta(e.leftBottom.add(new y(-10, -10))), this.P2 = new ta(e.rightBottom.add(new y(10, -10)));
	}
	AddPolylineToAllInputSites(e) {
		if (this.simplifyObstacles) for (let t = e.startPoint; t != null;) {
			let n = t.point;
			if (t = t.next, !t) break;
			for (; t.next && y.getTriangleOrientation(n, t.point, t.next.point) === _.Collinear;) t = t.next;
			this.AddConstrainedEdge(n, t.point, e);
		}
		else for (let t = e.startPoint; t.next != null; t = t.next) this.AddConstrainedEdge(t.point, t.next.point, e);
		e.closed && this.AddConstrainedEdge(e.endPoint.point, e.startPoint.point, e);
	}
	AddConstrainedEdge(t, n, r) {
		let i = e.AbovePP(t, n), a, o;
		i > 0 ? (a = this.AddSite(t, r), o = this.AddSite(n, r)) : (a = this.AddSite(n, r), o = this.AddSite(t, r));
		let s = e.CreateEdgeOnOrderedCouple(a, o);
		s.constrained = !0;
	}
	static GetOrCreateEdge(t, n) {
		return e.AboveCC(t, n) === 1 ? t.EdgeBetweenUpperSiteAndLowerSite(n) ?? e.CreateEdgeOnOrderedCouple(t, n) : n.EdgeBetweenUpperSiteAndLowerSite(t) ?? e.CreateEdgeOnOrderedCouple(n, t);
	}
	static CreateEdgeOnOrderedCouple(e, t) {
		return new ea(e, t);
	}
	GetTriangles() {
		return this.sweeper.triangles;
	}
	run() {
		this.Initialization(), this.SweepAndFinalize();
	}
	SweepAndFinalize() {
		this.sweeper = new oa(this.allInputSites, this.P1, this.P2, e.GetOrCreateEdge), this.sweeper.run(), this.cleanRemovedEdges();
	}
	cleanRemovedEdges() {
		for (let e of this.PointsToSites.values()) e.cleanRemovedEdges();
	}
	Initialization() {
		this.FillAllInputSites(), this.allInputSites.sort(e.OnComparison);
	}
	static OnComparison(t, n) {
		return e.AboveCC(t, n);
	}
	static AbovePP(e, t) {
		let n = e.y - t.y;
		return n > 0 ? 1 : n < 0 ? -1 : (n = e.x - t.x, n > 0 ? -1 : +(n < 0));
	}
	static AboveCC(t, n) {
		return e.AbovePP(t.point, n.point);
	}
	RestoreEdgeCapacities() {
		for (let e of this.allInputSites) for (let t of e.Edges) t.constrained || (t.ResidualCapacity = t.Capacity);
	}
	SetInEdges() {
		for (let e of this.PointsToSites.values()) for (let t of e.Edges) t.lowerSite.AddInEdge(t);
	}
	FindSite(e) {
		return this.PointsToSites.get(e);
	}
	static PointIsInsideOfTriangle(e, t) {
		for (let n = 0; n < 3; n++) {
			let r = t.Sites.getItem(n).point, i = t.Sites.getItem(n + 1).point;
			if (y.signedDoubledTriangleArea(e, r, i) < u.distanceEpsilon * -1) return !1;
		}
		return !0;
	}
	getRectangleNodeOnTriangles() {
		return this.rectangleNodeOnTriangles ??= F(Array.from(this.GetTriangles().values()).map((e) => I(e, e.BoundingBox()))), this.rectangleNodeOnTriangles;
	}
};
function pa(e) {
	let t = Array.from(e.GetAllLeaves()), n = e.irect, r = n.diagonal / 4, i = n.clone();
	return i.pad(r), ma(t.concat([i.perimeter()]));
}
function ma(e) {
	let t = new fa(null, e, null);
	return t.run(), t;
}
//#endregion
//#region node_modules/@msagl/core/dist/math/geometry/Interval.js
var ha = class e {
	constructor(e, t) {
		this.start = e, this.end = t;
	}
	add(e) {
		this.add_d(e);
	}
	add_rect(e) {
		let t = e, n = this.clone();
		return n.add_d(t.start), n.add_d(t.end), n;
	}
	clone() {
		return new e(this.start, this.end);
	}
	contains_point(e) {
		return this.contains_d(e);
	}
	contains_rect(e) {
		let t = e;
		return this.contains_d(t.start) && this.contains_d(t.end);
	}
	intersection_rect(t) {
		let n = t;
		return new e(Math.max(this.start, n.start), Math.min(this.end, n.end));
	}
	intersects_rect(e) {
		let t = e;
		return this.intersects(t);
	}
	contains_point_radius(e, t) {
		return this.contains_d(e - t) && this.contains_d(e + t);
	}
	static mkInterval(t, n) {
		let r = new e(t.start, t.end);
		return r.add_d(n.start), r.add_d(n.end), r;
	}
	add_d(e) {
		this.start > e && (this.start = e), this.end < e && (this.end = e);
	}
	get Start() {
		return this.start;
	}
	set Start(e) {
		this.start = e;
	}
	get Length() {
		return this.end - this.start;
	}
	contains_d(e) {
		return this.start <= e && e <= this.end;
	}
	GetInRange(e) {
		return e < this.start ? this.start : e > this.end ? this.end : e;
	}
	intersects(e) {
		return e.start > this.end + u.distanceEpsilon ? !1 : !(e.end < this.start - u.distanceEpsilon);
	}
}, ga = class {
	get Count() {
		return this.heapSize;
	}
	constructor(e) {
		this.heapSize = 0, this._priors = Array(e), this._heap = Array(e + 1), this._reverse_heap = Array(e);
	}
	SwapWithParent(e) {
		let t = this._heap[e >> 1];
		this.PutAtI(e >> 1, this._heap[e]), this.PutAtI(e, t);
	}
	Enqueue(e, t) {
		this.heapSize++;
		let n = this.heapSize;
		for (this._priors[e] = t, this.PutAtI(n, e); n > 1 && this._priors[this._heap[n >> 1]] > t;) this.SwapWithParent(n), n >>= 1;
	}
	PutAtI(e, t) {
		this._heap[e] = t, this._reverse_heap[t] = e;
	}
	Dequeue() {
		if (this.heapSize === 0) throw Error();
		let e = this._heap[1];
		if (this.heapSize > 1) {
			this.PutAtI(1, this._heap[this.heapSize]);
			let e = 1;
			for (;;) {
				let t = e, n = e << 1;
				n <= this.heapSize && this._priors[this._heap[n]] < this._priors[this._heap[e]] && (t = n);
				let r = n + 1;
				if (r <= this.heapSize && this._priors[this._heap[r]] < this._priors[this._heap[t]] && (t = r), t !== e) this.SwapWithParent(t);
				else break;
				e = t;
			}
		}
		return this.heapSize--, e;
	}
	IsEmpty() {
		return this.heapSize === 0;
	}
	DecreasePriority(e, t) {
		this._priors[e] = t;
		let n = this._reverse_heap[e];
		for (; n > 1 && this._priors[this._heap[n]] < this._priors[this._heap[n >> 1]];) this.SwapWithParent(n), n >>= 1;
	}
}, _a = class {
	constructor(e, t, n, r) {
		this._numberOfOverlaps = 0, this._proximityEdges = e, this._nodeSizes = t, this._nodePositions = n, this._forLayers = r, this._q = new ga(t.length * 2);
	}
	Run() {
		return this.InitQueue(), this.FindOverlaps(), this._numberOfOverlaps;
	}
	FindOverlaps() {
		for (; this._q.Count > 0;) {
			let e = this._q.Dequeue();
			e < this._nodePositions.length ? (this.FindOverlapsWithInterval(e), this.AddIntervalToTree(e)) : (e -= this._nodePositions.length, this.RemoveIntervalFromTree(e));
		}
	}
	RemoveIntervalFromTree(e) {
		this._intervalTree.Remove(this.GetInterval(e), e);
	}
	AddIntervalToTree(e) {
		let t = this.GetInterval(e);
		this._intervalTree ??= it([]), this._intervalTree.Add(t, e);
	}
	FindOverlapsWithInterval(e) {
		if (this._intervalTree == null) return;
		let t = this.GetInterval(e);
		for (let n of this._intervalTree.GetAllIntersecting(t)) {
			let t = xa.GetIdealEdge(e, n, this._nodePositions[e], this._nodePositions[n], this._nodeSizes);
			if (t.overlapFactor <= 1) return;
			this._proximityEdges.push(t), this._numberOfOverlaps++;
		}
	}
	GetInterval(e) {
		let t = this._nodeSizes[e].width / 2, n = this._nodePositions[e].x;
		return new ha(n - t, n + t);
	}
	InitQueue() {
		for (let e = 0; e < this._nodeSizes.length; e++) {
			let t = this._nodeSizes[e].height / 2, n = this._nodePositions[e].y;
			this._q.Enqueue(e, n - t), this._q.Enqueue(this._nodeSizes.length + e, n + t);
		}
	}
}, va = class {
	constructor(e, t, n) {
		this.treeNodes = /* @__PURE__ */ new Set(), this.hedgehog = /* @__PURE__ */ new Map(), this.graph = e, this.weight = t, this.root = n, this.q = new ga(this.graph.nodeCount);
	}
	NodeIsInTree(e) {
		return this.treeNodes.has(e);
	}
	GetTreeEdges() {
		let e = [];
		for (this.Init(); e.length < this.graph.nodeCount - 1 && this.q.Count > 0;) this.AddEdgeToTree(e);
		return e;
	}
	AddEdgeToTree(e) {
		let t = this.q.Dequeue(), n = this.hedgehog.get(t);
		this.treeNodes.add(t), e.push(n), this.UpdateOutEdgesOfV(t), this.UpdateInEdgesOfV(t);
	}
	UpdateOutEdgesOfV(e) {
		for (let t of this.graph.outEdges[e]) {
			let e = t.target;
			if (this.NodeIsInTree(e)) continue;
			let n = this.hedgehog.get(e);
			if (n) {
				let r = this.weight(n), i = this.weight(t);
				i < r && (this.q.DecreasePriority(e, i), this.hedgehog.set(e, t));
			} else this.q.Enqueue(e, this.weight(t)), this.hedgehog.set(e, t);
		}
	}
	UpdateInEdgesOfV(e) {
		for (let t of this.graph.inEdges[e]) {
			let e = t.source;
			if (this.NodeIsInTree(e)) continue;
			let n = this.hedgehog.get(e);
			if (n) {
				let r = this.weight(n), i = this.weight(t);
				i < r && (this.q.DecreasePriority(e, i), this.hedgehog.set(e, t));
			} else this.q.Enqueue(e, this.weight(t)), this.hedgehog.set(e, t);
		}
	}
	Init() {
		this.treeNodes.add(this.root);
		for (let e of this.graph.outEdges[this.root]) {
			let t = this.weight(e);
			this.q.Enqueue(e.target, t), this.hedgehog.set(e.target, e);
		}
		for (let e of this.graph.inEdges[this.root]) {
			let t = this.weight(e);
			this.q.Enqueue(e.source, t), this.hedgehog.set(e.source, e);
		}
	}
}, ya = class e {
	static GetMst(e, t) {
		if (e.length === 0) return null;
		let n = e.map((e) => new V(e.source, e.target)), r = new gt();
		for (let t = 0; t < e.length; t++) r.setPair(n[t], e[t]);
		return new va(Dn(n, t), (e) => r.get(e.source, e.target).weight, n[0].source).GetTreeEdges().map((e) => r.get(e.source, e.target));
	}
	static GetMstOnCdt(t, n) {
		let r = Array.from(t.PointsToSites.values()), i = /* @__PURE__ */ new Map();
		for (let e = 0; e < r.length; e++) i.set(r[e], e);
		let a = e.GetEdges(r, i);
		return new va(En(Array.from(a.keys())), (e) => n(a.get(e.source, e.target)), 0).GetTreeEdges().map((e) => a.get(e.source, e.target));
	}
	static GetEdges(e, t) {
		let n = new gt();
		for (let r = 0; r < e.length; r++) {
			let i = e[r], a = t.get(i);
			for (let e of i.Edges) n.set(a, t.get(e.lowerSite), e);
		}
		return n;
	}
}, ba = class e {
	constructor() {
		this.epsilon = .01, this.iterationsMax = 1e3, this.stopOnMaxIterat = !1, this.nodeSeparation = 4, this.randomizationSeed = 1, this.randomizationShift = .1;
	}
	get StopOnMaxIterat() {
		return this.stopOnMaxIterat;
	}
	set StopOnMaxIterat(e) {
		this.stopOnMaxIterat = e;
	}
	get Epsilon() {
		return this.epsilon;
	}
	set Epsilon(e) {
		this.epsilon = e;
	}
	get IterationsMax() {
		return this.iterationsMax;
	}
	set IterationsMax(e) {
		this.iterationsMax = e;
	}
	get NodeSeparation() {
		return this.nodeSeparation;
	}
	set NodeSeparation(e) {
		this.nodeSeparation = e;
	}
	get RandomizationSeed() {
		return this.randomizationSeed;
	}
	set RandomizationSeed(e) {
		this.randomizationSeed = e;
	}
	get RandomizationShift() {
		return this.randomizationShift;
	}
	set RandomizationShift(e) {
		this.randomizationShift = e;
	}
	Clone() {
		let t = new e();
		return t.Epsilon = this.Epsilon, t.IterationsMax = this.IterationsMax, t.StopOnMaxIterat = this.StopOnMaxIterat, t.NodeSeparation = this.NodeSeparation, t.RandomizationSeed = this.RandomizationSeed, t.RandomizationShift = this.randomizationShift, t;
	}
}, xa = class e {
	constructor(e, t) {
		this._settings = e, this._nodes = t;
	}
	static RemoveOverlaps(t, n) {
		let r = new ba();
		r.RandomizationShift = 1, r.NodeSeparation = n, new e(r, t).RemoveOverlaps();
	}
	RemoveOverlaps() {
		if (this._nodes.length < 3) {
			this.RemoveOverlapsOnTinyGraph();
			return;
		}
		let e = {
			nodePositions: [],
			nodeSizes: []
		};
		for (Sa(this._settings, this._nodes, e, this._settings.RandomizationShift), this.lastRunNumberIterations = 0; this.OneIteration(e.nodePositions, e.nodeSizes, !1);) this.lastRunNumberIterations++;
		for (; this.OneIteration(e.nodePositions, e.nodeSizes, !0);) this.lastRunNumberIterations++;
		for (let t = 0; t < this._nodes.length; t++) this._nodes[t].center = e.nodePositions[t];
	}
	RemoveOverlapsOnTinyGraph() {
		if (this._nodes.length !== 1 && this._nodes.length === 2) {
			let e = this._nodes[0], t = this._nodes[1];
			y.closeDistEps(e.center, t.center) && (t.center = t.center.add(new y(.001, 0)));
			let n = this.GetIdealDistanceBetweenTwoNodes(e, t), r = y.middle(e.center, t.center), i = e.center.sub(t.center), a = i.length;
			i = i.mul(n / a * .5), e.center = r.add(i), t.center = r.sub(i);
		}
	}
	GetIdealDistanceBetweenTwoNodes(e, t) {
		let n = e.center.sub(t.center), r = Math.abs(n.x), i = Math.abs(n.y), a = (e.width + t.width) / 2 + this._settings.NodeSeparation, o = (e.height + t.height) / 2 + this._settings.NodeSeparation, s = Infinity, c = Infinity;
		return r > u.tolerance && (s = a / r), i > u.tolerance && (c = o / i), Math.min(s, c) * n.length;
	}
	static AvgEdgeLength(e) {
		let t = 0, n = 0;
		for (let r of e) for (let e of r.outEdges()) n += r.center.sub(e.target.center).length, t++;
		return t > 0 ? n / t : 1;
	}
	OneIteration(t, n, r) {
		let i = [];
		for (let e = 0; e < t.length; e++) i.push([t[e], e]);
		let a = fa.constructor_(i);
		a.run();
		let o = /* @__PURE__ */ new Map();
		for (let e = 0; e < t.length; e++) o.set(a.PointsToSites.get(t[e]), e);
		let s = 0, c = [];
		for (let t of a.PointsToSites.values()) for (let r of t.Edges) {
			let t = r.upperSite.point, i = r.lowerSite.point, a = o.get(r.upperSite), l = o.get(r.lowerSite), u = e.GetIdealEdge(a, l, t, i, n);
			c.push(u), u.overlapFactor > 1 && s++;
		}
		if (s === 0 || r) {
			let e = this.FindProximityEdgesWithSweepLine(c, n, t);
			if (s === 0 && e === 0 || s === 0 && !r) return !1;
		}
		let l = ya.GetMst(c, t.length);
		return e.MoveNodePositions(l, t, l[0].source), !0;
	}
	FindProximityEdgesWithSweepLine(e, t, n) {
		return new _a(e, t, n, this._overlapForLayers).Run();
	}
	static GetIdealEdge(t, n, r, i, a) {
		let o = { overlapFactor: 0 }, s = e.GetIdealEdgeLength(t, n, r, i, a, o), c = r.sub(i).length, l = O.mkSizeCenter(a[t], r), u = O.mkSizeCenter(a[n], i), d = o.overlapFactor > 1 ? c - s : e.GetDistanceRects(l, u);
		return {
			source: Math.min(t, n),
			target: Math.max(t, n),
			overlapFactor: o.overlapFactor,
			idealDistance: s,
			weight: d
		};
	}
	static GetIdealEdgeLength(e, t, n, r, i, a) {
		let o = n.sub(r), s = o.length, c = Math.abs(o.x), l = Math.abs(o.y), u = (i[e].width + i[t].width) / 2, d = (i[e].height + i[t].height) / 2;
		if (c >= u || l >= d) return a.overlapFactor = 1, o.length;
		let f, p = 1e-10;
		if (c > p) f = l > p ? Math.min(u / c, d / l) : u / c;
		else if (l > p) f = d / l;
		else return a.overlapFactor = 2, Math.sqrt(u * u + d * d) / 4;
		return f = Math.max(f, 1.001), a.overlapFactor = f, f * s;
	}
	static GetDistanceRects(e, t) {
		if (e.intersects(t)) return 0;
		let n = 0, r = 0;
		return (e.right < t.left || t.right < e.left) && (r = e.left - t.right), e.top < t.bottom ? n = t.bottom - e.top : t.top < e.bottom && (n = e.bottom - t.top), Math.sqrt(r * r + n * n);
	}
	static MoveNodePositions(t, n, r) {
		let i = n.map((e) => e.clone()), a = /* @__PURE__ */ new Set();
		a.add(r);
		for (let r = 0; r < t.length; r++) {
			let o = t[r];
			a.has(o.source) ? e.MoveNode(o.source, o.target, i, n, a, o.idealDistance) : e.MoveNode(o.target, o.source, i, n, a, o.idealDistance);
		}
	}
	static MoveNode(e, t, n, r, i, a) {
		let o = n[t].sub(n[e]);
		o = o.mul(a / o.length + .01), r[t] = r[e].add(o), i.add(t);
	}
	GetLastRunIterations() {
		return this.lastRunNumberIterations;
	}
};
function Sa(e, t, n, r) {
	n.nodePositions = t.map((e) => e.center), r && Ca(n.nodePositions, new _n(0, 0), r), n.nodeSizes = t.map((t) => {
		let n = t.boundingBox.size;
		return n.width += e.NodeSeparation, n.height += e.NodeSeparation, n;
	});
}
function Ca(e, t, n) {
	let r = new R();
	for (let i = 0; i < e.length; i++) {
		let a = e[i];
		if (n || r.has(a)) do
			a = new y(a.x + (2 * t.random() - 1) * n, a.y + (2 * t.random() - 1) * n);
		while (r.has(a));
		e[i] = a, r.add(a);
	}
}
//#endregion
//#region node_modules/@msagl/core/dist/layout/mds/mDSGraphLayout.js
var wa = class e extends B {
	constructor(e, t, n, r) {
		super(n), this.settings = e, this.graph = t, this.length = r;
	}
	run() {
		this.LayoutConnectedGraphWithMds(), this.graph.pumpTheBoxToTheGraphWithMargins();
	}
	static ScaleToAverageEdgeLength(e, t, n, r) {
		let i = /* @__PURE__ */ new Map(), a = 0;
		for (let t of e.shallowNodes) i.set(t, a), a++;
		let o = 0, s = 0;
		for (let a of e.shallowEdges) {
			let e = i.get(a.source), c = i.get(a.target);
			s += Math.sqrt((t[e] - t[c]) ** 2 + (n[e] - n[c]) ** 2), o += r(a);
		}
		if (o > 0 && (s /= o), s > 0) for (let e = 0; e < t.length; e++) t[e] /= s, n[e] /= s;
	}
	static LayoutGraphWithMds(t, n, r, i) {
		if (r.x = Array(t.shallowNodeCount), r.y = Array(t.shallowNodeCount), r.x.length === 0) return;
		if (r.x.length === 1) {
			r.x[0] = r.y[0] = 0;
			return;
		}
		let a = Math.min(n.PivotNumber, t.shallowNodeCount), o = n.GetNumberOfIterationsWithMajorization(t.shallowNodeCount), s = n.Exponent, c = Array(a), l = new Zi(t, c, i);
		l.run();
		let u = l.Result;
		if ($i.LandmarkClassicalScaling(u, r, c), e.ScaleToAverageEdgeLength(t, r.x, r.y, i), o > 0) {
			let e = new Xi(t, i);
			e.run();
			let n = e.Result, a = $i.ExponentialWeightMatrix(n, s);
			$i.DistanceScalingSubset(n, r.x, r.y, a, o);
		}
	}
	LayoutConnectedGraphWithMds() {
		let t = {
			x: [],
			y: []
		};
		e.LayoutGraphWithMds(this.graph, this.settings, t, this.length), this.settings.RotationAngle !== 0 && Qi.Rotate(t.x, t.y, this.settings.RotationAngle);
		let n = 0;
		for (let e of this.graph.shallowNodes) e.boundingBox && (e.center = new y(t.x[n] * this.settings.ScaleX, t.y[n] * this.settings.ScaleY)), n++;
		this.settings.removeOverlaps && xa.RemoveOverlaps(Array.from(this.graph.shallowNodes), this.settings.NodeSeparation), this.graph.pumpTheBoxToTheGraphWithMargins();
	}
	ScaleNodes(e, t) {
		for (let n of e) n.center = n.center.mul(t);
	}
	static PackGraphs(e, t) {
		if (e.length === 0) return O.mkEmpty();
		if (e.length === 1) return e[0].boundingBox;
		let n = e.map((e) => e.boundingBox), r = [];
		for (let t of e) r.push({
			g: t,
			lb: t.boundingBox.leftBottom.clone()
		});
		let i = new rt(n, t.PackingAspectRatio);
		i.run();
		for (let { g: e, lb: t } of r) {
			let n = e.boundingBox.leftBottom.sub(t);
			e.translate(n);
		}
		return new O({
			left: 0,
			bottom: 0,
			right: i.PackedWidth,
			top: i.PackedHeight
		});
	}
}, Ta = class e {
	constructor() {
		this.commonSettings = new Ki(), this.pivotNumber = 50, this.iterationsWithMajorization = 30, this.scaleX = 100, this.scaleY = 100, this.exponent = -2, this.rotationAngle = 0, this._removeOverlaps = !0, this._callIterationsWithMajorizationThreshold = 2e3, this.adjustScale = !1;
	}
	static fromJSON(t) {
		let n = new e();
		return t.pivotNumber && (n.pivotNumber = t.pivotNumber), t.iterationsWithMajorization && (n.iterationsWithMajorization = t.iterationsWithMajorization), t.scaleX && (n.scaleX = t.scaleX), t.scaleY && (n.scaleY = t.scaleY), t.exponent && (n.exponent = t.exponent), t.rotationAngle && (n.rotationAngle = t.rotationAngle), t.removeOverlaps != null && (n._removeOverlaps = t.removeOverlaps), t._callIterationsWithMajorizationThreshold && (n._callIterationsWithMajorizationThreshold = t._callIterationsWithMajorizationThreshold), n;
	}
	toJSON() {
		let e = {};
		return this.pivotNumber != 50 && (e.pivotNumber = this.pivotNumber), this.iterationsWithMajorization != 30 && (e.iterationsWithMajorization = this.iterationsWithMajorization), this.scaleX != 200 && (e.scaleX = this.scaleX), this.scaleY != 200 && (e.scaleY = this.scaleY), this.exponent != -2 && (e.exponent = this.exponent), this.rotationAngle != 0 && (e.rotationAngle = this.rotationAngle), this._removeOverlaps || (e.removeOverlaps = this._removeOverlaps), this._callIterationsWithMajorizationThreshold != 3e3 && (e._callIterationsWithMajorizationThreshold = this._callIterationsWithMajorizationThreshold), e;
	}
	get NodeSeparation() {
		return this.commonSettings.NodeSeparation;
	}
	set NodeSeparation(e) {
		this.commonSettings.NodeSeparation = e;
	}
	get edgeRoutingSettings() {
		return this.commonSettings.edgeRoutingSettings;
	}
	set edgeRoutingSettings(e) {
		this.commonSettings.edgeRoutingSettings = e;
	}
	get removeOverlaps() {
		return this._removeOverlaps;
	}
	set removeOverlaps(e) {
		this._removeOverlaps = e;
	}
	get PivotNumber() {
		return this.pivotNumber;
	}
	set PivotNumber(e) {
		this.pivotNumber = e;
	}
	get IterationsWithMajorization() {
		return this.iterationsWithMajorization;
	}
	set IterationsWithMajorization(e) {
		this.iterationsWithMajorization = e;
	}
	get ScaleX() {
		return this.scaleX;
	}
	set ScaleX(e) {
		this.scaleX = e;
	}
	get ScaleY() {
		return this.scaleY;
	}
	set ScaleY(e) {
		this.scaleY = e;
	}
	get Exponent() {
		return this.exponent;
	}
	set Exponent(e) {
		this.exponent = e;
	}
	get RotationAngle() {
		return this.rotationAngle;
	}
	set RotationAngle(e) {
		this.rotationAngle = e % 360;
	}
	get AdjustScale() {
		return this.adjustScale;
	}
	set AdjustScale(e) {
		this.adjustScale = e;
	}
	GetNumberOfIterationsWithMajorization(e) {
		return e > this.CallIterationsWithMajorizationThreshold ? 0 : this.IterationsWithMajorization;
	}
	get CallIterationsWithMajorizationThreshold() {
		return this._callIterationsWithMajorizationThreshold;
	}
	set CallIterationsWithMajorizationThreshold(e) {
		this._callIterationsWithMajorizationThreshold = e;
	}
}, Ea = class extends B {
	get scaleX() {
		return this.settings.ScaleX;
	}
	set scaleX(e) {
		this.settings.ScaleX = e;
	}
	get scaleY() {
		return this.settings.ScaleY;
	}
	set scaleY(e) {
		this.settings.ScaleY = e;
	}
	constructor(e, t, n, r) {
		super(t), this.graph = e, this.length = n, this.settings = r, this.settings.ScaleX = this.settings.ScaleY = 200;
	}
	run() {
		new wa(this.settings, this.graph, this.cancelToken, this.length).run();
	}
};
//#endregion
//#region node_modules/@msagl/core/dist/routing/StraightLineEdges.js
function Da(e, t, n) {
	if (t) for (let e of t) {
		if (n && n.canceled) return;
		Oa.RouteEdge(e);
	}
	else for (let t of e.nodesBreadthFirst) {
		if (n && n.canceled) return;
		for (let e of t.outEdges()) e.curve ?? Oa.RouteEdge(e);
		for (let e of t.selfEdges()) e.curve ?? Oa.RouteEdge(e);
	}
}
var Oa = class e extends B {
	constructor(e, t) {
		super(null), this.edges = e, this.padding = t;
	}
	run() {
		gs.CreatePortsIfNeeded(this.edges);
		for (let t of this.edges) e.RouteEdge(t);
	}
	static RouteEdge(t) {
		let n = t;
		n.sourcePort ??= xt.mk(() => t.source.boundaryCurve, () => t.source.center), n.targetPort ??= xt.mk(() => t.target.boundaryCurve, () => t.target.center), e.ContainmentLoop(n) || (n.curve = e.GetEdgeLine(t)), Qn.trimSplineAndCalculateArrowheadsII(n, n.sourcePort.Curve, n.targetPort.Curve, t.curve, !1);
	}
	static ContainmentLoop(t) {
		let n = t.sourcePort.Curve, r = t.targetPort.Curve;
		if (n == null || r == null) return !1;
		let i = n.boundingBox, a = r.boundingBox, o = i.containsRect(a), s = !o && a.containsRect(i);
		return o || s ? (t.curve = e.CreateLoop(i, a, s), !0) : !1;
	}
	static CreateLoop(t, n, r) {
		return r ? e.CreateLoop_(t, n, !1) : e.CreateLoop_(n, t, !0);
	}
	static CreateLoop_(t, n, r) {
		let i = t.center, a = e.FindClosestPointOnBoxBoundary(t.center, n), o = a.sub(i), s = (Math.abs(o.x) < u.distanceEpsilon ? Math.min(i.y - n.bottom, n.top - i.y) : Math.min(i.x - n.left, n.right - i.x)) / 2, c = Math.min(1, s);
		o.length <= u.distanceEpsilon && (o = new y(1, 0));
		let l = o.normalize(), d = l.rotate(Math.PI / 2), f = a.add(l.mul(1)), p = f.add(d.mul(c)), m = a.add(d.mul(c)), h = i.add(d.mul(c));
		return (r ? he.mkFromPoints([
			h,
			m,
			p,
			f,
			a,
			i
		]) : he.mkFromPoints([
			i,
			a,
			f,
			p,
			m,
			h
		])).createCurve();
	}
	static FindClosestPointOnBoxBoundary(e, t) {
		let n = e.x - t.left < t.right - e.x ? t.left : t.right, r = e.y - t.bottom < t.top - e.y ? t.bottom : t.top;
		return Math.abs(n - e.x) < Math.abs(r - e.y) ? new y(n, e.y) : new y(e.x, r);
	}
	static GetEdgeLine(e) {
		let t, n;
		e.sourcePort == null ? (t = e.source.center, n = e.source.boundaryCurve) : (t = e.sourcePort.Location, n = e.sourcePort.Curve);
		let r, i;
		e.targetPort == null ? (r = e.target.center, i = e.target.boundaryCurve) : (r = e.targetPort.Location, i = e.targetPort.Curve);
		let a = S.mkPP(t, r), o = E.getAllIntersections(n, a, !1);
		if (o.length > 0) {
			let e = a.trim(o[0].par1, 1);
			e instanceof S && (a = e, o = E.getAllIntersections(i, a, !1), o.length > 0 && (e = a.trim(0, o[0].par1), e instanceof S && (a = e)));
		}
		return a;
	}
	static CreateSimpleEdgeCurveWithUnderlyingPolyline(t) {
		let n = t.sourcePort ? t.sourcePort.Location : t.source.center, r = t.targetPort ? t.targetPort.Location : t.target.center;
		if (t.source === t.target) {
			let r = 2 / (3 * t.source.boundaryCurve.boundingBox.width), i = t.source.boundingBox.height / 4;
			t.smoothedPolyline = e.CreateUnderlyingPolylineForSelfEdge(n, r, i), t.curve = t.smoothedPolyline.createCurve();
		} else t.smoothedPolyline = he.mkFromPoints([n, r]), t.curve = t.smoothedPolyline.createCurve();
		Qn.trimSplineAndCalculateArrowheadsII(t, t.source.boundaryCurve, t.target.boundaryCurve, t.curve, !1);
	}
	static CreateUnderlyingPolylineForSelfEdge(e, t, n) {
		let r = e.add(new y(0, n)), i = e.add(new y(t, n)), a = e.add(new y(t, n * -1)), o = e.add(new y(0, n * -1)), s = k.mkSiteP(e), c = new he(s);
		return s = k.mkSiteSP(s, r), s = k.mkSiteSP(s, i), s = k.mkSiteSP(s, a), s = k.mkSiteSP(s, o), k.mkSiteSP(s, e), c;
	}
	static SetStraightLineEdgesWithUnderlyingPolylines(t) {
		gs.CreatePortsIfNeeded(Array.from(t.deepEdges));
		for (let n of t.deepEdges) e.CreateSimpleEdgeCurveWithUnderlyingPolyline(n);
	}
}, ka;
(function(e) {
	e[e.OverlapsOtherLabels = 0] = "OverlapsOtherLabels", e[e.OverlapsNodes = 1] = "OverlapsNodes", e[e.OverlapsEdges = 2] = "OverlapsEdges", e[e.OverlapsNothing = Number.MAX_VALUE] = "OverlapsNothing";
})(ka ||= {});
var Aa;
(function(e) {
	e[e.Any = 0] = "Any", e[e.Port = 1] = "Port", e[e.Starboard = 2] = "Starboard", e[e.Top = 3] = "Top", e[e.Bottom = 4] = "Bottom", e[e.Left = 5] = "Left", e[e.Right = 6] = "Right";
})(Aa ||= {});
var ja = class {}, Ma = class {
	constructor() {
		this.points = [], this.coveredLength = 0;
	}
	AddFirst(e) {
		if (this.points.length !== 0) {
			let t = this.points[0];
			this.coveredLength += e.Center.sub(t.Center).length;
		}
		return this.points.unshift(e), this.coveredLength;
	}
	AddLast(e) {
		if (this.points.length !== 0) {
			let t = this.points[this.points.length - 1];
			this.coveredLength += e.Center.sub(t.Center).length;
		}
		return this.points.push(e), this.coveredLength;
	}
}, Na;
(function(e) {
	e[e.AlongCurve = 0] = "AlongCurve", e[e.Horizontal = 1] = "Horizontal";
})(Na ||= {});
var Pa = class {
	constructor(e) {
		this.location = e, this.boundingBox = O.rectangleOnPoint(e);
	}
}, Fa = class {
	constructor(e, t) {
		this.data = t, this.boundingBox = e;
	}
}, Ia = class {
	constructor(e) {
		this.innerPoints = [], this.outerPoints = [], this.placementSide = Aa.Any, this.placementOffset = .5, this.edgePoints = e, this.placementSide;
	}
}, La = class e extends B {
	get CollisionGranularity() {
		return this.granularity;
	}
	set CollisionGranularity(e) {
		this.granularity = e;
	}
	static constructorG(t) {
		return new e(Array.from(t.nodesBreadthFirst), Array.from(t.deepEdges).filter((e) => e.label));
	}
	static constructorGA(t, n) {
		return new e(Array.from(t.nodesBreadthFirst), n.filter((e) => e.label));
	}
	constructor(t, n) {
		super(null), this.placementStrategy = [Na.Horizontal, Na.AlongCurve], this.obstacleMaps = [], this.edgeInfos = /* @__PURE__ */ new Map(), this.granularity = e.MinGranularity, this.ScaleCollisionGranularity = !0, this.granularity = this.ScaleCollisionGranularity ? this.interpolateGranularity(n.length) : e.MinGranularity, this.InitializeObstacles(t, n), this.edges = n;
	}
	interpolateGranularity(t) {
		if (t <= e.LowerEdgeBound) return e.MaxGranularity;
		if (t >= e.UpperEdgeBound) return e.MinGranularity;
		let n = (e.UpperEdgeBound - e.LowerEdgeBound) / (t - e.LowerEdgeBound);
		return Math.ceil(e.MinGranularity + n);
	}
	InitializeObstacles(e, t) {
		let n = this.GetEdgeObstacles(t);
		this.obstacleMaps[1] = it(e.map((e) => [e.boundingBox, new Fa(e.boundingBox, e)])), this.obstacleMaps[2] = it(n.map((e) => [e.boundingBox, new Fa(e.boundingBox, e)]));
	}
	static CurvePoints(t, n) {
		let r = [], i = t.end.sub(t.start).lengthSquared / (n * n);
		return e.SubdivideCurveSegment(r, t, i, t.parStart, t.parEnd), r.sort(e.compareByArgument), r;
	}
	static compareByArgument(e, t) {
		return e[0] < t[0] ? -1 : +(e[0] > t[0]);
	}
	static SubdivideCurveSegment(t, n, r, i, a) {
		if (t.length > 64) return;
		let o = n.value(i), s = n.value(a);
		if (o.sub(s).lengthSquared > r) {
			let o = (i + a) / 2;
			e.SubdivideCurveSegment(t, n, r, i, o), e.SubdivideCurveSegment(t, n, r, o, a);
		} else t.push([i, o]);
	}
	static PlaceLabelsAtDefaultPositions(t, n) {
		for (let t of n) t.label && new e([t.source, t.target], [t]).run();
	}
	GetEdgeObstacles(t) {
		let n = [];
		for (let r of t) {
			if (r.curve == null) continue;
			let t = e.CurvePoints(r.curve, this.CollisionGranularity);
			this.edgeInfos.set(r, new Ia(t));
			for (let e of t) n.push(new Pa(e[1]));
		}
		return n;
	}
	AddLabelObstacle(e) {
		this.labelObstacleMap == null ? (this.labelObstacleMap = it([[e.boundingBox, e]]), this.obstacleMaps[0] = this.labelObstacleMap) : this.labelObstacleMap.Add(e.boundingBox, e);
	}
	run() {
		this.edges.sort((e, t) => this.edgeInfos.get(e).edgePoints.length - this.edgeInfos.get(t).edgePoints.length);
		for (let e of this.edges) this.PlaceLabel(e);
	}
	PlaceLabel(e) {
		let t = !1;
		for (let n of this.placementStrategy) {
			switch (n) {
				case Na.AlongCurve:
					t = this.PlaceEdgeLabelOnCurve(e.label);
					break;
				case Na.Horizontal:
					t = this.PlaceEdgeLabelHorizontally(e);
					break;
				default: throw Error("unexpected case");
			}
			if (t) break;
		}
		t ? this.CalculateCenterLabelInfoCenter(e.label) : this.PlaceLabelAtFirstPosition(e.label);
	}
	getLabelInfo(e) {
		let t = e.parent;
		return this.edgeInfos.get(t);
	}
	PlaceLabelAtFirstPosition(t) {
		let n = t.parent, r = n.curve, i = this.edgeInfos.get(n).edgePoints, a = this.StartIndex(t, i.map((e) => e[1])), o = i[a][1], s = r.derivative(i[a][0]);
		s.length < u.distanceEpsilon && (s = new y(1, 1)), s = s.normalize();
		let c = new me(t.width, t.height), l = this.getLabelInfo(t), d = e.GetPossibleSides(l.placementSide, s)[0], f = e.GetLabelBounds(o, s, c, d);
		this.SetLabelBounds(this.getLabelInfo(t), f);
	}
	StartIndex(e, t) {
		let n = this.getLabelInfo(e);
		return Math.min(t.length - 1, Math.max(0, Math.floor(t.length * n.placementOffset)));
	}
	CalculateCenterLabelInfoCenter(e) {
		let t = this.getLabelInfo(e), n = new y(0, 0);
		for (let e of t.innerPoints) n = n.add(e);
		for (let e of t.outerPoints) n = n.add(e);
		e.positionCenter(n.div(t.innerPoints.length + t.outerPoints.length));
	}
	PlaceEdgeLabelHorizontally(t) {
		let n = t.label, r = this.getLabelInfo(n).edgePoints, i = new me(n.width, n.height), a = -1, o = O.mkEmpty(), s = t.curve;
		for (let t of e.ExpandingSearch(this.StartIndex(n, r.map((e) => e[1])), 0, r.length)) {
			let c = r[t], l = s.derivative(c[0]);
			if (!m(l.lengthSquared, 0)) {
				l = l.normalize();
				for (let t of e.GetPossibleSides(this.getLabelInfo(n).placementSide, l)) {
					let r = e.GetLabelBounds(c[1], l, i, t), s = this.ConflictIndexRL(r, n);
					if (s > a && (a = s, o = r, a === Number.MAX_VALUE)) break;
				}
				if (a === Number.MAX_VALUE) break;
			}
		}
		if (a >= 0) {
			this.SetLabelBounds(this.getLabelInfo(n), o);
			let e = new Fa(o, null);
			this.AddLabelObstacle(e);
			let t = this.getLabelInfo(n);
			return a === 0 ? t.placementResult = ka.OverlapsOtherLabels : a === 1 ? t.placementResult = ka.OverlapsNodes : a === 2 ? t.placementResult = ka.OverlapsEdges : t.placementResult = ka.OverlapsNothing, !0;
		}
		return !1;
	}
	static GetLabelBounds(e, t, n, r) {
		let i = t.rotate(Math.PI / 2).mul(r), a = e.add(i), o = i.x > 0 ? a.x : a.x - n.width, s = i.y > 0 ? a.y : a.y - n.height;
		if (Math.abs(i.x) < .75) {
			let e = Math.acos(Math.abs(i.y) / 1), t = 1 / Math.sin(e), r = 1 / Math.cos(e);
			o += (i.x > 0 ? -1 : 1) * Math.min(t, n.width / 2), s += (i.y > 0 ? 1 : -1) * r;
		} else if (Math.abs(i.y) < .75) {
			let e = Math.acos(Math.abs(i.x) / 1), t = 1 / Math.sin(e), r = 1 / Math.cos(e);
			o += (i.x > 0 ? 1 : -1) * r, s += (i.y > 0 ? -1 : 1) * Math.min(t, n.height / 2);
		}
		return O.mkLeftBottomSize(o, s, n);
	}
	SetLabelBounds(e, t) {
		e.innerPoints = [t.leftTop, t.rightTop], e.outerPoints = [t.leftBottom, t.rightBottom];
	}
	static GetPossibleSides(t, n) {
		switch (n.length === 0 && (t = Aa.Any), t) {
			case Aa.Port: return [-1];
			case Aa.Starboard: return [1];
			case Aa.Top: return m(n.x, 0) ? e.GetPossibleSides(Aa.Left, n) : [1];
			case Aa.Bottom: return m(n.x, 0) ? e.GetPossibleSides(Aa.Right, n) : [n.x < 0 ? -1 : 1];
			case Aa.Left: return m(n.y, 0) ? e.GetPossibleSides(Aa.Top, n) : [n.y < 0 ? -1 : 1];
			case Aa.Right: return m(n.y, 0) ? e.GetPossibleSides(Aa.Bottom, n) : [n.y < 0 ? 1 : -1];
			default: return [-1, 1];
		}
	}
	static *ExpandingSearch(e, t, n) {
		let r = e + 1, i = r;
		for (; i > t;) yield --i;
		for (; r < n;) yield r++;
	}
	static PointSetLength(e) {
		let t = 0, n = null;
		for (let r of e) n != null && (t += n.sub(r.Center).length), n = r.Center;
		return t;
	}
	PlaceEdgeLabelOnCurve(t) {
		let n = t.parent, r = this.getLabelInfo(t);
		r.innerPoints = null;
		let i = r.edgePoints, a = t.height / 2, o = new me(a, a), s = t.width;
		for (let r of e.ExpandingSearch(this.StartIndex(t, i), 0, i.length)) {
			let e = this.GetSidesAndEdgeCurve(t, n, i, r);
			for (let c of e) {
				let e = new Ma(), l = { coveredLength: 0 };
				if (this.ProcessExpandingSearchOnSide(r, i, n.curve, c, a, 3, o, l, e, s), l.coveredLength >= s) return this.CaseOfCoveredLengthGreaterThanLabelLength(t, e, l.coveredLength, s, o), !0;
			}
		}
		return !1;
	}
	CaseOfCoveredLengthGreaterThanLabelLength(e, t, n, r, i) {
		let a = [], o = [], s = Array.from(t.points), c = n - r;
		if (c > 0) {
			let e = s[s.length - 1], t = s[s.length - 2], n = e.Center.sub(t.Center), r = n.length;
			c > r && (e = s[0], t = s[1], n = e.Center.sub(t.Center), r = n.length);
			let i = n.mul((r - c) / r);
			e.Center = t.Center.add(i), e.Inner = t.Inner.add(i), e.Outer = t.Outer.add(i);
		}
		this.GoOverOrderedPointsAndAddLabelObstacels(s, a, o, i);
		let l = this.getLabelInfo(e);
		l.innerPoints = a, l.outerPoints = o;
	}
	GoOverOrderedPointsAndAddLabelObstacels(e, t, n, r) {
		for (let i of e) {
			let e = i.Center;
			t.push(i.Inner), n.push(i.Outer);
			let a = new Fa(O.mkSizeCenter(new me(r.width * 2, r.height * 2), e), null);
			this.AddLabelObstacle(a);
		}
	}
	ProcessExpandingSearchOnSide(t, n, r, i, a, o, s, c, l, u) {
		for (let d of e.ExpandingSearch(t, 0, n.length)) {
			let [e, f] = n[d], p = r.derivative(e);
			if (m(p.lengthSquared, 0)) continue;
			let h = p.rotate(Math.PI / 2).normalize().mul(i), g = f.add(h.mul(a + o));
			if (this.Conflict(g, a, s)) break;
			{
				let e = new ja();
				if (e.Center = g, e.Inner = f.add(h.mul(o)), e.Outer = f.add(h.mul(2 * a + o)), c.coveredLength = d <= t ? l.AddFirst(e) : l.AddLast(e), c.coveredLength >= u) break;
			}
		}
	}
	GetSidesAndEdgeCurve(t, n, r, i) {
		let a = n.curve.derivative(r[i][0]);
		return e.GetPossibleSides(this.getLabelInfo(t).placementSide, a);
	}
	Conflict(e, t, n) {
		return this.ConflictIndex(e, t, n) !== Number.MAX_VALUE;
	}
	ConflictIndexRL(e, t) {
		let n = t.parent, r = n.source, i = n.target;
		for (let t = 0; t < this.obstacleMaps.length; t++) if (this.obstacleMaps[t] != null) {
			for (let n of this.obstacleMaps[t].GetAllIntersecting(e)) if (!(t === ka.OverlapsNodes && n instanceof Fa && n.data instanceof mt && (r.node.isDescendantOf(n.data.graph) || i.node.isDescendantOf(n.data)))) return t;
		}
		return Number.MAX_VALUE;
	}
	ConflictIndex(e, t, n) {
		let r = O.creatRectangleWithSize(new me(n.width * 2, n.height * 2), e), i = t * t;
		for (let t = 0; t < this.obstacleMaps.length; t++) if (this.obstacleMaps[t] != null) {
			for (let t = 0; t < this.obstacleMaps.length; t++) if (this.obstacleMaps[t] != null) for (let n of this.obstacleMaps[t].GetAllIntersecting(r)) if (n instanceof Pa) {
				if (e.sub(n.location).lengthSquared < i) return t;
			} else return t;
			return Number.MAX_VALUE;
		}
	}
};
La.MinGranularity = 5, La.MaxGranularity = 50, La.LowerEdgeBound = 500, La.UpperEdgeBound = 3e3;
//#endregion
//#region node_modules/@msagl/core/dist/structs/algorithmData.js
var Ra = class extends o {
	clone() {
		throw Error("Method not implemented.");
	}
	rebind(e) {
		this.entity = e, this.bind(s.AlgorithmDataIndex);
	}
	constructor(e, t = null) {
		super(e, s.AlgorithmDataIndex), this.data = t;
	}
	static getAlgData(e) {
		return e.getAttr(s.AlgorithmDataIndex);
	}
};
//#endregion
//#region node_modules/@msagl/core/dist/layout/incremental/fiNode.js
function za(e) {
	let t = Ra.getAlgData(e.node);
	return t == null ? null : t.data;
}
var Ba = class {
	get Center() {
		return this.center;
	}
	set Center(e) {
		this.geomNode.center = e, this.center = e;
	}
	ResetBounds() {
		this.previousCenter = this.geomNode.center, this.center = this.geomNode.center, this.Width = this.geomNode.width, this.Height = this.geomNode.height;
	}
	constructor(e, t) {
		this.force = new y(0, 0), this.stayWeight = 1, this.index = e, this.geomNode = t, this.ResetBounds();
	}
	ToString() {
		return "FINode(" + (this.index + ("):" + this.geomNode));
	}
}, Va = class {
	constructor(e) {
		this._length = 1, this.mEdge = e, this.sourceFiNode = za(this.mEdge.source), this.targetFiNode = za(this.mEdge.target);
	}
	get source() {
		return this.sourceFiNode.index;
	}
	get target() {
		return this.targetFiNode.index;
	}
	get length() {
		return this._length;
	}
	set length(e) {
		this._length = e;
	}
	vector() {
		return this.sourceFiNode.geomNode.center.sub(this.targetFiNode.geomNode.center);
	}
}, Ha = class e {
	get Center() {
		return this.c;
	}
	set Center(e) {
		this.c = e;
	}
	get Radius() {
		return this.r;
	}
	set Radius(e) {
		this.r = e, this.r2 = e * e;
	}
	Distance2(e) {
		let t = this.c.y - e.y, n = this.c.x - e.x;
		return n * n + t * t;
	}
	Contains(e) {
		return this.Distance2(e) - 1e-7 <= this.r2;
	}
	ContainsPN(e, t) {
		for (let n = 0; n < e.length; n++) if (t.findIndex((e) => e == n) == -1 && !this.Contains(e[n])) return !1;
		return !0;
	}
	static constructorP(t) {
		let n = new e();
		return n.c = t, n.r = 0, n.r2 = 0, n;
	}
	static midPoint(e, t) {
		return new y((t.x + e.x) / 2, (t.y + e.y) / 2);
	}
	static constructorPP(t, n) {
		let r = new e();
		return r.c = e.midPoint(t, n), r.r2 = r.Distance2(t), r.r = Math.sqrt(r.r2), z.assert(r.OnBoundary(t)), z.assert(r.OnBoundary(n)), r;
	}
	OnBoundary(e) {
		let t = this.Distance2(e);
		return Math.abs(t - this.r2) / (t + this.r2) < 1e-5;
	}
	static centre(e, t, n) {
		z.assert(t.x != e.x), z.assert(n.x != t.x);
		let r = (t.y - e.y) / (t.x - e.x), i = (n.y - t.y) / (n.x - t.x);
		z.assert(i != r);
		let a, o = (r * i * (e.y - n.y) + i * (e.x + t.x) - r * (t.x + n.x)) / (2 * (i - r));
		return a = Math.abs(r) > Math.abs(i) ? (e.y + t.y) / 2 - (o - (e.x + t.x) / 2) / r : (t.y + n.y) / 2 - (o - (t.x + n.x) / 2) / i, new y(o, a);
	}
	static Collinear(e, t, n) {
		return e.x * (t.y - n.y) + (t.x * (n.y - e.y) + n.x * (e.y - t.y)) == 0;
	}
	static constructorPPP(t, n, r) {
		e.count++;
		let i = new e();
		if (e.Collinear(t, n, r)) {
			let a = new y(Math.min(t.x, Math.min(n.x, r.x)), Math.min(t.y, Math.max(n.y, r.y))), o = new y(Math.max(t.x, Math.max(n.x, r.x)), Math.max(t.y, Math.max(n.y, r.y)));
			i.c = e.midPoint(a, o), i.r2 = i.Distance2(o), i.r = Math.sqrt(i.r2);
		} else {
			let a = n.x - t.x, o = r.x - n.x, s = r.x - t.x;
			a == 0 ? (z.assert(o != 0), i.c = e.centre(n, r, t)) : o == 0 ? (z.assert(s != 0), i.c = e.centre(n, t, r)) : i.c = e.centre(t, n, r), i.r2 = i.Distance2(t), i.r = Math.sqrt(i.r2), z.assert(i.OnBoundary(t)), z.assert(i.OnBoundary(n)), z.assert(i.OnBoundary(r));
		}
		return i;
	}
};
Ha.count = 0;
//#endregion
//#region node_modules/@msagl/core/dist/layout/incremental/multipole/minimumEnclosingDisc.js
function Ua(e) {
	let t = e.slice();
	return Wa(t), Ga(t, e.length, [], 0);
}
function Wa(e) {
	let t, n, r;
	for (r = e.length - 1; r > 0; r--) t = yn(r + 1), n = e[r], e[r] = e[t], e[t] = n;
	return e;
}
function Ga(e, t, n, r) {
	let i = null;
	return r === 3 ? i = Ka(n[0], n[1], n[2]) : t === 1 && r === 0 ? i = {
		x: e[0].x,
		y: e[0].y,
		r: 0
	} : t === 0 && r === 2 ? i = qa(n[0], n[1]) : t === 1 && r === 1 ? i = qa(n[0], e[0]) : (i = Ga(e, t - 1, n, r), Ja(e[t - 1], i) || (n[r++] = e[t - 1], i = Ga(e, t - 1, n, r))), i;
}
function Ka(e, t, n) {
	let r = e.x, i = e.y, a = t.x, o = t.y, s = n.x, c = n.y, l = a - r, u = o - i, d = s - r, f = c - i, p = l * (a + r) * .5 + u * (o + i) * .5, m = d * (s + r) * .5 + f * (c + i) * .5, h = l * f - u * d, g = (f * p - u * m) / h, _ = (-d * p + l * m) / h;
	return {
		x: g,
		y: _,
		r: Math.sqrt((r - g) * (r - g) + (i - _) * (i - _))
	};
}
function qa(e, t) {
	let n = e.x, r = e.y, i = t.x, a = t.y, o = .5 * (n + i), s = .5 * (r + a);
	return {
		x: o,
		y: s,
		r: Math.sqrt((n - o) * (n - o) + (r - s) * (r - s))
	};
}
function Ja(e, t) {
	return (t.x - e.x) * (t.x - e.x) + (t.y - e.y) * (t.y - e.y) <= t.r * t.r;
}
var Ya = class {
	static LinearComputation(e) {
		let t = Ua(e), n = new Ha();
		return n.Center = new y(t.x, t.y), n.Radius = t.r, n;
	}
	static SlowComputation(e) {
		let t = e.length, n = null, r = null;
		for (let i = 0; i < t; i++) for (let a = 0; a < t; a++) {
			if (i != a) {
				let t = Ha.constructorPP(e[i], e[a]);
				t.ContainsPN(e, [i, a]) && (n == null || n.Radius > t.Radius) && (n = t, r = [i, a]);
			}
			for (let o = 0; o < t; o++) if (o != i && o != a && !Ha.Collinear(e[i], e[a], e[o])) {
				let t = Ha.constructorPPP(e[i], e[a], e[o]);
				t.ContainsPN(e, [
					i,
					a,
					o
				]) && (n == null || n.Radius > t.Radius) && (n = t, r = [
					i,
					a,
					o
				]);
			}
		}
		return z.assert(r != null), n;
	}
}, Xa = class e {
	static constructorNPA(t, n, r) {
		let i = new e();
		i.p = t, i.z0 = new Q(n.x, n.y), i.a = Array(t);
		for (let e = 0; e < t; e++) i.a[e] = i.compute(e, r);
		return i;
	}
	static constructorPMM(t, n, r) {
		let i = new e();
		z.assert(n.p == r.p), i.p = n.p, i.z0 = new Q(t.x, t.y);
		let a = r.shift(i.z0), o = n.shift(i.z0);
		i.a = Array(i.p);
		for (let e = 0; e < i.p; e++) i.a[e] = Za(o[e], a[e]);
		return i;
	}
	static factorial(e) {
		let t = 1;
		for (let n = 2; n <= e; n++) t *= n;
		return t;
	}
	static binomial(t, n) {
		return e.factorial(t) / (e.factorial(n) * e.factorial(t - n));
	}
	sum(t, n) {
		let r = Q.constructorN(0);
		for (let i = 1; i <= t; i++) {
			let a = Q.constructorN(e.binomial(t - 1, i - 1));
			r = Za(r, Qa(this.a[i], Qa(Q.Pow(n, t - i), a)));
		}
		return r;
	}
	shift(e) {
		let t = Array(this.p), n = t[0] = this.a[0], r = eo(this.z0, e);
		for (let e = 1; e < this.p; e++) {
			let i = Q.constructorN(e);
			t[e] = Za(Qa(to(n), no(Q.Pow(r, e), i)), this.sum(e, r));
		}
		return t;
	}
	compute(e, t) {
		let n = t.length, r = Q.constructorN(0);
		if (e == 0) r.re = n;
		else {
			for (let i = 0; i < n; i++) {
				let n = t[i], a = new Q(n.x, n.y);
				r = eo(r, Q.Pow(eo(a, this.z0), e));
			}
			r.divideBy(e);
		}
		return r;
	}
	ApproximateForce(e) {
		let t = eo(new Q(e.x, e.y), this.z0), n = no(this.a[0], t), r = t, i = 0;
		for (; n = eo(n, no($a(this.a[i], i), r)), i++, i != this.p;) r = Qa(r, t);
		return new y(n.re, -n.im);
	}
	static Force(e, t) {
		let n = t.sub(e), r = n.lengthSquared;
		return r < .1 ? r == 0 ? new y(1, 0) : n.div(.1) : n.div(r);
	}
}, Q = class e {
	constructor(e, t) {
		this.re = e, this.im = t;
	}
	static constructorN(t) {
		return new e(t, 0);
	}
	divideBy(e) {
		this.re /= e, this.im /= e;
	}
	static Pow(t, n) {
		switch (z.assert(n >= 0), n) {
			case 0: return e.constructorN(1);
			case 1: return t;
			case 2: return Qa(t, t);
			case 3: return Qa(t, Qa(t, t));
			default: return Qa(e.Pow(t, n / 2), e.Pow(t, n / 2 + n % 2));
		}
	}
};
function Za(e, t) {
	return new Q(e.re + t.re, e.im + t.im);
}
function Qa(e, t) {
	return new Q(e.re * t.re - e.im * t.im, e.re * t.im + t.re * e.im);
}
function $a(e, t) {
	return new Q(e.re * t, e.im * t);
}
function eo(e, t) {
	return new Q(e.re - t.re, e.im - t.im);
}
function to(e) {
	return new Q(-e.re, -e.im);
}
function no(e, t) {
	let n = t.re * t.re + t.im * t.im;
	if (n == 0) return Q.constructorN(0);
	let r = e.re * t.re + e.im * t.im, i = e.im * t.re - e.re * t.im;
	return new Q(r / n, i / n);
}
//#endregion
//#region node_modules/@msagl/core/dist/layout/incremental/multipole/kdTree.js
var ro;
(function(e) {
	e[e.Horizontal = 0] = "Horizontal", e[e.Vertical = 1] = "Vertical";
})(ro ||= {});
var io = class {
	intersects(e) {
		return e.med.Center.sub(this.med.Center).length < e.med.Radius + this.med.Radius;
	}
}, ao = class extends io {
	constructor(e, t, n) {
		super(), this.med = e, this.parent = t.parent, this.parent != null && (this.parent.leftChild == t ? this.parent.leftChild = this : this.parent.rightChild = this), this.leftChild = t, this.rightChild = n, t.parent = this, n.parent = this;
	}
	computeMultipoleCoefficients(e) {
		this.leftChild.computeMultipoleCoefficients(e), this.rightChild.computeMultipoleCoefficients(e), this.multipoleCoefficients = Xa.constructorPMM(this.med.Center, this.leftChild.multipoleCoefficients, this.rightChild.multipoleCoefficients);
	}
}, oo = class e extends io {
	constructor(e) {
		super(), this.particles = e, this.ComputeMinimumEnclosingDisc();
	}
	computeMultipoleCoefficients(e) {
		this.multipoleCoefficients = Xa.constructorNPA(e, this.med.Center, this.ps);
	}
	ComputeMinimumEnclosingDisc() {
		let e = this.Size();
		this.ps = Array(e);
		for (let t = 0; t < e; t++) this.ps[t] = this.particles[0][t].point;
		return this.med = Ya.LinearComputation(this.ps);
	}
	Min(e) {
		return this.particles[e][0].pos(e);
	}
	Size() {
		return this.particles[0].length;
	}
	Max(e) {
		return this.particles[e][this.Size() - 1].pos(e);
	}
	Dimension(e) {
		return this.Max(e) - this.Min(e);
	}
	Split(t) {
		let n = this.Dimension(ro.Horizontal) > this.Dimension(ro.Vertical) ? ro.Horizontal : ro.Vertical, r = n == ro.Horizontal ? ro.Vertical : ro.Horizontal, i = this.Size(), a = i >> 1, o = i - a, s = [Array(a), Array(a)], c = [Array(o), Array(o)], l = 0, u = 0;
		for (let e = 0; e < i; e++) {
			let t = this.particles[n][e];
			e < a ? (s[n][e] = t, t.splitLeft = !0) : (c[n][e - a] = t, t.splitLeft = !1);
		}
		for (let e = 0; e < i; e++) {
			let t = this.particles[r][e];
			t.splitLeft ? s[r][u++] = t : c[r][l++] = t;
		}
		let d = this.med;
		return this.particles = s, this.ComputeMinimumEnclosingDisc(), t.rightSibling = new e(c), new ao(d, this, t.rightSibling);
	}
	ComputeForces() {
		for (let e of this.particles[0]) for (let t of this.particles[0]) e != t && (e.force = e.force.add(Xa.Force(e.point, t.point)));
	}
}, so = class {
	pos(e) {
		return e == ro.Horizontal ? this.point.x : this.point.y;
	}
	constructor(e) {
		this.point = e, this.force = new y(0, 0);
	}
}, co = class {
	particlesBy(e) {
		return this.particles.map((e) => e).sort((t, n) => t.pos(e) - n.pos(e));
	}
	constructor(e, t) {
		this.particles = e;
		let n = [];
		n.push(this.particlesBy(ro.Horizontal)), n.push(this.particlesBy(ro.Vertical)), this.leaves = [];
		let r = new oo(n);
		this.leaves.push(r);
		let i = { rightSibling: null };
		this.root = r.Split(i), this.leaves.push(i.rightSibling);
		let a = new lo(t);
		for (a.EnqueueLL(r, i.rightSibling); a.length > 0;) r = a.dequeue(), r.Split(i), this.leaves.push(i.rightSibling), a.EnqueueLL(r, i.rightSibling);
	}
	ComputeForces(e) {
		this.root.computeMultipoleCoefficients(e);
		for (let e of this.leaves) {
			e.ComputeForces();
			let t = [];
			for (t.push(this.root); t.length > 0;) {
				let n = t.pop();
				if (!e.intersects(n)) for (let t of e.particles[0]) t.force = t.force.sub(n.multipoleCoefficients.ApproximateForce(t.point));
				else if (n instanceof oo) for (let t of e.particles[0]) for (let e of n.particles[0]) t != e && (t.force = t.force.add(Xa.Force(t.point, e.point)));
				else {
					let e = n;
					t.push(e.leftChild), t.push(e.rightChild);
				}
			}
		}
	}
}, lo = class extends i.Queue {
	constructor(e) {
		super(), this.B = e;
	}
	EnqueueLL(e, t) {
		e.Size() > this.B && this.enqueue(e), t.Size() > this.B && this.enqueue(t);
	}
}, uo = class e extends B {
	constructor(e, t, n) {
		if (super(null), this.clustersInfo = /* @__PURE__ */ new Map(), this.clusterEdges = [], this.graph = e, this.settings = t, this.initFiNodesEdges(), this.edges = Array.from(this.graph.shallowEdges).map((e) => Ra.getAlgData(e.edge).data), this.nodes = Array.from(this.graph.shallowNodes).map((e) => Ra.getAlgData(e.node).data), this.components = [], this.settings.InterComponentForces) this.components.push(this.nodes);
		else {
			this.basicGraph = Dn(this.edges, this.nodes.length);
			for (let e of Sn(this.basicGraph)) {
				let t = Array(e.length), n = 0;
				for (let r of e) t[n++] = this.nodes[r];
				this.components.push(t);
			}
		}
		this.computeWeight(e), this.setCurrentConstraintLevel(n);
	}
	initFiNodesEdges() {
		let e = 0;
		for (let t of this.graph.shallowNodes) {
			let n = new Ba(e++, t);
			new Ra(t.node, n);
		}
		for (let e of this.graph.shallowEdges) {
			let t = new Va(e);
			new Ra(e.edge, t);
		}
	}
	getCurrentConstraintLevel() {
		return this.currentConstraintLevel;
	}
	setCurrentConstraintLevel(e) {
		this.currentConstraintLevel = e, this.settings.Unconverge();
	}
	ResetNodePositions() {
		for (let e of this.nodes) e.ResetBounds();
	}
	AddRepulsiveForce(e, t) {
		e.force = t.mul(10 * this.settings.RepulsiveForceConstant);
	}
	AddLogSpringForces(e, t, n) {
		let r = t.length, i = 7e-4 * this.settings.AttractiveForceConstant * r * Math.log((r + .1) / (n + .1));
		e.sourceFiNode.force = e.sourceFiNode.force.add(t.mul(i)), e.targetFiNode.force = e.targetFiNode.force.sub(t.mul(i));
	}
	AddSquaredSpringForces(e, t, n) {
		let r = t.length, i = n * n + .1, a = this.settings.AttractiveForceConstant * (r - n) / i;
		e.sourceFiNode.force = e.sourceFiNode.force.add(t.mul(a)), e.targetFiNode.force = e.targetFiNode.force.sub(t.mul(a));
	}
	AddSpringForces(e) {
		let t;
		if (this.settings.RespectEdgePorts) {
			let n = e.sourceFiNode.Center, r = e.targetFiNode.Center, i = e.mEdge.sourcePort;
			i instanceof bt && (n = i.Location);
			let a = e.mEdge.targetPort;
			a instanceof bt && (r = a.Location), t = n.sub(r);
		} else t = e.vector();
		this.settings.LogScaleEdgeForces ? this.AddLogSpringForces(e, t, e.length) : this.AddSquaredSpringForces(e, t, e.length);
	}
	static AddGravityForce(e, t, n) {
		n != null && (n.force = n.force.sub(e.sub(n.Center).mul(t * 1e-4)));
	}
	ComputeRepulsiveForces(e) {
		let t = e.length;
		if (t > 16 && this.settings.ApproximateRepulsion) {
			let n = Array(e.length), r = Math.PI / t * 2, i = 0;
			for (let a = 0; a < t; a++) n[a] = new so(e[a].Center.add(new y(Math.cos(i), Math.sin(i)).mul(1e-5))), i += r;
			new co(n, 8).ComputeForces(5);
			for (let t = 0; t < e.length; t++) this.AddRepulsiveForce(e[t], n[t].force);
		} else for (let t of e) {
			let n = new y(0, 0);
			for (let r of e) t != r && (n = n.add(Xa.Force(t.Center, r.Center)));
			this.AddRepulsiveForce(t, n);
		}
	}
	SetBarycenter(e) {
		let t = this.clustersInfo.get(e);
		if (t != null) return t.barycenter;
		let n = new y(0, 0);
		if (e.shallowNodeCount || fo(e)) {
			let t = this.clustersInfo.get(e);
			if ((t == null || t.weight == null) && this.computeWeight(e), t.weight != null) {
				for (let t of e.shallowNodes) n = t instanceof Qe ? n.add(t.center) : n.add(this.SetBarycenter(t).mul(this.clustersInfo.get(t).weight));
				this.clustersInfo.get(e).barycenter = n = n.div(t.weight);
			}
		} else this.clustersInfo.get(e).barycenter = n;
		return n;
	}
	computeWeight(e) {
		let t = 0;
		for (let n of e.shallowNodes) n.entity instanceof Je ? t += this.computeWeight(n) : t++;
		let n = this.clustersInfo.get(e);
		return n ?? this.clustersInfo.set(e, n = { barycenter: new y(0, 0) }), n.weight = t, t;
	}
	AddClusterForces(t) {
		if (t != null) {
			this.SetBarycenter(t);
			for (let e of this.clusterEdges) {
				let t = c.getGeom(e.source), n = c.getGeom(e.target), r = Ra.getAlgData(e.source).data, i = Ra.getAlgData(e.target).data, a = t.hasOwnProperty("shallowNodes"), o = a ? this.clustersInfo.get(t).barycenter : t.center, s = n.hasOwnProperty("shallowNodes"), l = s ? this.clustersInfo.get(n).barycenter : n.center, u = o.sub(l), d = u.length, f = 1e-8 * (this.settings.AttractiveInterClusterForceConstant * (d * Math.log(d + .1)));
				if (u = u.mul(f), a) {
					let e = t;
					for (let t of e.shallowNodes) {
						let e = Ra.getAlgData(t.node).data;
						e.force = e.force.add(u);
					}
				} else r.force = r.force.add(u);
				if (s) {
					let e = n;
					for (let t of e.shallowNodes) {
						let e = Ra.getAlgData(t.node).data;
						e.force = e.force.sub(u);
					}
				} else i.force = i.force.sub(u);
			}
			for (let n of t.subgraphsDepthFirst) {
				let t = this.clustersInfo.get(n).barycenter;
				for (let r of n.shallowNodes) e.AddGravityForce(t, this.settings.ClusterGravity, za(r));
			}
		}
	}
	ComputeForces() {
		if (this.components != null) for (let e of this.components) this.ComputeRepulsiveForces(e);
		else this.ComputeRepulsiveForces(this.nodes);
		this.edges.forEach((e) => this.AddSpringForces(e));
		for (let t of this.components) {
			let n = new y(0, 0);
			for (let e = 0; e < t.length; e++) n = n.add(t[e].Center);
			n = n.div(t.length);
			let r = -Infinity;
			for (let i = 0; i < t.length; i++) {
				let a = t[i];
				e.AddGravityForce(n, this.settings.GravityConstant, a), a.force.length > r && (r = a.force.length);
			}
			if (r > 100) for (let e = 0; e < t.length; e++) t[e].force = t[e].force.mul(100 / r);
		}
		this.AddClusterForces(this.graph);
	}
	VerletIntegration() {
		let e = this.energy;
		this.energy = this.ComputeDescentDirection(1), this.UpdateStepSize(e);
		let t = 0;
		for (let e = 0; e < this.nodes.length; e++) {
			let n = this.nodes[e];
			t += n.Center.sub(n.previousCenter).lengthSquared;
		}
		return t;
	}
	ComputeDescentDirection(e) {
		this.ResetForceVectors(), this.settings.ApplyForces && this.ComputeForces();
		let t = 0;
		for (let n of this.nodes) {
			t += n.force.lengthSquared;
			let r = n.Center.sub(n.previousCenter).mul(this.settings.Friction), i = n.force.mul(-this.stepSize * e);
			n.previousCenter = n.Center, z.assert(!Number.isNaN(i.x), "!double.IsNaN(a.X)"), z.assert(!Number.isNaN(i.y), "!double.IsNaN(a.Y)"), z.assert(Number.isFinite(i.x), "!double.IsInfinity(a.X)"), z.assert(Number.isFinite(i.y), "!double.IsInfinity(a.Y)"), r = r.add(i), r = r.div(n.stayWeight), n.Center = n.Center.add(r);
		}
		return t;
	}
	ResetForceVectors() {
		for (let e of this.nodes) e.force = new y(0, 0);
	}
	UpdateStepSize(e) {
		this.energy < e ? ++this.progress >= 3 && (this.progress = 0, this.stepSize /= this.settings.Decay) : (this.progress = 0, this.stepSize *= this.settings.Decay);
	}
	RungeKuttaIntegration() {
		let e = Array(this.nodes.length), t = Array(this.nodes.length), n = Array(this.nodes.length), r = Array(this.nodes.length), i = Array(this.nodes.length), a = this.energy;
		for (let t = 0; t < this.nodes.length; t++) this.nodes[t].previousCenter = this.nodes[t].Center, e[t] = this.nodes[t].Center;
		this.ComputeDescentDirection(3);
		for (let n = 0; n < this.nodes.length; n++) t[n] = this.nodes[n].Center.sub(this.nodes[n].previousCenter), this.nodes[n].Center = e[n].add(t[n].mul(.5));
		this.ComputeDescentDirection(3);
		for (let t = 0; t < this.nodes.length; t++) n[t] = this.nodes[t].Center.sub(this.nodes[t].previousCenter), this.nodes[t].previousCenter = e[t], this.nodes[t].Center = e[t].add(n[t].mul(.5));
		this.ComputeDescentDirection(3);
		for (let t = 0; t < this.nodes.length; t++) r[t] = this.nodes[t].Center.sub(this.nodes[t].previousCenter), this.nodes[t].previousCenter = e[t], this.nodes[t].Center = e[t].add(r[t]);
		this.energy = this.ComputeDescentDirection(3);
		for (let a = 0; a < this.nodes.length; a++) {
			i[a] = this.nodes[a].Center.sub(this.nodes[a].previousCenter), this.nodes[a].previousCenter = e[a];
			let o = t[a].add(n[a].mul(2).add(r[a].mul(2)).add(i[a])).div(6);
			this.nodes[a].Center = e[a].add(o);
		}
		return this.UpdateStepSize(a), this.nodes.reduce((e, t) => t.Center.sub(t.previousCenter).lengthSquared + e, 0);
	}
	run() {
		this.settings.Converged = !1, this.settings.EdgeRoutesUpToDate = !1, this.settings.Iterations++ == 0 && (this.stepSize = this.settings.InitialStepSize, this.energy = Number.MAX_VALUE, this.progress = 0);
		for (let e = 0; e < this.settings.MinorIterations; e++) {
			if ((this.settings.RungeKuttaIntegration ? this.RungeKuttaIntegration() : this.VerletIntegration()) < this.settings.DisplacementThreshold || this.settings.Iterations > this.settings.MaxIterations) {
				this.settings.Converged = !0;
				break;
			}
			this.ProgressStep();
		}
	}
};
function fo(e) {
	for (let t of e.Clusters) return !0;
	return !1;
}
//#endregion
//#region node_modules/@msagl/core/dist/layout/incremental/iPsepColaSettings.js
var po = class e {
	get edgeRoutingSettings() {
		return this.commonSettings.edgeRoutingSettings;
	}
	set edgeRoutingSettings(e) {
		this.commonSettings.edgeRoutingSettings = e;
	}
	get PackingAspectRatio() {
		return this.commonSettings.PackingAspectRatio;
	}
	set PackingAspectRatio(e) {
		this.commonSettings.PackingAspectRatio = e;
	}
	get NodeSeparation() {
		return this.commonSettings.NodeSeparation;
	}
	set NodeSeparation(e) {
		this.commonSettings.NodeSeparation = e;
	}
	get MaxIterations() {
		return this.maxIterations;
	}
	set MaxIterations(e) {
		this.maxIterations = e;
	}
	get MinorIterations() {
		return this.minorIterations;
	}
	set MinorIterations(e) {
		this.minorIterations = e;
	}
	get Iterations() {
		return this.iterations;
	}
	set Iterations(e) {
		this.iterations = e;
	}
	get ProjectionIterations() {
		return this.projectionIterations;
	}
	set ProjectionIterations(e) {
		this.projectionIterations = e;
	}
	get ApproximateRepulsion() {
		return this.approximateRepulsion;
	}
	set ApproximateRepulsion(e) {
		this.approximateRepulsion = e;
	}
	get InitialStepSize() {
		return this.initialStepSize;
	}
	set InitialStepSize(e) {
		if (e <= 0 || e > 2) throw Error("ForceScalar should be greater than 0 and less than 2 (if we let you set it to 0 nothing would happen, greater than 2 would most likely be very unstable!)");
		this.initialStepSize = e;
	}
	get Decay() {
		return this.decay;
	}
	set Decay(e) {
		if (e < .1 || e > 1) throw Error("Setting decay too small gives no progress.  1==no decay, 0.1==minimum allowed value");
		this.decay = e;
	}
	get Friction() {
		return this.friction;
	}
	set Friction(e) {
		if (e < 0 || e > 1) throw Error("Setting friction less than 0 or greater than 1 would just be strange.  1==no friction, 0==no conservation of velocity");
		this.friction = e;
	}
	get RepulsiveForceConstant() {
		return this.repulsiveForceConstant;
	}
	set RepulsiveForceConstant(e) {
		this.repulsiveForceConstant = e;
	}
	get AttractiveForceConstant() {
		return this.attractiveForceConstant;
	}
	set AttractiveForceConstant(e) {
		this.attractiveForceConstant = e;
	}
	get GravityConstant() {
		return this.gravity;
	}
	set GravityConstant(e) {
		this.gravity = e;
	}
	get InterComponentForces() {
		return this.interComponentForces;
	}
	set InterComponentForces(e) {
		this.interComponentForces = e;
	}
	get ApplyForces() {
		return this.applyForces;
	}
	set ApplyForces(e) {
		this.applyForces = e;
	}
	constructor() {
		this.commonSettings = new Ki(), this.maxIterations = 100, this.clusterMargin = 10, this.minorIterations = 3, this.projectionIterations = 5, this.approximateRepulsion = !0, this.RungeKuttaIntegration = !1, this.initialStepSize = 1.4, this.decay = .9, this.friction = .8, this.repulsiveForceConstant = 1, this.attractiveForceConstant = 1, this.gravity = 1, this.interComponentForces = !0, this.applyForces = !0, this.AvoidOverlaps = !0, this.approximateRouting = !0, this.logScaleEdgeForces = !0, this.displacementThreshold = .1, this.maxConstraintLevel = 2, this.minConstraintLevel = 0, this.attractiveInterClusterForceConstant = 1, this.clusterGravity = 1, this.commonSettings.NodeSeparation *= 2;
	}
	ResetLayout() {
		this.Unconverge(), this.algorithm != null && this.algorithm.ResetNodePositions();
	}
	Unconverge() {
		this.iterations = 0, this.converged = !1;
	}
	InitializeLayoutGN(e, t) {
		this.InitializeLayout(e, t);
	}
	InitializeLayout(e, t) {
		this.algorithm = new uo(e, this, t), this.ResetLayout();
	}
	Uninitialize() {
		this.algorithm = null;
	}
	get IsInitialized() {
		return this.algorithm != null;
	}
	IncrementalRunG(e) {
		this.IncrementalRunGF(e);
	}
	SetupIncrementalRun(e) {
		this.IsInitialized ? this.IsDone && this.ResetLayout() : this.InitializeLayout(e, this.MaxConstraintLevel);
	}
	IncrementalRunGF(e) {
		this.SetupIncrementalRun(e), this.algorithm.run();
	}
	IncrementalRun(e, t) {
		e?.throwIfCanceled(), this.SetupIncrementalRun(t), this.algorithm.cancelToken = e, this.algorithm.run();
	}
	Clone() {
		return e.ctorClone(this);
	}
	get ApproximateRouting() {
		return this.approximateRouting;
	}
	set ApproximateRouting(e) {
		this.approximateRouting = e;
	}
	get LogScaleEdgeForces() {
		return this.logScaleEdgeForces;
	}
	set LogScaleEdgeForces(e) {
		this.logScaleEdgeForces = e;
	}
	get DisplacementThreshold() {
		return this.displacementThreshold;
	}
	set DisplacementThreshold(e) {
		this.displacementThreshold = e;
	}
	get Converged() {
		return this.converged;
	}
	set Converged(e) {
		this.converged = e;
	}
	get PercentDone() {
		return this.Converged ? 100 : 100 * this.iterations / this.MaxIterations;
	}
	get IsDone() {
		return this.Converged || this.iterations >= this.MaxIterations;
	}
	get Energy() {
		return this.algorithm == null ? 0 : this.algorithm.energy;
	}
	get MaxConstraintLevel() {
		return this.maxConstraintLevel;
	}
	set MaxConstraintLevel(e) {
		this.maxConstraintLevel != e && (this.maxConstraintLevel = e, this.IsInitialized && this.Uninitialize());
	}
	get MinConstraintLevel() {
		return this.minConstraintLevel;
	}
	set MinConstraintLevel(e) {
		this.minConstraintLevel = e;
	}
	getCurrentConstraintLevel() {
		return this.algorithm == null ? 0 : this.algorithm.getCurrentConstraintLevel();
	}
	setCurrentConstraintLevel(e) {
		this.algorithm.setCurrentConstraintLevel(e);
	}
	get AttractiveInterClusterForceConstant() {
		return this.attractiveInterClusterForceConstant;
	}
	set AttractiveInterClusterForceConstant(e) {
		this.attractiveInterClusterForceConstant = e;
	}
	static ctorClone(t) {
		let n = new e();
		return n.maxIterations = t.maxIterations, n.minorIterations = t.minorIterations, n.projectionIterations = t.projectionIterations, n.approximateRepulsion = t.approximateRepulsion, n.initialStepSize = t.initialStepSize, n.RungeKuttaIntegration = t.RungeKuttaIntegration, n.decay = t.decay, n.friction = t.friction, n.repulsiveForceConstant = t.repulsiveForceConstant, n.attractiveForceConstant = t.attractiveForceConstant, n.gravity = t.gravity, n.interComponentForces = t.interComponentForces, n.applyForces = t.applyForces, n.AvoidOverlaps = t.AvoidOverlaps, n.RespectEdgePorts = t.RespectEdgePorts, n.RouteEdges = t.RouteEdges, n.approximateRouting = t.approximateRouting, n.logScaleEdgeForces = t.logScaleEdgeForces, n.displacementThreshold = t.displacementThreshold, n.minConstraintLevel = t.minConstraintLevel, n.maxConstraintLevel = t.maxConstraintLevel, n.attractiveInterClusterForceConstant = t.attractiveInterClusterForceConstant, n.clusterGravity = t.clusterGravity, n.PackingAspectRatio = t.PackingAspectRatio, n.NodeSeparation = t.NodeSeparation, n.clusterMargin = t.clusterMargin, n;
	}
	get ClusterGravity() {
		return this.clusterGravity;
	}
	set ClusterGravity(e) {
		this.clusterGravity = e;
	}
	static CreateFastIncrementalLayoutSettings() {
		let t = new e();
		return t.ApplyForces = !1, t.ApproximateRepulsion = !0, t.ApproximateRouting = !0, t.AttractiveForceConstant = 1, t.AttractiveInterClusterForceConstant = 1, t.AvoidOverlaps = !0, t.ClusterGravity = 1, t.Decay = .9, t.DisplacementThreshold = 5e-8, t.Friction = .8, t.GravityConstant = 1, t.InitialStepSize = 2, t.InterComponentForces = !1, t.Iterations = 0, t.LogScaleEdgeForces = !1, t.MaxConstraintLevel = 2, t.MaxIterations = 20, t.MinConstraintLevel = 0, t.MinorIterations = 1, t.ProjectionIterations = 5, t.RepulsiveForceConstant = 2, t.RespectEdgePorts = !1, t.RouteEdges = !1, t.RungeKuttaIntegration = !0, t.NodeSeparation = 20, t;
	}
}, mo = class {
	constructor(e) {
		this.topNodes = e;
	}
	get nodesBreadthFirst() {
		return this.nodesBreadthFirst_();
	}
	*nodesBreadthFirst_() {
		for (let e of this.topNodes) if (yield Qe.getGeom(e), e instanceof Je) for (let t of e.nodesBreadthFirst) yield Qe.getGeom(t);
	}
	get Clusters() {
		return this.clusters();
	}
	*clusters() {
		for (let e of this.topNodes) e instanceof Je && (yield mt.getGeom(e));
	}
	get subgraphsDepthFirst() {
		return this.subgraphsDepthFirst_();
	}
	*subgraphsDepthFirst_() {
		for (let e of this.topNodes) if (e instanceof Je) {
			let t = mt.getGeom(e);
			yield* t.subgraphsDepthFirst, yield t;
		}
	}
	get shallowEdges() {
		return this.edges_();
	}
	*edges_() {
		for (let e of this.topNodes) {
			for (let t of e.outEdges) yield be.getGeom(t);
			for (let t of e.selfEdges) yield be.getGeom(t);
		}
	}
	get shallowNodes() {
		return this.shallowNodes_();
	}
	*shallowNodes_() {
		for (let e of this.topNodes) yield Qe.getGeom(e);
	}
	pumpTheBoxToTheGraphWithMargins() {
		let e = { b: O.mkEmpty() };
		return ht(this, e), this.boundingBox = e.b;
	}
	get shallowNodeCount() {
		return this.topNodes.length;
	}
	translate(e) {
		this.boundingBox && (this.boundingBox.center = this.boundingBox.center.add(e));
		for (let t of this.topNodes) Qe.getGeom(t).translate(e);
	}
}, ho = class {
	static LinearInterpolation(e, t, n, r, i) {
		return e < t ? r : e > n ? i : r + (e - t) / (n - t) * (i - r);
	}
	static NegativeLinearInterpolation(e, t, n, r, i) {
		return e < t ? i : e > n ? r : r + (1 - (e - t) / (n - t)) * (i - r);
	}
}, go = class extends B {
	constructor(e, t) {
		super(null), this.SingleComponent = !1, this.graph = e, this.settings = po.ctorClone(t), this.settings.ApplyForces = !0, this.settings.InterComponentForces = !0, this.settings.RungeKuttaIntegration = !1, this.settings.RespectEdgePorts = !1;
	}
	run() {
		if (this.SingleComponent) this.componentCount = 1, this.LayoutComponent(this.graph);
		else {
			let e = Array.from(this.graph.graph.getClusteredConnectedComponents()).map((e) => new mo(e));
			this.componentCount = e.length;
			for (let t of e) this.LayoutComponent(t);
			this.graph.boundingBox = wa.PackGraphs(e, this.settings.commonSettings);
		}
	}
	LayoutComponent(e) {
		if (e.shallowNodeCount > 1) {
			if (this.settings.MaxIterations = ho.NegativeLinearInterpolation(e.shallowNodeCount, 50, 500, 5, 10), this.settings.MinorIterations = ho.NegativeLinearInterpolation(e.shallowNodeCount, 50, 500, 3, 20), this.settings.MinConstraintLevel == 0) {
				let t = new Ta();
				t.removeOverlaps = !1, t.IterationsWithMajorization = 0, new Ea(e, null, () => 1, new Ta()).run();
			}
			let t = new uo(e, this.settings, this.settings.MinConstraintLevel);
			for (let n of this.GetConstraintLevels(e)) {
				if (n > this.settings.MaxConstraintLevel) break;
				n > this.settings.MinConstraintLevel && t.setCurrentConstraintLevel(n);
				do
					t.run();
				while (!this.settings.IsDone);
			}
			this.settings.AvoidOverlaps && xa.RemoveOverlaps(Array.from(this.graph.shallowNodes), this.settings.NodeSeparation);
		}
		e.pumpTheBoxToTheGraphWithMargins(), e.uniformMargins = this.settings.NodeSeparation, e.translate(e.boundingBox.leftBottom.mul(-1));
	}
	GetConstraintLevels(e) {
		let t = /* @__PURE__ */ new Set();
		return t.add(0), this.settings.AvoidOverlaps && e.shallowNodeCount < 2e3 && t.add(2), t;
	}
};
//#endregion
//#region node_modules/@msagl/core/dist/layout/driver.js
function _o(e) {
	e.layoutSettings ||= yo(e);
}
function vo(e) {
	let t = e.parent;
	for (; t;) {
		if (t.layoutSettings) return t.layoutSettings;
		t = t.parent;
	}
	return null;
}
function yo(e) {
	let t = vo(e);
	if (t) return t;
	if (e.graph.shallowNodeCount > 2e3 || e.graph.deepEdgesCount > 4e3) return new po();
	let n = !1;
	for (let t of e.deepEdges) if (t.sourceArrowhead != null || t.targetArrowhead != null) {
		n = !0;
		break;
	}
	return n ? new Ji() : new po();
}
function bo(e, t, n = () => 1) {
	if (_o(e), e.layoutSettings instanceof Ji) new tc(e, e.layoutSettings, t).run();
	else if (e.layoutSettings instanceof Ta) new Ea(e, t, n, e.layoutSettings).run();
	else if (e.layoutSettings instanceof po) {
		let t = new go(e, e.layoutSettings);
		t.SingleComponent = !0, t.run();
	} else throw Error("not implemented");
}
function xo(e, t = null) {
	_o(e), wo(e, t, bo, Co, pt), Ao(e);
}
function So(e) {
	do {
		if (e.layoutSettings && e.layoutSettings.commonSettings.edgeRoutingSettings) return e.layoutSettings.commonSettings.edgeRoutingSettings;
		let t = e.graph.parent;
		if (t) e = c.getGeom(t);
		else break;
	} while (!0);
	let t = new Gi();
	return t.EdgeRoutingMode = Z.Spline, t;
}
function Co(e, t, n) {
	let r = So(e);
	r.EdgeRoutingMode === Z.Rectilinear ? Do(e, t, n) : r.EdgeRoutingMode === Z.Spline || r.EdgeRoutingMode === Z.SplineBundling ? _s(e, t, n) : r.EdgeRoutingMode === Z.StraightLine ? Da(e, t, n) : r.EdgeRoutingMode !== Z.None && new gs(e, t).run(), Oo(e, t);
}
function wo(e, t, n, r, i, a = 1, o = () => 1) {
	if (e.graph.isEmpty()) return;
	e.shallowNodes.next(), e.parent ?? (bn(a), ko(e));
	let s = f();
	d(e);
	let c = To(e.graph), l = Eo(e);
	if (p(), c.forEach((e) => {
		e[0].edge.remove(), e[1].add();
	}), l.forEach((t) => {
		for (let n of t.graph.shallowNodes) n.parent = e.graph;
	}), s.forEach((e) => e.add()), e.graph.parent == null) {
		let n = u(e);
		r(e, n, t), Oo(e, n), e.pumpTheBoxToTheGraphWithMargins();
	}
	function u(e) {
		let t = [];
		for (let n of e.nodesBreadthFirst) {
			for (let e of n.outEdges()) e.curve ?? t.push(e);
			for (let e of n.selfEdges()) e.curve ?? t.push(e);
		}
		return t;
	}
	function d(e) {
		for (let a of e.shallowNodes) a instanceof mt && wo(a, t, n, r, i);
	}
	function f() {
		let t = /* @__PURE__ */ new Set(), n = e.graph;
		if (n.parent == null) return t;
		for (let e of n.shallowNodes) {
			for (let r of e.outEdges) {
				let i = n.liftNode(r.target);
				(i == null || i === e) && t.add(r);
			}
			for (let r of e.inEdges) {
				let i = n.liftNode(r.source);
				(i == null || i === e) && t.add(r);
			}
		}
		for (let e of t) e.remove();
		return t;
	}
	function p() {
		if (l.length === 1) n(e, t, o);
		else {
			for (let e of l) n(e, t, o), e.boundingBox = e.pumpTheBoxToTheGraphWithMargins();
			i(e, l);
		}
	}
}
function To(e) {
	let t = [];
	for (let n of e.nodesBreadthFirst) {
		let r = e.liftNode(n);
		if (r != null) for (let i of n.outEdges.values()) {
			let a = i.target, o = e.liftNode(a);
			if (o == null || r === n && o === a || r === o) continue;
			i.remove();
			let s = new be(new Ge(r, o));
			t.push([s, i]);
		}
	}
	return t;
}
function Eo(e) {
	let t = e.graph, n = Ye(t), r = [], i = 0;
	for (let a of n) {
		let n = new Je(t.id + i++);
		n.parent = t;
		let o = new mt(n);
		o.layoutSettings = e.layoutSettings ?? yo(e);
		for (let e of a) e.parent = n, n.addNode(e);
		r.push(o);
	}
	return r;
}
function Do(e, t, n, r = 1, i = 3, a = 3) {
	let o = Li.constructorGNAN(e, t, r, i);
	o.edgeSeparatian = a, o.run();
}
function Oo(e, t) {
	t.length !== 0 && La.constructorGA(e, t).run();
}
function ko(e) {
	for (let t of e.deepEdges) t.label && (t.label.isPositioned = !1);
}
function Ao(e) {
	let t = e.boundingBox.leftBottom;
	if (t.x < 0 || t.y < 0) {
		let n = new y(-t.x, -t.y);
		e.translate(n);
	}
}
//#endregion
//#region node_modules/@msagl/core/dist/routing/PreGraph.js
var jo = class e {
	static constructorStatic(t, n) {
		let r = new e();
		r.edges = t, r.nodeBoundaries = n, r.boundingBox = O.mkEmpty();
		for (let e of r.nodeBoundaries) r.boundingBox = r.boundingBox.addRec(e.boundingBox);
		return r;
	}
	AddGraph(e) {
		this.edges = this.edges.concat(e.edges), this.nodeBoundaries = je(this.nodeBoundaries, e.nodeBoundaries), this.boundingBox.addRec(e.boundingBox);
	}
	AddNodeBoundary(e) {
		this.nodeBoundaries.add(e), this.boundingBox.addRec(e.boundingBox);
	}
}, Mo;
(function(e) {
	e[e.Success = 0] = "Success", e[e.Overlaps = 1] = "Overlaps", e[e.EdgeSeparationIsTooLarge = 2] = "EdgeSeparationIsTooLarge";
})(Mo ||= {});
//#endregion
//#region node_modules/@msagl/core/dist/routing/spline/bundling/CdtThreader.js
var No = class {
	get CurrentPiercedEdge() {
		return this.currentPiercedEdge;
	}
	get CurrentTriangle() {
		return this.currentTriangle;
	}
	constructor(e, t, n) {
		this.currentTriangle = e, this.start = t, this.end = n;
	}
	FindFirstPiercedEdge() {
		let e = this.GetHyperplaneSign(this.currentTriangle.Sites.item0), t = this.GetHyperplaneSign(this.currentTriangle.Sites.item1);
		if (e !== t && y.getTriangleOrientation(this.end, this.currentTriangle.Sites.item0.point, this.currentTriangle.Sites.item1.point) == _.Clockwise) return this.positiveSign = e, this.negativeSign = t, this.currentTriangle.Edges.item0;
		let n = this.GetHyperplaneSign(this.currentTriangle.Sites.item2);
		return t !== n && y.getTriangleOrientation(this.end, this.currentTriangle.Sites.item1.point, this.currentTriangle.Sites.item2.point) == _.Clockwise ? (this.positiveSign = t, this.negativeSign = n, this.currentTriangle.Edges.item1) : (this.positiveSign = n, this.negativeSign = e, this.currentTriangle.Edges.item2);
	}
	FindNextPierced() {
		if (this.currentTriangle = this.currentPiercedEdge.GetOtherTriangle_T(this.currentTriangle), this.currentTriangle == null) {
			this.currentPiercedEdge = null;
			return;
		}
		let e = this.currentTriangle.Edges.index(this.currentPiercedEdge), t, n = this.currentTriangle.Sites.getItem(e + 2), r = this.GetHyperplaneSign(n);
		this.negativeSign === 0 ? r === -1 || r === 0 ? (this.negativeSign = r, t = e + 1) : t = e + 2 : this.positiveSign === 0 ? r === 1 || r === 0 ? (this.positiveSign = r, t = e + 2) : t = e + 1 : r === this.positiveSign ? (this.positiveSign = r, t = e + 2) : (this.negativeSign = r, t = e + 1), this.currentPiercedEdge = y.signedDoubledTriangleArea(this.end, this.currentTriangle.Sites.getItem(t).point, this.currentTriangle.Sites.getItem(t + 1).point) < -u.distanceEpsilon ? this.currentTriangle.Edges.getItem(t) : null;
	}
	GetHyperplaneSign(e) {
		let t = y.signedDoubledTriangleArea(this.start, e.point, this.end);
		return t > u.distanceEpsilon ? 1 : t < -u.distanceEpsilon ? -1 : 0;
	}
	MoveNext() {
		return this.currentPiercedEdge == null ? this.currentPiercedEdge = this.FindFirstPiercedEdge() : this.FindNextPierced(), this.currentPiercedEdge != null;
	}
}, Po = class e {
	EdgeIsLegal_(e, t, n, r) {
		if (fa.PointIsInsideOfTriangle(t, n)) return !0;
		let i = new No(n, e, t);
		for (; i.MoveNext();) {
			let e = i.CurrentPiercedEdge;
			if (e.constrained) {
				let t = e.lowerSite.Owner;
				if (!r.has(t)) return !1;
			}
		}
		return !0;
	}
	constructor(e, t) {
		this.ComputeForcesForBundles = !1, this.metroGraphData = e, this.bundlingSettings = t;
	}
	BundleAvoidsObstacles(e, t, n, r, i, a) {
		a.closestDist = [];
		let o = this.metroGraphData.looseIntersections.ObstaclesToIgnoreForBundle(e, t), s = this.FindCloseObstaclesForBundle(t.cdtTriangle, r, n, o, i);
		if (s == null) return !1;
		for (let e of s) {
			let t = e[1];
			a.closestDist.push(t);
		}
		return !0;
	}
	FindCloseObstaclesForBundle(t, n, r, i, a) {
		let o = /* @__PURE__ */ new Map(), s = [];
		if (!this.ThreadLineSegmentThroughTriangles(t, n, r, i, s)) return null;
		if (!this.ComputeForcesForBundles && !this.bundlingSettings.HighestQuality) return o;
		let c = /* @__PURE__ */ new Set();
		for (let t of s) for (let s of t.Sites) {
			if (c.has(s)) continue;
			c.add(s);
			let t = s.Owner;
			if (i.has(t)) continue;
			let l = e.FindPolylinePoint(t, s.point), u = S.minDistBetweenLineSegments(l.point, l.nextOnPolyline.point, n, r), d = u.dist, f = u.parab, p = u.parcd, m = S.minDistBetweenLineSegments(l.point, l.prevOnPolyline.point, n, r), h = m.dist, g = m.parab, _ = m.parcd, v, y, b;
			if (d < h) {
				if (b = d, b > a) continue;
				v = l.point.add(l.nextOnPolyline.point.sub(l.point).mul(f)), y = n.add(r.sub(n).mul(p));
			} else {
				if (b = h, b > a) continue;
				v = l.point.add(l.prevOnPolyline.point.sub(l.point).mul(g)), y = n.add(r.sub(n).mul(_));
			}
			o.get(t) || o.set(t, [v, y]);
		}
		return o;
	}
	ThreadLineSegmentThroughTriangles(e, t, n, r, i) {
		if (fa.PointIsInsideOfTriangle(n, e)) return i.push(e), !0;
		let a = new No(e, t, n);
		for (i.push(e); a.MoveNext();) {
			i.push(a.CurrentTriangle);
			let e = a.CurrentPiercedEdge;
			if (e.constrained) {
				let t = e.lowerSite.Owner;
				if (!r.has(t)) return !1;
			}
		}
		return a.CurrentTriangle != null && i.push(a.CurrentTriangle), !0;
	}
	static PointLocationInsideTriangle(e, t) {
		let n = !1;
		for (let r = 0; r < 3; r++) {
			let i = y.signedDoubledTriangleArea(e, t.Sites.getItem(r).point, t.Sites.getItem(r + 1).point);
			if (i < u.distanceEpsilon * -1) return T.Outside;
			i < u.distanceEpsilon && (n = !0);
		}
		return n ? T.Boundary : T.Inside;
	}
	static FindPolylinePoint(e, t) {
		for (let n of e.polylinePoints()) if (n.point.equal(t)) return n;
		throw Error("polyline point " + t + " not found");
	}
	EdgeIsLegal(e, t, n, r) {
		let i = [], a = this.metroGraphData.looseIntersections.ObstaclesToIgnoreForBundle(e, t);
		return this.ThreadLineSegmentThroughTriangles(e.cdtTriangle, n, r, a, i);
	}
	EdgeIsLegalSSPPS(e, t, n) {
		let r = e.Position, i = e.cdtTriangle, a = t.Position;
		if (fa.PointIsInsideOfTriangle(a, i)) return !0;
		let o = new No(i, r, a);
		for (; o.MoveNext();) {
			let e = o.CurrentPiercedEdge;
			if (e.constrained) {
				let t = e.lowerSite.Owner;
				if (!n.has(t)) return !1;
			}
		}
		return !0;
	}
}, Fo = class e {
	constructor(e, t, n, r) {
		this.metroGraphData = e, this.obstaclesToIgnoreLambda = r, this.bundlingSettings = t, this.obstacleTree = n;
	}
	ObstaclesToIgnoreForBundle(e, t) {
		return e != null && t != null ? je(this.obstaclesToIgnoreLambda(e), this.obstaclesToIgnoreLambda(t)) : e == null && t == null ? /* @__PURE__ */ new Set() : e == null ? this.obstaclesToIgnoreLambda(t) : this.obstaclesToIgnoreLambda(e);
	}
	HubAvoidsObstaclesSPNBA(t, n, r, i) {
		let a = { minimalDistance: r };
		return e.IntersectCircleWithTree(this.obstacleTree, n, r, this.obstaclesToIgnoreLambda(t), i.touchedObstacles, a);
	}
	HubAvoidsObstaclesPNS__(e, t, n) {
		return this.HubAvoidsObstaclesPNSTT(e, t, n, { touchedObstacles: [] }, { minimalDistance: 0 });
	}
	GetMinimalDistanceToObstacles(t, n, r) {
		let i = [], a = { minimalDistance: r };
		return e.IntersectCircleWithTree(this.obstacleTree, n, r, this.obstaclesToIgnoreLambda(t), i, a) ? a.minimalDistance : 0;
	}
	HubAvoidsObstaclesPNSTT(t, n, r, i, a) {
		return i.touchedObstacles = [], a.minimalDistance = n, e.IntersectCircleWithTree(this.obstacleTree, t, n, r, i.touchedObstacles, a);
	}
	static IntersectCircleWithTree(t, n, r, i, a, o) {
		if (!t.irect.contains_point_radius(n, r)) return !0;
		if (t.UserData == null) {
			let s = e.IntersectCircleWithTree(t.Left, n, r, i, a, o);
			if (!s || (s = e.IntersectCircleWithTree(t.Right, n, r, i, a, o), !s)) return !1;
		} else {
			let s = t.UserData;
			if (i.has(s)) return !0;
			if (E.PointRelativeToCurveLocation(n, s) !== T.Outside) return e.containingPoly = s, !1;
			let c = s.value(s.closestParameter(n)), l = c.sub(n).length;
			l <= r && a.push([s, c]), o.minimalDistance = Math.min(l, o.minimalDistance);
		}
		return !0;
	}
	static Create4gon(e, t, n, r) {
		let i = t.sub(e).normalize();
		return i = new y(i.y, i.x * -1), D.mkFromPoints([
			e.add(i.mul(n / 2)),
			e.sub(i.mul(n / 2)),
			t.sub(i.mul(r / 2)),
			t.add(i.mul(r / 2))
		]);
	}
}, Io = class {
	constructor(e, t, n, r) {
		this.Width = t, this.Polyline = e, this.sourceAndTargetLoosePolylines = n, this.Index = r;
	}
	UpdateLengths() {
		let e = 0;
		for (let t = this.Polyline.startPoint; t.next != null; t = t.next) e += t.next.point.sub(t.point).length;
		this.Length = e, this.IdealLength = this.Polyline.end.sub(this.Polyline.start).length;
	}
}, Lo = class {
	constructor(e, t, n) {
		this.metroline = e, this.station = t, this.polyPoint = n;
	}
	get Metroline() {
		return this.metroline;
	}
	get PolyPoint() {
		return this.polyPoint;
	}
}, Ro = class {
	constructor(e, t, n) {
		this.Radius = 0, this.BundleBases = /* @__PURE__ */ new Map(), this.MetroNodeInfos = [], this._cachedIdealRadius = 0, this.SerialNumber = e, this.IsReal = t, this.Position = n;
	}
	debStop() {
		return this.SerialNumber === 28 && this.Position.sub(new y(841.2662778763244, 303.3817005853006)).length < .001;
	}
	get Position() {
		return this._Position;
	}
	set Position(e) {
		this._Position = e;
	}
	getELP() {
		return this.EnterableLoosePolylines;
	}
	setELP(e) {
		this.EnterableLoosePolylines = e;
	}
	addEL(e) {
		this.EnterableLoosePolylines.add(e);
	}
	get cachedIdealRadius() {
		return this._cachedIdealRadius;
	}
	set cachedIdealRadius(e) {
		this._cachedIdealRadius = e;
	}
	AddEnterableLoosePolyline(e) {
		this.EnterableLoosePolylines ??= /* @__PURE__ */ new Set(), this.EnterableLoosePolylines.add(e);
	}
	AddEnterableTightPolyline(e) {
		this.EnterableTightPolylines ??= /* @__PURE__ */ new Set(), this.EnterableTightPolylines.add(e);
	}
}, zo = class {
	constructor() {
		this.Width = 0, this.Metrolines = [], this.cachedBundleCost = 0;
	}
	get Count() {
		return this.Metrolines.length;
	}
}, Bo = class e {
	constructor(e, t) {
		this.metroGraphData = e, this.bundlingSettings = t;
	}
	CreateNodeRadii() {
		for (let t of this.metroGraphData.VirtualStations()) t.Radius = 0, t.cachedIdealRadius = e.CalculateIdealHubRadiusWithNeighborsMBS(this.metroGraphData, this.bundlingSettings, t);
		this.GrowHubs(!1), this.GrowHubs(!0);
		for (let e of this.metroGraphData.VirtualStations()) e.Radius = Math.max(e.Radius, this.bundlingSettings.MinHubRadius);
	}
	GrowHubs(e) {
		let t = new Rn(f);
		for (let n of this.metroGraphData.VirtualStations()) t.Enqueue(n, -this.CalculatePotential(n, e));
		let n = !1;
		for (; !t.IsEmpty();) {
			let r = { priority: 0 }, i = t.DequeueAndGetPriority(r);
			if (r.priority >= 0) break;
			this.TryGrowHub(i, e) && (t.Enqueue(i, -this.CalculatePotential(i, e)), n = !0);
		}
		return n;
	}
	TryGrowHub(t, n) {
		let r = this.CalculateAllowedHubRadius(t);
		if (t.Radius >= r) return !1;
		let i = n ? e.CalculateIdealHubRadiusWithAdjacentEdges(this.bundlingSettings, t) : t.cachedIdealRadius;
		if (t.Radius >= i) return !1;
		let a = .05 * (i - t.Radius);
		a < 1 && (a = 1);
		let o = Math.min(t.Radius + a, r);
		return o <= t.Radius ? !1 : (t.Radius = o, !0);
	}
	CalculatePotential(t, n) {
		let r = n ? e.CalculateIdealHubRadiusWithAdjacentEdges(this.bundlingSettings, t) : t.cachedIdealRadius;
		return r <= t.Radius ? 0 : (r - t.Radius) / r;
	}
	CalculateAllowedHubRadius(e) {
		let t = this.bundlingSettings.MaxHubRadius;
		for (let n of e.Neighbors) {
			let r = n.Position.sub(e.Position).length;
			t = Math.min(t, r / 1.05 - n.Radius);
		}
		let n = this.metroGraphData.tightIntersections.GetMinimalDistanceToObstacles(e, e.Position, t);
		return n < t && (t = n - .001), Math.max(t, .1);
	}
	static CalculateIdealHubRadius(e, t, n) {
		let r = 1;
		for (let i of n.Neighbors) {
			let a = e.GetWidthSSN(i, n, t.EdgeSeparation) / 2 + t.EdgeSeparation;
			r = Math.max(r, a);
		}
		return r = Math.min(r, 2 * t.MaxHubRadius), r;
	}
	static CalculateIdealHubRadiusWithNeighborsMBS(t, n, r) {
		return e.CalculateIdealHubRadiusWithNeighborsMBNP(t, n, r, r.Position);
	}
	static CalculateIdealHubRadiusWithNeighborsMBNP(t, n, r, i) {
		let a = e.CalculateIdealHubRadius(t, n, r);
		if (r.Neighbors.length > 1) {
			let o = r.Neighbors;
			for (let s = 0; s < o.length; s++) {
				let c = o[s], l = o[(s + 1) % o.length];
				a = Math.max(a, e.GetMinRadiusForTwoAdjacentBundles(a, r, i, c, l, t, n));
			}
		}
		return a = Math.min(a, 2 * n.MaxHubRadius), a;
	}
	static CalculateIdealHubRadiusWithAdjacentEdges(e, t) {
		let n = e.MaxHubRadius;
		for (let e of t.Neighbors) n = Math.min(n, t.Position.sub(e.Position).length / 2);
		return n;
	}
	static GetMinRadiusForTwoAdjacentBundles(t, n, r, i, a, o, s) {
		let c = o.GetWidthSSN(n, i, s.EdgeSeparation), l = o.GetWidthSSN(n, a, s.EdgeSeparation);
		return e.GetMinRadiusForTwoAdjacentBundlesNPPPNNB(t, r, i.Position, a.Position, c, l, s);
	}
	static GetMinRadiusForTwoAdjacentBundlesNPPPNNB(e, t, n, r, i, a, o) {
		if (i < u.distanceEpsilon || a < u.distanceEpsilon) return e;
		let s = y.anglePCP(n, t, r);
		if (s = Math.min(s, Math.PI * 2 - s), s < u.distanceEpsilon) return 2 * o.MaxHubRadius;
		if (s >= Math.PI / 2) return e * 1.05;
		let c = Math.sin(s), l = Math.cos(s), d = i / (4 * c), f = a / (4 * c), p = 2 * Math.sqrt(d * d + (f * f + 2 * (f * l * d)));
		return p = Math.min(p, 2 * o.MaxHubRadius), p = Math.max(p, e), p;
	}
}, Vo = class e {
	constructor(e, t, n, r) {
		this.metroGraphData = e, this.bundlingSettings = t, this.costCalculator = n, this.cdt = r;
	}
	InitializeCostCache() {
		for (let e of this.metroGraphData.VirtualStations()) e.cachedIdealRadius = Bo.CalculateIdealHubRadiusWithNeighborsMBS(this.metroGraphData, this.bundlingSettings, e), e.cachedRadiusCost = this.costCalculator.RadiusCost(e, e.Position), e.cachedBundleCost = 0;
		for (let e of this.metroGraphData.VirtualEdges()) {
			let t = e[0], n = e[1], r = this.metroGraphData.GetIjInfo(t, n);
			r.cachedBundleCost = this.costCalculator.BundleCost(t, n, t.Position), t.cachedBundleCost += r.cachedBundleCost, n.cachedBundleCost += r.cachedBundleCost;
		}
	}
	UpdateCostCache(t) {
		t.cdtTriangle = this.cdt.getRectangleNodeOnTriangles().FirstHitNodeWithPredicate(t.Position, e.testPointInside).UserData, t.cachedIdealRadius = Bo.CalculateIdealHubRadiusWithNeighborsMBS(this.metroGraphData, this.bundlingSettings, t), t.cachedRadiusCost = this.costCalculator.RadiusCost(t, t.Position), t.cachedBundleCost = 0;
		for (let e of t.Neighbors) {
			e.IsReal || (e.cachedIdealRadius = Bo.CalculateIdealHubRadiusWithNeighborsMBS(this.metroGraphData, this.bundlingSettings, e), e.cachedRadiusCost = this.costCalculator.RadiusCost(e, e.Position));
			let n = this.metroGraphData.GetIjInfo(t, e);
			e.cachedBundleCost -= n.cachedBundleCost, n.cachedBundleCost = this.costCalculator.BundleCost(t, e, t.Position), t.cachedBundleCost += n.cachedBundleCost, e.cachedBundleCost += n.cachedBundleCost;
		}
	}
	static testPointInside(e, t) {
		return fa.PointIsInsideOfTriangle(e, t) ? P.Stop : P.Continue;
	}
}, Ho = class {
	constructor() {
		this.mainMap = /* @__PURE__ */ new Map();
	}
	get isEmpty() {
		return this.mainMap.size === 0 || this.everyMapIsEmpty();
	}
	everyMapIsEmpty() {
		for (let e of this.mainMap.values()) if (e.size) return !1;
		return !0;
	}
	get(e, t) {
		let n = this.mainMap.get(e);
		if (n) return n.get(t);
	}
	has(e, t) {
		let n = this.mainMap.get(e);
		return n ? n.has(t) : !1;
	}
	set(e, t, n) {
		let r = this.mainMap.get(e);
		r || (r = /* @__PURE__ */ new Map(), this.mainMap.set(e, r)), r.set(t, n);
	}
	*[Symbol.iterator]() {
		for (let [e, t] of this.mainMap) for (let [n, r] of t) yield [
			e,
			n,
			r
		];
	}
	*keys() {
		for (let [e, t] of this.mainMap) for (let [n] of t) yield [e, n];
	}
}, Uo = class {
	constructor(e, t, n, r, i, a, o, s) {
		this.cachedEnterableLooseForEnd = new Nt(), this.bundlingSettings = r, this.regularEdges = e, i == null ? this.cdt = pa(t) : this.cdt = i, this.EdgeLooseEnterable = a, this.EdgeTightEnterable = o, this.LoosePolylineOfPort = s, this.looseIntersections = new Fo(this, r, t, (e) => e.getELP()), this.tightIntersections = new Fo(this, r, n, (e) => e.EnterableTightPolylines), this.cdtIntersections = new Po(this, r), this.Initialize(!1);
	}
	get Ink() {
		return this.ink;
	}
	get Edges() {
		return this.regularEdges;
	}
	VirtualStations() {
		return Array.from(this.Stations).filter((e) => !e.IsReal);
	}
	get Metrolines() {
		return this.metrolines;
	}
	get LooseTree() {
		return this.looseIntersections.obstacleTree;
	}
	get TightTree() {
		return this.tightIntersections.obstacleTree;
	}
	*VirtualEdges() {
		for (let e of this.edgeInfoDictionary.keys()) yield e;
	}
	RealEdgeCount(e, t) {
		let n = e.SerialNumber < t.SerialNumber ? [e, t] : [t, e], r = this.edgeInfoDictionary.get(n[0], n[1]);
		return r ? r.Count : 0;
	}
	MetroNodeInfosOfNode(e) {
		return e.MetroNodeInfos;
	}
	GetIjInfo(e, t) {
		let n = e.SerialNumber < t.SerialNumber ? [e, t] : [t, e];
		return this.edgeInfoDictionary.get(n[0], n[1]);
	}
	MoveNode(e, t) {
		let n = e.Position;
		this.PointToStations.deleteP(n), this.PointToStations.set(t, e), e.Position = t;
		for (let n of this.MetroNodeInfosOfNode(e)) n.PolyPoint.point = t;
		for (let r of this.MetroNodeInfosOfNode(e)) {
			let e = r.Metroline, i = r.PolyPoint.prev.point, a = r.PolyPoint.next.point;
			e.Length += a.sub(t).length + i.sub(t).length - a.sub(n).length - i.sub(n).length;
		}
		for (let r of e.Neighbors) this.ink += t.sub(r.Position).length - n.sub(r.Position).length;
		this.SortNeighbors(e);
		for (let t of e.Neighbors) this.SortNeighbors(t);
	}
	GetWidthSSN(e, t, n) {
		let r = e.SerialNumber < t.SerialNumber ? [e, t] : [t, e], i = this.edgeInfoDictionary.get(r[0], r[1]);
		return i ? i.Width + (i.Count - 1) * n : 0;
	}
	GetWidthAN(e, t) {
		let n = 0;
		for (let t of e) n += t.Width;
		let r = e.length;
		return n += r > 0 ? (r - 1) * t : 0, n;
	}
	Initialize(e) {
		this.SimplifyRegularEdges(), this.InitializeStationData(), this.InitializeEdgeData(), this.InitializeVirtualGraph(), this.InitializeEdgeNodeInfo(e), this.InitializeCdtInfo();
	}
	SimplifyRegularEdges() {
		for (let e of this.regularEdges) this.SimplifyRegularEdge(e);
	}
	SimplifyRegularEdge(e) {
		let t = e.curve, n = new N.Stack(), r = new R();
		for (let e = t.endPoint; e != null; e = e.prev) {
			let t = e.point;
			if (r.has(e.point)) {
				let i = e.next;
				do {
					let e = n.top;
					if (!e.equal(t)) r.delete(e), n.pop(), i = i.next;
					else break;
				} while (!0);
				i.prev = e.prev, i.prev.next = i;
			} else n.push(t), r.add(t);
		}
	}
	InitializeStationData() {
		this.Stations = [], this.PointToStations = new Nt();
		for (let e of this.regularEdges) {
			let t = e.curve;
			this.ProcessPolylinePoints(t);
		}
	}
	ProcessPolylinePoints(e) {
		let t = e.startPoint;
		for (this.RegisterStation(t, !0), t = t.next; t !== e.endPoint; t = t.next) this.RegisterStation(t, !1);
		this.RegisterStation(t, !0);
	}
	RegisterStation(e, t) {
		if (!this.PointToStations.has(e.point)) {
			let n = new Ro(this.Stations.length, t, e.point);
			this.PointToStations.set(e.point, n), this.Stations.push(n);
		}
	}
	InitializeEdgeData() {
		this.metrolines = [];
		for (let e = 0; e < this.regularEdges.length; e++) {
			let t = this.regularEdges[e];
			this.InitEdgeData(t, e);
		}
	}
	InitEdgeData(e, t) {
		let n = new Io(e.curve, this.bundlingSettings.ActualEdgeWidth(e), this.EdgeSourceAndTargetFunc(e), t);
		this.metrolines.push(n), this.PointToStations.get(n.Polyline.start).BoundaryCurve = e.sourcePort.Curve, this.PointToStations.get(n.Polyline.end).BoundaryCurve = e.targetPort.Curve;
	}
	EdgeSourceAndTargetFunc(e) {
		return () => [this.LoosePolylineOfPort(e.sourcePort), this.LoosePolylineOfPort(e.targetPort)];
	}
	InitializeVirtualGraph() {
		let e = /* @__PURE__ */ new Map();
		for (let t of this.metrolines) {
			let n = this.PointToStations.get(t.Polyline.start), r;
			for (let i = t.Polyline.startPoint; i.next != null; i = i.next, n = r) r = this.PointToStations.get(i.next.point), Re(e, n, r), Re(e, r, n);
		}
		for (let t of this.Stations) t.Neighbors = Array.from(e.get(t));
	}
	GetUnorderedIjInfo(e, t) {
		return e.SerialNumber < t.SerialNumber ? this.GetCreateOrderedIjInfo(e, t) : this.GetCreateOrderedIjInfo(t, e);
	}
	static closedeb(e, t) {
		return e.Position.sub(new y(360.561, 428.416)).length < .1 && t.Position.sub(new y(414.281, 440.732)).length < .1;
	}
	GetCreateOrderedIjInfo(e, t) {
		let n = this.edgeInfoDictionary.get(e, t);
		return n || (n = new zo(), this.edgeInfoDictionary.set(e, t, n), n);
	}
	InitializeEdgeNodeInfo(e) {
		this.edgeInfoDictionary = new Ho(), this.InitAllMetroNodeInfos(e), this.SortAllNeighbors(), this.InitEdgeIjInfos(), this.ink = 0;
		for (let e of this.VirtualEdges()) this.ink += e[0].Position.sub(e[1].Position).length;
	}
	InitAllMetroNodeInfos(e) {
		for (let t = 0; t < this.metrolines.length; t++) {
			let n = this.metrolines[t];
			this.InitMetroNodeInfos(n), this.InitNodeEnterableLoosePolylines(n, this.regularEdges[t]), e && this.InitNodeEnterableTightPolylines(n, this.regularEdges[t]), n.UpdateLengths();
		}
	}
	InitMetroNodeInfos(e) {
		for (let t = e.Polyline.startPoint; t != null; t = t.next) {
			let n = this.PointToStations.get(t.point);
			n.MetroNodeInfos.push(new Lo(e, n, t));
		}
	}
	InitNodeEnterableLoosePolylines(e, t) {
		let n = this.EdgeLooseEnterable == null ? /* @__PURE__ */ new Set() : this.EdgeLooseEnterable.get(t);
		for (let t = e.Polyline.startPoint.next; t != null && t.next != null; t = t.next) {
			let e = this.PointToStations.get(t.point);
			e.getELP() == null ? e.setELP(new Set(n)) : e.setELP(Ne(e.getELP(), n));
		}
		this.AddLooseEnterableForMetrolineStartEndPoints(e);
	}
	AddLooseEnterableForMetrolineStartEndPoints(e) {
		this.AddLooseEnterableForEnd(e.Polyline.start), this.AddLooseEnterableForEnd(e.Polyline.end);
	}
	AddTightEnterableForMetrolineStartEndPoints(e) {
		this.AddTightEnterableForEnd(e.Polyline.start), this.AddTightEnterableForEnd(e.Polyline.end);
	}
	AddLooseEnterableForEnd(e) {
		let t = this.PointToStations.get(e);
		if (this.cachedEnterableLooseForEnd.has(e)) t.setELP(this.cachedEnterableLooseForEnd.get(e));
		else {
			for (let n of this.LooseTree.AllHitItems_(e)) E.PointRelativeToCurveLocation(e, n) === T.Inside && t.AddEnterableLoosePolyline(n);
			this.cachedEnterableLooseForEnd.set(e, t.getELP());
		}
	}
	AddTightEnterableForEnd(e) {
		let t = this.PointToStations.get(e);
		for (let n of this.TightTree.AllHitItems_(e)) E.PointRelativeToCurveLocation(e, n) === T.Inside && t.AddEnterableTightPolyline(n);
	}
	InitNodeEnterableTightPolylines(e, t) {
		let n = this.EdgeTightEnterable == null ? /* @__PURE__ */ new Set() : this.EdgeTightEnterable.get(t);
		for (let t = e.Polyline.startPoint.next; t != null && t.next != null; t = t.next) {
			let e = this.PointToStations.get(t.point), r = e.EnterableTightPolylines;
			r == null ? e.EnterableTightPolylines = new Set(n) : e.EnterableTightPolylines = Ne(r, n);
		}
		this.AddTightEnterableForMetrolineStartEndPoints(e);
	}
	SortAllNeighbors() {
		for (let e of this.Stations) this.SortNeighbors(e);
	}
	SortNeighbors(e) {
		if (e.Neighbors.length <= 2) return;
		let t = e.Neighbors[0].Position, n = e.Position;
		e.Neighbors.sort((e, r) => Wo(t.sub(n), e.Position.sub(n), r.Position.sub(n)));
	}
	InitEdgeIjInfos() {
		for (let e of this.metrolines) {
			let t = e.Polyline, n = this.PointToStations.get(t.start), r;
			for (let t = e.Polyline.startPoint; t.next != null; t = t.next, n = r) {
				r = this.PointToStations.get(t.next.point);
				let i = this.GetUnorderedIjInfo(n, r);
				i.Width += e.Width, i.Metrolines.push(e);
			}
		}
	}
	InitializeCdtInfo() {
		let e = this.cdt.getRectangleNodeOnTriangles();
		for (let t of this.Stations) t.cdtTriangle = e.FirstHitNodeWithPredicate(t.Position, Vo.testPointInside).UserData;
	}
	PointIsAcceptableForEdge(e, t) {
		if (this.LoosePolylineOfPort == null) return !0;
		let n = e.sourceAndTargetLoosePolylines();
		return E.PointRelativeToCurveLocation(t, n[0]) === T.Outside && E.PointRelativeToCurveLocation(t, n[1]) === T.Outside;
	}
};
function Wo(e, t, n) {
	let r = y.crossProduct(e, n), i = e.dot(n), a = y.crossProduct(e, t), o = e.dot(t);
	return m(a, 0) && Go(o, 0) ? m(r, 0) && Go(i, 0) ? 0 : 1 : m(r, 0) && Go(i, 0) ? -1 : m(a, 0) || m(r, 0) || a * r > 0 ? g(y.crossProduct(n, t), 0) : -g(Math.sign(a), 0);
}
function Go(e, t) {
	return g(e, t) >= 0;
}
//#endregion
//#region node_modules/@msagl/core/dist/routing/spline/bundling/CostCalculator.js
var Ko = class e {
	constructor(e, t) {
		this.metroGraphData = e, this.bundlingSettings = t;
	}
	static InkError(e, t, n) {
		return (e - t) * n.InkImportance;
	}
	static PathLengthsError(e, t, n, r) {
		return (e - t) * (r.PathLengthImportance / n);
	}
	static RError(e, t, n) {
		return e <= t ? 0 : n.HubRepulsionImportance * ((1 - t / e) * (e - t));
	}
	static BundleError(e, t, n) {
		return e <= t ? 0 : n.BundleRepulsionImportance * ((1 - t / e) * (e - t));
	}
	static Cost(e, t) {
		let n = t.InkImportance * e.Ink;
		for (let r of e.Metrolines) n += t.PathLengthImportance * r.Length / r.IdealLength;
		return n += this.CostOfForces(e), n;
	}
	static CostOfForces(e) {
		let t = 0;
		for (let n of e.VirtualStations()) t += n.cachedRadiusCost;
		for (let n of e.VirtualEdges()) {
			let r = n[0], i = n[1];
			t += e.GetIjInfo(r, i).cachedBundleCost;
		}
		return t;
	}
	InkGain(t, n) {
		let r = this.metroGraphData.Ink, i = this.metroGraphData.Ink;
		for (let e of t.Neighbors) {
			let r = e.Position;
			i -= r.sub(t.Position).length, i += r.sub(n).length;
		}
		return e.InkError(r, i, this.bundlingSettings);
	}
	PathLengthsGain(t, n) {
		let r = 0;
		for (let i of this.metroGraphData.MetroNodeInfosOfNode(t)) {
			let a = i.Metroline.Length, o = i.PolyPoint.prev.point, s = i.PolyPoint.next.point, c = i.Metroline.Length + s.sub(n).length + o.sub(n).length - s.sub(t.Position).length - o.sub(t.Position).length;
			r += e.PathLengthsError(a, c, i.Metroline.IdealLength, this.bundlingSettings);
		}
		return r;
	}
	RadiusGain(e, t) {
		let n = 0;
		return n += e.cachedRadiusCost, n -= this.RadiusCost(e, t), n;
	}
	RadiusCost(t, n) {
		let r;
		r = y.closeDistEps(t.Position, n) ? t.cachedIdealRadius : Bo.CalculateIdealHubRadiusWithNeighborsMBNP(this.metroGraphData, this.bundlingSettings, t, n);
		let i = { touchedObstacles: [] };
		if (!this.metroGraphData.looseIntersections.HubAvoidsObstaclesSPNBA(t, n, r, i)) return e.Inf;
		let a = 0;
		for (let t of i.touchedObstacles) {
			let i = t[1].sub(n).length;
			a += e.RError(r, i, this.bundlingSettings);
		}
		return a;
	}
	BundleGain(t, n) {
		let r = t.cachedBundleCost;
		for (let i of t.Neighbors) {
			let a = this.BundleCost(t, i, n);
			if (Go(a, e.Inf)) return -e.Inf;
			r -= a;
		}
		return r;
	}
	BundleCost(t, n, r) {
		let i = this.metroGraphData.GetWidthSSN(t, n, this.bundlingSettings.EdgeSeparation), a = { closestDist: [] };
		if (!this.metroGraphData.cdtIntersections.BundleAvoidsObstacles(t, n, r, n.Position, i, a)) return e.Inf;
		let o = 0;
		for (let t of a.closestDist) {
			let n = t[0].sub(t[1]).length;
			o += e.BundleError(i / 2, n, this.bundlingSettings);
		}
		return o;
	}
};
Ko.Inf = 1e9;
//#endregion
//#region node_modules/@msagl/core/dist/routing/spline/bundling/FlipSwitcher.js
var qo = class {
	get Polylines() {
		return Array.from(this.polylineToEdgeGeom.keys());
	}
	constructor(e) {
		this.polylineToEdgeGeom = /* @__PURE__ */ new Map(), this.pathsThroughPoints = new Nt(), this.interestingPoints = new R(), this.metroGraphData = e;
	}
	Run() {
		this.Init(), this.SwitchFlips();
	}
	Init() {
		for (let e of this.metroGraphData.Edges) this.polylineToEdgeGeom.set(e.curve, e);
		for (let e of this.Polylines) this.RegisterPolylinePointInPathsThrough(e.polylinePoints());
	}
	RegisterPolylinePointInPathsThrough(e) {
		for (let t of e) this.RegisterPolylinePointInPathsThroughP(t);
	}
	RegisterPolylinePointInPathsThroughP(e) {
		Jo(this.pathsThroughPoints, e.point, e);
	}
	UnregisterPolylinePointsInPathsThrough(e) {
		for (let t of e) this.UnregisterPolylinePointInPathsThrough(t);
	}
	UnregisterPolylinePointInPathsThrough(e) {
		Yo(this.pathsThroughPoints, e.point, e);
	}
	SwitchFlips() {
		let e = new Set(this.Polylines), t = new i.Queue();
		for (let e of this.Polylines) t.enqueue(e);
		for (; t.length > 0;) {
			let n = t.dequeue();
			e.delete(n);
			let r = this.ProcessPolyline(n);
			r != null && (e.has(n) || (e.add(n), t.enqueue(n)), e.has(r) || (e.add(r), t.enqueue(r)));
		}
	}
	ProcessPolyline(e) {
		let t = /* @__PURE__ */ new Map();
		for (let n = e.startPoint.next; n != null; n = n.next) {
			this.FillDepartedPolylinePoints(n, t);
			for (let e of this.pathsThroughPoints.get(n.point)) {
				let r = t.get(e.polyline);
				if (r) {
					if (this.ProcessFlip(n, r)) return e.polyline;
					t.delete(e.polyline);
				}
			}
		}
		return null;
	}
	FillDepartedPolylinePoints(e, t) {
		let n = e.prev.point;
		for (let r of this.pathsThroughPoints.get(n)) this.IsNeighborOnTheSamePolyline(r, e) || t.has(r.polyline) || t.set(r.polyline, r);
	}
	ProcessFlip(e, t) {
		let n = e.polyline, r = t.polyline, i = e.point, a = t.point, o = this.polylineToEdgeGeom.get(n), s = this.polylineToEdgeGeom.get(r);
		if (o.lineWidth !== s.lineWidth || this.metroGraphData.EdgeLooseEnterable == null || !Ie(this.metroGraphData.EdgeLooseEnterable.get(o), this.metroGraphData.EdgeLooseEnterable.get(s))) return !1;
		let c = this.FindPointsOnPolyline(n, i, a), l = c[0], u = c[1], d = c[2];
		c = this.FindPointsOnPolyline(r, i, a);
		let f = c[0], p = c[1], m = c[2], h = this.FindRelationOnFirstPoint(l, f, d, m), g = this.FindRelationOnLastPoint(u, p, d, m);
		return h !== 2 && g !== 2 || h === 1 || g === 1 ? !1 : (this.UnregisterPolylinePointsInPathsThrough(n.polylinePoints()), this.UnregisterPolylinePointsInPathsThrough(r.polylinePoints()), this.Swap(l, f, u, p, d, m), this.RegisterPolylinePointInPathsThrough(n.polylinePoints()), this.RegisterPolylinePointInPathsThrough(r.polylinePoints()), this.RegisterInterestingPoint(l.point), this.RegisterInterestingPoint(u.point), this.numberOfReducedCrossings++, !0);
	}
	FindPointsOnPolyline(e, t, n) {
		let r, i;
		for (let a = e.startPoint; a != null; a = a.next) if (r == null) if (a.point.equal(t)) {
			if (i != null) return [
				a,
				i,
				!1
			];
			r = a;
		} else i == null && a.point.equal(n) && (i = a);
		else if (a.point.equal(n)) return [
			r,
			a,
			!0
		];
	}
	PolylinePointsAreInForwardOrder(e, t) {
		for (let n = e; n != null; n = n.next) if (n === t) return !0;
		return !1;
	}
	Next(e, t) {
		return t ? e.next : e.prev;
	}
	Prev(e, t) {
		return t ? e.prev : e.next;
	}
	FindRelationOnFirstPoint(e, t, n, r) {
		let i = e, a = t;
		for (;;) {
			let i = this.Prev(e, n), a = this.Prev(t, r);
			if (i == null || a == null) return 0;
			if (!i.point.equal(a.point)) break;
			e = i, t = a;
		}
		return this.PolylinesIntersect(i, a, e, t, n, r);
	}
	FindRelationOnLastPoint(e, t, n, r) {
		let i = e, a = t;
		for (;;) {
			let i = this.Next(e, n), a = this.Next(t, r);
			if (i == null || a == null) return 0;
			if (!i.point.equal(a.point)) break;
			e = i, t = a;
		}
		for (; this.Next(e, n).point.equal(this.Prev(t, r).point);) e = this.Next(e, n), t = this.Prev(t, r);
		return this.PolylinesIntersect(e, t, i, a, n, r);
	}
	PolylinesIntersect(e, t, n, r, i, a) {
		let o = this.Prev(e, i), s = this.Next(e, i), c = this.Next(n, i), l = this.Prev(n, i), u = this.Next(t, a), d = this.Prev(r, a);
		if (e.point.equal(n.point)) {
			let t = e.point;
			return Wo(l.point.sub(t), d.point.sub(t), s.point.sub(t)) === Wo(l.point.sub(t), u.point.sub(t), s.point.sub(t)) ? 1 : 2;
		} else return Wo(o.point.sub(e.point), s.point.sub(e.point), u.point.sub(e.point)) === Wo(c.point.sub(n.point), d.point.sub(n.point), l.point.sub(n.point)) ? 1 : 2;
	}
	Swap(e, t, n, r, i, a) {
		let o = this.GetRangeOnPolyline(this.Next(e, i), n, i), s = this.GetRangeOnPolyline(this.Next(t, a), r, a);
		this.ChangePolylineSegment(e, n, i, s), this.ChangePolylineSegment(t, r, a, o), Xo.RemoveSelfCyclesFromPolyline(e.polyline), Xo.RemoveSelfCyclesFromPolyline(t.polyline);
	}
	ChangePolylineSegment(e, t, n, r) {
		let i = e;
		for (let e of r) {
			let t = b.mkFromPoint(e.point);
			t.polyline = i.polyline, n ? (t.prev = i, i.next = t) : (t.next = i, i.prev = t), i = t;
		}
		n ? (i.next = t, t.prev = i) : (i.prev = t, t.next = i);
	}
	GetRangeOnPolyline(e, t, n) {
		let r = [];
		for (let i = e; i !== t; i = this.Next(i, n)) r.push(i);
		return r;
	}
	IsNeighborOnTheSamePolyline(e, t) {
		return e.prev != null && e.prev.point.equal(t.point) || e.next != null && e.next.point.equal(t.point);
	}
	RegisterInterestingPoint(e) {
		this.interestingPoints.has(e) || this.interestingPoints.add(e);
	}
	GetChangedHubs() {
		return this.interestingPoints;
	}
	NumberOfReducedCrossings() {
		return this.numberOfReducedCrossings;
	}
	PolylineIsOK(e) {
		let t = new R();
		for (let n = e.startPoint; n != null; n = n.next) {
			if (n === e.startPoint) {
				if (n.prev != null) return !1;
			} else if (n.prev.next !== n) return !1;
			if (n === e.endPoint) {
				if (n.next != null) return !1;
			} else if (n.next.prev !== n) return !1;
			if (t.has(n.point)) return !1;
			t.add(n.point);
		}
		return !(e.startPoint.prev != null || e.endPoint.next != null);
	}
};
function Jo(e, t, n) {
	let r = e.get(t);
	r || (r = /* @__PURE__ */ new Set(), e.set(t, r)), r.add(n);
}
function Yo(e, t, n) {
	let r = e.get(t);
	r && (r.delete(n), r.size === 0 && e.deleteP(t));
}
//#endregion
//#region node_modules/@msagl/core/dist/routing/spline/bundling/PathFixer.js
var Xo = class e {
	constructor(e, t) {
		this.foundCrossings = new R(), this.crossingsThatShouldBecomeHubs = new R(), this.metroGraphData = e, this.polylineAcceptsPoint = t;
	}
	*Vertices() {
		for (let e of this.Polylines) for (let t of e.polylinePoints()) yield t;
	}
	get Polylines() {
		return this.metroGraphData.Edges.map((e) => e.curve);
	}
	Edges() {
		let e = new $n();
		for (let t of this.Vertices()) t.next && e.set(new L(t.point, t.next.point), 0);
		return Array.from(e.keys());
	}
	run() {
		if (this.metroGraphData.Edges.length === 0) return !1;
		let e = new $n(), t = new dt(null);
		for (let e of this.Vertices()) {
			let n = O.mkOnPoints([e.point]);
			n.pad(u.intersectionEpsilon), t.Add(n, e.point);
		}
		let n = Te(this.Edges(), (e) => O.mkPP(e.first, e.second));
		G(n, n, (n, r) => this.IntersectTwoEdges.bind(n, r, e, t)), this.SortInsertedPoints(e);
		let r = this.InsertPointsIntoPolylines(e), i = this.FixPaths(), a = this.RemoveUnimportantCrossings();
		return i || r || a;
	}
	FixPaths() {
		let e = !1;
		return this.RemoveSelfCycles() && (e = !0), this.ReduceEdgeCrossings() && (e = !0), e;
	}
	SortInsertedPoints(e) {
		for (let t of e) this.SortInsideSegment(t[0], t[1]);
	}
	SortInsideSegment(e, t) {
		t.sort((t, n) => f(v(t, e.first), v(n, e.first)));
	}
	InsertPointsIntoPolylines(e) {
		let t = !1;
		for (let n of this.metroGraphData.Metrolines) return this.InsertPointsIntoPolyline(n, e) && (t = !0), t;
	}
	InsertPointsIntoPolyline(e, t) {
		let n = !1;
		for (let r = e.Polyline.startPoint; r.next != null; r = r.next) this.InsertPointsOnPolypoint(r, t, e) && (n = !0);
		return n;
	}
	InsertPointsOnPolypoint(e, t, n) {
		let r = new L(e.point, e.next.point), i = e.point !== r.first, a = t.get(r);
		if (!a) return !1;
		let o = e.next, s = e.polyline;
		if (i) for (let t = a.length - 1; t >= 0; t--) {
			if (this.polylineAcceptsPoint != null && !this.polylineAcceptsPoint(n, a[t])) continue;
			let r = b.mkFromPoint(a[t]);
			r.prev = e, r.polyline = s, e.next = r, e = r;
		}
		else for (let t = 0; t < a.length; t++) {
			if (this.polylineAcceptsPoint != null && !this.polylineAcceptsPoint(n, a[t])) continue;
			let r = b.mkFromPoint(a[t]);
			r.prev = e, r.polyline = s, e.next = r, e = r;
		}
		return e.next = o, o.prev = e, !0;
	}
	RemoveSelfCycles() {
		let t = !1;
		for (let n of this.Polylines) e.RemoveSelfCyclesFromPolyline(n) && (t = !0);
		return t;
	}
	static RemoveSelfCyclesFromPolyline(e) {
		let t = !1, n = new Nt();
		for (let r = e.startPoint; r != null; r = r.next) {
			let e = r.point, i = n.get(e);
			if (i) {
				for (let e = i.next; e !== r.next; e = e.next) n.deleteP(e.point);
				i.next = r.next, r.next.prev = i, t = !0;
			} else n.set(r.point, r);
		}
		return t;
	}
	ReduceEdgeCrossings() {
		let e = new qo(this.metroGraphData);
		e.Run();
		for (let t of e.GetChangedHubs()) this.crossingsThatShouldBecomeHubs.add(t);
		return e.NumberOfReducedCrossings() > 0;
	}
	RemoveUnimportantCrossings() {
		let e = !1;
		this.pointsToDelete = Ae(this.foundCrossings, this.crossingsThatShouldBecomeHubs);
		for (let t of this.Polylines) this.RemoveUnimportantCrossingsFromPolyline(t) && (e = !0);
		return e;
	}
	RemoveUnimportantCrossingsFromPolyline(e) {
		let t = !1;
		for (let n = e.startPoint.next; n != null && n.next != null; n = n.next) if (this.pointsToDelete.has(n.point) && y.getTriangleOrientation(n.prev.point, n.point, n.next.point) === _.Collinear) {
			let e = n.prev, r = n.next;
			e.next = r, r.prev = e, n = e, t = !0;
		}
		return t;
	}
	IntersectTwoEdges(e, t, n, r) {
		let i = S.IntersectPPPP(e.first, e.second, t.first, t.second);
		if (i) {
			let a = this.FindExistingVertexOrCreateNew(r, i);
			(this.AddVertexToSplittingList(e, n, a) || this.AddVertexToSplittingList(t, n, a)) && this.foundCrossings.add(a);
		}
	}
	FindExistingVertexOrCreateNew(e, t) {
		let n = e.RootNode.FirstHitNode(t);
		if (n != null) return n.UserData;
		let r = O.mkOnPoints([t]);
		return r.pad(u.intersectionEpsilon), e.Add(r, t), t;
	}
	AddVertexToSplittingList(e, t, n) {
		if (!E.closeIntersectionPoints(n, e.first) && !E.closeIntersectionPoints(n, e.second)) {
			let r = t.get(e);
			if (r || (r = [], t.set(e, r)), !r.find((e) => e.equal(n))) return r.push(n), !0;
		}
		return !1;
	}
}, Zo = class {
	isCorrectlyOrienected() {
		return y.getTriangleOrientation(this.Curve.boundingBox.center, this.Curve.value(this.parEnd), this.Curve.value(this.parStart)) !== _.Counterclockwise;
	}
	get Count() {
		return this.points.length;
	}
	constructor(e, t, n, r) {
		this.BelongsToRealNode = r, this.Curve = t, this.Position = n, this.points = Array(e), this.tangents = Array(e), this.OrientedHubSegments = Array(e);
	}
	get CurveCenter() {
		return this.Curve.boundingBox.center;
	}
	get OppositeBase() {
		return this.OutgoingBundleInfo == null ? this.IncomingBundleInfo.SourceBase : this.OutgoingBundleInfo.TargetBase;
	}
	get length() {
		return this.points.length;
	}
	get Points() {
		return this.points;
	}
	get Tangents() {
		return this.tangents;
	}
	get InitialMidParameter() {
		return this.initialMidParameter;
	}
	set InitialMidParameter(e) {
		this.initialMidParameter = e, this.InitialMidPoint = this.Curve.value(e);
	}
	get ParStart() {
		return this.parStart;
	}
	set ParStart(e) {
		this.parStart = e, this.StartPoint = this.Curve.value(this.parStart);
	}
	get ParEnd() {
		return this.parEnd;
	}
	set ParEnd(e) {
		this.parEnd = e, this.EndPoint = this.Curve.value(this.parEnd);
	}
	get ParMid() {
		return (this.parStart + this.parEnd) / 2;
	}
	get MidPoint() {
		return y.middle(this.StartPoint, this.EndPoint);
	}
	get Span() {
		return this.SpanBetweenTwoParameters(this.parStart, this.parEnd);
	}
	SpanBetweenTwoParameters(e, t) {
		return e <= t ? t - e : t - e + ve(this.Curve);
	}
	RotateLeftPoint(e, t) {
		return e === 0 ? this.EndPoint : this.RotatePoint(e, this.parEnd, t);
	}
	RotateRigthPoint(e, t) {
		return e === 0 ? this.StartPoint : this.RotatePoint(e, this.parStart, t);
	}
	RotatePoint(e, t, n) {
		let r = ve(this.Curve) * n;
		return t += e * r, t = this.AdjustParam(t), this.Curve.value(t);
	}
	AdjustParam(e) {
		return e > this.Curve.parEnd ? e = this.Curve.parStart + (e - this.Curve.parEnd) : e < this.Curve.parStart && (e = this.Curve.parEnd - (this.Curve.parStart - e)), e;
	}
	RotateBy(e, t, n) {
		let r = ve(this.Curve) * n;
		e !== 0 && (this.ParStart = this.AdjustParam(this.ParStart + e * r)), t !== 0 && (this.ParEnd = this.AdjustParam(this.ParEnd + t * r));
	}
	RelativeOrderOfBasesIsPreserved(e, t, n) {
		let r = ve(this.Curve) * n, i = this.parStart + e * r, a = this.parStart < this.parEnd ? this.parEnd + t * r : this.parEnd + ve(this.Curve) + t * r;
		if (i > a || this.SpanBetweenTwoParameters(i, a) > ve(this.Curve) / 2) return !1;
		if (this.Prev == null || this.SpanBetweenTwoParameters(this.Prev.ParMid, this.ParMid) > r && this.SpanBetweenTwoParameters(this.ParMid, this.Next.ParMid) > r) return !0;
		let o = this.RotateLeftPoint(t, n), s = this.RotateRigthPoint(e, n), c = y.middle(o, s), l = this.MidPoint;
		return !(y.getTriangleOrientation(this.CurveCenter, this.Prev.MidPoint, l) != y.getTriangleOrientation(this.CurveCenter, this.Prev.MidPoint, c) || y.getTriangleOrientation(this.CurveCenter, this.Next.MidPoint, l) != y.getTriangleOrientation(this.CurveCenter, this.Next.MidPoint, c));
	}
}, Qo = class e {
	constructor(e, t, n, r) {
		this.SourceBase = e, this.TargetBase = t, this.obstaclesToIgnore = n, this.HalfWidthArray = r, this.TotalRequiredWidth = this.HalfWidthArray.reduce((e, t) => e + t, 0) * 2, this.longEnoughSideLength = e.Curve.boundingBox.addRec(t.Curve.boundingBox).diagonal;
		let i = Math.max(e.Curve.boundingBox.diagonal, t.Curve.boundingBox.diagonal);
		if (this.TotalRequiredWidth > i) {
			let e = this.TotalRequiredWidth / i;
			for (let t = 0; t < this.HalfWidthArray.length; t++) this.HalfWidthArray[t] /= e;
			this.TotalRequiredWidth /= e;
		}
	}
	SetParamsFeasiblySymmetrically(e) {
		this.CalculateTightObstaclesForBundle(e, this.obstaclesToIgnore), this.SetEndParamsSymmetrically();
	}
	CalculateTightObstaclesForBundle(e, t) {
		let n = this.SourceBase.Curve.boundingBox.diagonal / 2, r = this.TargetBase.Curve.boundingBox.diagonal / 2, i = Fo.Create4gon(this.SourceBase.Position, this.TargetBase.Position, n * 2, r * 2);
		this.tightObstaclesInTheBoundingBox = Array.from(e.AllHitItems(i.boundingBox, (e) => !t.has(e) && E.ClosedCurveInteriorsIntersect(i, e)));
	}
	SetEndParamsSymmetrically() {
		let t = this.TargetBase.Position, n = this.SourceBase.Position, r = t.sub(n).normalize(), i = r.rotate90Ccw(), a = y.middle(t, n), o = r.mul(this.longEnoughSideLength), s = a.add(o), c = a.sub(o);
		if (this.SetRLParamsIfWidthIsFeasible(i.mul(this.TotalRequiredWidth / 2), s, c)) {
			this.SetInitialMidParams();
			return;
		}
		let l = this.TotalRequiredWidth, u = 0, d = l / 2;
		for (; l - u > e.FeasibleWidthEpsilon;) this.SetRLParamsIfWidthIsFeasible(i.mul(d / 2), s, c) ? u = d : l = d, d = .5 * (l + u);
		d <= e.FeasibleWidthEpsilon && (this.SetRLParamsIfWidthIsFeasible_(i.mul(e.FeasibleWidthEpsilon), new y(0, 0), s, c) || this.SetRLParamsIfWidthIsFeasible_(new y(0, 0), i.mul(-e.FeasibleWidthEpsilon), s, c)) && (d = 2 * e.FeasibleWidthEpsilon), this.SourceBase.InitialMidParameter = this.SourceBase.AdjustParam(this.SourceBase.ParStart + this.SourceBase.Span / 2), this.TargetBase.InitialMidParameter = this.TargetBase.AdjustParam(this.TargetBase.ParStart + this.TargetBase.Span / 2);
	}
	mkNameFromLRST() {
		return "./tmp/leftRight" + this.SourceBase.Position.toString() + "_" + this.TargetBase.Position.toString() + ".svg";
	}
	SetRLParamsIfWidthIsFeasible(e, t, n) {
		return this.SetRLParamsIfWidthIsFeasible_(e, e.neg(), t, n);
	}
	SetRLParamsIfWidthIsFeasible_(e, t, n, r) {
		let i = { par: 0 }, a = { par: 0 }, o = { par: 0 }, s = { par: 0 }, c = this.TrimSegWithBoundaryCurves(S.mkPP(n.add(e), r.add(e)), a, o);
		return c == null || this.tightObstaclesInTheBoundingBox.find((e) => E.intersectionOne(c, e, !1) != null) || (c = this.TrimSegWithBoundaryCurves(S.mkPP(n.add(t), r.add(t)), s, i), c == null) || this.tightObstaclesInTheBoundingBox.find((e) => E.intersectionOne(c, e, !1) != null) ? !1 : (this.SourceBase.IsParent ? (this.SourceBase.ParStart = a.par, this.SourceBase.ParEnd = s.par) : (this.SourceBase.ParStart = s.par, this.SourceBase.ParEnd = a.par), this.TargetBase.IsParent ? (this.TargetBase.ParStart = i.par, this.TargetBase.ParEnd = o.par) : (this.TargetBase.ParStart = o.par, this.TargetBase.ParEnd = i.par), !0);
	}
	SetInitialMidParams() {
		let e = { par: 0 }, t = { par: 0 };
		this.TrimSegWithBoundaryCurves(S.mkPP(this.TargetBase.CurveCenter, this.TargetBase.CurveCenter), t, e) == null ? (this.SourceBase.InitialMidParameter = this.SourceBase.AdjustParam(this.SourceBase.ParStart + this.SourceBase.Span / 2), this.TargetBase.InitialMidParameter = this.TargetBase.AdjustParam(this.TargetBase.ParStart + this.TargetBase.Span / 2)) : (this.SourceBase.InitialMidParameter = t.par, this.TargetBase.InitialMidParameter = e.par);
	}
	mkNameFromST() {
		return "./tmp/mparam" + this.SourceBase.Position.toString() + "_" + this.TargetBase.Position.toString() + ".svg";
	}
	TrimSegWithBoundaryCurves(e, t, n) {
		let r = E.getAllIntersections(e, this.SourceBase.Curve, !0);
		if (r.length === 0) return n.par = 0, t.par = 0, null;
		let i;
		if (i = r.length === 1 ? r[0] : this.SourceBase.IsParent ? r[0].par0 < r[1].par0 ? r[1] : r[0] : r[0].par0 < r[1].par0 ? r[0] : r[1], r = E.getAllIntersections(e, this.TargetBase.Curve, !0), r.length === 0) return n.par = 0, t.par = 0, null;
		let a;
		return a = r.length === 1 ? r[0] : this.TargetBase.IsParent ? r[0].par0 > r[1].par0 ? r[1] : r[0] : r[0].par0 > r[1].par0 ? r[0] : r[1], t.par = i.par1, n.par = a.par1, S.mkPP(i.x, a.x);
	}
	RotateBy(e, t, n, r, i) {
		let a = e !== 0 || t !== 0, o = n !== 0 || r !== 0;
		a && this.SourceBase.RotateBy(e, t, i), o && this.TargetBase.RotateBy(n, r, i), this.UpdateSourceAndTargetBases(a, o);
	}
	UpdateSourceAndTargetBases(e, t) {
		e && this.UpdatePointsOnBundleBase(this.SourceBase), t && this.UpdatePointsOnBundleBase(this.TargetBase), this.UpdateTangentsOnBases();
	}
	UpdateTangentsOnBases() {
		let e = this.TargetBase.length;
		for (let t = 0; t < e; t++) {
			let n = this.TargetBase.Points[t].sub(this.SourceBase.Points[e - 1 - t]), r = n.length;
			r >= u.tolerance && (n = n.div(r), this.TargetBase.Tangents[t] = n, this.SourceBase.Tangents[e - 1 - t] = n.neg());
		}
	}
	UpdatePointsOnBundleBase(e) {
		let t = e.length, n = e.Points, r = S.mkPP(e.EndPoint, e.StartPoint), i = 1 / this.TotalRequiredWidth, a = this.HalfWidthArray[0];
		n[0] = r.value(a * i);
		for (let e = 1; e < t; e++) a += this.HalfWidthArray[e - 1] + this.HalfWidthArray[e], n[e] = r.value(a * i);
	}
	RotationIsLegal(e, t, n, r, i) {
		if (!this.SourceBase.IsParent && !this.TargetBase.IsParent) {
			if (t !== 0 || n !== 0) {
				let e = this.SourceBase.RotateLeftPoint(t, i), r = this.TargetBase.RotateRigthPoint(n, i);
				if (!this.LineIsLegal(e, r)) return !1;
			}
			if (e !== 0 || r !== 0) {
				let t = this.SourceBase.RotateRigthPoint(e, i), n = this.TargetBase.RotateLeftPoint(r, i);
				if (!this.LineIsLegal(t, n)) return !1;
			}
		} else {
			if (t !== 0 || r !== 0) {
				let e = this.SourceBase.RotateLeftPoint(t, i), n = this.TargetBase.RotateLeftPoint(r, i);
				if (!this.LineIsLegal(e, n)) return !1;
			}
			if (e !== 0 || n !== 0) {
				let t = this.SourceBase.RotateRigthPoint(e, i), r = this.TargetBase.RotateRigthPoint(n, i);
				if (!this.LineIsLegal(t, r)) return !1;
			}
		}
		return !((e !== 0 || t !== 0) && !this.SourceBase.RelativeOrderOfBasesIsPreserved(e, t, i) || (n !== 0 || r !== 0) && !this.TargetBase.RelativeOrderOfBasesIsPreserved(n, r, i));
	}
	LineIsLegal(e, t) {
		return this.tightObstaclesInTheBoundingBox.find((n) => E.intersectionOne(S.mkPP(e, t), n, !1) != null) == null;
	}
};
Qo.FeasibleWidthEpsilon = .1;
//#endregion
//#region node_modules/@msagl/core/dist/routing/spline/bundling/OrientedHubSegment.js
var $o = class {
	get Segment() {
		return this.segment;
	}
	set Segment(e) {
		this.segment = e;
	}
	constructor(e, t, n, r) {
		this.Segment = e, this.Reversed = t, this.Index = n, this.BundleBase = r;
	}
	value(e) {
		return this.Reversed ? this.Segment.value(this.Segment.parEnd - e) : this.Segment.value(e);
	}
}, es = class e {
	constructor(e, t, n) {
		this.fixedBundles = /* @__PURE__ */ new Set(), this.stepsWithProgress = 0, this.metroOrdering = e, this.metroGraphData = t, this.bundlingSettings = n;
	}
	Run() {
		this.AllocateBundleBases(), this.SetBasesRightLeftParamsToTheMiddles(), this.bundlingSettings.KeepOverlaps ? (this.UpdateSourceAndTargetBases(), this.CreateOrientedSegs()) : (this.SetRightLeftParamsFeasiblySymmetrically(), this.AdjustStartEndParamsToAvoidBaseOverlaps(), this.UpdateSourceAndTargetBases(), this.CreateOrientedSegs(), this.bundlingSettings.RotateBundles && this.RotateBundlesToDiminishCost(), this.AdjustStartEndParamsToAvoidBaseOverlaps(), this.UpdateSourceAndTargetBases());
	}
	AllocateBundleBases() {
		this.externalBases = /* @__PURE__ */ new Map(), this.internalBases = /* @__PURE__ */ new Map(), this.Bundles = [];
		for (let e of this.metroGraphData.Stations) e.BoundaryCurve ??= w.mkCircle(e.Radius, e.Position);
		for (let e of this.metroGraphData.Stations) for (let t of e.Neighbors) if (e.SerialNumber < t.SerialNumber) {
			let n = new Zo(this.metroGraphData.RealEdgeCount(e, t), e.BoundaryCurve, e.Position, e.IsReal);
			e.BundleBases.set(t, n);
			let r = new Zo(this.metroGraphData.RealEdgeCount(e, t), t.BoundaryCurve, t.Position, t.IsReal);
			t.BundleBases.set(e, r), E.PointRelativeToCurveLocation(t.Position, e.BoundaryCurve) === T.Outside ? E.PointRelativeToCurveLocation(e.Position, t.BoundaryCurve) === T.Outside ? (ze(this.externalBases, e, n), ze(this.externalBases, t, r)) : (r.IsParent = !0, ze(this.externalBases, e, n), ze(this.internalBases, t, r)) : (n.IsParent = !0, ze(this.internalBases, e, n), ze(this.externalBases, t, r));
			let i = new Qo(n, r, this.metroGraphData.tightIntersections.ObstaclesToIgnoreForBundle(e, t), Array.from(this.metroOrdering.GetOrder(e, t)).map((e) => e.Width / 2));
			n.OutgoingBundleInfo = r.IncomingBundleInfo = i, this.Bundles.push(i);
		}
		this.SetBundleBaseNeighbors();
	}
	SetBundleBaseNeighbors() {
		for (let e of this.externalBases.keys()) {
			let t = this.externalBases.get(e);
			this.SortBundlesCounterClockwise(t), this.SetLeftRightBases(t);
		}
		for (let e of this.internalBases.keys()) {
			let t = this.internalBases.get(e);
			this.SortBundlesCounterClockwise(t), this.SetLeftRightBases(t);
		}
	}
	SortBundlesCounterClockwise(e) {
		if (e.length > 2) {
			let t = e[0].OppositeBase.Position, n = e[0].CurveCenter;
			e.sort((e, r) => Wo(t.sub(n), e.OppositeBase.Position.sub(n), r.OppositeBase.Position.sub(n)));
		}
	}
	SetLeftRightBases(e) {
		let t = e.length;
		if (!(t <= 1)) for (let n = 0; n < t; n++) e[n].Prev = e[(n - 1 + t) % t], e[n].Next = e[(n + 1) % t];
	}
	CreateOrientedSegs() {
		for (let e of this.metroGraphData.Metrolines) this.CreateOrientedSegsOnLine(e);
	}
	CreateOrientedSegsOnLine(e) {
		for (let t = e.Polyline.startPoint.next; t.next != null; t = t.next) this.CreateOrientedSegsOnLineVertex(e, t);
	}
	CreateOrientedSegsOnLineVertex(e, t) {
		let n = this.metroGraphData.PointToStations.get(t.prev.point), r = this.metroGraphData.PointToStations.get(t.point), i = this.metroGraphData.PointToStations.get(t.next.point), a = r.BundleBases.get(n), o = r.BundleBases.get(i), s = this.metroOrdering.GetLineIndexInOrder(n, r, e), c = this.metroOrdering.GetLineIndexInOrder(i, r, e), l = a.OrientedHubSegments[s] = new $o(null, !1, s, a), u = o.OrientedHubSegments[c] = new $o(null, !0, c, o);
		u.Other = l, l.Other = u;
	}
	UpdateSourceAndTargetBases() {
		for (let e of this.Bundles) e.UpdateSourceAndTargetBases(!0, !0);
	}
	SetBasesRightLeftParamsToTheMiddles() {
		for (let e of this.Bundles) {
			let t = e.SourceBase, n = e.TargetBase;
			t.ParEnd = t.ParStart = this.GetBaseMiddleParamInDirection(t, t.Position, n.Position), n.ParEnd = n.ParStart = this.GetBaseMiddleParamInDirection(n, n.Position, t.Position);
		}
	}
	GetBaseMiddleParamInDirection(e, t, n) {
		let r = e.Curve;
		if (r instanceof w) {
			let e = r;
			if (e.isArc()) return y.angle(e.aAxis, n.sub(t));
		}
		let i = E.getAllIntersections(r, S.mkPP(t, n), !0);
		for (let e of i) {
			let r = e.x;
			if (r.sub(t).dot(r.sub(n)) <= 0) return e.par0;
		}
		throw Error();
	}
	SetRightLeftParamsFeasiblySymmetrically() {
		for (let e of this.Bundles) e.SetParamsFeasiblySymmetrically(this.metroGraphData.TightTree);
	}
	AdjustStartEndParamsToAvoidBaseOverlaps() {
		for (let e of this.externalBases.values()) this.AdjustCurrentBundleWidthsOnCurve(e);
		for (let e of this.internalBases.values()) this.AdjustCurrentBundleWidthsOnCurve(e);
	}
	AdjustCurrentBundleWidthsOnCurve(e) {
		let t = e.length;
		if (!(t <= 1)) for (let n = 0; n < t; n++) {
			let t = e[n], r = t.Next;
			this.ShrinkBasesToMakeTwoConsecutiveNeighborsHappy(t, r);
		}
	}
	ShrinkBasesToMakeTwoConsecutiveNeighborsHappy(e, t) {
		let n = ts(e, t);
		if (n == null || m(n.start, n.end)) return;
		if (n.rbaseMiddle < n.lbaseMiddle) {
			let n = e;
			e = t, t = n;
		}
		let r = e.Span, i = t.Span, a = (n.end * r + n.start * i) / (i + r);
		e.ParStart = e.AdjustParam(a + u.distanceEpsilon), t.ParEnd = t.AdjustParam(a - u.distanceEpsilon);
	}
	RegularCut(e, t, n, r, i, a) {
		let o = (i * r + a * e) / (i + a), s = Math.min(t, r), c = Math.max(e, n);
		return o < c && (o = c), o > s && (o = s), o;
	}
	RotateBundlesToDiminishCost() {
		let t = e.MaxParameterChange, n = { cost: this.Cost() }, r = 0;
		for (; r++ < e.MaxIterations;) {
			let r = n.cost;
			if (this.RotateBundlesToDiminishCostOneIteration(t, n), t = this.UpdateParameterChange(t, r, n.cost), t < e.MinParameterChange) break;
		}
	}
	UpdateParameterChange(e, t, n) {
		return n + 1 < t ? (this.stepsWithProgress++, this.stepsWithProgress >= 5 && (this.stepsWithProgress = 0, this.fixedBundles.clear())) : (this.stepsWithProgress = 0, e *= .8, this.fixedBundles.clear()), e;
	}
	RotateBundlesToDiminishCostOneIteration(e, t) {
		let n = !1;
		for (let r of this.Bundles) this.fixedBundles.has(r) || (this.OptimizeBundle(r, e, t) ? n = !0 : this.fixedBundles.add(r));
		return n;
	}
	OptimizeBundle(t, n, r) {
		let i = this.CostBi(t);
		if (i < e.CostThreshold) return !1;
		let a = 0, o = -1, s = -1;
		for (let r = 0; r < e.Deltas.length - 1; r++) {
			let c = this.DeltaWithChangedAngles(e.Deltas[r][0], e.Deltas[r][1], 0, 0, t, i, n);
			c > e.CostDeltaThreshold && c > a && (s = r, o = e.Deltas.length - 1, a = c), c = this.DeltaWithChangedAngles(0, 0, e.Deltas[r][0], e.Deltas[r][1], t, i, n), c > e.CostDeltaThreshold && c > a && (s = e.Deltas.length - 1, o = r, a = c);
		}
		return a < e.CostDeltaThreshold ? !1 : (r.cost -= a, t.RotateBy(e.Deltas[s][0], e.Deltas[s][1], e.Deltas[o][0], e.Deltas[o][1], n), !0);
	}
	DeltaWithChangedAngles(e, t, n, r, i, a, o) {
		if (!i.RotationIsLegal(e, t, n, r, o)) return 0;
		i.RotateBy(e, t, n, r, o);
		let s = this.CostBN(i, a);
		return i.RotateBy(e * -1, t * -1, n * -1, r * -1, o), a - s;
	}
	CostBi(t) {
		return e.SeparationCoeff * this.SeparationCost(t) + (e.SqueezeCoeff * this.SqueezeCost(t) + (e.AssymetryCoeff * this.AssymetryCost(t) + e.CenterCoeff * this.CenterCostBi(t)));
	}
	CostBN(t, n) {
		let r = 0;
		return r += e.CenterCoeff * this.CenterCostBi(t), r > n || (r += e.SeparationCoeff * this.SeparationCost(t), r > n) || (r += e.SqueezeCoeff * this.SqueezeCost(t), r > n) || (r += e.AssymetryCoeff * this.AssymetryCost(t)), r;
	}
	SqueezeCost(e) {
		let t = e.TargetBase.MidPoint.sub(e.SourceBase.MidPoint).normalize().rotate90Ccw(), n = Math.abs(e.SourceBase.StartPoint.sub(e.SourceBase.EndPoint).dot(t)), r = Math.abs(e.TargetBase.StartPoint.sub(e.TargetBase.EndPoint).dot(t)), i = Math.abs(e.TotalRequiredWidth - n) / e.TotalRequiredWidth, a = Math.abs(e.TotalRequiredWidth - r) / e.TotalRequiredWidth, o = Math.abs(n - r) / e.TotalRequiredWidth;
		return Math.exp(i * 10) - 1 + (Math.exp(a * 10) - 1) + o;
	}
	CenterCostBi(e) {
		return !e.SourceBase.BelongsToRealNode && !e.TargetBase.BelongsToRealNode ? 0 : this.CenterCostBb(e.SourceBase) + this.CenterCostBb(e.TargetBase);
	}
	CenterCostBb(e) {
		if (!e.BelongsToRealNode) return 0;
		let t = e.ParMid, n = Math.min(e.InitialMidParameter, t), r = Math.max(e.InitialMidParameter, t), i = Math.min(r - n, n + (ve(e.Curve) - r));
		return e.CurveCenter.equal(e.Position) || e.IsParent ? i * i * 25 : i * i * 500;
	}
	AssymetryCost(e) {
		return this.GetAssymetryCostForBase(e.SourceBase) + this.GetAssymetryCostForBase(e.TargetBase);
	}
	GetAssymetryCostForBase(e) {
		if (e.BelongsToRealNode) return 0;
		let t = e.OppositeBase.BelongsToRealNode ? 200 : 500, n = 0;
		for (let r of e.OrientedHubSegments) {
			let i = r.Index, a = r.Other.Index, o = e.Points[i], s = e.Tangents[i], c = r.Other.BundleBase, l = c.Points[a], u = c.Tangents[a], d = e.Count + c.Count;
			n += this.GetAssymetryCostOnData(o, s, l, u, t) / d;
		}
		return n;
	}
	GetAssymetryCostOnData(e, t, n, r, i) {
		let a = e.sub(n);
		if (a.length < u.distanceEpsilon) return 0;
		let o = t.add(r).dot(a), s = y.crossProduct(a, t), c = y.crossProduct(a, r), l = s - c, d = o * o + l * l, f = s * s + c * c;
		return 10 * d + i * f;
	}
	SeparationCost(e) {
		return this.SeparationCostForBundleBase(e.SourceBase) + this.SeparationCostForBundleBase(e.TargetBase);
	}
	SeparationCostForBundleBase(e) {
		return e.Prev == null ? 0 : this.SeparationCostForAdjacentBundleBases(e, e.Prev) + this.SeparationCostForAdjacentBundleBases(e, e.Next);
	}
	SeparationCostForAdjacentBundleBases(e, t) {
		let n = e.Curve, r = this.IntervalsOverlapLength(e.ParStart, e.ParEnd, t.ParStart, t.ParEnd, n), i = Math.min(e.Span, t.Span);
		return Math.exp(r / (i * 10)) - 1;
	}
	IntervalsOverlapLength(e, t, n, r, i) {
		let a = i.parStart, o = i.parEnd;
		return e < t ? n < r ? this.IntersectRegularIntervals(e, t, n, r) : this.IntersectRegularIntervals(e, t, n, o) + this.IntersectRegularIntervals(e, t, a, r) : n < r ? this.IntersectRegularIntervals(e, o, n, r) + this.IntersectRegularIntervals(a, t, n, r) : this.IntersectRegularIntervals(e, o, n, o) + this.IntersectRegularIntervals(a, t, a, r);
	}
	IntersectRegularIntervals(e, t, n, r) {
		let i = Math.max(e, n), a = Math.min(t, r);
		return i < a ? a - i : 0;
	}
	Cost() {
		let t = 0;
		for (let n of this.Bundles) {
			let r = e.SeparationCoeff * this.SeparationCost(n), i = e.AssymetryCoeff * this.AssymetryCost(n), a = e.SqueezeCoeff * this.SqueezeCost(n), o = e.CenterCoeff * this.CenterCostBi(n);
			t += (r + i) / 2 + a + o;
		}
		return t;
	}
};
es.Deltas = [[1, -1], [1, -1]], es.SeparationCoeff = 1, es.SqueezeCoeff = 1, es.CenterCoeff = 10, es.AssymetryCoeff = 1, es.MaxIterations = 200, es.MaxParameterChange = 8 / 360, es.MinParameterChange = .1 / 360, es.CostThreshold = 1e-5, es.CostDeltaThreshold = .01;
function ts(e, t) {
	let n = ve(e.Curve), r = e.ParEnd, i = e.ParStart < e.ParEnd ? e.ParStart : e.ParStart - n, a = t.ParEnd, o = t.ParStart < t.ParEnd ? t.ParStart : t.ParStart - n;
	r > a ? r - o > n && (o += n, a += n) : a - i > n && (i += n, r += n);
	let s = Math.min(r, a), c = Math.max(i, o);
	return c <= s ? {
		start: c,
		end: s,
		rbaseMiddle: (i + r) / 2,
		lbaseMiddle: (o + a) / 2
	} : null;
}
//#endregion
//#region node_modules/@msagl/core/dist/routing/spline/bundling/PointPairOrder.js
var ns = class {
	constructor() {
		this.Metrolines = [];
	}
	Add(e) {
		this.Metrolines.push(e);
	}
}, rs = class e {
	constructor(e) {
		this.Metrolines = e, this.BuildOrder();
	}
	*GetOrder(e, t) {
		let n = new L(e.Position, t.Position), r = this.bundles.get(n).Metrolines;
		if (e.Position === n.first) for (let e = 0; e < r.length; e++) yield r[e];
		else for (let e = r.length - 1; e >= 0; e--) yield r[e];
	}
	GetLineIndexInOrder(e, t, n) {
		let r = new L(e.Position, t.Position), i = e.Position !== r.first, a = this.bundles.get(r).LineIndexInOrder;
		return i ? a.size - 1 - a.get(n) : a.get(n);
	}
	BuildOrder() {
		this.bundles = new $n();
		for (let e of this.Metrolines) for (let t = e.Polyline.startPoint; t.next != null; t = t.next) {
			let n = new L(t.point, t.next.point), r = this.bundles.get(n);
			r || this.bundles.set(n, r = new ns()), r.Add(e);
		}
		for (let e of this.bundles) this.BuildOrderPP(e[0], e[1]);
	}
	BuildOrderPP(e, t) {
		if (!t.orderFixed) {
			t.Metrolines.sort((t, n) => this.CompareLines(t, n, e.first, e.second)), t.orderFixed = !0, t.LineIndexInOrder = /* @__PURE__ */ new Map();
			for (let e = 0; e < t.Metrolines.length; e++) t.LineIndexInOrder.set(t.Metrolines[e], e);
		}
	}
	CompareLines(t, n, r, i) {
		let a = {
			polyPoint: null,
			next: null,
			prev: null
		};
		this.FindStationOnLine(r, i, t, a);
		let o = a.polyPoint, s = a.next, c = a.prev;
		this.FindStationOnLine(r, i, n, a);
		let l = a.polyPoint, u = a.next, d = a.prev, p = o, m = l, h, g;
		for (; (g = c(p)) != null && (h = d(m)) != null && g.point.equal(h.point);) {
			let e = new L(g.point, p.point);
			if (this.bundles.get(e).orderFixed) return this.CompareOnFixedOrder(e, t, n, !g.point.equal(e.first));
			p = g, m = h;
		}
		if (g != null && h != null) {
			let t = p.point;
			return -e.IsLeft(s(p).point.sub(t), g.point.sub(t), h.point.sub(t));
		}
		for (p = o, m = l; (g = s(p)) != null && (h = u(m)) != null && g.point.equal(h.point);) {
			let e = new L(g.point, p.point);
			if (this.bundles.get(e).orderFixed) return this.CompareOnFixedOrder(e, t, n, !p.point.equal(e.first));
			p = g, m = h;
		}
		if (g != null && h != null) {
			let t = p.point;
			return e.IsLeft(c(p).point.sub(t), g.point.sub(t), h.point.sub(t));
		}
		return f(t.Index, n.Index);
	}
	CompareOnFixedOrder(e, t, n, r) {
		let i = this.bundles.get(e).LineIndexInOrder;
		return (r ? -1 : 1) * f(i.get(t), i.get(n));
	}
	FindStationOnLine(e, t, n, r) {
		for (let i = n.Polyline.startPoint; i.next != null; i = i.next) {
			if (i.point.equal(e) && i.next.point.equal(t)) {
				r.next = (e) => e.next, r.prev = (e) => e.prev, r.polyPoint = i;
				return;
			}
			if (i.point.equal(t) && i.next.point.equal(e)) {
				r.next = (e) => e.prev, r.prev = (e) => e.next, r.polyPoint = i.next;
				return;
			}
		}
		throw Error();
	}
	static IsLeft(e, t, n) {
		return Wo(e, t, n);
	}
}, is = class e extends B {
	constructor(e, t) {
		super(null), this.metroGraphData = e, this.bundlingSettings = t;
	}
	run() {
		this.CreateMetroOrdering(), this.InitRadii(), this.FinalizePaths();
	}
	InitRadii() {
		new Bo(this.metroGraphData, this.bundlingSettings).CreateNodeRadii();
	}
	CreateMetroOrdering() {
		this.metroOrdering = new rs(this.metroGraphData.Metrolines);
	}
	FinalizePaths() {
		this.CreateBundleBases(), this.CreateSegmentsInsideHubs(), this.CreateCurves();
	}
	CreateBundleBases() {
		new es(this.metroOrdering, this.metroGraphData, this.bundlingSettings).Run();
	}
	CreateCurves() {
		for (let e = 0; e < this.metroGraphData.Metrolines.length; e++) this.CreateCurveLine(this.metroGraphData.Metrolines[e], this.metroGraphData.Edges[e]);
	}
	CreateCurveLine(t, n) {
		let r = new E(), i = e.FindCurveStart(this.metroGraphData, this.metroOrdering, t), a = e.HubSegsOfLine(this.metroGraphData, this.metroOrdering, t);
		for (let e of a) e != null && (r.addSegment(S.mkPP(i, e.start)), r.addSegment(e), i = e.end);
		r.addSegment(S.mkPP(i, e.FindCurveEnd(this.metroGraphData, this.metroOrdering, t))), n.curve = r;
	}
	static FindCurveStart(e, t, n) {
		let r = e.PointToStations.get(n.Polyline.startPoint.point), i = e.PointToStations.get(n.Polyline.startPoint.next.point), a = r.BundleBases.get(i), o = a.IsParent ? t.GetLineIndexInOrder(r, i, n) : t.GetLineIndexInOrder(i, r, n);
		return a.Points[o];
	}
	static FindCurveEnd(e, t, n) {
		let r = e.PointToStations.get(n.Polyline.endPoint.prev.point), i = e.PointToStations.get(n.Polyline.endPoint.point), a = i.BundleBases.get(r), o = a.IsParent ? t.GetLineIndexInOrder(i, r, n) : t.GetLineIndexInOrder(r, i, n);
		return a.Points[o];
	}
	static *HubSegsOfLine(t, n, r) {
		for (let i = r.Polyline.startPoint.next; i.next != null; i = i.next) yield e.SegOnLineVertex(t, n, r, i);
	}
	static SegOnLineVertex(e, t, n, r) {
		let i = e.PointToStations.get(r.prev.point), a = e.PointToStations.get(r.point), o = a.BundleBases.get(i), s = t.GetLineIndexInOrder(i, a, n);
		if (o.OrientedHubSegments[s] == null || o.OrientedHubSegments[s].Segment == null) {
			let i = e.PointToStations.get(r.next.point), c = a.BundleBases.get(i), l = t.GetLineIndexInOrder(i, a, n);
			return S.mkPP(o.Points[s], c.Points[l]);
		}
		return o.OrientedHubSegments[s].Segment;
	}
	CreateSegmentsInsideHubs() {
		for (let e of this.metroGraphData.Metrolines) this.CreateOrientedSegsOnLine(e);
		this.bundlingSettings.UseCubicBezierSegmentsInsideOfHubs && this.FanBezierSegs();
	}
	CreateOrientedSegsOnLine(e) {
		for (let t = e.Polyline.startPoint.next; t.next != null; t = t.next) this.CreateICurveForOrientedSeg(e, t);
	}
	CreateICurveForOrientedSeg(t, n) {
		let r = this.metroGraphData.PointToStations.get(n.prev.point), i = this.metroGraphData.PointToStations.get(n.point), a = this.metroGraphData.PointToStations.get(n.next.point), o = i.BundleBases.get(r), s = i.BundleBases.get(a), c = this.metroOrdering.GetLineIndexInOrder(r, i, t), l = this.metroOrdering.GetLineIndexInOrder(a, i, t), u = this.bundlingSettings.UseCubicBezierSegmentsInsideOfHubs ? e.StandardBezier(o.Points[c], o.Tangents[c], s.Points[l], s.Tangents[l]) : e.BiArc(o.Points[c], o.Tangents[c], s.Points[l], s.Tangents[l]);
		o.OrientedHubSegments[c].Segment = u, s.OrientedHubSegments[l].Segment = u;
	}
	static ShowHubs(t, n, r, i, a = []) {
		let o = e.GetAllDebugCurves(n, t);
		r != null && o.push(q.mkDebugCurveTWCI(255, 1, "red", _e.mkDiamond(5, 25, r.Position))), o = o.concat(a);
	}
	static GetAllDebugCurves(t, n) {
		return e.GraphNodes(n).concat(e.VertexDebugCurves(t, n)).concat(e.DebugEdges(n));
	}
	static DebugEdges(e) {
		return e.Edges.map((e) => q.mkDebugCurveTWCI(40, .1, "gray", e.curve));
	}
	static VertexDebugCurves(t, n) {
		return e.DebugCircles(n).concat(e.DebugHubBases(n)).concat(e.DebugSegs(n)).concat(e.BetweenHubs(t, n));
	}
	static BetweenHubs(t, n) {
		let r = [];
		for (let i of n.Metrolines) {
			let a = e.GetInterestingSegs(n, t, i), o = e.GetMonotoneColor(i.Polyline.start, i.Polyline.end, a);
			for (let e of a) r.push(q.mkDebugCurveTWCI(100, i.Width, o, S.mkPP(e[0], e[1])));
		}
		return r;
	}
	static GetInterestingSegs(t, n, r) {
		let i = [];
		if (t.Stations.length === 0 || t.Stations[0].BundleBases == null || t.Stations[0].BundleBases.size === 0) return [];
		let a = e.FindCurveStart(t, n, r), o = e.HubSegsOfLine(t, n, r);
		for (let e of o) e != null && (i.push([a, e.start]), a = e.end);
		return i.push([a, e.FindCurveEnd(t, n, r)]), i;
	}
	static GetMonotoneColor(e, t, n) {
		return "green";
	}
	static DebugHubBases(e) {
		let t = [];
		for (let n of e.Stations) for (let e of n.BundleBases.values()) t.push(q.mkDebugCurveTWCI(100, 1, "red", S.mkPP(e.EndPoint, e.StartPoint)));
		return t;
	}
	static DebugCircles(e) {
		return e.Stations.map((e) => q.mkDebugCurveTWCI(100, .1, "blue", _e.mkCircle(e.Radius, e.Position)));
	}
	static DebugSegs(e) {
		let t = [];
		for (let n of e.VirtualStations()) for (let e of n.BundleBases.values()) for (let n of e.OrientedHubSegments) if (n != null) if (n.Segment == null) {
			let r = n.Other.BundleBase, i = n.Index, a = n.Other.Index;
			t.push(S.mkPP(e.Points[i], r.Points[a]));
		} else t.push(n.Segment);
		return t.map((e) => q.mkDebugCurveTWCI(100, .01, "green", e));
	}
	static GraphNodes(e) {
		return e.Edges.map((e) => e.sourcePort.Curve).concat(e.Edges.map((e) => e.targetPort.Curve)).map((e) => q.mkDebugCurveTWCI(40, 1, "black", e));
	}
	static BiArc(t, n, r, i) {
		let a = t.sub(r);
		if (a.length < u.distanceEpsilon) return null;
		let o = a.dot(n.sub(i)), s = -n.dot(i);
		if (n.dot(r.sub(t)) <= 0 && n.dot(i) <= 0) return e.StandardBezier(t, n, r, i);
		let c = 2 * (s - 1), l = 2 * o, d = a.dot(a), f;
		if (Math.abs(c) < u.distanceEpsilon) if (Math.abs(l) > u.distanceEpsilon) f = -d / l;
		else return null;
		else {
			let e = l * l - 4 * c * d;
			e < 0 && (e = 0), e = Math.sqrt(e), f = (-l + e) / (2 * c), f < 0 && (f = (-l - e) / (2 * c));
		}
		let p = t.add(n.mul(f)), m = r.add(i.mul(f)), h = y.middle(p, m);
		if (y.getTriangleOrientation(t, p, h) !== y.getTriangleOrientation(h, m, r)) return e.StandardBezier(t, n, r, i);
		let g = new E();
		return g.addSegs([e.ArcOn(t, p, h), e.ArcOn(h, m, r)]), g;
	}
	static ArcOn(t, n, r) {
		let i = { center: null };
		if (Math.abs(y.signedDoubledTriangleArea(t, n, r)) < 1e-4 || !e.FindArcCenter(t, n, r, i)) return S.mkPP(t, r);
		let a = i.center, o = v(t, a);
		if (v(t, n) / o < 1e-4) return S.mkPP(t, r);
		let s = t.sub(a), c = Math.atan2(s.y, s.x), l = r.sub(a), u = Math.atan2(l.y, l.x), d = u - c;
		if (d < 0 && (d += 2 * Math.PI, u += 2 * Math.PI), d <= Math.PI) return new w(c, u, new y(o, 0), new y(0, o), a);
		for (u > 2 * Math.PI && (u -= 2 * Math.PI), c = Math.PI - c, u = Math.PI - u, c < 0 && (c += 2 * Math.PI); u < c;) u += 2 * Math.PI;
		return d = u - c, new w(c, u, new y(-o, 0), new y(0, o), a);
	}
	static FindArcCenter(e, t, n, r) {
		let i = t.sub(e).rotate90Cw(), a = t.sub(n).rotate90Cw();
		return r.center = y.lineLineIntersection(e, e.add(i), n, n.add(a)), r.center != null;
	}
	static StandardBezier(e, t, n, r) {
		let i = v(e, n) / 4;
		return ce.mkBezier([
			e,
			e.add(t.mul(i)),
			n.add(r.mul(i)),
			n
		]);
	}
	FanBezierSegs() {
		let e = !0, t = 0;
		for (; e && t++ < 5;) {
			e = !1;
			for (let t of this.metroGraphData.Stations) for (let n of t.BundleBases.values()) e ||= this.FanEdgesOfHubSegment(n);
		}
	}
	FanEdgesOfHubSegment(e) {
		let t = !1;
		for (let n = 0; n < e.Count - 1; n++) t ||= this.FanCouple(e, n, e.CurveCenter, e.Curve.boundingBox.diagonal / 2);
		return t;
	}
	FanCouple(e, t, n, r) {
		let i = e.OrientedHubSegments[t], a = e.OrientedHubSegments[t + 1];
		if (i == null || ne(i.Segment.start, i.Segment.end, a.Segment.start, a.Segment.end) || y.getTriangleOrientation(i.value(0), i.value(.5), i.value(1)) != y.getTriangleOrientation(a.value(0), a.value(.5), a.value(1))) return !1;
		let o = this.BaseLength(i), s = this.BaseLength(a);
		return Math.abs(o - s) < u.intersectionEpsilon ? !1 : o > s ? this.AdjustLongerSeg(i, a, n, r) : this.AdjustLongerSeg(a, i, n, r);
	}
	AdjustLongerSeg(e, t, n, r) {
		let i = e.value(0).sub(t.value(0)), a = e.value(1).sub(t.value(1)), o = Math.min(i.length, a.length), s = t.value(.5), c = Math.max(i.length, a.length);
		return this.NicelyAligned(e.Segment, i, a, s, o, c) === 0 ? !1 : this.FitLonger(e, i, a, s, o, c, n, r);
	}
	FitLonger(t, n, r, i, a, o, s, c) {
		let l = t.Segment, u = l.start, d = l.end, f = 0, p = l.start.mul(1 - e.SqueezeBound).add(l.B(1).mul(e.SqueezeBound)), m = l.end.mul(1 - e.SqueezeBound).add(l.B(2).mul(e.SqueezeBound)), h = l.B(1).mul(2).sub(l.start), g = l.B(2).mul(2).sub(l.end), _ = { highP: h };
		this.PullControlPointToTheCircle(l.start, _, s, c), h = _.highP;
		let v = this.NicelyAligned(l, n, r, i, a, o);
		do {
			if (v === -1) {
				let e = y.middle(l.B(1), p), t = y.middle(l.B(2), m);
				h = l.B(1), g = l.B(2), l = new ce(u, e, t, d);
			} else {
				let e = y.middle(l.B(1), h), t = (l.B(2), g);
				p = l.B(1), m = l.B(2), l = new ce(u, e, t, d);
			}
			if ((v = this.NicelyAligned(l, n, r, i, a, o)) === 0) return t.Segment = l, t.Other.Segment = l, !0;
			if (f++ > 10) return !1;
		} while (!0);
	}
	PullControlPointToTheCircle(e, t, n, r) {
		let i = y.ProjectionToLine(e, t.highP, n), a = Math.sqrt(r * r - i.sub(n).lengthSquared), o = t.highP.sub(i), s = o.length;
		s > a && (t.highP = i.add(o.mul(a / s)));
	}
	NicelyAligned(e, t, n, r, i, a) {
		let o = .001, s = e.value(.5).sub(r), c = s.length;
		return t.dot(s) < 0 || n.dot(s) < 0 || c < i - o ? 1 : c > a + o ? -1 : 0;
	}
	BaseLength(e) {
		return e.value(0).sub(e.value(1)).lengthSquared;
	}
};
is.SqueezeBound = .2;
//#endregion
//#region node_modules/@msagl/core/dist/routing/spline/bundling/SimulatedAnnealing.js
var as = class e {
	static FixRouting(e, t) {
		return this.FixRoutingMBP(e, t, null);
	}
	static FixRoutingMBP(t, n, r) {
		return new e(t, n).FixRoutingP(r);
	}
	constructor(e, t) {
		this.stepsWithProgress = 0, this.metroGraphData = e, this.bundlingSettings = t, this.costCalculator = new Ko(this.metroGraphData, this.bundlingSettings), this.cache = new Vo(this.metroGraphData, this.bundlingSettings, this.costCalculator, this.metroGraphData.cdt);
	}
	FixRoutingP(t) {
		this.stationsForOptimizations = this.GetStationsForOptimizations(t), this.cache.InitializeCostCache();
		let n = e.MaxStep, r = Infinity, i = this.metroGraphData.VirtualStations().map((e) => e.Position), a = 0;
		for (; a++ < e.MaxIterations;) {
			let t = this.TryMoveStations();
			if (a <= 1 && !t) return !1;
			if (!t) break;
			let o = r;
			r = Ko.Cost(this.metroGraphData, this.bundlingSettings), n = this.UpdateMaxStep(n, o, r);
			let s = i;
			if (i = this.metroGraphData.VirtualStations().map((e) => e.Position), n < e.MinStep || this.Converged(n, s, i)) break;
		}
		return !0;
	}
	static stationsArePositionedCorrectly(e) {
		for (let t of e.VirtualEdges()) if (!this.edgeIsPositionedCorrectly(t, e)) return !1;
		return !0;
	}
	static edgeIsPositionedCorrectly(e, t) {
		let n = e[0], r = e[1], i = t.looseIntersections.ObstaclesToIgnoreForBundle(n, r), a = S.mkPP(n.Position, r.Position), o = Array.from(t.looseIntersections.obstacleTree.GetNodeItemsIntersectingRectangle(a.boundingBox)).filter((e) => !i.has(e)).filter((e) => E.CurvesIntersect(a, e));
		return o.length > 0 ? (is.ShowHubs(t, null, null, "./tmp/badcross.svg", [
			q.mkDebugCurveTWCI(200, 1, "Brown", a),
			q.mkDebugCurveTWCI(200, 1, "Red", _e.mkCircle(2, n.Position)),
			q.mkDebugCurveTWCI(200, 1, "Blue", _e.mkCircle(5, r.Position)),
			q.mkDebugCurveTWCI(100, 1, "Blue", _e.mkCircle(5, r.Position))
		].concat(o.map((e) => q.mkDebugCurveTWCI(100, 1, "Pink", e)))), !1) : !0;
	}
	GetStationsForOptimizations(e) {
		if (e == null) return new Set(this.metroGraphData.VirtualStations());
		{
			let t = /* @__PURE__ */ new Set();
			for (let n of e) {
				let e = this.metroGraphData.PointToStations.get(n);
				e && !e.IsReal && t.add(e);
			}
			return t;
		}
	}
	Converged(t, n, r) {
		let i = 0, a = 0;
		for (let e = 0; e < n.length; e++) a += n[e].sub(r[e]).lengthSquared, i += n[e].lengthSquared;
		return Math.sqrt(a / i) < e.MinRelativeChange;
	}
	UpdateMaxStep(t, n, r) {
		let i = .8;
		return r + 1 < n ? (this.stepsWithProgress++, this.stepsWithProgress >= 5 && (this.stepsWithProgress = 0, t = Math.min(e.MaxStep, t / i))) : (this.stepsWithProgress = 0, t *= i), t;
	}
	TryMoveStations() {
		let e = !1, t = /* @__PURE__ */ new Set();
		for (let n of this.stationsForOptimizations) if (this.TryMoveStation(n)) {
			e = !0, t.add(n);
			for (let e of n.Neighbors) e.IsReal || t.add(e);
		}
		return this.stationsForOptimizations = t, e;
	}
	TryMoveStation(t) {
		let n = this.BuildDirection(t);
		if (n.length === 0) return !1;
		let r = this.BuildStepLength(t, n);
		if (r < e.MinStep && (n = os(), r = this.BuildStepLength(t, n), r < e.MinStep)) return !1;
		let i = n.mul(r), a = t.Position.add(i);
		return this.metroGraphData.PointToStations.has(a) || !this.moveIsLegalForAdjacentBundles(t, a) ? !1 : (this.metroGraphData.MoveNode(t, a), this.cache.UpdateCostCache(t), !0);
	}
	moveIsLegalForAdjacentBundles(e, t) {
		for (let n of this.metroGraphData.looseIntersections.obstacleTree.AllHitItems(O.mkOnPoints([t]), (e) => E.PointRelativeToCurveLocation(t, e) !== T.Outside)) if (e.getELP().has(n) === !1) return !1;
		for (let n of e.Neighbors) {
			let r = this.metroGraphData.looseIntersections.ObstaclesToIgnoreForBundle(n, e);
			if (!this.metroGraphData.cdtIntersections.EdgeIsLegal_(n.Position, t, n.cdtTriangle, r)) return !1;
		}
		return !0;
	}
	BuildDirection(e) {
		let t = this.BuildForceForInk(e), n = this.BuildForceForPathLengths(e), r = this.BuildForceForRadius(e), i = this.BuildForceForBundle(e), a = t.add(n.add(r.add(i)));
		return a.length < .1 ? new y(0, 0) : a.normalize();
	}
	BuildStepLength(t, n) {
		let r = e.MinStep, i = this.CostGain(t, t.Position.add(n.mul(r)));
		if (i < .01) return 0;
		for (; 2 * r <= e.MaxStep;) {
			let e = this.CostGain(t, t.Position.add(n.mul(r * 2)));
			if (e <= i) break;
			r *= 2, i = e;
		}
		return r;
	}
	CostGain(e, t) {
		let n = -12345678, r = this.costCalculator.RadiusGain(e, t);
		if (r < n) return n;
		let i = this.costCalculator.BundleGain(e, t);
		if (i < n) return n;
		let a = this.costCalculator.InkGain(e, t), o = this.costCalculator.PathLengthsGain(e, t);
		return r + a + o + i;
	}
	BuildForceForInk(e) {
		let t = new y(0, 0);
		for (let n of e.Neighbors) {
			let r = n.Position.sub(e.Position);
			t = t.add(r.normalize());
		}
		return t.mul(this.bundlingSettings.InkImportance);
	}
	BuildForceForPathLengths(e) {
		let t = new y(0, 0);
		for (let n of this.metroGraphData.MetroNodeInfosOfNode(e)) {
			let r = n.Metroline, i = n.PolyPoint.next.point, a = n.PolyPoint.prev.point, o = i.sub(e.Position), s = a.sub(e.Position);
			t = t.add(o.div(o.length * r.IdealLength)), t = t.add(s.div(s.length * r.IdealLength));
		}
		return t.mul(this.bundlingSettings.PathLengthImportance);
	}
	BuildForceForRadius(e) {
		let t = new y(0, 0), n = e.cachedIdealRadius, r = { touchedObstacles: [] };
		if (!this.metroGraphData.looseIntersections.HubAvoidsObstaclesSPNBA(e, e.Position, n, r)) throw is.ShowHubs(this.metroGraphData, null, e, "./tmp/hubs.svg", [q.mkDebugCurveTWCI(255, 1, "Brown", Fo.containingPoly), q.mkDebugCurveTWCI(100, 1, "Blue", _e.mkCircle(n, e.Position))]), Error();
		for (let i of r.touchedObstacles) {
			let r = 2 * (1 - i[1].sub(e.Position).length / n), a = e.Position.sub(i[1]).normalize();
			t = t.add(a.mul(r));
		}
		return t.mul(this.bundlingSettings.HubRepulsionImportance);
	}
	BuildForceForBundle(e) {
		let t = new y(0, 0);
		for (let n of e.Neighbors) {
			let r = this.metroGraphData.GetWidthSSN(e, n, this.bundlingSettings.EdgeSeparation), i = { closestDist: [] };
			this.metroGraphData.cdtIntersections.BundleAvoidsObstacles(e, n, e.Position, n.Position, r / 2, i);
			for (let e of i.closestDist) {
				let n = 2 * (1 - e[0].sub(e[1]).length / (r / 2)), i = e[0].sub(e[1]).normalize().neg();
				t = t.add(i.mul(n));
			}
		}
		return t.mul(this.bundlingSettings.BundleRepulsionImportance);
	}
};
as.MaxIterations = 100, as.MaxStep = 50, as.MinStep = 1, as.MinRelativeChange = 5e-4;
function os() {
	return new y(1 + 2 * xn(), 1 + 2 * xn());
}
//#endregion
//#region node_modules/@msagl/core/dist/routing/spline/bundling/StationPositionsAdjuster.js
var ss = class e {
	constructor(e, t) {
		this.metroGraphData = e, this.bundlingSettings = t;
	}
	static FixRouting(t, n) {
		let r = new e(t, n);
		r.GlueConflictingStations(), r.UnglueEdgesFromBundleToSaveInk(!0);
		let i = 0;
		for (; ++i < 10;) {
			let e = r.GlueConflictingStations();
			if (e ||= r.RelaxConstrainedEdges(), e ||= i <= 3 && r.UnglueEdgesFromBundleToSaveInk(!1), e ||= r.GlueCollinearNeighbors(i), e ||= i === 3 && r.RemoveDoublePathCrossings(), !e) break;
		}
		for (t.cdtIntersections.ComputeForcesForBundles = !0, r.RemoveDoublePathCrossings(), r.UnglueEdgesFromBundleToSaveInk(!0); r.GlueConflictingStations(););
		t.Initialize(!0);
	}
	GlueConflictingStations() {
		let e = this.GetCirclesHierarchy();
		if (e == null) return !1;
		let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Set();
		if (G(e, e, (e, r) => this.TryToGlueStations(e, r, t, n)), t.size === 0) return !1;
		for (let e = 0; e < this.metroGraphData.Edges.length; e++) this.RegenerateEdge(t, e);
		let r = new R();
		for (let e of n) {
			r.add(e.Position);
			for (let t of e.Neighbors) t.IsReal || r.add(t.Position);
		}
		return this.metroGraphData.Initialize(!1), as.FixRoutingMBP(this.metroGraphData, this.bundlingSettings, r), !0;
	}
	GetCirclesHierarchy() {
		for (let e of this.metroGraphData.VirtualStations()) e.Radius = this.GetCurrentHubRadius(e);
		return F(this.metroGraphData.VirtualStations().map(e));
		function e(e) {
			let t = e.Position, n = Math.max(e.Radius, 5), r = new y(n, n);
			return I(e, O.mkPP(t.add(r), t.sub(r)));
		}
	}
	GetCurrentHubRadius(e) {
		if (e.IsReal) return e.BoundaryCurve.boundingBox.diagonal / 2;
		{
			let t = e.cachedIdealRadius, n = this.metroGraphData.looseIntersections.GetMinimalDistanceToObstacles(e, e.Position, t);
			for (let t of e.Neighbors) n = Math.min(n, e.Position.sub(t.Position).length);
			return n;
		}
	}
	TryToGlueStations(e, t, n, r) {
		if (!Ie(e.getELP(), t.getELP())) return !1;
		e.Position.sub(t.Position).length >= Math.max(e.Radius, 5) + Math.max(t.Radius, 5) || this.TryGlueOrdered(e, t, r, n) || this.TryGlueOrdered(t, e, r, n);
	}
	TryGlueOrdered(e, t, n, r) {
		return !r.has(e) && !n.has(e) && this.StationGluingIsAllowed(e, t, r) ? (this.Map(e, t, n, r), !0) : !1;
	}
	Map(e, t, n, r) {
		r.set(e, t), n.add(t);
	}
	StationGluingIsAllowed(t, n, r) {
		for (let i of t.Neighbors) {
			let a = e.Glued(i, r), o = this.metroGraphData.looseIntersections.ObstaclesToIgnoreForBundle(a, t);
			if (!this.metroGraphData.cdtIntersections.EdgeIsLegalSSPPS(a, n, o)) return !1;
		}
		return !(this.ComputeCostDeltaAfterStationGluing(t, n, r) < 0);
	}
	ComputeCostDeltaAfterStationGluing(t, n, r) {
		let i = t.Position.sub(n.Position).length;
		if (t.Radius >= i || n.Radius >= i) return 1;
		let a = 0, o = this.metroGraphData.Ink, s = this.metroGraphData.Ink - n.Position.sub(t.Position).length;
		for (let i of t.Neighbors) {
			let a = e.Glued(i, r);
			s -= a.Position.sub(t.Position).length, s += this.metroGraphData.RealEdgeCount(a, n) === 0 ? a.Position.sub(n.Position).length : 0;
		}
		a += Ko.InkError(o, s, this.bundlingSettings);
		for (let e of this.metroGraphData.MetroNodeInfosOfNode(t)) {
			let r = e.Metroline.Length, i = e.Metroline.Length, o = e.PolyPoint, s = o.prev, c = o.next;
			i -= s.point.sub(t.Position).length + c.point.sub(t.Position).length, i += s.point.sub(n.Position).length + c.point.sub(n.Position).length, a += Ko.PathLengthsError(r, i, e.Metroline.IdealLength, this.bundlingSettings);
		}
		return a;
	}
	RegenerateEdge(t, n) {
		let r = this.metroGraphData.Metrolines[n].Polyline;
		for (let e of r) if (!this.metroGraphData.PointToStations.has(e)) return;
		let i = !1;
		for (let e of r) if (t.has(this.metroGraphData.PointToStations.get(e))) {
			i = !0;
			break;
		}
		if (!i) return;
		let a = Array.from(r).map((e) => this.metroGraphData.PointToStations.get(e));
		this.metroGraphData.Edges[n].curve = D.mkFromPoints(e.GluedPolyline(a, t));
	}
	static GluedPolyline(t, n) {
		let r, i = new N.Stack();
		i.push(t[0]);
		let a = /* @__PURE__ */ new Set();
		for (r = 1; r < t.length - 1; r++) {
			let o = e.Glued(t[r], n);
			if (a.has(o)) {
				for (; i.top !== o;) a.delete(i.pop());
				continue;
			}
			y.closeDistEps(o.Position, i.top.Position) || (a.add(o), i.push(o));
		}
		return i.push(t[r]), Array.from(i).reverse().map((e) => e.Position);
	}
	static Glued(e, t) {
		return t.get(e) ?? e;
	}
	UnglueEdgesFromBundleToSaveInk(e) {
		let t = new $n();
		this.ink = this.metroGraphData.Ink, this.polylineLength = /* @__PURE__ */ new Map();
		for (let e of this.metroGraphData.Metrolines) {
			this.polylineLength.set(e, e.Length);
			for (let n = e.Polyline.startPoint; n.next != null; n = n.next) Be(t, new L(n.point, n.next.point), e);
		}
		let n = new R(), r = !1;
		for (let e of this.metroGraphData.Metrolines) {
			let i = Ne(this.metroGraphData.PointToStations.get(e.Polyline.start).getELP(), this.metroGraphData.PointToStations.get(e.Polyline.end).getELP());
			this.TrySeparateOnPolyline(e, t, n, i) && (r = !0);
		}
		return r && this.metroGraphData.Initialize(!1), (e || r) && as.FixRoutingMBP(this.metroGraphData, this.bundlingSettings, e ? null : n), r;
	}
	TrySeparateOnPolyline(e, t, n, r) {
		let i = !1, a = !0;
		for (; a;) {
			a = !1;
			for (let i = e.Polyline.startPoint; i.next != null && i.next.next != null; i = i.next) this.TryShortcutPolypoint(i, t, n, r) && (a = !0);
			a && (i = !0);
		}
		return i;
	}
	TryShortcutPolypoint(e, t, n, r) {
		return this.SeparationShortcutAllowed(e, t, r) ? (n.add(e.point), n.add(e.next.point), n.add(e.next.next.point), this.RemoveShortcuttedPolypoint(e, t), !0) : !1;
	}
	SeparationShortcutAllowed(e, t, n) {
		let r = e.point, i = e.next.point, a = e.next.next.point, o = this.metroGraphData.PointToStations.get(r), s = this.metroGraphData.PointToStations.get(i), c = this.metroGraphData.PointToStations.get(a), l = je(o.getELP(), c.getELP()), u = Pe([
			n,
			s.getELP(),
			l
		]);
		return !(!this.metroGraphData.cdtIntersections.EdgeIsLegalSSPPS(o, c, u) || this.GetInkgain(e, t, r, i, a) < 0);
	}
	GetInkgain(e, t, n, r, i) {
		let [a, o, s] = this.FindPolylines(e, t), c = 0, l = this.ink, u = this.ink, d = n.sub(r).length, f = r.sub(i).length, p = n.sub(i).length;
		a.size === s.size && (u -= d), o.size === s.size && (u -= f);
		let m = t.get(new L(n, i));
		(!m || m.size === 0) && (u += p), c += Ko.InkError(l, u, this.bundlingSettings);
		for (let e of s) {
			let t = this.polylineLength.get(e), n = t - (d + f - p);
			c += Ko.PathLengthsError(t, n, e.IdealLength, this.bundlingSettings);
		}
		let h = this.GetCurrentHubRadius(this.metroGraphData.PointToStations.get(n)), g = this.metroGraphData.GetWidthAN(Array.from(s), this.bundlingSettings.EdgeSeparation), _ = this.metroGraphData.GetWidthAN(Array.from(ke(a, s)), this.bundlingSettings.EdgeSeparation), v = Bo.GetMinRadiusForTwoAdjacentBundlesNPPPNNB(h, n, i, r, g, _, this.bundlingSettings);
		v > h && (c -= Ko.RError(v, h, this.bundlingSettings)), h = this.GetCurrentHubRadius(this.metroGraphData.PointToStations.get(i));
		let y = this.metroGraphData.GetWidthAN(Array.from(ke(o, s)), this.bundlingSettings.EdgeSeparation);
		return v = Bo.GetMinRadiusForTwoAdjacentBundlesNPPPNNB(h, i, r, n, y, g, this.bundlingSettings), v > h && (c -= Ko.RError(v, h, this.bundlingSettings)), c;
	}
	RemoveShortcuttedPolypoint(e, t) {
		let n = e.point, r = e.next.point, i = e.next.next.point, [a, o, s] = this.FindPolylines(e, t), c = v(n, r), l = v(r, i), u = v(n, i);
		a.size === s.size && (this.ink -= c), o.size === s.size && (this.ink -= l);
		let d = t.get(new L(n, i));
		(!d || d.size === 0) && (this.ink += u);
		for (let e of s) {
			let t = this.polylineLength.get(e);
			this.polylineLength.set(e, t - (c + l - u));
		}
		for (let e of s) {
			let a = Array.from(e.Polyline.polylinePoints()).find((e) => e.point.equal(r));
			this.RemovePolypoint(a), Ue(t, [n, r], e), Ue(t, [r, i], e), Ve(t, [n, i], e);
		}
	}
	FindPolylines(e, t) {
		let n = e.point, r = e.next.point, i = e.next.next.point, a = t.getPP(n, r), o = t.getPP(r, i);
		return [
			a,
			o,
			Ne(a, o)
		];
	}
	RemovePolypoint(e) {
		let t = e.prev, n = e.next;
		t.next = n, n.prev = t;
	}
	GlueCollinearNeighbors(e) {
		let t = new R(), n = !1;
		for (let r of this.metroGraphData.Stations) this.GlueCollinearNeighborsSPN(r, t, e) && (n = !0);
		return n && (this.metroGraphData.Initialize(!1), as.FixRoutingMBP(this.metroGraphData, this.bundlingSettings, t)), n;
	}
	GlueCollinearNeighborsSPN(e, t, n) {
		if (e.Neighbors.length <= 1) return !1;
		let r = new Ho(), i = e.Neighbors;
		for (let t = 0; t < i.length; t++) this.TryToGlueEdges(e, i[t], i[(t + 1) % i.length], r, n);
		if (r.isEmpty) return !1;
		for (let e of r) this.GlueEdge(e), t.add(e[0].Position), t.add(e[1].Position), t.add(e[2]);
		return !0;
	}
	TryToGlueEdges(e, t, n, r, i) {
		if (y.anglePCP(t.Position, e.Position, n.Position) < this.bundlingSettings.AngleThreshold) {
			let a = v(t.Position, e.Position), o = v(n.Position, e.Position), s = Math.min(a, o) / Math.max(a, o);
			if (s < .05) return;
			if (a < o) {
				if (this.EdgeGluingIsAllowedSSS(e, t, n)) {
					this.AddEdgeToGlue(e, n, t, t.Position, r);
					return;
				}
			} else if (this.EdgeGluingIsAllowedSSS(e, n, t)) {
				this.AddEdgeToGlue(e, t, n, n.Position, r);
				return;
			}
			if (i < 5 && s > .5) {
				let i = this.ConstructGluingPoint(e, t, n);
				this.EdgeGluingIsAllowedSSSP(e, t, n, i) && this.AddEdgeToGlue(e, n, t, i, r);
			}
		}
	}
	ConstructGluingPoint(e, t, n) {
		let r = Math.min(v(t.Position, e.Position), v(n.Position, e.Position) / 2), i = t.Position.sub(e.Position).normalize().add(n.Position.sub(e.Position).normalize());
		return e.Position.add(i.mul(r / 2));
	}
	EdgeGluingIsAllowedSSS(e, t, n) {
		if (t.IsReal || n.IsReal || !Ie(t.getELP(), n.getELP()) || !this.metroGraphData.cdtIntersections.EdgeIsLegal(t, n, t.Position, n.Position)) return !1;
		let r = this.metroGraphData.looseIntersections.ObstaclesToIgnoreForBundle(e, n);
		return !(Zn.IntersectionsOfLineAndRectangleNodeOverPolylineLR(S.mkPP(e.Position, t.Position), this.metroGraphData.LooseTree).find((e) => !r.has(e.seg1)) || Zn.IntersectionsOfLineAndRectangleNodeOverPolylineLR(S.mkPP(t.Position, n.Position), this.metroGraphData.LooseTree).find((e) => !r.has(e.seg1)) || this.ComputeCostDeltaAfterEdgeGluing(e, t, n, t.Position) < 0);
	}
	EdgeGluingIsAllowedSSSP(e, t, n, r) {
		return !(!this.metroGraphData.looseIntersections.HubAvoidsObstaclesPNS__(r, 0, Ne(t.getELP(), n.getELP())) || !this.metroGraphData.cdtIntersections.EdgeIsLegal(e, null, e.Position, r) || !this.metroGraphData.cdtIntersections.EdgeIsLegal(t, null, t.Position, r) || !this.metroGraphData.cdtIntersections.EdgeIsLegal(n, null, n.Position, r) || this.ComputeCostDeltaAfterEdgeGluing(e, t, n, r) < 0);
	}
	ComputeCostDeltaAfterEdgeGluing(e, t, n, r) {
		let i = 0, a = this.metroGraphData.Ink, o = this.metroGraphData.Ink - v(e.Position, n.Position) - v(e.Position, t.Position) + v(e.Position, r) + v(r, t.Position) + v(r, n.Position);
		i += Ko.InkError(a, o, this.bundlingSettings);
		for (let t of this.metroGraphData.GetIjInfo(e, n).Metrolines) {
			let a = t.Length, o = t.Length - v(e.Position, n.Position) + v(e.Position, r) + v(r, n.Position);
			i += Ko.PathLengthsError(a, o, t.IdealLength, this.bundlingSettings);
		}
		for (let n of this.metroGraphData.GetIjInfo(e, t).Metrolines) {
			let a = n.Length, o = n.Length - v(e.Position, t.Position) + v(e.Position, r) + v(r, t.Position);
			i += Ko.PathLengthsError(a, o, n.IdealLength, this.bundlingSettings);
		}
		let s = e.cachedIdealRadius, c = this.GetCurrentHubRadius(e), l = Bo.GetMinRadiusForTwoAdjacentBundles(c, e, e.Position, t, n, this.metroGraphData, this.bundlingSettings);
		return l > c && (i += Ko.RError(l, c, this.bundlingSettings)), s > v(e.Position, r) && !e.IsReal && (i -= Ko.RError(s, v(e.Position, r), this.bundlingSettings)), i;
	}
	AddEdgeToGlue(e, t, n, r, i) {
		i.has(n, e) || i.has(t, e) || i.has(e, n) || i.has(e, t) || (i.set(e, n, r), i.set(e, t, r));
	}
	GlueEdge(e) {
		let t = e[0], n = e[1], r = e[2];
		for (let e of t.MetroNodeInfos.map((e) => e.PolyPoint)) e.next != null && e.next.point.equal(n.Position) ? this.SplitPolylinePoint(e, r) : e.prev != null && e.prev.point.equal(n.Position) && this.SplitPolylinePoint(e.prev, r);
	}
	SplitPolylinePoint(e, t) {
		if (e.point === t || e.next.point === t) return;
		let n = b.mkFromPoint(t);
		n.polyline = e.polyline, n.next = e.next, n.prev = e, n.next.prev = n, n.prev.next = n;
	}
	RelaxConstrainedEdges() {
		let e = new R(), t = !1;
		for (let n of this.metroGraphData.VirtualEdges()) this.RelaxConstrainedEdge(n[0], n[1], e) && (t = !0);
		return t && (this.metroGraphData.Initialize(!1), as.FixRoutingMBP(this.metroGraphData, this.bundlingSettings, e)), t;
	}
	RelaxConstrainedEdge(e, t, n) {
		let r = this.metroGraphData.GetWidthSSN(e, t, this.bundlingSettings.EdgeSeparation), i = { closestDist: [] };
		this.metroGraphData.cdtIntersections.BundleAvoidsObstacles(e, t, e.Position, t.Position, .99 * r / 2, i);
		let a = i.closestDist;
		if (a.length > 0) {
			let r = -1, i;
			for (let n of a) {
				if (Math.min(v(e.Position, n[1]), v(t.Position, n[1])) / v(e.Position, t.Position) < .1) continue;
				let a = v(n[0], n[1]);
				(r === -1 || a < r) && (r = a, i = n[1]);
			}
			if (r === -1 || !this.metroGraphData.looseIntersections.HubAvoidsObstaclesPNS__(i, 0, Ne(e.getELP(), t.getELP()))) return !1;
			n.add(i), n.add(e.Position), n.add(t.Position);
			for (let n of this.metroGraphData.GetIjInfo(e, t).Metrolines) {
				let r = null;
				for (let t of n.Polyline.polylinePoints()) if (t.point.equal(e.Position)) {
					r = t;
					break;
				}
				r.next != null && r.next.point.equal(t.Position) ? this.SplitPolylinePoint(r, i) : this.SplitPolylinePoint(r.prev, i);
			}
			return !0;
		}
		return !1;
	}
	RemoveDoublePathCrossings() {
		let e = new Xo(this.metroGraphData, this.metroGraphData.PointIsAcceptableForEdge.bind(this)).run();
		return e && (this.metroGraphData.Initialize(!1), as.FixRouting(this.metroGraphData, this.bundlingSettings)), e;
	}
}, cs = class e {
	constructor(e, t, n) {
		this.upperBound = Infinity, this._visGraph = n, n.ClearPrevEdgesTable();
		for (let e of n.Vertices()) e.Distance = Infinity;
		this.sources = e, this.targets = new Set(t);
	}
	GetPath() {
		let e = new Rn();
		for (let t of this.sources) t.Distance = 0, e.Enqueue(t, 0);
		for (; !e.IsEmpty() && (this._current = e.Dequeue(), !this.targets.has(this._current));) {
			for (let t of this._current.OutEdges) this.PassableOutEdge(t) && this.ProcessNeighbor(e, t, t.Target);
			for (let t of this._current.InEdges.filter(this.PassableInEdge.bind)) this.ProcessNeighbor(e, t, t.Source);
		}
		return this._visGraph.PreviosVertex(this._current) == null ? null : this.CalculatePath();
	}
	PassableOutEdge(t) {
		return this.targets.has(t.Target) || !e.IsForbidden(t);
	}
	PassableInEdge(t) {
		return this.targets.has(t.Source) || !e.IsForbidden(t);
	}
	static IsForbidden(e) {
		return (e.IsPassable != null && !e.IsPassable() || e) instanceof Mt;
	}
	ProcessNeighbor(e, t, n) {
		let r = t.Length, i = this._current.Distance + r;
		i >= this.upperBound || (this.targets.has(n) && (this.upperBound = i, this.closestTarget = n), this._visGraph.PreviosVertex(n) == null ? (n.Distance = i, this._visGraph.SetPreviousEdge(n, t), e.Enqueue(n, i)) : i < n.Distance && (n.Distance = i, this._visGraph.SetPreviousEdge(n, t), e.DecreasePriority(n, i)));
	}
	CalculatePath() {
		if (this.closestTarget == null) return null;
		let e = [], t = this.closestTarget;
		do
			e.push(t), t = this._visGraph.PreviosVertex(t);
		while (t.Distance > 0);
		return e.push(t), e.reverse();
	}
}, ls = class extends B {
	constructor(e, t, n, r, i, a, o, s, c, l) {
		super(null), this.bundlingSettings = r, this.bundlingSettings.edgeWidthShrinkCoeff = 1, this.edgesToRoute = e, this.regularEdges = e.filter((e) => e.source !== e.target), this.VisibilityGraph = n, this.shortestPathRouter = t, this.LoosePadding = i, this.LooseHierarchy = o, this.TightHierarchy = a, this.EdgeLooseEnterable = s, this.EdgeTightEnterable = c, this.loosePolylineOfPort = l, bn(0);
	}
	ThereAreOverlaps(e) {
		return dn(e, e, E.CurvesIntersect);
	}
	run() {
		if (this.ThereAreOverlaps(this.TightHierarchy)) {
			this.Status = Mo.Overlaps;
			return;
		}
		this.FixLocationsForHookAnywherePorts(this.edgesToRoute), this.RoutePathsWithSteinerDijkstra(), this.FixChildParentEdges(), this.bundlingSettings.StopAfterShortestPaths || this.OrderOptimizeNudgeEtc(), this.RouteSelfEdges(), this.FixArrowheads();
	}
	OrderOptimizeNudgeEtc() {
		let e = new Uo(this.regularEdges, this.LooseHierarchy, this.TightHierarchy, this.bundlingSettings, this.shortestPathRouter.cdt, this.EdgeLooseEnterable, this.EdgeTightEnterable, this.loosePolylineOfPort);
		ss.FixRouting(e, this.bundlingSettings), new is(e, this.bundlingSettings).run();
	}
	FixChildParentEdges() {
		for (let e of this.regularEdges) {
			let t = e.sourcePort, n = e.targetPort;
			if (t.Curve.boundingBox.containsRect(n.Curve.boundingBox)) {
				let n = E.intersectionOne(t.Curve, S.mkPP(e.curve.start, e.curve.end), !1), r = e.curve;
				r.startPoint.point = n.x;
			}
			if (n.Curve.boundingBox.containsRect(t.Curve.boundingBox)) {
				let t = E.intersectionOne(n.Curve, S.mkPP(e.curve.start, e.curve.end), !0), r = e.curve;
				r.endPoint.point = t.x;
			}
		}
	}
	FixLocationsForHookAnywherePorts(e) {
		for (let t of e) {
			let e = t.sourcePort instanceof $t;
			if (e) {
				let e = t.sourcePort;
				e.SetLocation(this.FigureOutHookLocation(e.LoosePolyline, t.targetPort, t));
			} else if (e = t.targetPort instanceof $t, e) {
				let e = t.targetPort;
				e.SetLocation(this.FigureOutHookLocation(e.LoosePolyline, t.sourcePort, t));
			}
		}
	}
	FigureOutHookLocation(e, t, n) {
		return t instanceof en ? this.FigureOutHookLocationForClusterOtherPort(e, t, n) : this.FigureOutHookLocationForSimpleOtherPort(e, t, n);
	}
	FigureOutHookLocationForClusterOtherPort(e, t, n) {
		let r = this.shortestPathRouter.MakeTransparentShapesOfEdgeGeometry(n), i = new cs(Array.from(t.LoosePolyline).map(this.VisibilityGraph.FindVertex.bind), Array.from(e).map(this.VisibilityGraph.FindVertex.bind), this.VisibilityGraph).GetPath();
		for (let e of r) e.IsTransparent = !1;
		return i[i.length - 1].point;
	}
	FigureOutHookLocationForSimpleOtherPort(e, t, n) {
		let r = t.Location, i = this.shortestPathRouter.MakeTransparentShapesOfEdgeGeometry(n), a = new zn(this.VisibilityGraph.FindVertex(r), Array.from(e).map((e) => this.VisibilityGraph.FindVertex(e)), this.VisibilityGraph).GetPath();
		for (let e of i) e.IsTransparent = !1;
		return a[a.length - 1].point;
	}
	RoutePathsWithSteinerDijkstra() {
		this.shortestPathRouter.VisibilityGraph = this.VisibilityGraph, this.shortestPathRouter.BundlingSettings = this.bundlingSettings, this.shortestPathRouter.geomEdges = this.regularEdges, this.shortestPathRouter.ObstacleHierarchy = this.LooseHierarchy, this.shortestPathRouter.RouteEdges(), this.shortestPathRouter.cdt != null && this.AdjustEdgeSeparation();
	}
	AdjustEdgeSeparation() {
		let e = /* @__PURE__ */ new Map();
		this.shortestPathRouter.FillCrossedCdtEdges(e);
		let t = this.GetPathsOnCdtEdge(e);
		this.bundlingSettings.edgeWidthShrinkCoeff = this.CalculateEdgeWidthShrinkCoeff(t);
	}
	GetPathsOnCdtEdge(e) {
		let t = /* @__PURE__ */ new Map();
		for (let n of e.keys()) for (let r of e.get(n)) Re(t, r, n);
		return t;
	}
	CalculateEdgeWidthShrinkCoeff(e) {
		let t = 0, n = this.bundlingSettings.edgeWidthShrinkCoeff;
		if (this.EdgeSeparationIsOkMN(e, n)) return n;
		let r = !1;
		for (; !r || Math.abs(n - t) > .01;) {
			let i = (t + n) / 2;
			this.EdgeSeparationIsOkMN(e, i) ? (t = i, r = !0) : n = i;
		}
		return t;
	}
	EdgeSeparationIsOkMN(e, t) {
		for (let n of e.keys()) if (!this.EdgeSeparationIsOk(n, e.get(n), t)) return !1;
		return !0;
	}
	EdgeSeparationIsOk(e, t, n) {
		return Array.from(t).map((e) => this.bundlingSettings.ActualEdgeWidth(e, n)).reduce((e, t) => e + t, 0) <= e.Capacity;
	}
	RouteSelfEdges() {
		for (let e of this.edgesToRoute) e.source === e.target && (e.curve = be.RouteSelfEdge(e.source.boundaryCurve, this.LoosePadding * 2, { smoothedPolyline: null }));
	}
	FixArrowheads() {
		for (let e of this.edgesToRoute) Qn.trimSplineAndCalculateArrowheadsII(e, e.source.boundaryCurve, e.target.boundaryCurve, e.curve, !1);
	}
};
ls.SuperLoosePaddingCoefficient = 1.1;
//#endregion
//#region node_modules/@msagl/core/dist/routing/spline/bundling/SdBoneEdge.js
var us = class {
	constructor(e, t, n) {
		this.numberOfPassedPaths = 0, this.VisibilityEdge = e, this.Source = t, this.Target = n;
	}
	get TargetPoint() {
		return this.Target.Point;
	}
	get SourcePoint() {
		return this.Source.Point;
	}
	get IsOccupied() {
		return this.numberOfPassedPaths > 0;
	}
	get IsPassable() {
		return this.Target.IsTargetOfRouting || this.Source.IsSourceOfRouting || this.VisibilityEdge.IsPassable == null || this.VisibilityEdge.IsPassable();
	}
	AddOccupiedEdge() {
		this.numberOfPassedPaths++;
	}
	RemoveOccupiedEdge() {
		this.numberOfPassedPaths--;
	}
}, ds = class {
	get Prev() {
		return this.PrevEdge == null ? null : this.PrevEdge.Source === this ? this.PrevEdge.Target : this.PrevEdge.Source;
	}
	constructor(e) {
		this.InBoneEdges = [], this.OutBoneEdges = [], this.VisibilityVertex = e;
	}
	get Point() {
		return this.VisibilityVertex.point;
	}
	get Cost() {
		return this.IsSourceOfRouting ? this.cost : this.Prev == null ? Infinity : this.cost;
	}
	set Cost(e) {
		this.cost = e;
	}
	SetPreviousToNull() {
		this.PrevEdge = null;
	}
}, fs = class e {
	constructor(e, t, n) {
		this.EdgesToRoutes = /* @__PURE__ */ new Map(), this.EdgesToRouteSources = /* @__PURE__ */ new Map(), this.MakeTransparentShapesOfEdgeGeometry = e, this.cdt = t, this.Gates = n;
	}
	CreateGraphElements() {
		for (let e of this.vertexArray) {
			let t = e.VisibilityVertex;
			for (let n of t.InEdges) {
				let t = new us(n, this.VisibilityVerticesToSdVerts.get(n.Source), this.VisibilityVerticesToSdVerts.get(n.Target)), r = this.VisibilityVerticesToSdVerts.get(n.Source);
				e.InBoneEdges.push(t), r.OutBoneEdges.push(t);
			}
		}
	}
	CreateRoutingGraph() {
		this.vertexArray = [], this.VisibilityVerticesToSdVerts = /* @__PURE__ */ new Map();
		for (let e of this.VisibilityGraph.Vertices()) {
			let t = new ds(e);
			this.vertexArray.push(t), this.VisibilityVerticesToSdVerts.set(e, t);
		}
		this.CreateGraphElements();
	}
	RouteEdges() {
		this.Initialize(), this.RestoreCapacities();
		for (let e of this.geomEdges) this.EdgesToRoutes.set(e, this.RouteEdge(e));
		this.RerouteEdges();
		for (let e of this.geomEdges) this.SetEdgeGeometryCurve(e);
	}
	SetEdgeGeometryCurve(t) {
		let n = new D(), r = this.EdgesToRouteSources.get(t);
		n.addPoint(r.Point);
		for (let e of this.EdgesToRoutes.get(t)) e.SourcePoint.equal(r.Point) ? (n.addPoint(e.TargetPoint), r = e.Target) : (n.addPoint(e.SourcePoint), r = e.Source);
		t.curve = n, t.sourcePort instanceof en && e.ExtendPolylineStartToClusterBoundary(n, t.sourcePort.Curve), t.targetPort instanceof en && e.ExtendPolylineEndToClusterBoundary(n, t.targetPort.Curve);
	}
	static ExtendPolylineEndToClusterBoundary(e, t) {
		let n = t.closestParameter(e.end);
		e.addPoint(t.value(n));
	}
	static ExtendPolylineStartToClusterBoundary(e, t) {
		let n = t.closestParameter(e.start);
		e.PrependPoint(t.value(n));
	}
	RerouteEdges() {
		this.RestoreCapacities();
		for (let e of this.geomEdges) {
			let t = this.RerouteEdge(e);
			this.EdgesToRoutes.set(e, t);
		}
	}
	RestoreCapacities() {
		this.cdt != null && this.cdt.RestoreEdgeCapacities();
	}
	RerouteEdge(e) {
		let t = this.EdgesToRoutes.get(e);
		for (let e of t) e.RemoveOccupiedEdge();
		return this.RouteEdge(e);
	}
	RouteEdge(e) {
		this.CurrentEdgeGeometry = e;
		for (let e = 0; e < this.vertexArray.length; e++) {
			let t = this.vertexArray[e];
			t.SetPreviousToNull(), t.IsTargetOfRouting = t.IsSourceOfRouting = !1;
		}
		let t = this.MakeTransparentShapesOfEdgeGeometry(e), n = this.RouteEdgeWithGroups();
		for (let e of t) e.IsTransparent = !1;
		return n;
	}
	RouteEdgeWithGroups() {
		for (let e = 0; e < 2; e++) {
			this.SetLengthCoefficient(), this.Queue = new Rn(), this.sourceLoosePoly = this.SetPortVerticesAndObstacles(this.CurrentEdgeGeometry.sourcePort, !0), this.targetLoosePoly = this.SetPortVerticesAndObstacles(this.CurrentEdgeGeometry.targetPort, !1);
			let t = this.RouteOnKnownSourceTargetVertices(this.CurrentEdgeGeometry.targetPort.Location.sub(this.CurrentEdgeGeometry.sourcePort.Location).normalize(), e === 0);
			if (t != null) return t;
			for (let e = 0; e < this.vertexArray.length; e++) this.vertexArray[e].SetPreviousToNull();
		}
		throw Error();
	}
	RouteOnKnownSourceTargetVertices(e, t) {
		for (this.LowestCostToTarget = Infinity, this.ClosestTargetVertex = null; this.Queue.count > 0;) {
			let n = { priority: 0 }, r = this.Queue.DequeueAndGetPriority(n);
			if (!(n.priority >= this.LowestCostToTarget)) {
				for (let n = 0; n < r.OutBoneEdges.length; n++) {
					let i = r.OutBoneEdges[n];
					i.IsPassable && this.ProcessOutcomingBoneEdge(r, i, e, t);
				}
				for (let n = 0; n < r.InBoneEdges.length; n++) {
					let i = r.InBoneEdges[n];
					i.IsPassable && this.ProcessIncomingBoneEdge(r, i, e, t);
				}
			}
		}
		return this.GetPathAndUpdateRelatedCosts();
	}
	ProcessOutcomingBoneEdge(e, t, n, r) {
		r && n.dot(t.TargetPoint.sub(t.SourcePoint)) < 0 || this.ProcessBoneEdge(e, t.Target, t);
	}
	ProcessIncomingBoneEdge(e, t, n, r) {
		r && n.dot(t.SourcePoint.sub(t.TargetPoint)) < 0 || this.ProcessBoneEdge(e, t.Source, t);
	}
	ProcessBoneEdge(e, t, n) {
		let r = this.GetEdgeAdditionalCost(n, e.Cost);
		if (!(t.Cost <= r)) if (t.Cost = r, t.PrevEdge = n, this.Queue.ContainsElement(t)) this.Queue.DecreasePriority(t, r);
		else {
			if (t.IsTargetOfRouting) {
				let e = 0;
				this.CurrentEdgeGeometry.targetPort instanceof en && (e = this.LengthCoefficient * t.Point.sub(this.CurrentEdgeGeometry.targetPort.Location).length), r + e < this.LowestCostToTarget && (this.LowestCostToTarget = r + e, this.ClosestTargetVertex = t);
				return;
			}
			this.Enqueue(t);
		}
	}
	GetPathAndUpdateRelatedCosts() {
		let e = this.ClosestTargetVertex;
		if (e == null) return null;
		let t = [];
		for (; e.PrevEdge != null;) t.push(e.PrevEdge), this.RegisterPathInBoneEdge(e.PrevEdge), e = e.Prev;
		return this.EdgesToRouteSources.set(this.CurrentEdgeGeometry, e), t.reverse(), t;
	}
	RegisterPathInBoneEdge(e) {
		e.AddOccupiedEdge(), this.cdt != null && this.BundlingSettings.CapacityOverflowCoefficient !== 0 && this.UpdateResidualCostsOfCrossedCdtEdges(e);
	}
	UpdateResidualCostsOfCrossedCdtEdges(e) {
		for (let t of e.CrossedCdtEdges) this.AdjacentToSourceOrTarget(t) || (t.ResidualCapacity === t.Capacity ? t.ResidualCapacity -= this.BundlingSettings.edgeWidthShrinkCoeff * this.CurrentEdgeGeometry.lineWidth : t.ResidualCapacity -= this.BundlingSettings.ActualEdgeWidth(this.CurrentEdgeGeometry));
	}
	H(e) {
		return e.Cost + this.LengthCoefficient * e.Point.sub(this.CurrentEdgeGeometry.targetPort.Location).length;
	}
	GetEdgeAdditionalCost(e, t) {
		let n = e.TargetPoint.sub(e.SourcePoint).length;
		return this.LengthCoefficient * n + t + (e.IsOccupied ? 0 : this.BundlingSettings.InkImportance * n) + this.CapacityOverflowCost(e);
	}
	CapacityOverflowCost(e) {
		if (this.cdt == null || this.BundlingSettings.CapacityOverflowCoefficient === 0) return 0;
		let t = 0;
		for (let n of this.CrossedCdtEdgesOfBoneEdge(e)) t += this.CostOfCrossingCdtEdgeLocal(this.capacityOverlowPenaltyMultiplier, this.BundlingSettings, this.CurrentEdgeGeometry, n);
		return t;
	}
	CrossedCdtEdgesOfBoneEdge(e) {
		return e.CrossedCdtEdges == null ? Array.from(e.CrossedCdtEdges = this.ThreadBoneEdgeThroughCdt(e)) : Array.from(e.CrossedCdtEdges);
	}
	ThreadBoneEdgeThroughCdt(e) {
		let t = e.SourcePoint, n = e.Source.Triangle, r = /* @__PURE__ */ new Set(), i = e.TargetPoint;
		if (fa.PointIsInsideOfTriangle(i, n)) return r;
		let a = new No(n, t, i);
		for (; a.MoveNext();) {
			let e = a.CurrentPiercedEdge;
			this.Gates.has(e) && r.add(e);
		}
		return r;
	}
	static CostOfCrossingCdtEdge(e, t, n, r) {
		let i = n.lineWidth * t.edgeWidthShrinkCoeff;
		r.Capacity !== r.ResidualCapacity && (i += t.EdgeSeparation * t.edgeWidthShrinkCoeff);
		let a = r.ResidualCapacity - i;
		return a >= 0 ? 0 : -a * e;
	}
	CostOfCrossingCdtEdgeLocal(t, n, r, i) {
		return this.AdjacentToSourceOrTarget(i) ? 0 : e.CostOfCrossingCdtEdge(t, n, r, i);
	}
	AdjacentToSourceOrTarget(e) {
		return e.upperSite.Owner === this.sourceLoosePoly || e.lowerSite.Owner === this.sourceLoosePoly || e.upperSite.Owner === this.targetLoosePoly || e.lowerSite.Owner === this.targetLoosePoly;
	}
	SetLengthCoefficient() {
		let e = this.GetIdealDistanceBetweenSourceAndTarget(this.CurrentEdgeGeometry);
		this.LengthCoefficient = this.BundlingSettings.PathLengthImportance / e;
	}
	GetIdealDistanceBetweenSourceAndTarget(e) {
		return e.sourcePort.Location.sub(e.targetPort.Location).length;
	}
	SetPortVerticesAndObstacles(e, t) {
		let n;
		if (e instanceof en) {
			n = e.LoosePolyline;
			for (let e of n) {
				let n = 0;
				t && (n = this.LengthCoefficient * e.sub(this.CurrentEdgeGeometry.sourcePort.Location).length), this.AddAndEnqueueVertexToEnds(e, t, n);
			}
		} else if (e instanceof $t) {
			n = e.LoosePolyline;
			for (let e of n) this.AddAndEnqueueVertexToEnds(e, t, 0);
		} else {
			this.AddAndEnqueueVertexToEnds(e.Location, t, 0);
			let r = Array.from(this.ObstacleHierarchy.GetNodeItemsIntersectingRectangle(e.Curve.boundingBox)), i = r[0].boundingBox.diagonal;
			n = r[0];
			for (let e = 1; e < r.length; e++) {
				let t = r[e], a = t.boundingBox.diagonal;
				a < i && (i = a, n = t);
			}
		}
		return n;
	}
	Enqueue(e) {
		this.Queue.Enqueue(e, this.H(e));
	}
	AddAndEnqueueVertexToEnds(e, t, n) {
		let r = this.FindVertex(e), i = this.VisibilityVerticesToSdVerts.get(r);
		t ? (i.IsSourceOfRouting = !0, i.Cost = n, this.Enqueue(i)) : i.IsTargetOfRouting = !0;
	}
	FindVertex(e) {
		return this.VisibilityGraph.FindVertex(e);
	}
	Initialize() {
		this.CreateRoutingGraph(), this.cdt != null && (this.capacityOverlowPenaltyMultiplier = e.CapacityOverflowPenaltyMultiplier(this.BundlingSettings), this.SetVertexTriangles(), this.CalculateCapacitiesOfTrianglulation());
	}
	CalculateCapacitiesOfTrianglulation() {
		for (let t of this.Gates) e.CalculateCdtEdgeCapacityForEdge(t);
	}
	static CalculateCdtEdgeCapacityForEdge(e) {
		if (e.constrained || e.CwTriangle == null || e.CcwTriangle == null) return;
		let t = e.upperSite.Owner, n = e.lowerSite.Owner;
		t !== n && (e.Capacity = (Mn.DistancePoint(new Mn(t), e.lowerSite.point) + Mn.DistancePoint(new Mn(n), e.upperSite.point)) / 2);
	}
	SetVertexTriangles() {
		un(F(Array.from(this.cdt.GetTriangles()).map((e) => I(e, e.BoundingBox()))), F(this.vertexArray.map((e) => I(e, O.mkOnPoints([e.Point])))), (e, t) => this.TryToAssigenTriangleToVertex(e, t));
	}
	TryToAssigenTriangleToVertex(e, t) {
		t.Triangle == null && fa.PointIsInsideOfTriangle(t.Point, e) && (t.Triangle = e);
	}
	static CapacityOverflowPenaltyMultiplier(e) {
		return e.CapacityOverflowCoefficient * (e.PathLengthImportance + e.InkImportance);
	}
	FillCrossedCdtEdges(e) {
		for (let t of this.geomEdges) {
			this.sourceLoosePoly = this.SetPortVerticesAndObstacles(t.sourcePort, !0), this.targetLoosePoly = this.SetPortVerticesAndObstacles(t.targetPort, !1);
			for (let n of this.EdgesToRoutes.get(t)) for (let r of this.CrossedCdtEdgesOfBoneEdge(n)) this.AdjacentToSourceOrTarget(r) || Re(e, t, r);
		}
	}
}, ps = class e {
	constructor(e, t, n, r, i) {
		this.multiEdges = e, this.interactiveEdgeRouter = t, this.bundlingSettings = r, this.bundlingSettings.edgeWidthShrinkCoeff = 1, this.transparentShapeSetter = i, this.nodeTree = Te(n, (e) => e.boundingBox);
	}
	run() {
		for (let e of this.GetIndependantPreGraphs()) new ls(e.edges, new fs(this.transparentShapeSetter, null, null), this.interactiveEdgeRouter.VisibilityGraph, this.bundlingSettings, this.interactiveEdgeRouter.LoosePadding, this.interactiveEdgeRouter.TightHierarchy, this.interactiveEdgeRouter.LooseHierarchy, null, null, null).run();
	}
	GetPortCurve(e) {
		return this.nodeTree.FirstHitNodeWithPredicate(e.Location, (e, t) => E.PointRelativeToCurveLocation(e, t) === T.Outside ? P.Continue : P.Stop).UserData;
	}
	GetIndependantPreGraphs() {
		let e = this.CreateInitialPregraphs();
		do {
			let t = e.length, n = { preGraphs: e };
			if (this.UniteConnectedPreGraphs(n), t <= e.length) break;
		} while (!0);
		return e;
	}
	UniteConnectedPreGraphs(t) {
		let n = e.GetIntersectionGraphOfPreGraphs(t.preGraphs);
		if (n == null) return;
		let r = Sn(n), i = [];
		for (let e of r) {
			let n = null;
			for (let r of e) n == null ? (n = t.preGraphs[r], i.push(n)) : n.AddGraph(t.preGraphs[r]);
		}
		t.preGraphs = i;
		for (let e of t.preGraphs) this.AddIntersectingNodes(e);
	}
	AddIntersectingNodes(e) {
		let t = e.boundingBox;
		for (let n of this.nodeTree.GetNodeItemsIntersectingRectangle(t)) e.AddNodeBoundary(n);
	}
	static GetIntersectionGraphOfPreGraphs(t) {
		let n = e.EnumeratePairsOfIntersectedPreGraphs(t);
		return n.length ? Dn(n, t.length) : null;
	}
	static EnumeratePairsOfIntersectedPreGraphs(e) {
		let t = Te(Array.from(Array(e.length).keys()), (t) => e[t].boundingBox), n = [];
		return G(t, t, (e, t) => n.push(new V(e, t))), n;
	}
	CreateInitialPregraphs() {
		return this.multiEdges.map((e) => this.CreatePregraphFromSetOfEdgeGeometries(e));
	}
	CreatePregraphFromSetOfEdgeGeometries(e) {
		let t = /* @__PURE__ */ new Set(), n = e[0], r = this.GetPortCurve(n.sourcePort), i = r.boundingBox;
		t.add(r), t.add(n.targetPort.Curve), i.addRec(n.targetPort.Curve.boundingBox);
		let a = this.nodeTree.GetNodeItemsIntersectingRectangle(i);
		for (let e of a) t.add(e);
		return jo.constructorStatic(e, t);
	}
}, ms = class {
	constructor() {
		this.triangles = /* @__PURE__ */ new Set();
	}
	setCdt(e) {
		this.cdt = e, this.cdt.SetInEdges();
		let t = /* @__PURE__ */ new Set();
		for (let n of e.GetTriangles()) for (let e of n.Sites) e.Owner != null && t.add(e.Owner);
	}
	outsideOfObstacles(e) {
		if (e == null) return !1;
		let t = e.Sites.item0.Owner ?? e.Sites.item1.Owner;
		return t === this.sourcePoly || t === this.targetPoly || !hs(e);
	}
	run(e) {
		if (this.triangles.clear(), this.poly = e, this.d = [], e.count <= 2 || this.cdt == null) return;
		this.sourcePoly = this.findPoly(e.start), this.targetPoly = this.findPoly(e.end), this.findChannelTriangles();
		let t = this.getPerimeterEdges();
		t = this.fillTheCollapedSites(t);
		let n = new fa([], [], Array.from(t).map((e) => ({
			A: e.lowerSite.point,
			B: e.upperSite.point
		})));
		n.run();
		let r = this.getSleeve(this.findSourceTriangle(n));
		if (r == null) {
			console.log("failed to create sleeve");
			return;
		}
		if (r.length == 0) {
			this.poly = D.mkFromPoints([e.start, e.end]);
			return;
		}
		this.initDiagonals(r), this.refineFunnel();
	}
	getAllCrossedTriangles(e, t, n) {
		let r = [], i = [], a = null;
		for (i.push(e); i.length > 0;) {
			let e = i.pop();
			if (a == null && e.containsPoint(n) && (a = e), e.intersectsLine(t, n, 0)) {
				r.push(e);
				for (let t of e.Edges) {
					let n = t.GetOtherTriangle_T(e);
					n && !r.includes(n) && !i.includes(n) && i.push(n);
				}
			}
		}
		return {
			triangles: r,
			containsEnd: a
		};
	}
	findChannelTriangles() {
		let e = this.cdt.FindSite(this.poly.start).Triangles().next().value;
		this.triangles.clear();
		for (let t = this.poly.startPoint; t.next != null; t = t.next) {
			let n = this.getAllCrossedTriangles(e, t.point, t.next.point);
			e = n.containsEnd;
			for (let e of n.triangles) this.outsideOfObstacles(e) && this.triangles.add(e);
		}
	}
	findPoly(e) {
		let t = this.cdt.FindSite(e);
		for (let e of t.Edges) return e.lowerSite.Owner ?? e.upperSite.Owner;
	}
	fillTheCollapedSites(e) {
		let t = /* @__PURE__ */ new Map();
		for (let t of e) r(t.lowerSite, t), r(t.upperSite, t);
		let n = [];
		for (let [e, r] of t) r.length > 2 && n.push(e);
		if (n.length == 0) return e;
		for (let e of n) for (let t of e.Triangles()) this.outsideOfObstacles(t) && this.triangles.add(t);
		return this.getPerimeterEdges();
		function r(e, n) {
			let r = t.get(e);
			r ?? t.set(e, r = []), r.push(n);
		}
	}
	findSourceTriangle(e) {
		let t;
		for (let n of e.GetTriangles()) if (n.containsPoint(this.poly.start)) {
			t = n;
			break;
		}
		return t;
	}
	refineFunnel() {
		let e = [], t = this.poly.start, n = { point: t }, r = { point: t }, i = {
			point: this.d[0].left,
			prev: n
		}, a = {
			point: this.d[0].right,
			prev: r
		};
		n.next = i, r.next = a;
		let o;
		for (let e = 1; e < this.d.length; e++) c(e, this.d);
		this.d.push({
			right: this.poly.end,
			left: i.point
		}), c(this.d.length - 1, this.d);
		let s = D.mkFromPoints(e);
		for (let e = r; e != null; e = e.next) s.addPoint(e.point);
		this.poly = s;
		function c(e, t) {
			if (t[e - 1].left !== t[e].left) {
				o = t[e].left;
				let n = i;
				for (; !(h(n) || d(n)); n = n.prev);
				h(n) ? p() : _(n);
			} else {
				o = t[e].right;
				let n = a;
				for (; !(h(n) || f(n)); n = n.prev);
				h(n) ? m() : g(n);
			}
		}
		function l(e) {
			return e.next == null ? !0 : y.pointToTheLeftOfLineOrOnLine(o, e.point, e.next.point);
		}
		function u(e) {
			return e.next == null ? !0 : y.pointToTheRightOfLineOrOnLine(o, e.point, e.next.point);
		}
		function d(e) {
			return y.pointToTheLeftOfLine(o, e.prev.point, e.point);
		}
		function f(e) {
			return y.pointToTheRightOfLine(o, e.prev.point, e.point);
		}
		function p() {
			let s = r;
			for (; !l(s);) s = s.next;
			if (!h(s)) {
				let n = r;
				for (; !n.point.equal(s.point); n = n.next) e.push(n.point);
				r.point = n.point, r.next = n.next, t = n.point, a.point.equal(r.point) && (a.prev = a.next = null);
			}
			n.point = t, i.point = o, i.prev = n, n.next = i;
		}
		function m() {
			let s = n;
			for (; !u(s);) s = s.next;
			if (!h(s)) {
				let r = n;
				for (; !r.point.equal(s.point); r = r.next) e.push(r.point);
				n.point = r.point, n.next = r.next, t = r.point, i.point.equal(n.point) && (i.prev = n.next = null);
			}
			r.point = t, a.point = o, a.prev = r, r.next = a;
		}
		function h(e) {
			return e.point == t;
		}
		function g(e) {
			e == a ? (a = {
				point: o,
				prev: e
			}, e.next = a) : (a.point = o, a.prev = e, e.next = a);
		}
		function _(e) {
			e == i ? (i = {
				point: o,
				prev: e
			}, e.next = i) : (i.point = o, i.prev = e, e.next = i);
		}
	}
	initDiagonals(e) {
		for (let t of e) {
			let e = t.edge, n = t.source.OppositeSite(e);
			y.getTriangleOrientation(n.point, e.lowerSite.point, e.upperSite.point) == _.Counterclockwise ? this.d.push({
				left: e.upperSite.point,
				right: e.lowerSite.point
			}) : this.d.push({
				right: e.upperSite.point,
				left: e.lowerSite.point
			});
		}
	}
	getSleeve(e) {
		let t = new i.Queue();
		t.enqueue(e);
		let n = /* @__PURE__ */ new Map();
		for (n.set(e, void 0); t.length > 0;) {
			let r = t.dequeue(), i = n.get(r);
			if (r.containsPoint(this.poly.end)) return this.recoverPath(e, n, r);
			for (let e of r.Edges) {
				if (e.constrained || i !== void 0 && e === i) continue;
				let a = e.GetOtherTriangle_T(r);
				a != null && (n.has(a) || (n.set(a, e), t.enqueue(a)));
			}
		}
	}
	recoverPath(e, t, n) {
		let r = [];
		for (let i = n; i != e && i !== e;) {
			let e = t.get(i);
			i = e.GetOtherTriangle_T(i), r.push({
				source: i,
				edge: e
			});
		}
		return r.reverse();
	}
	getPerimeterEdges() {
		let e = /* @__PURE__ */ new Set();
		for (let t of this.triangles) for (let n of t.Edges) this.triangles.has(n.GetOtherTriangle_T(t)) || e.add(n);
		return e;
	}
};
function hs(e) {
	return e.Sites.item0.Owner == null || e.Sites.item1.Owner == null || e.Sites.item2.Owner == null ? !0 : e.Sites.item0.Owner == e.Sites.item1.Owner && e.Sites.item0.Owner == e.Sites.item2.Owner;
}
//#endregion
//#region node_modules/@msagl/core/dist/routing/splineRouter.js
var gs = class e extends B {
	get ContinueOnOverlaps() {
		return this.continueOnOverlaps;
	}
	set ContinueOnOverlaps(e) {
		this.continueOnOverlaps = e;
	}
	get LoosePadding() {
		return this.loosePadding;
	}
	set LoosePadding(e) {
		this.loosePadding = e;
	}
	get MultiEdgesSeparation() {
		return this.multiEdgesSeparation;
	}
	set MultiEdgesSeparation(e) {
		this.multiEdgesSeparation = e;
	}
	static mk2(t, n) {
		return e.mk5(t, n.Padding, n.PolylinePadding, n.ConeAngle, n.bundlingSettings);
	}
	static mk4(t, n, r, i) {
		return new e(t, Array.from(t.deepEdges), n, r, i, null);
	}
	static mk5(t, n, r, i, a) {
		return new e(t, Array.from(t.deepEdges), n, r, i, a);
	}
	constructor(e, t, n = 1, r = 2, i = Math.PI / 180 * 30, a = null, o = null) {
		super(o), this.continueOnOverlaps = !0, this.shapesToTightLooseCouples = /* @__PURE__ */ new Map(), this.multiEdgesSeparation = .5, this.routeMultiEdgesAsBundles = !0, this.UsePolylineEndShortcutting = !0, this.UseInnerPolylingShortcutting = !0, this.AllowedShootingStraightLines = !0, this._overlapsDetected = !1, this.edges = t, this.BundlingSettings = a, this.geomGraph = e, this.LoosePadding = r, this.tightPadding = n, this.coneAngle = i, this.routeMultiEdgesAsBundles = t.length < 1e3 && e.deepNodeCount < 1e3;
	}
	static mk6(t, n, r, i, a, o) {
		let s = e.mk4(t, n, r, i), c = an.GetShapes(a, o);
		return s.Initialize(c, i), s;
	}
	Initialize(e, t) {
		this.rootShapes = e.filter((e) => e.Parents == null || e.Parents.length === 0), this.coneAngle = t, this.coneAngle === 0 && (this.coneAngle = Math.PI / 6);
	}
	run() {
		if (this.edges.length == 0 || this.geomGraph.isEmpty()) return;
		console.time("SplineRouter");
		let e = ir.GetShapes(this.geomGraph, this.edges);
		this.BundlingSettings == null && this.geomGraph.layoutSettings && this.geomGraph.layoutSettings.commonSettings.edgeRoutingSettings && this.geomGraph.layoutSettings.commonSettings.edgeRoutingSettings.bundlingSettings && (this.BundlingSettings = this.geomGraph.layoutSettings.commonSettings.edgeRoutingSettings.bundlingSettings), this.Initialize(e, this.coneAngle), this.GetOrCreateRoot(), this.RouteOnRoot(), this.RemoveRoot(), console.timeEnd("SplineRouter");
	}
	rerouteOnSubsetOfNodes(e) {
		this.RouteMultiEdgesAsBundles = !1, this.edges = Array.from(this.geomGraph.deepEdges).filter((t) => Ze(t.edge, e)), this.rootShapes = ir.GetShapes(this.geomGraph, this.edges).filter((e) => e.Parents == null || e.Parents.length === 0), this.GetOrCreateRoot(), this.CalculateShapeToBoundaries(this.root), this.calcLooseShapesToNodes(), this.CalculatePortsToShapes(), this.rerouteOnActiveNodes(e), this.RemoveRoot();
	}
	calcLooseShapesToNodes() {
		if (this.loosePolylinesToNodes = /* @__PURE__ */ new Map(), !this.OverlapsDetected) {
			for (let [e, t] of this.shapesToTightLooseCouples) this.loosePolylinesToNodes.set(t.LooseShape.BoundaryCurve, new Set([e.node.node]));
			return;
		}
		let e = Te(this.geomGraph.nodesBreadthFirst, (e) => e.boundingBox);
		un(this.GetLooseHierarchy(), e, (e, t) => {
			if (E.CurveIsInsideOther(t.boundaryCurve, e)) {
				let n = this.loosePolylinesToNodes.get(e);
				for (let n of t.getAncestors()) if (!(n instanceof mt && n.parent == null) && n.boundaryCurve != null && E.CurveIsInsideOther(n.boundaryCurve, e)) return;
				n ?? this.loosePolylinesToNodes.set(e, n = /* @__PURE__ */ new Set()), n.add(t.node);
			}
		});
	}
	RouteOnRoot() {
		bn(0), this.CalculatePortsToShapes(), this.CalculatePortsToEnterableShapes(), this.CalculateShapeToBoundaries(this.root), !(this.OverlapsDetected && !this.ContinueOnOverlaps) && (this.BindLooseShapes(), this.SetLoosePolylinesForAnywherePorts(), this.CalculateVisibilityGraph(), this.RouteOnVisGraph());
	}
	CalculatePortsToEnterableShapes() {
		this.portsToEnterableShapes = /* @__PURE__ */ new Map();
		for (let [t, n] of this.portsToShapes) {
			let r = /* @__PURE__ */ new Set();
			e.EdgesAttachedToPortAvoidTheNode(t) || r.add(n), this.portsToEnterableShapes.set(t, r);
		}
		for (let e of this.rootShapes) for (let t of e.Descendants()) for (let e of t.Ports) Fe(this.portsToEnterableShapes.get(e), Array.from(t.Ancestors()).filter((e) => e.BoundaryCurve != null));
	}
	static EdgesAttachedToPortAvoidTheNode(e) {
		return e instanceof tn || e instanceof en;
	}
	SetLoosePolylinesForAnywherePorts() {
		for (let [e, t] of this.shapesToTightLooseCouples) for (let n of e.Ports) {
			if (n instanceof $t) {
				let e = n;
				e.LoosePolyline = t.LooseShape.BoundaryCurve;
			}
			if (n instanceof en) {
				let e = n;
				e.LoosePolyline = t.LooseShape.BoundaryCurve;
			}
		}
	}
	BindLooseShapes() {
		this.looseRoot = new vt();
		for (let e of this.root.Children) {
			let t = this.shapesToTightLooseCouples.get(e).LooseShape;
			this.BindLooseShapesUnderShape(e), this.looseRoot.AddChild(t);
		}
	}
	BindLooseShapesUnderShape(e) {
		let t = this.shapesToTightLooseCouples.get(e).LooseShape;
		for (let n of e.Children) {
			let e = this.shapesToTightLooseCouples.get(n).LooseShape;
			t.AddChild(e), this.BindLooseShapesUnderShape(n);
		}
	}
	CalculateShapeToBoundaries(e) {
		if (this.ProgressStep(), e.Children.length !== 0) {
			for (let t of e.Children) this.CalculateShapeToBoundaries(t);
			this.obstacleCalculator = new In(e, this.tightPadding, Math.min(this.AdjustedLoosePadding, Infinity), this.shapesToTightLooseCouples), this.obstacleCalculator.Calculate(.01), this.OverlapsDetected ||= this.obstacleCalculator.OverlapsDetected;
		}
	}
	get OverlapsDetected() {
		return this._overlapsDetected;
	}
	set OverlapsDetected(e) {
		this._overlapsDetected = e;
	}
	get AdjustedLoosePadding() {
		return this.BundlingSettings == null ? this.LoosePadding : this.LoosePadding * ls.SuperLoosePaddingCoefficient;
	}
	GroupEdgesByPassport() {
		let e = [];
		for (let t of this.edges) {
			let n = this.EdgePassport(t), r = e.find((e) => Ie(e.passport, n));
			r || (r = {
				passport: n,
				edges: []
			}, e.push(r)), r.edges.push(t);
		}
		return e;
	}
	RouteOnVisGraph() {
		if (this.ancestorSets = e.GetAncestorSetsMap(Array.from(this.root.Descendants())), this.BundlingSettings == null) {
			let e = this.GroupEdgesByPassport();
			for (let t = 0; t < e.length; t++) {
				let n = e[t], r = n.passport, i = this.GetObstaclesFromPassport(r), a = this.CreateInteractiveEdgeRouter(Array.from(i));
				this.RouteEdgesWithTheSamePassport(n, a, i);
			}
		} else this.RouteBundles();
	}
	rerouteOnActiveNodes(t) {
		if (this.ancestorSets = e.GetAncestorSetsMap(Array.from(this.root.Descendants())), this.BundlingSettings == null) for (let e of this.GroupEdgesByPassport()) {
			let n = e.passport, r = this.GetObstaclesFromPassport(n), i = /* @__PURE__ */ new Set();
			for (let e of r) {
				let n = this.LooseShapeOfOriginalShape(e);
				for (let r of this.loosePolylinesToNodes.get(n.BoundaryCurve)) t.has(r) && i.add(e);
			}
			let a = this.CreateInteractiveEdgeRouter(Array.from(i));
			this.rerouteEdgesWithTheSamePassportActiveNodes(e, a, i, t);
		}
		else this.RouteBundles();
	}
	getDebugCurvesFromEdgesAndCdt(e) {
		let t = Array.from(this.geomGraph.deepEdges).map((e) => e.curve).filter((e) => e != null).filter((e) => e.count > 5).map((e) => q.mkDebugCurveTWCI(200, 1, "Red", e));
		for (let n of e.PointsToSites.values()) for (let e of n.Edges) t.push(q.mkDebugCurveTWCI(200, .5, e.constrained ? "Blue" : "Green", S.mkPP(e.lowerSite.point, e.upperSite.point)));
		return t;
	}
	RouteEdgesWithTheSamePassport(e, t, n) {
		let r = {
			regularEdges: [],
			multiEdges: []
		};
		try {
			let e = this.getCdtFromPassport(n);
			t.pathOptimizer.setCdt(e);
		} catch {
			t.pathOptimizer.setCdt(null);
		}
		if (this.RouteMultiEdgesAsBundles) {
			if (this.SplitOnRegularAndMultiedges(e.edges, r), r.regularEdges.length > 0) for (let e = 0; e < r.regularEdges.length; e++) this.routeEdge(t, r.regularEdges[e]);
			r.multiEdges != null && (this.ScaleDownLooseHierarchy(t, n), this.RouteMultiEdges(r.multiEdges, t, e.passport));
		} else for (let n = 0; n < e.edges.length; n++) this.routeEdge(t, e.edges[n]);
	}
	rerouteEdgesWithTheSamePassportActiveNodes(e, t, n, r) {
		let i = {
			regularEdges: [],
			multiEdges: []
		};
		try {
			let e = this.getCdtFromPassport(n);
			t.pathOptimizer.setCdt(e);
		} catch (e) {
			console.log(e), t.pathOptimizer.setCdt(null);
		}
		if (this.RouteMultiEdgesAsBundles) {
			if (this.SplitOnRegularAndMultiedges(e.edges, i), i.regularEdges.length > 0) for (let e = 0; e < i.regularEdges.length; e++) {
				let n = i.regularEdges[e];
				z.assert(Ze(n.edge, r)), this.rerouteEdge(t, n);
			}
			i.multiEdges != null && (this.ScaleDownLooseHierarchy(t, n), this.RouteMultiEdges(i.multiEdges, t, e.passport));
		} else for (let n = 0; n < e.edges.length; n++) {
			let i = e.edges[n];
			Ze(i.edge, r) && this.rerouteEdge(t, i);
		}
	}
	rerouteEdge(e, t) {
		try {
			e.rerouteEdge(t), Qn.trimSplineAndCalculateArrowheadsII(t, t.sourcePort.Curve, t.targetPort.Curve, t.curve, !1);
		} catch {
			console.log("failed");
		}
	}
	getCdtFromPassport(e) {
		let t = /* @__PURE__ */ new Set(), n = [], r = O.mkEmpty();
		for (let i of e) {
			let e = this.LoosePolyOfOriginalShape(i);
			if (e != null) {
				t.add(e);
				for (let e of i.Ports) n.push(e.Location);
				r.addRecSelf(e.boundingBox);
			}
		}
		r.pad(Math.max(r.diagonal / 4, 100));
		let i = Array.from(t);
		i.push(r.perimeter());
		let a = new fa(n, i, []);
		return a.run(), a;
	}
	get RouteMultiEdgesAsBundles() {
		return this.routeMultiEdgesAsBundles;
	}
	set RouteMultiEdgesAsBundles(e) {
		this.routeMultiEdgesAsBundles = e;
	}
	routeEdge(t, n) {
		let r = this.makeTransparentShapesOfEdgeAndGetTheShapes(n);
		this.ProgressStep(), this.RouteEdgeInternal(n, t), e.SetTransparency(r, !1);
	}
	ScaleDownLooseHierarchy(t, n) {
		let r = [];
		for (let e of n) {
			let t = this.shapesToTightLooseCouples.get(e);
			r.push(Nn.LoosePolylineWithFewCorners(t.TightPolyline, t.Distance / 1.1, 0));
		}
		t.LooseHierarchy = e.CreateLooseObstacleHierarachy(r), t.ClearActivePolygons(), t.AddActivePolygons(r.map((e) => new Mn(e)));
	}
	RouteMultiEdges(e, t, n) {
		let r = [];
		for (let e of n) for (let t of e.Children) r.push(t.BoundaryCurve);
		let i = new nn();
		i.InkImportance = 1e-5, i.EdgeSeparation = this.MultiEdgesSeparation, new ps(e, t, r, i, (e) => this.makeTransparentShapesOfEdgeAndGetTheShapes(e)).run();
	}
	SplitOnRegularAndMultiedges(t, n) {
		let r = new $n();
		for (let i of t) e.IsEdgeToParent(i) ? n.regularEdges.push(i) : e.RegisterInPortLocationsToEdges(i, r);
		n.multiEdges = null;
		for (let e of r.values()) e.length === 1 || this.OverlapsDetected ? Me(n.regularEdges, e) : (n.multiEdges ??= [], n.multiEdges.push(e));
	}
	static RegisterInPortLocationsToEdges(e, t) {
		let n, r = new L(e.sourcePort.Location, e.targetPort.Location);
		n = t.get(r), n || (n = [], t.set(r, n)), n.push(e);
	}
	static IsEdgeToParent(e) {
		return e.sourcePort instanceof $t || e.targetPort instanceof $t;
	}
	CreateInteractiveEdgeRouter(t) {
		let n = new Set(t.map((e) => this.shapesToTightLooseCouples.get(e).LooseShape.BoundaryCurve)), r = new Zn(this.cancelToken);
		return r.pathOptimizer = new ms(), r.ObstacleCalculator = new Nn(t.map((e) => e.BoundaryCurve), this.tightPadding, this.loosePadding, !1), r.VisibilityGraph = this.visGraph, r.TightHierarchy = this.CreateTightObstacleHierarachy(t), r.LooseHierarchy = e.CreateLooseObstacleHierarachy(Array.from(n)), r.UseSpanner = !0, r.LookForRoundedVertices = !0, r.TightPadding = this.tightPadding, r.LoosePadding = this.LoosePadding, r.UseEdgeLengthMultiplier = this.UseEdgeLengthMultiplier, r.UsePolylineEndShortcutting = this.UsePolylineEndShortcutting, r.UseInnerPolylingShortcutting = this.UseInnerPolylingShortcutting, r.AllowedShootingStraightLines = this.AllowedShootingStraightLines, r.AddActivePolygons(Array.from(n).map((e) => new Mn(e))), r;
	}
	GetObstaclesFromPassport(e) {
		if (e.size === 0) return new Set(this.root.Children);
		let t = this.GetCommonAncestorsAbovePassport(e), n = this.GetAllAncestors(e), r = /* @__PURE__ */ new Set();
		for (let t of e) for (let e of t.Children) n.has(e) || r.add(e);
		let a = je(new Set(e), r), o = new i.Queue();
		for (let n of e) t.has(n) || o.enqueue(n);
		for (; o.length > 0;) {
			let e = o.dequeue();
			for (let i of e.Parents) {
				for (let e of i.Children) n.has(e) || r.add(e);
				!t.has(i) && !a.has(i) && (o.enqueue(i), a.add(i));
			}
		}
		return r;
	}
	GetAllAncestors(e) {
		if (e.size === 0) return /* @__PURE__ */ new Set();
		let t = new Set(e);
		for (let n of e) t = je(t, this.ancestorSets.get(n));
		return t;
	}
	GetCommonAncestorsAbovePassport(e) {
		if (e.size === 0) return /* @__PURE__ */ new Set();
		let t = Array.from(e), n = this.ancestorSets.get(t[0]);
		for (let e = 1; e < t.length; e++) {
			let r = t[e];
			n = Ne(n, this.ancestorSets.get(r));
		}
		return n;
	}
	RouteBundles() {
		this.ScaleLooseShapesDown(), this.CalculateEdgeEnterablePolylines();
		let e = this.GetLooseHierarchy(), t = pa(e), n = new fs((e) => this.makeTransparentShapesOfEdgeAndGetTheShapes(e), t, this.FindCdtGates(t));
		new ls(this.edges, n, this.visGraph, this.BundlingSettings, this.LoosePadding, this.GetTightHierarchy(), e, this.enterableLoose, this.enterableTight, (e) => this.LoosePolyOfOriginalShape(this.portsToShapes.get(e))).run();
	}
	CreateTheMapToParentLooseShapes(e, t) {
		for (let n of e.Children) {
			let r = this.shapesToTightLooseCouples.get(n).LooseShape.BoundaryCurve;
			t.set(r, e), this.CreateTheMapToParentLooseShapes(n, t);
		}
	}
	FindCdtGates(e) {
		let t = /* @__PURE__ */ new Map();
		this.CreateTheMapToParentLooseShapes(this.root, t);
		let n = /* @__PURE__ */ new Set();
		for (let r of e.PointsToSites.values()) for (let e of r.Edges) {
			if (e.CwTriangle == null && e.CcwTriangle == null) continue;
			let i = r.Owner, a = e.lowerSite.Owner;
			if (i === a) continue;
			let o = t.get(i);
			o && o === t.get(a) && n.add(e);
		}
		return n;
	}
	CalculateEdgeEnterablePolylines() {
		this.enterableLoose = /* @__PURE__ */ new Map(), this.enterableTight = /* @__PURE__ */ new Map();
		for (let e of this.edges) {
			let t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set();
			this.GetEdgeEnterablePolylines(e, t, n), this.enterableLoose.set(e, t), this.enterableTight.set(e, n);
		}
	}
	GetEdgeEnterablePolylines(e, t, n) {
		let r = this.portsToShapes.get(e.sourcePort), i = this.portsToShapes.get(e.targetPort);
		r !== this.root && this.GetEnterablesForShape(r, t, n), i !== this.root && this.GetEnterablesForShape(i, t, n);
	}
	GetEnterablesForShape(e, t, n) {
		for (let r of this.ancestorSets.get(e)) {
			let e = this.LoosePolyOfOriginalShape(r);
			e && t.add(e);
			let i = this.TightPolyOfOriginalShape(r);
			i && n.add(i);
		}
	}
	GetTightHierarchy() {
		return F(Array.from(this.shapesToTightLooseCouples.values()).map((e) => I(e.TightPolyline, e.TightPolyline.boundingBox)));
	}
	GetLooseHierarchy() {
		let e = /* @__PURE__ */ new Set();
		for (let t of this.shapesToTightLooseCouples.values()) e.add(t.LooseShape.BoundaryCurve);
		return F(Array.from(e).map((e) => I(e, e.boundingBox)));
	}
	ScaleLooseShapesDown() {
		for (let [, e] of this.shapesToTightLooseCouples) e.LooseShape.BoundaryCurve = Nn.LoosePolylineWithFewCorners(e.TightPolyline, e.Distance / ls.SuperLoosePaddingCoefficient, 0);
	}
	EdgePassport(e) {
		let t = /* @__PURE__ */ new Set(), n = this.portsToShapes.get(e.sourcePort), r = this.portsToShapes.get(e.targetPort);
		return this.IsAncestor(n, r) ? (Fe(t, r.Parents), t.add(n), t) : this.IsAncestor(r, n) ? (Fe(t, n.Parents), t.add(r), t) : (n !== this.looseRoot && Fe(t, n.Parents), r !== this.looseRoot && Fe(t, r.Parents), t);
	}
	*AllPorts() {
		for (let e of this.edges) yield e.sourcePort, yield e.targetPort;
	}
	CalculatePortsToShapes() {
		this.portsToShapes = /* @__PURE__ */ new Map();
		for (let e of this.root.Descendants()) for (let t of e.Ports) this.portsToShapes.set(t, e);
		for (let e of this.AllPorts()) this.portsToShapes.has(e) || (this.root.Ports.add(e), this.portsToShapes.set(e, this.root));
	}
	RouteEdgeInternal(e, t) {
		let n = [];
		e.sourcePort instanceof $t || Me(n, this.AddVisibilityEdgesFromPort(e.sourcePort)), e.targetPort instanceof $t || Me(n, this.AddVisibilityEdgesFromPort(e.targetPort));
		let r = { smoothedPolyline: null };
		if (y.closeDistEps(e.sourcePort.Location, e.targetPort.Location) ? e.curve = be.RouteSelfEdge(e.sourcePort.Curve, Math.max(this.LoosePadding * 2, e.GetMaxArrowheadLength()), r) : e.curve = t.RouteSplineFromPortToPortWhenTheWholeGraphIsReady(e.sourcePort, e.targetPort, !0, r), e.smoothedPolyline = null, e.curve == null) throw Error();
		for (let e of n) W.RemoveEdge(e);
		Qn.trimSplineAndCalculateArrowheadsII(e, e.sourcePort.Curve, e.targetPort.Curve, e.curve, !1);
	}
	*AddVisibilityEdgesFromPort(e) {
		let t, n;
		if (e instanceof tn || !(t = this.portsToShapes.get(e)) || !(n = this.shapesToTightLooseCouples.get(t))) return;
		let r = n.LooseShape;
		for (let t of r.BoundaryCurve) this.visGraph.FindEdgePP(e.Location, t) ?? (yield this.visGraph.AddEdgePP(e.Location, t));
	}
	makeTransparentShapesOfEdgeAndGetTheShapes(t) {
		let n = this.portsToShapes.get(t.sourcePort), r = this.portsToShapes.get(t.targetPort), i = [];
		for (let e of this.GetTransparentShapes(t.sourcePort, t.targetPort, n, r)) e != null && i.push(this.LooseShapeOfOriginalShape(e));
		for (let e of this.portsToEnterableShapes.get(t.sourcePort)) i.push(this.LooseShapeOfOriginalShape(e));
		for (let e of this.portsToEnterableShapes.get(t.targetPort)) i.push(this.LooseShapeOfOriginalShape(e));
		return e.SetTransparency(i, !0), i;
	}
	LooseShapeOfOriginalShape(e) {
		return e === this.root ? this.looseRoot : this.shapesToTightLooseCouples.get(e).LooseShape;
	}
	LoosePolyOfOriginalShape(e) {
		return this.LooseShapeOfOriginalShape(e).BoundaryCurve;
	}
	TightPolyOfOriginalShape(e) {
		return e === this.root ? null : this.shapesToTightLooseCouples.get(e).TightPolyline;
	}
	*GetTransparentShapes(t, n, r, i) {
		for (let e of this.ancestorSets.get(r)) yield e;
		for (let e of this.ancestorSets.get(i)) yield e;
		e.EdgesAttachedToPortAvoidTheNode(t) || (yield r), e.EdgesAttachedToPortAvoidTheNode(n) || (yield i);
	}
	static SetTransparency(e, t) {
		for (let n of e) n.IsTransparent = t;
	}
	IsAncestor(e, t) {
		let n;
		return t != null && (n = this.ancestorSets.get(t)) != null && n.has(e);
	}
	static CreateLooseObstacleHierarachy(e) {
		return F(e.map((e) => I(e, e.boundingBox)));
	}
	CreateTightObstacleHierarachy(e) {
		return F(e.map((e) => this.shapesToTightLooseCouples.get(e).TightPolyline).map((e) => I(e, e.boundingBox)));
	}
	CalculateVisibilityGraph() {
		let e = this.LineSweeperPorts == null ? new R() : R.mk(this.LineSweeperPorts);
		this.ProcessHookAnyWherePorts(e), this.portRTree = it(Array.from(e.values()).map((e) => [O.rectangleOnPoint(e), e])), this.visGraph = new W(), this.FillVisibilityGraphUnderShape(this.root);
	}
	ProcessHookAnyWherePorts(e) {
		for (let t of this.edges) t.sourcePort instanceof $t || t.sourcePort instanceof en || e.add(t.sourcePort.Location), t.targetPort instanceof $t || t.targetPort instanceof en || e.add(t.targetPort.Location);
	}
	FillVisibilityGraphUnderShape(e) {
		let t = e.Children;
		for (let e = 0; e < t.length; e++) {
			let n = t[e];
			this.FillVisibilityGraphUnderShape(n);
		}
		let n = this.shapesToTightLooseCouples.get(e), r = n ? n.LooseShape.BoundaryCurve : null, i = n ? n.LooseShape : this.looseRoot, a = new Set(i.Children.map((e) => e.BoundaryCurve)), o = this.RemoveInsidePortsAndSplitBoundaryIfNeeded(r), s = new W(), c = Qt.mk([], s, this.coneAngle, o, r);
		c.run(), s = new W(), c = Qt.mk(Array.from(a), s, this.coneAngle, o, r), c.run(), this.ProgressStep();
		for (let e of s.Edges) this.TryToCreateNewEdgeAndSetIsPassable(e, i);
		this.AddBoundaryEdgesToVisGraph(r);
	}
	TryToCreateNewEdgeAndSetIsPassable(e, t) {
		let n = this.visGraph.FindEdgePP(e.SourcePoint, e.TargetPoint);
		n ?? (n = this.visGraph.AddEdgePP(e.SourcePoint, e.TargetPoint), t != null && (n.IsPassable = () => t.IsTransparent));
	}
	AddBoundaryEdgesToVisGraph(e) {
		if (e == null) return;
		let t;
		for (let n = e.startPoint; t = n.nextOnPolyline, this.visGraph.AddEdgePP(n.point, t.point), t !== e.startPoint; n = t);
	}
	RemoveInsidePortsAndSplitBoundaryIfNeeded(t) {
		let n = new R();
		if (t == null) {
			for (let e of this.portRTree.GetAllLeaves()) n.add(e);
			return this.portRTree.clear(), n;
		}
		let r = t.boundingBox, i = this.portRTree.GetAllIntersecting(r);
		for (let r of i) switch (E.PointRelativeToCurveLocation(r, t)) {
			case T.Inside:
				n.add(r), this.portRTree.Remove(O.rectangleOnPoint(r), r);
				break;
			case T.Boundary:
				this.portRTree.Remove(O.rectangleOnPoint(r), r);
				let i = e.FindPointOnPolylineToInsertAfter(t, r);
				if (i != null) Zt.InsertPointIntoPolylineAfter(t, i, r);
				else throw Error();
				break;
		}
		return n;
	}
	static FindPointOnPolylineToInsertAfter(e, t) {
		for (let n = e.startPoint;;) {
			let r = n.nextOnPolyline;
			if (y.closeDistEps(t, n.point) || y.closeDistEps(t, r.point)) return null;
			let i = y.distToLineSegment(t, n.point, r.point).dist;
			if (m(i, 0)) return n;
			if (n = r, n === e.startPoint) throw Error();
		}
	}
	GetOrCreateRoot() {
		if (this.rootShapes.length === 1) {
			let e = this.rootShapes[0];
			if (e.BoundaryCurve == null) {
				this.root = e;
				return;
			}
		}
		this.rootWasCreated = !0, this.root = new vt(null);
		for (let e of this.rootShapes) this.root.AddChild(e);
	}
	RemoveRoot() {
		if (this.rootWasCreated) {
			for (let e of this.rootShapes) e.RemoveParent(this.root);
			this.root = null, this.rootWasCreated = !1;
		}
	}
	static GetAncestorSetsMap(t) {
		let n = /* @__PURE__ */ new Map();
		for (let r of t.filter((e) => !n.has(e))) n.set(r, e.GetAncestorSet(r, n));
		return n;
	}
	static GetAncestorSet(t, n) {
		let r = new Set(t.Parents);
		for (let i of t.Parents) {
			let t = n.get(i);
			t || n.set(i, t = e.GetAncestorSet(i, n));
			for (let e of t) r.add(e);
		}
		return r;
	}
	static CreatePortsIfNeeded(e) {
		for (let t of e) {
			if (t.sourcePort == null) {
				let e = t;
				new xt(() => e.source.boundaryCurve, () => e.source.center, new y(0, 0));
			}
			if (t.targetPort == null) {
				let e = t;
				new xt(() => e.target.boundaryCurve, () => e.target.center, new y(0, 0));
			}
		}
	}
};
function _s(e, t, n) {
	let r = So(e);
	new gs(e, t, r.Padding, r.PolylinePadding, r.coneAngle, r.bundlingSettings, n).run();
}
//#endregion
//#region node_modules/@msagl/core/dist/layout/core/tileMap.js
var vs = class {
	getTileData(e, t, n) {
		let r = this.levels[n];
		return r ? r.get(e, t) : null;
	}
	*getTilesOfLevel(e) {
		let t = this.levels[e];
		if (t != null) for (let [e, n] of t.keyValues()) yield {
			x: e.x,
			y: e.y,
			data: n
		};
	}
	constructor(e, t) {
		this.numberOfNodesOnLevel = [], this.nodeScales = [], this.tileCapacity = 5e3, this.levels = [], this.nodeIndexInSortedNodes = /* @__PURE__ */ new Map(), this.geomGraph = e, this.topLevelTileRect = t, this.tileSizes = [], this.tileSizes.push(t.size);
	}
	getMinTileSize() {
		let e = 0, t = 0, n = 0;
		for (let r of this.geomGraph.nodesBreadthFirst) r instanceof mt || (n == 0 ? (e = r.width, t = r.height) : (e = (n * e + r.width) / (n + 1), t = (n * t + r.height) / (n + 1)), n++);
		return new me(e * 10, t * 10);
	}
	fillTheLowestLayer() {
		let e = new gt(), t = new _t(this.topLevelTileRect), n = t.arrowheads, r = t.labels;
		for (let e of this.geomGraph.graph.deepEdges) i(e);
		t.nodes = Array.from(this.geomGraph.nodesBreadthFirst), e.set(0, 0, t), this.levels.push(e);
		function i(e) {
			let i = be.getGeom(e), a = be.getGeom(e).curve;
			if (a instanceof E) for (let n of a.segs) t.addElement({
				edge: e,
				curve: n,
				startPar: n.parStart,
				endPar: n.parEnd
			});
			else t.addElement({
				edge: e,
				curve: a,
				startPar: a.parStart,
				endPar: a.parEnd
			});
			i.sourceArrowhead && n.push({
				edge: i.edge,
				tip: i.sourceArrowhead.tipPosition,
				base: i.curve.start
			}), i.targetArrowhead && n.push({
				edge: i.edge,
				tip: i.targetArrowhead.tipPosition,
				base: i.curve.end
			}), i.label && r.push(i.label);
		}
	}
	buildUpToLevel(e) {
		if (this.fillTheLowestLayer(), this.minTileSize = this.getMinTileSize(), this.pageRank = Xe(this.geomGraph.graph, .85), !this.needToSubdivide()) return 1;
		for (let t = 1; t <= e && !this.subdivideLevel(t); t++);
		this.sortedNodes = Array.from(this.pageRank.keys()).sort(this.compareByPagerank.bind(this));
		for (let e = 0; e < this.sortedNodes.length; e++) this.nodeIndexInSortedNodes.set(this.sortedNodes[e], e);
		for (let e = 0; e < this.levels.length - 1; e++) this.numberOfNodesOnLevel.push(this.filterOutEntities(this.levels[e], e));
		this.numberOfNodesOnLevel.push(this.sortedNodes.length);
		let t = new gs(this.geomGraph, []);
		for (let e = this.levels.length - 2; e >= 0; e--) {
			let n = this.setOfNodesOnTheLevel(e);
			t.rerouteOnSubsetOfNodes(n), this.regenerateCurveClipsUpToLevel(e, n);
		}
		return this.calculateNodeRank(), this.levels.length;
	}
	keepInsideGraphBoundingBox(e) {
		let t = this.geomGraph.boundingBox, n = e.width / 2, r = e.height / 2;
		return Math.min((e.center.x - t.left) / n, (t.top - e.center.y) / r, (t.right - e.center.x) / n, (e.center.y - t.bottom) / r);
	}
	diminishScaleToAvoidTree(e, t, n) {
		z.assert(t.intersects(n));
		let r, i = n.center.x, a = n.center.y, o = n.height / 2, s = n.width / 2;
		if (i < t.left) r = (t.left - i) / o;
		else if (i > t.right) r = (i - t.right) / o;
		else return 1;
		let c;
		if (a < t.bottom) c = (t.bottom - a) / s;
		else if (a > t.top) c = (a - t.top) / s;
		else return r;
		return Math.min(r, c);
	}
	needToSubdivide() {
		let e = !1;
		for (let t of this.levels[0].values()) if (t.entityCount > this.tileCapacity) {
			e = !0;
			break;
		}
		return e;
	}
	setOfNodesOnTheLevel(e) {
		let t = /* @__PURE__ */ new Set();
		for (let n of this.levels[e].values()) for (let e of n.nodes) t.add(e.node);
		return t;
	}
	regenerateCurveClipsUpToLevel(e, t) {
		this.clearCurveClipsInLevelsUpTo(e);
		for (let n of this.levels[0].values()) this.regenerateCurveClipsUnderTileUpToLevel(n, e, t);
	}
	clearCurveClipsInLevelsUpTo(e) {
		for (let t = 0; t <= e; t++) for (let e of this.levels[t].values()) e.initCurveClips();
	}
	regenerateCurveClipsUnderTileUpToLevel(e, t, n) {
		e.arrowheads = [], e.initCurveClips();
		for (let t of this.geomGraph.deepEdges) if (Ze(t.edge, n)) {
			if (t.curve instanceof E) for (let n of t.curve.segs) e.addElement({
				edge: t.edge,
				curve: n,
				startPar: n.parStart,
				endPar: n.parEnd
			});
			else e.addElement({
				edge: t.edge,
				curve: t.curve,
				startPar: t.curve.parStart,
				endPar: t.curve.parEnd
			});
			t.sourceArrowhead && e.arrowheads.push({
				edge: t.edge,
				tip: t.sourceArrowhead.tipPosition,
				base: t.curve.start
			}), t.targetArrowhead && e.arrowheads.push({
				edge: t.edge,
				tip: t.targetArrowhead.tipPosition,
				base: t.curve.end
			});
		}
		for (let e = 1; e <= t; e++) this.regenerateCurveClipsWhenPreviosLayerIsDone(e), this.removeEmptyTiles(e);
	}
	removeEmptyTiles(e) {
		let t = this.levels[e], n = [];
		for (let [e, r] of t.keyValues()) r.isEmpty() && n.push(e);
		for (let e of n) t.delete(e.x, e.y);
	}
	regenerateCurveClipsWhenPreviosLayerIsDone(e) {
		for (let [t, n] of this.levels[e - 1].keyValues()) this.subdivideTile(t, e, n, !0);
	}
	calculateNodeRank() {
		this.nodeRank = /* @__PURE__ */ new Map();
		let e = this.sortedNodes.length, t = Math.log10(e);
		for (let n = 0; n < e; n++) this.nodeRank.set(this.sortedNodes[n], t - Math.log10(n + 1));
	}
	compareByPagerank(e, t) {
		return this.pageRank.get(t) - this.pageRank.get(e);
	}
	filterOutEntities(e, t) {
		let n = this.transferDataOfLevelToMap(e), r = 0;
		for (; r < this.sortedNodes.length; r++) {
			let t = this.sortedNodes[r];
			if (!this.addNodeToLevel(e, t, n)) break;
		}
		return this.removeEmptyTiles(t), r;
	}
	addNodeToLevel(e, t, n) {
		let r = n.get(t);
		for (let e of r) if (e.tile.entityCount >= this.tileCapacity) return !1;
		for (let e of r) {
			let t = e.tile, n = e.data;
			t.addElement(n);
		}
		for (let e of t.selfEdges) {
			let t = n.get(e);
			for (let e of t) {
				let t = e.tile, n = e.data;
				t.addElement(n);
			}
			if (e.label) for (let t of n.get(e.label)) {
				let e = t.tile, n = t.data;
				e.addElement(n);
			}
		}
		let i = this.nodeIndexInSortedNodes.get(t);
		for (let e of t.inEdges) {
			let t = e.source;
			if (!(this.nodeIndexInSortedNodes.get(t) > i)) {
				for (let t of n.get(e)) {
					let e = t.tile, n = t.data;
					e.addElement(n);
				}
				if (e.label) for (let t of n.get(e.label)) {
					let e = t.tile, n = t.data;
					e.addElement(n);
				}
			}
		}
		for (let e of t.outEdges) {
			let t = e.target;
			if (!(this.nodeIndexInSortedNodes.get(t) > i)) {
				for (let t of n.get(e)) {
					let e = t.tile, n = t.data;
					e.addElement(n);
				}
				if (e.label && n.get(e.label)) for (let t of n.get(e.label)) {
					let e = t.tile, n = t.data;
					e.addElement(n);
				}
			}
		}
		return !0;
	}
	transferDataOfLevelToMap(e) {
		let t = /* @__PURE__ */ new Map();
		for (let t of e.values()) {
			for (let e of t.curveClips) {
				let r = e.edge;
				n(r).push({
					tile: t,
					data: e
				});
			}
			for (let e of t.labels) {
				let r = e.parent.edge;
				n(r).push({
					tile: t,
					data: e
				});
			}
			for (let e of t.nodes) {
				let r = e.node;
				n(r).push({
					tile: t,
					data: e
				});
			}
			for (let e of t.arrowheads) {
				let r = e.edge;
				n(r).push({
					tile: t,
					data: e
				});
			}
			t.clear();
		}
		return t;
		function n(e) {
			let n = t.get(e);
			return n || t.set(e, n = []), n;
		}
	}
	subdivideLevel(e) {
		if (console.log("subdivideLevel", e), this.levels[e] = new gt(), this.subdivideTilesOnLevel(e)) return console.log("done subdividing at level", e, "because each tile contains less than", this.tileCapacity), !0;
		let { w: t, h: n } = this.getWHOnLevel(e);
		return t <= this.minTileSize.width && n <= this.minTileSize.height ? (console.log("done subdividing at level", e, " because of tile size = ", t, n, "is less than ", this.minTileSize), !0) : !1;
	}
	countClips(e) {
		let t = 0;
		for (let n of this.levels[e].values()) t += n.curveClips.length;
		return t;
	}
	getWHOnLevel(e) {
		for (let t = this.tileSizes.length; t <= e; t++) {
			let e = this.tileSizes[t - 1];
			this.tileSizes.push(new me(e.width / 2, e.height / 2));
		}
		return {
			w: this.tileSizes[e].width,
			h: this.tileSizes[e].height
		};
	}
	subdivideTilesOnLevel(e) {
		let t = !0;
		for (let [n, r] of this.levels[e - 1].keyValues()) {
			let i = this.subdivideTile(n, e, r, !1);
			t &&= i.allSmall;
		}
		return this.removeEmptyTiles(e), console.log("generated", this.levels[e].size, "tiles"), t;
	}
	subdivideTile(e, t, n, r) {
		let { w: i, h: a } = this.getWHOnLevel(t), o = this.levels[t], s = e.x, c = e.y, l = this.topLevelTileRect.left + s * i * 2, u = this.topLevelTileRect.bottom + c * a * 2, d = [
			,
			,
			,
			,
		];
		for (let e = 0; e < 2; e++) for (let t = 0; t < 2; t++) d[e * 2 + t] = new V(s * 2 + e, c * 2 + t);
		r || this.generateSubtilesWithoutTileClips(l, i, u, a, d, n, t);
		let f = new S(l, u + a, l + 2 * i, u + a), p = new S(l + i, u, l + i, u + 2 * a);
		g();
		let m = 0, h = !0;
		for (let e of d) {
			let t = o.get(e.x, e.y);
			t != null && (m++, t.entityCount > this.tileCapacity && (h = !1));
		}
		return {
			count: m,
			allSmall: h
		};
		function g() {
			for (let e of n.curveClips) {
				let t = e.curve, n = _(t, e.startPar, e.endPar);
				if (z.assert(n.length >= 2), n.length == 2) {
					let r = (n[0] + n[1]) / 2, s = t.value(r), c = s.x <= l + i ? 0 : 1, f = s.y <= u + a ? 0 : 1, p = d[2 * c + f], m = o.getI(p);
					if (!m) {
						let e = l + c * i, t = u + f * a;
						m = new _t(new O({
							left: e,
							bottom: t,
							top: t + a,
							right: e + i
						})), o.setPair(p, m);
					}
					m.addCurveClip({
						curve: t,
						edge: e.edge,
						startPar: n[0],
						endPar: n[1]
					});
				} else for (let r = 0; r < n.length - 1; r++) {
					let s = (n[r] + n[r + 1]) / 2, c = t.value(s), f = c.x <= l + i ? 0 : 1, p = c.y <= u + a ? 0 : 1, m = d[2 * f + p], h = o.getI(m);
					if (!h) {
						let e = l + f * i, t = u + p * a;
						h = new _t(new O({
							left: e,
							bottom: t,
							top: t + a,
							right: e + i
						})), o.setPair(m, h);
					}
					h.addCurveClip({
						curve: t,
						edge: e.edge,
						startPar: n[r],
						endPar: n[r + 1]
					});
				}
			}
		}
		function _(e, t, n) {
			let r = Array.from(E.getAllIntersections(e, f, !0)).concat(Array.from(E.getAllIntersections(e, p, !0))).map((e) => e.par0);
			return r.sort((e, t) => e - t), [t].concat(r.filter((e) => e >= t && e <= n), n);
		}
	}
	addSubtilesToLevel(e, t, n, r, i) {
		for (let a = 0; a < 2; a++) for (let o = 0; o < 2; o++) {
			let s = e[a * 2 + o];
			s.isEmpty() || (t.set(2 * n + a, 2 * r + o, s), i && s.entityCount > this.tileCapacity && (i = !1));
		}
		return i;
	}
	generateSubtilesWithoutTileClips(e, t, n, r, i, a, o) {
		let s = 0;
		for (let c = 0; c < 2; c++) for (let l = 0; l < 2; l++) {
			let u = new O({
				left: e + t * c,
				right: e + t * (c + 1),
				bottom: n + r * l,
				top: n + r * (l + 1)
			}), d = this.generateOneSubtileExceptEdgeClips(a, u);
			d && this.levels[o].set(i[s].x, i[s].y, d), s++;
		}
	}
	innerClips(e, t, n) {
		let r = [], i = Array.from(E.getAllIntersections(e, n, !0)).concat(Array.from(E.getAllIntersections(e, t, !0)));
		i.sort((e, t) => e.par0 - t.par0);
		let a = [e.parStart];
		for (let e = 0; e < i.length; e++) {
			let t = i[e];
			t.par0 > a[a.length - 1] + u.distanceEpsilon && a.push(t.par0);
		}
		if (e.parEnd > a[a.length - 1] + u.distanceEpsilon && a.push(e.parEnd), a.length <= 2) return r.push(e), r;
		for (let t = 0; t < a.length - 1; t++) r.push(e.trim(a[t], a[t + 1]));
		return r;
	}
	generateOneSubtileExceptEdgeClips(e, t) {
		let n = new _t(t);
		for (let r of e.nodes) r.boundingBox.intersects(t) && n.nodes.push(r);
		for (let r of e.labels) r.boundingBox.intersects(t) && n.labels.push(r);
		for (let r of e.arrowheads) {
			let e = O.mkPP(r.base, r.tip), i = r.tip.sub(r.base).div(3).rotate90Cw();
			e.add(r.base.add(i)), e.add(r.base.sub(i)), e.intersects(t) && n.arrowheads.push(r);
		}
		return n.isEmpty() ? null : n;
	}
}, ys = class extends On {
	constructor(e, t) {
		super(), this.SetEdges(e, t);
	}
}, bs = class {
	*RegularMultiedges() {
		for (let [e, t] of this.Multiedges.keyValues()) e.x !== e.y && (yield t);
	}
	*AllIntEdges() {
		for (let e of this.Multiedges.values()) for (let t of e) yield t;
	}
	addFeedbackSet(e) {
		for (let t of e) {
			let e = new V(t.source, t.target), n = new V(t.target, t.source), r = this.Multiedges.get(e.x, e.y);
			for (let e of r) e.reverse();
			if (this.Multiedges.has(n.x, n.y)) {
				let e = this.Multiedges.get(n.x, n.y);
				for (let t of r) e.push(t);
			} else this.Multiedges.set(n.x, n.y, r);
			this.Multiedges.delete(e.x, e.y);
		}
	}
	constructor(e) {
		this.MultipleMiddles = /* @__PURE__ */ new Set(), this.Multiedges = new gt();
	}
	registerOriginalEdgeInMultiedges(e) {
		let t = this.Multiedges.get(e.source, e.target);
		t ?? this.Multiedges.set(e.source, e.target, t = []), t.push(e);
	}
	*SkeletonEdges() {
		for (let [e, t] of this.Multiedges.keyValues()) e.x !== e.y && (yield t[0]);
	}
	GetMultiedge(e, t) {
		return this.GetMultiedgeI(new V(e, t));
	}
	GetMultiedgeI(e) {
		return this.Multiedges.has(e.x, e.y) ? this.Multiedges.get(e.x, e.y) : [];
	}
};
//#endregion
//#region node_modules/@msagl/core/dist/utils/copy.js
function xs(e, t) {
	for (let n = 0; n < e.length; n++) t[n] = e[n];
}
//#endregion
//#region node_modules/@msagl/core/dist/layout/layered/LayerArrays.js
var Ss = class e {
	constructor(e) {
		this.initialize(e);
	}
	initialize(e) {
		this.y = e, this.verticesToX = null, this.layers = null;
	}
	DropEmptyLayers() {
		let t = Array(this.Layers.length), n = 0;
		for (let e = 0; e < this.Layers.length; e++) t[e] = n, this.Layers[e].length === 0 && n++;
		if (n === 0) return this;
		let r = Array(this.y.length);
		for (let e = 0; e < r.length; e++) r[e] = this.y[e] - t[this.y[e]];
		let i = Array(this.layers.length - n);
		for (let e = 0; e < this.layers.length; e++) this.layers[e].length > 0 && (i[e - t[e]] = Array.from(this.layers[e]));
		let a = new e(r);
		return a.layers = i, a;
	}
	updateLayers(e) {
		this.layers ?? this.InitLayers();
		for (let t = 0; t < this.layers.length; t++) xs(e[t], this.layers[t]);
		this.UpdateXFromLayers();
	}
	UpdateXFromLayers() {
		this.layers ?? this.InitLayers(), this.verticesToX ??= Array(this.y.length);
		for (let e of this.layers) {
			let t = 0;
			for (let n of e) this.verticesToX[n] = t++;
		}
	}
	get x() {
		return this.verticesToX == null ? (this.verticesToX = Array(this.y.length), this.UpdateXFromLayers(), this.verticesToX) : this.verticesToX;
	}
	ReversedClone() {
		let t = Array(this.y.length), n = this.Layers.length - 1;
		for (let e = 0; e < this.y.length; e++) t[e] = n - this.y[e];
		return new e(t);
	}
	get Layers() {
		return this.layers ?? this.InitLayers(), this.layers;
	}
	set Layers(e) {
		this.layers = e;
	}
	InitLayers() {
		let e = 0;
		for (let t of this.y) t + 1 > e && (e = t + 1);
		let t = Array(e).fill(0);
		for (let e of this.y) t[e]++;
		this.layers = Array(e);
		for (let n = 0; n < e; n++) this.layers[n] = Array(t[n]), t[n] = 0;
		for (let e = 0; e < this.y.length; e++) {
			let n = this.y[e];
			this.layers[n][t[n]++] = e;
		}
	}
}, Cs = class e extends B {
	static Balance(t, n, r, i) {
		new e(t, n, r, i).run();
	}
	constructor(e, t, n, r) {
		super(r), this.jumpers = /* @__PURE__ */ new Set(), this.possibleJumperFeasibleIntervals = /* @__PURE__ */ new Map(), this.nodeCount = n, this.dag = e, this.layering = t, this.Init();
	}
	run() {
		for (; this.jumpers.size > 0;) this.Jump(this.ChooseJumper());
	}
	Init() {
		this.CalculateLayerCounts(), this.InitJumpers();
	}
	Jump(e) {
		this.jumpers.delete(e);
		let t = this.possibleJumperFeasibleIntervals.get(e), n = this.CalcJumpInfo(t.x, t.y, e);
		if (n == null) return;
		this.layering[e] = n.layerToJumpTo;
		let r = this.nodeCount[e];
		this.vertsCounts[n.jumperLayer] -= r, this.vertsCounts[n.layerToJumpTo] += r, this.UpdateRegionsForPossibleJumpersAndInsertJumpers(n.jumperLayer, e);
	}
	IsJumper(e) {
		return this.possibleJumperFeasibleIntervals.has(e);
	}
	UpdateRegionsForPossibleJumpersAndInsertJumpers(e, t) {
		let n = /* @__PURE__ */ new Set();
		for (let e of this.dag.pred(t)) this.IsJumper(e) && (this.CalculateRegionAndInsertJumper(e), n.add(e));
		for (let e of this.dag.succ(t)) this.IsJumper(e) && (this.CalculateRegionAndInsertJumper(e), n.add(e));
		let r = [];
		for (let t of this.possibleJumperFeasibleIntervals) n.has(t[0]) || t[1].x > e && t[1].y < e && r.push(t[0]);
		for (let e of r) this.CalculateRegionAndInsertJumper(e);
	}
	InitJumpers() {
		let e = Array(this.dag.nodeCount).fill(0);
		for (let t of this.dag.edges) e[t.source] -= t.weight, e[t.target] += t.weight;
		this.possibleJumperFeasibleIntervals = /* @__PURE__ */ new Map();
		for (let t = 0; t < this.dag.nodeCount; t++) e[t] === 0 && this.CalculateRegionAndInsertJumper(t);
	}
	CalculateRegionAndInsertJumper(e) {
		let t = new V(this.Up(e), this.Down(e));
		this.possibleJumperFeasibleIntervals.set(e, t), this.InsertJumper(t.x, t.y, e);
	}
	InsertJumper(e, t, n) {
		this.CalcJumpInfo(e, t, n) != null && this.jumpers.add(n);
	}
	CalcJumpInfo(e, t, n) {
		let r = this.layering[n], i = -1, a = this.vertsCounts[r] - 2 * this.nodeCount[n];
		for (let t = e - 1; t > r; t--) this.vertsCounts[t] < a && (a = this.vertsCounts[t], i = t);
		for (let e = r - 1; e > t; e--) this.vertsCounts[e] < a && (a = this.vertsCounts[e], i = e);
		if (i !== -1) return {
			jumperLayer: r,
			layerToJumpTo: i
		};
	}
	Up(e) {
		let t = 2 ** 53 - 1;
		for (let n of this.dag.inEdges[e]) {
			let e = this.layering[n.source] - n.separation + 1;
			e < t && (t = e);
		}
		return t === 2 ** 53 - 1 && (t = this.layering[e] + 1), t;
	}
	Down(e) {
		let t = -Infinity;
		for (let n of this.dag.outEdges[e]) {
			let e = this.layering[n.target] + n.separation - 1;
			e > t && (t = e);
		}
		return t === -Infinity && (t = this.layering[e] - 1), t;
	}
	CalculateLayerCounts() {
		this.vertsCounts = Array(Math.max(...this.layering) + 1).fill(0);
		for (let e of this.layering) this.vertsCounts[e] += this.nodeCount[e];
	}
	ChooseJumper() {
		for (let e of this.jumpers) return e;
		throw Error("there are no jumpers to choose");
	}
}, ws = class e {
	constructor(e) {
		this.Initialize(e);
	}
	Initialize(e) {
		this.BaseGraph = e, this.totalNumberOfNodes = e.nodeCount;
		for (let e of this.BaseGraph.edges) if (e.LayerEdges != null) for (let t of e.LayerEdges) {
			let e = Math.max(t.Source, t.Target) + 1;
			e > this.totalNumberOfNodes && (this.totalNumberOfNodes = e);
		}
		this.firstVirtualNode = Infinity;
		for (let e of this.BaseGraph.edges) if (e.LayerEdges != null) for (let t = 1; t < e.LayerEdges.length; t++) {
			let n = e.LayerEdges[t];
			this.firstVirtualNode = Math.min(this.firstVirtualNode, n.Source);
		}
		this.firstVirtualNode === Infinity && (this.firstVirtualNode = this.BaseGraph.nodeCount, this.totalNumberOfNodes = this.BaseGraph.nodeCount), this.virtualNodesToInEdges = Array(this.totalNumberOfNodes - this.firstVirtualNode), this.virtualNodesToOutEdges = Array(this.totalNumberOfNodes - this.firstVirtualNode);
		for (let e of this.BaseGraph.edges) if (e.LayerSpan > 0) for (let t of e.LayerEdges) t.Target !== e.target && (this.virtualNodesToInEdges[t.Target - this.firstVirtualNode] = t), t.Source !== e.source && (this.virtualNodesToOutEdges[t.Source - this.firstVirtualNode] = t);
	}
	*edges_() {
		for (let e of this.BaseGraph.edges) if (e.LayerSpan > 0) for (let t of e.LayerEdges) yield t;
	}
	get Edges() {
		return this.edges_();
	}
	*InEdges(t) {
		if (t < this.BaseGraph.nodeCount) for (let n of this.BaseGraph.inEdges[t]) n.source !== n.target && n.LayerEdges != null && (yield e.LastEdge(n));
		else t >= this.firstVirtualNode && (yield this.InEdgeOfVirtualNode(t));
	}
	static LastEdge(e) {
		return e.LayerEdges[e.LayerEdges.length - 1];
	}
	InEdgeOfVirtualNode(e) {
		return this.virtualNodesToInEdges[e - this.firstVirtualNode];
	}
	*OutEdges(t) {
		if (t < this.BaseGraph.nodeCount) for (let n of this.BaseGraph.outEdges[t]) n.source !== n.target && n.LayerEdges != null && (yield e.FirstEdge(n));
		else t >= this.firstVirtualNode && (yield this.OutEdgeOfVirtualNode(t));
	}
	OutDegreeIsMoreThanOne(e) {
		return e < this.BaseGraph.nodeCount ? this.BaseGraph.outEdges[e].length > 1 : !1;
	}
	InDegreeIsMoreThanOne(e) {
		return e < this.BaseGraph.nodeCount ? this.BaseGraph.inEdges[e].length > 1 : !1;
	}
	OutEdgeOfVirtualNode(e) {
		return this.virtualNodesToOutEdges[e - this.firstVirtualNode];
	}
	static FirstEdge(e) {
		return e.LayerEdges[0];
	}
	InEdgesCount(e) {
		return this.RealInEdgesCount(e);
	}
	RealInEdgesCount(e) {
		return e < this.BaseGraph.nodeCount ? this.BaseGraph.inEdges[e].filter((e) => e.LayerEdges != null).length : 1;
	}
	OutEdgesCount(e) {
		return this.RealOutEdgesCount(e);
	}
	RealOutEdgesCount(e) {
		return e < this.BaseGraph.nodeCount ? this.BaseGraph.outEdges[e].filter((e) => e.LayerEdges != null).length : 1;
	}
	get NodeCount() {
		return this.totalNumberOfNodes;
	}
	IsRealNode(e) {
		return e < this.BaseGraph.nodeCount;
	}
	IsVirtualNode(e) {
		return !this.IsRealNode(e);
	}
	ReversedClone() {
		return new e(new ys(this.CreateReversedEdges(), this.BaseGraph.nodeCount));
	}
	CreateReversedEdges() {
		let e = [];
		for (let t of this.BaseGraph.edges) t.isSelfEdge() || e.push(t.reversedClone());
		return e;
	}
	*Succ(e) {
		for (let t of this.OutEdges(e)) yield t.Target;
	}
	*Pred(e) {
		for (let t of this.InEdges(e)) yield t.Source;
	}
}, Ts = class e {
	constructor(e, t, n, r) {
		this.la = t, this.database = n, this.layeredGraph = e, this.intGraph = r;
	}
	static InsertLayers(t, n, r, i) {
		let a = new e(t, n, r, i);
		return a.InsertLayers(), {
			layeredGraph: a.nLayeredGraph,
			la: a.Nla.DropEmptyLayers()
		};
	}
	get NLayering() {
		return this.Nla.y;
	}
	InsertLayers() {
		this.EditOldLayering(), this.CreateFullLayeredGraph(), this.InitNewLayering(), this.MapVirtualNodesToEdges(), this.FillUnsortedNewOddLayers(), this.WidenOriginalLayers(), this.SortNewOddLayers();
	}
	EditOldLayering() {
		let e = this.intGraph.nodeCount;
		for (let t of this.database.RegularMultiedges()) {
			let n = 0, r = t[0];
			if (n = r.LayerSpan * 2, n > 0) {
				for (let t of r.LayerEdges) t.Target !== r.target && (e++, this.UpdateOldLayer(e++, t.Target));
				e += (n - 1) * (t.length - 1) + 1;
			}
		}
	}
	UpdateOldLayer(e, t) {
		let n = this.la.x[t], r = this.la.y[t], i = this.la.Layers[r];
		i[n] = e;
	}
	WidenOriginalLayers() {
		for (let e = 0; e < this.la.Layers.length; e++) {
			let t = this.Nla.Layers[e * 2], n = 0;
			for (let r of this.la.Layers[e]) {
				let e = this.virtNodesToIntEdges[r];
				if (e != null) {
					let i = this.NLayering[e.source] - this.NLayering[r], a = this.database.Multiedges.get(e.source, e.target);
					for (let o of a) if (o !== e) {
						let e = o.LayerEdges[i].Source;
						t[n] = e, this.Nla.x[e] = n++;
					} else t[n] = r, this.Nla.x[r] = n++;
				} else t[n] = r, this.Nla.x[r] = n++;
			}
		}
	}
	FillUnsortedNewOddLayers() {
		let e = Array(this.Nla.Layers.length).fill(0);
		for (let t = this.intGraph.nodeCount; t < this.nLayeredGraph.NodeCount; t++) {
			let n = this.NLayering[t];
			n % 2 == 1 && (this.Nla.Layers[n][e[n]++] = t);
		}
	}
	MapVirtualNodesToEdges() {
		this.virtNodesToIntEdges = Array(this.NLayering.length);
		for (let e of this.database.AllIntEdges()) if (e.source !== e.target && e.LayerEdges != null) for (let t of e.LayerEdges) t.Target !== e.target && (this.virtNodesToIntEdges[t.Target] = e);
	}
	CreateFullLayeredGraph() {
		this.totalNodes = this.intGraph.nodeCount;
		for (let t of this.database.RegularMultiedges()) {
			let n = 0, r = !0;
			for (let i of t) if (r && (r = !1, n = i.LayerSpan * 2), n > 0) {
				i.LayerEdges = Array(n);
				for (let e = 0; e < n; e++) {
					let t = { currentVV: this.totalNodes }, r = Es.GetSource(t, i, e);
					this.totalNodes = t.currentVV;
					let a = Es.GetTarget(this.totalNodes, i, e, n);
					i.LayerEdges[e] = new Ri(r, a, i.CrossingWeight);
				}
				e.RegisterDontStepOnVertex(this.database, i);
			}
		}
		this.nLayeredGraph = new ws(this.intGraph);
	}
	SortNewOddLayers() {
		for (let e = 1; e < this.Nla.Layers.length; e += 2) {
			let t = /* @__PURE__ */ new Map(), n = this.Nla.Layers[e];
			for (let e of n) {
				let n = -1;
				for (let t of this.nLayeredGraph.InEdges(e)) n = t.Source;
				let r = -1;
				for (let t of this.nLayeredGraph.OutEdges(e)) r = t.Target;
				let i = this.Nla.x[n] + this.Nla.x[r];
				if (t.has(i)) {
					let n = t.get(i);
					if (typeof n == "number") {
						let r = [];
						r.push(n), r.push(e), t.set(i, r);
					} else n.push(e);
				} else t.set(i, e);
			}
			let r = Array.from(t.entries()).sort((e, t) => e[0] - t[0]), i = 0;
			for (let e of r.map((e) => e[1])) if (typeof e == "number") n[i++] = e;
			else for (let t of e) n[i++] = t;
			for (let e = 0; e < n.length; e++) this.Nla.x[n[e]] = e;
		}
	}
	InitNewLayering() {
		this.Nla = new Ss(Array(this.totalNodes));
		for (let e = 0; e < this.layeredGraph.NodeCount; e++) this.NLayering[e] = this.la.y[e] * 2;
		for (let [e, t] of this.database.Multiedges.keyValues()) if (e.x !== e.y && this.la.y[e.x] !== this.la.y[e.y]) {
			let n = this.la.y[e.x] * 2;
			for (let e of t) {
				let t = n - 1;
				for (let n of e.LayerEdges) n.Target !== e.target && (this.NLayering[n.Target] = t--);
			}
		}
		let e = Array(2 * this.la.Layers.length - 1), t = Array(e.length).fill(0);
		for (let e of this.NLayering) t[e]++;
		for (let n = 0; n < t.length; n++) e[n] = Array(t[n]);
		this.Nla = new Ss(this.NLayering), this.Nla.Layers = e;
	}
	static RegisterDontStepOnVertex(e, t) {
		if (e.Multiedges.get(t.source, t.target).length > 1) {
			let n = t.LayerEdges[Math.floor(t.LayerEdges.length / 2)];
			e.MultipleMiddles.add(n.Source);
		}
	}
}, Es = class e {
	get NLayering() {
		return this.Nla.y;
	}
	static InsertPaths(t, n, r, i) {
		let a = new e(t, n, r, i);
		return a.InsertPaths(), {
			layeredGraph: a.NLayeredGraph,
			la: a.Nla
		};
	}
	constructor(e, t, n, r) {
		this.virtNodesToIntEdges = /* @__PURE__ */ new Map(), this.la = t, this.database = n, this.layeredGraph = e, this.intGraph = r;
	}
	InsertPaths() {
		this.CreateFullLayeredGraph(), this.InitNewLayering(), this.MapVirtualNodesToEdges(), this.WidenOriginalLayers();
	}
	WidenOriginalLayers() {
		for (let e = 0; e < this.la.Layers.length; e++) {
			let t = this.Nla.Layers[e], n = 0;
			for (let r of this.la.Layers[e]) {
				let e = this.virtNodesToIntEdges.get(r);
				if (e != null) {
					let i = this.NLayering[e.source] - this.NLayering[r], a = this.database.Multiedges.get(e.source, e.target);
					for (let o of a) if (!this.EdgeIsFlat(o)) if (o !== e) {
						let e = o.LayerEdges[i].Source;
						t[n] = e, this.Nla.x[e] = n++;
					} else t[n] = r, this.Nla.x[r] = n++;
				} else t[n] = r, this.Nla.x[r] = n++;
			}
		}
	}
	EdgeIsFlat(e) {
		return this.la.y[e.source] === this.la.y[e.target];
	}
	MapVirtualNodesToEdges() {
		for (let e of this.database.RegularMultiedges()) for (let t of e) if (!this.EdgeIsFlat(t)) for (let e of t.LayerEdges) e.Target !== t.target && this.virtNodesToIntEdges.set(e.Target, t);
	}
	CreateFullLayeredGraph() {
		let t = this.layeredGraph.NodeCount;
		for (let [n, r] of this.database.Multiedges.keyValues()) if (n.x !== n.y) {
			let n = !0, i = 0;
			for (let a of r) {
				if (n) n = !1, i = a.LayerSpan;
				else if (a.LayerEdges = Array(i), i === 1) a.LayerEdges[0] = new Ri(a.source, a.target, a.CrossingWeight);
				else for (let n = 0; n < i; n++) {
					let r = { currentVV: t }, o = e.GetSource(r, a, n);
					t = r.currentVV;
					let s = e.GetTarget(t, a, n, i);
					a.LayerEdges[n] = new Ri(o, s, a.CrossingWeight);
				}
				Ts.RegisterDontStepOnVertex(this.database, a);
			}
		}
		this.NLayeredGraph = new ws(this.intGraph);
	}
	static GetTarget(e, t, n, r) {
		return n < r - 1 ? e : t.target;
	}
	static GetSource(e, t, n) {
		return n === 0 ? t.source : e.currentVV++;
	}
	InitNewLayering() {
		this.Nla = new Ss(Array(this.NLayeredGraph.NodeCount));
		for (let e = 0; e < this.layeredGraph.NodeCount; e++) this.NLayering[e] = this.la.y[e];
		for (let [e, t] of this.database.Multiedges.keyValues()) if (e.x !== e.y && this.la.y[e.x] !== this.la.y[e.y]) {
			let e = 0, n = !0;
			for (let r of t) {
				n && (n = !1, e = this.la.y[r.source]);
				let t = e - 1;
				for (let e of r.LayerEdges) this.NLayering[e.Target] = t--;
			}
		}
		let e = Array(this.la.Layers.length), t = Array(e.length).fill(0);
		for (let e of this.NLayering) t[e]++;
		for (let n = 0; n < t.length; n++) e[n] = Array(t[n]);
		this.Nla = new Ss(this.NLayering), this.Nla.Layers = e;
	}
}, Ds = class {
	constructor(e, t, n) {
		this.numberOfCrossings = t, this.la = e, this.virtVertexStart = n;
	}
	LayerGroupDisbalance(e, t, n) {
		return t === 1 ? this.LayerGroupDisbalanceWithOrigSeparators(e, n) : this.LayerGroupDisbalanceWithVirtSeparators(e, t);
	}
	LayerGroupDisbalanceWithVirtSeparators(e, t) {
		let n = 0;
		for (let r = 0; r < e.length;) {
			let i = this.CurrentOrigGroupDelta(r, e, t);
			r = i.i, n += i.ret;
		}
		return n;
	}
	CurrentOrigGroupDelta(e, t, n) {
		let r = 0, i = e;
		for (; i < t.length && t[i] < this.virtVertexStart; i++) r++;
		return e = i + 1, {
			ret: Math.abs(n - r),
			i: e
		};
	}
	LayerGroupDisbalanceWithOrigSeparators(e, t) {
		let n = 0;
		for (let r = 0; r < e.length;) {
			let i = this.CurrentVirtGroupDelta(r, e, t);
			n += i.ret, r = i.i;
		}
		return n;
	}
	CurrentVirtGroupDelta(e, t, n) {
		let r = 0, i = e;
		for (; i < t.length && t[i] >= this.virtVertexStart; i++) r++;
		return e = i + 1, {
			ret: Math.abs(n - r),
			i: e
		};
	}
	static less(e, t) {
		return e.numberOfCrossings < t.numberOfCrossings;
	}
	static greater(e, t) {
		return e.numberOfCrossings > t.numberOfCrossings;
	}
	IsPerfect() {
		return this.numberOfCrossings === 0;
	}
}, Os = class {
	constructor(e) {
		this.x = e;
	}
	Compare(e, t) {
		let n = this.x[e.Source] - this.x[t.Source];
		return n === 0 ? this.x[e.Target] - this.x[t.Target] : n;
	}
}, ks = class {
	constructor(e) {
		this.x = e;
	}
	Compare(e, t) {
		let n = this.x[e.Target] - this.x[t.Target];
		return n === 0 ? this.x[e.Source] - this.x[t.Source] : n;
	}
};
//#endregion
//#region node_modules/@msagl/core/dist/layout/layered/ordering/ordering.js
function As() {
	return yn(2) === 0;
}
function js(e, t, n) {
	let r = n.Layers[e + 1], i = n.Layers[e];
	return i.length <= r.length ? Ns(i, t, n) : Ms(r, i, t, n);
}
function Ms(e, t, n, r) {
	let i = Ps(t, n), a = new ks(r.x);
	i.sort((e, t) => a.Compare(e, t));
	let o = 1;
	for (; o < e.length;) o *= 2;
	let s = Array(2 * o - 1).fill(0);
	o--;
	let c = 0;
	for (let e of i) {
		let t = o + r.x[e.Source], n = e.CrossingWeight;
		for (s[t] += n; t > 0;) t % 2 != 0 && (c += n * s[t + 1]), t = Math.floor((t - 1) / 2), s[t] += n;
	}
	return c;
}
function Ns(e, t, n) {
	let r = Ps(e, t), i = new Os(n.x);
	r.sort((e, t) => i.Compare(e, t));
	let a = 1;
	for (; a < e.length;) a *= 2;
	let o = Array(2 * a - 1).fill(0);
	a--;
	let s = 0;
	for (let e of r) {
		let t = a + n.x[e.Target], r = e.CrossingWeight;
		for (o[t] += r; t > 0;) t % 2 != 0 && (s += r * o[t + 1]), t = Math.floor((t - 1) / 2), o[t] += r;
	}
	return s;
}
function Ps(e, t) {
	return Le(e, (e) => t.InEdges(e));
}
function Fs(e, t) {
	let n = 0;
	for (let r = 0; r < t.Layers.length - 1; r++) n += js(r, e, t);
	return n;
}
var Is = class e extends B {
	get NoGainStepsBound() {
		return this.SugSettings.NoGainAdjacentSwapStepsBound * this.SugSettings.NoGainStepsForOrderingMultiplier;
	}
	get SeedOfRandom() {
		return yn(100);
	}
	constructor(e, t, n, r, i, a, o) {
		super(o), this.tryReverse = !0, this.MaxNumberOfAdjacentExchanges = 50, this.cancelToken = o, this.tryReverse = t, this.startOfVirtNodes = r, this.layerArrays = n, this.layering = n.y, this.nOfLayers = n.Layers.length, this.layers = n.Layers, this.properLayeredGraph = e, this.hasCrossWeights = i, this.SugSettings = a;
	}
	get MaxOfIterations() {
		return this.SugSettings.MaxNumberOfPassesInOrdering * this.SugSettings.NoGainStepsForOrderingMultiplier;
	}
	static OrderLayers(t, n, r, i, a) {
		let o = !1;
		for (let e of t.Edges) if (e.CrossingWeight !== 1) {
			o = !0;
			break;
		}
		new e(t, !0, n, r, o, i, a).run();
	}
	run() {
		if (this.Calculate(), this.tryReverse) {
			let t = this.layerArrays.ReversedClone(), n = new e(this.properLayeredGraph.ReversedClone(), !1, t, this.startOfVirtNodes, this.hasCrossWeights, this.SugSettings, this.cancelToken);
			if (n.run(), Ds.less(n.measure, this.measure)) {
				for (let e = 0; e < this.nOfLayers; e++) xs(t.Layers[e], this.layerArrays.Layers[this.nOfLayers - 1 - e]);
				this.layerArrays.UpdateXFromLayers();
			}
		}
	}
	Calculate() {
		this.Init(), this.layerArraysCopy = e.CloneLayers(this.layers, this.layerArraysCopy);
		let t = 0;
		this.measure = new Ds(this.layerArraysCopy, Fs(this.properLayeredGraph, this.layerArrays), this.startOfVirtNodes);
		for (let n = 0; n < this.MaxOfIterations && t < this.NoGainStepsBound && !this.measure.IsPerfect(); n++) {
			let r = n % 2 == 0;
			this.LayerByLayerSweep(r), this.AdjacentExchange();
			let i = new Ds(this.layerArrays.Layers, Fs(this.properLayeredGraph, this.layerArrays), this.startOfVirtNodes);
			Ds.less(this.measure, i) ? (this.Restore(), t++) : (Ds.less(i, this.measure) || As()) && (t = 0, this.layerArraysCopy = e.CloneLayers(this.layers, this.layerArraysCopy), this.measure = i);
		}
	}
	static CloneLayers(e, t) {
		if (t == null) {
			t = Array(e.length);
			for (let n = 0; n < e.length; n++) t[n] = e[n].map((e) => e);
		} else for (let n = 0; n < e.length; n++) xs(e[n], t[n]);
		return t;
	}
	Restore() {
		this.layerArrays.updateLayers(this.layerArraysCopy);
	}
	LayerByLayerSweep(e) {
		if (e) for (let e = 1; e < this.nOfLayers; e++) this.SweepLayer(e, !0);
		else for (let e = this.nOfLayers - 2; e >= 0; e--) this.SweepLayer(e, !1);
	}
	SweepLayer(e, t) {
		let n = this.layers[e], r = Array(n.length);
		for (let e = 0; e < r.length; e++) r[e] = this.WMedian(n[e], t);
		this.Sort(e, r);
		let i = this.layerArrays.Layers[e];
		for (let e = 0; e < i.length; e++) this.layerArrays.x[i[e]] = e;
	}
	Sort(e, t) {
		let n = /* @__PURE__ */ new Map(), r = this.layers[e], i = 0;
		for (let e of t) {
			let t = r[i++];
			if (e !== -1) if (!n.has(e)) n.set(e, t);
			else {
				let r = n.get(e);
				if (typeof r != "number") {
					let e = r;
					if (As()) e.push(t);
					else {
						let n = yn(e.length), r = e[n];
						e[n] = t, e.push(r);
					}
				} else {
					let i = r, a = [];
					n.set(e, a), As() ? (a.push(i), a.push(t)) : (a.push(t), a.push(i));
				}
			}
		}
		let a = Array.from(n).sort((e, t) => e[0] - t[0]).map((e) => e[1]), o = 0;
		for (i = 0; i < r.length;) if (t[i] !== -1) {
			let e = a[o++];
			if (typeof e == "number") r[i++] = e;
			else {
				let n = e;
				for (let e of n) {
					for (; t[i] === -1;) i++;
					r[i++] = e;
				}
			}
		} else i++;
	}
	WMedian(e, t) {
		let n, r;
		if (t ? (n = this.properLayeredGraph.OutEdges(e), r = this.properLayeredGraph.OutEdgesCount(e)) : (n = this.properLayeredGraph.InEdges(e), r = this.properLayeredGraph.InEdgesCount(e)), r === 0) return -1;
		let i = Array(r), a = 0;
		if (t) for (let e of n) i[a++] = this.X[e.Target];
		else for (let e of n) i[a++] = this.X[e.Source];
		i.sort((e, t) => e - t);
		let o = Math.floor(r / 2);
		if (r % 2 == 1) return i[o];
		if (r === 2) return .5 * (i[0] + i[1]);
		let s = i[o - 1] - i[0], c = i[r - 1] - i[o];
		return Math.floor((i[o - 1] * s + i[o] * c) / (s + c));
	}
	Init() {
		let e = Array(this.nOfLayers).fill(0), t = new N.Stack();
		for (let e = 0; e < this.properLayeredGraph.NodeCount; e++) this.properLayeredGraph.InEdgesCount(e) === 0 && t.push(e);
		let n = Array(this.properLayeredGraph.NodeCount).fill(!1);
		for (; t.size > 0;) {
			let r = t.pop(), i = this.layerArrays.y[r];
			this.layerArrays.Layers[i][e[i]] = r, this.layerArrays.x[r] = e[i], e[i]++;
			for (let e of this.properLayeredGraph.Succ(r)) n[e] || (n[e] = !0, t.push(e));
		}
		this.X = this.layerArrays.x;
	}
	AdjacentExchange() {
		this.InitArrays();
		let e = 0, t = !0;
		for (; t && e++ < this.MaxNumberOfAdjacentExchanges;) {
			t = !1;
			for (let e = 0; e < this.layers.length; e++) t = this.AdjExchangeLayer(e) || t;
			for (let e = this.layers.length - 2; e >= 0; e--) t = this.AdjExchangeLayer(e) || t;
		}
	}
	AllocArrays() {
		let e = this.properLayeredGraph.NodeCount;
		this.predecessors = Array(e), this.successors = Array(e), this.pOrder = Array(e), this.sOrder = Array(e), this.hasCrossWeights && (this.outCrossingCount = Array(e), this.inCrossingCount = Array(e));
		for (let t = 0; t < e; t++) {
			let e = this.properLayeredGraph.InEdgesCount(t);
			if (this.predecessors[t] = Array(e), this.hasCrossWeights) {
				let e = this.inCrossingCount[t] = /* @__PURE__ */ new Map();
				for (let n of this.properLayeredGraph.InEdges(t)) e.set(n.Source, n.CrossingWeight);
			}
			if (this.pOrder[t] = /* @__PURE__ */ new Map(), e = this.properLayeredGraph.OutEdgesCount(t), this.successors[t] = Array(e), this.sOrder[t] = /* @__PURE__ */ new Map(), this.hasCrossWeights) {
				let e = this.outCrossingCount[t] = /* @__PURE__ */ new Map();
				for (let n of this.properLayeredGraph.OutEdges(t)) e.set(n.Target, n.CrossingWeight);
			}
		}
	}
	InitArrays() {
		this.successors ?? this.AllocArrays();
		for (let e = 0; e < this.properLayeredGraph.NodeCount; e++) this.pOrder[e] = /* @__PURE__ */ new Map(), this.sOrder[e] = /* @__PURE__ */ new Map();
		for (let e of this.layers) this.InitPsArraysForLayer(e);
	}
	CalcPair(e, t) {
		let n = this.successors[e], r = this.successors[t], i = this.predecessors[e], a = this.predecessors[t];
		if (this.hasCrossWeights) {
			let o = this.outCrossingCount[e], s = this.outCrossingCount[t], c = this.inCrossingCount[e], l = this.inCrossingCount[t];
			return {
				cuv: this.CountOnArraysUV(n, r, o, s) + this.CountOnArraysUV(i, a, c, l),
				cvu: this.CountOnArraysUV(r, n, s, o) + this.CountOnArraysUV(a, i, l, c)
			};
		} else return {
			cuv: this.CountOnArrays(n, r) + this.CountOnArrays(i, a),
			cvu: this.CountOnArrays(r, n) + this.CountOnArrays(a, i)
		};
	}
	InitPsArraysForLayer(e) {
		for (let t of e) {
			for (let e of this.properLayeredGraph.Pred(t)) {
				let n = this.sOrder[e], r = n.size;
				this.successors[e][r] = t, n.set(t, r);
			}
			for (let e of this.properLayeredGraph.Succ(t)) {
				let n = this.pOrder[e], r = n.size;
				this.predecessors[e][r] = t, n.set(t, r);
			}
		}
	}
	CountOnArrays(e, t) {
		let n = 0, r = t.length - 1, i = -1, a = 0;
		for (let o of e) {
			let e = this.X[o];
			for (; i < r && this.X[t[i + 1]] < e; i++) a++;
			n += a;
		}
		return n;
	}
	CountOnArraysUV(e, t, n, r) {
		let i = 0, a = t.length - 1, o = -1, s = 0;
		for (let c of e) {
			let e = this.X[c], l;
			for (; o < a && this.X[l = t[o + 1]] < e; o++) s += r.get(l);
			i += s * n.get(c);
		}
		return i;
	}
	AdjExchangeLayer(e) {
		let t = this.layers[e];
		return this.ExchangeWithGainWithNoDisturbance(t) ? !0 : (this.DisturbLayer(t), this.ExchangeWithGainWithNoDisturbance(t));
	}
	Swap(e, t) {
		let n = this.X[e], r = this.X[t], i = this.layering[e], a = this.layers[i];
		a[n] = t, a[r] = e, this.X[e] = r, this.X[t] = n, this.UpdateSsContainingUv(e, t), this.UpdatePsContainingUv(e, t);
	}
	UpdatePsContainingUv(e, t) {
		if (this.successors[e].length <= this.successors[t].length) for (let n of this.successors[e]) {
			let r = this.pOrder[n];
			if (r.has(t)) {
				let i = r.get(t), a = this.predecessors[n];
				a[i - 1] = t, a[i] = e, r.set(t, i - 1), r.set(e, i);
			}
		}
		else for (let n of this.successors[t]) {
			let r = this.pOrder[n];
			if (r.has(e)) {
				let i = r.get(t), a = this.predecessors[n];
				a[i - 1] = t, a[i] = e, r.set(t, i - 1), r.set(e, i);
			}
		}
	}
	UpdateSsContainingUv(e, t) {
		if (this.predecessors[e].length <= this.predecessors[t].length) for (let n of this.predecessors[e]) {
			let r = this.sOrder[n];
			if (r.has(t)) {
				let i = r.get(t), a = this.successors[n];
				a[i - 1] = t, a[i] = e, r.set(t, i - 1), r.set(e, i);
			}
		}
		else for (let n of this.predecessors[t]) {
			let r = this.sOrder[n];
			if (r.has(e)) {
				let i = r.get(t), a = this.successors[n];
				a[i - 1] = t, a[i] = e, r.set(t, i - 1), r.set(e, i);
			}
		}
	}
	DisturbLayer(e) {
		for (let t = 0; t < e.length - 1; t++) this.AdjacentSwapToTheRight(e, t);
	}
	ExchangeWithGainWithNoDisturbance(e) {
		let t = !1, n;
		do
			n = this.ExchangeWithGain(e), t ||= n;
		while (n);
		return t;
	}
	ExchangeWithGain(e) {
		for (let t = 0; t < e.length - 1; t++) if (this.SwapWithGain(e[t], e[t + 1])) return this.SwapToTheLeft(e, t), this.SwapToTheRight(e, t + 1), !0;
		return !1;
	}
	SwapToTheLeft(e, t) {
		for (let n = t - 1; n >= 0; n--) this.AdjacentSwapToTheRight(e, n);
	}
	SwapToTheRight(e, t) {
		for (let n = t; n < e.length - 1; n++) this.AdjacentSwapToTheRight(e, n);
	}
	AdjacentSwapToTheRight(e, t) {
		let n = e[t], r = e[t + 1], i = this.SwapGain(n, r);
		(i > 0 || i === 0 && As()) && this.Swap(n, r);
	}
	SwapGain(e, t) {
		let n = this.CalcPair(e, t);
		return n.cuv - n.cvu;
	}
	UvAreOfSameKind(e, t) {
		return e < this.startOfVirtNodes && t < this.startOfVirtNodes || e >= this.startOfVirtNodes && t >= this.startOfVirtNodes;
	}
	NeighborsForbidTheSwap(e, t) {
		return this.UpperNeighborsForbidTheSwap(e, t) || this.LowerNeighborsForbidTheSwap(e, t);
	}
	LowerNeighborsForbidTheSwap(e, t) {
		let n, r;
		return (n = this.properLayeredGraph.OutEdgesCount(e)) === 0 || (r = this.properLayeredGraph.OutEdgesCount(t)) === 0 ? !1 : this.X[this.successors[e][n >> 1]] < this.X[this.successors[t][r >> 1]];
	}
	UpperNeighborsForbidTheSwap(e, t) {
		let n = this.properLayeredGraph.InEdgesCount(e), r = this.properLayeredGraph.InEdgesCount(t);
		return n === 0 || r === 0 ? !1 : this.X[this.predecessors[e][n >> 1]] < this.X[this.predecessors[t][r >> 1]];
	}
	CalcDeltaBetweenGroupsToTheLeftAndToTheRightOfTheSeparator(e, t, n) {
		let r = this.GetKindDelegate(n), i = 0;
		for (let n = t - 1; n >= 0 && !r(e[n]); n--) i++;
		let a = 0;
		for (let n = t + 1; n < e.length && !r(e[n]); n++) a++;
		return i - a;
	}
	IsOriginal(e) {
		return e < this.startOfVirtNodes;
	}
	IsVirtual(e) {
		return e >= this.startOfVirtNodes;
	}
	GetKindDelegate(e) {
		return this.IsVirtual(e) ? this.IsVirtual : this.IsOriginal;
	}
	SwapWithGain(e, t) {
		return this.SwapGain(e, t) > 0 ? (this.Swap(e, t), !0) : !1;
	}
}, Ls = class e {
	constructor(e, t, n) {
		this.properLayeredGraph = e, this.layerArrays = t, this.nodePositions = n;
	}
	static UpdateLayerArrays0(t, n, r) {
		new e(t, n, r).UpdateLayerArrays();
	}
	static UpdateLayerArrays1(t, n) {
		let r = e.BuildInitialNodePositions(t, n);
		this.UpdateLayerArrays0(t, n, r);
	}
	static BuildInitialNodePositions(e, t) {
		let n = /* @__PURE__ */ new Map();
		for (let r = 0; r < t.Layers.length; r++) {
			let i = 0, a = 0;
			for (; i < t.Layers[r].length;) {
				for (; i < t.Layers[r].length && e.IsVirtualNode(t.Layers[r][i]);) i++;
				for (let e = a; e < i; e++) n.set(t.Layers[r][e], new y(r, a));
				i < t.Layers[r].length && n.set(t.Layers[r][i], new y(r, i)), i++, a = i;
			}
		}
		return n;
	}
	UpdateLayerArrays() {
		let e = this.CreateInitialOrdering();
		e = this.BuildOrdering(e), this.RestoreLayerArrays(e);
	}
	CreateInitialOrdering() {
		let e = new Nt();
		for (let t of this.layerArrays.Layers) for (let n of t) {
			let t = this.nodePositions.get(n);
			e.hasxy(t.x, t.y) || e.setxy(t.x, t.y, []), e.getxy(t.x, t.y).push(n);
		}
		return e;
	}
	BuildOrdering(e) {
		let t = new Nt(), n = /* @__PURE__ */ new Map();
		for (let r of this.layerArrays.Layers) for (let i of r) {
			let r = this.nodePositions.get(i);
			t.hasxy(r.x, r.y) || (this.BuildNodeOrdering(e.get(r), n), t.set(r, e.get(r)));
		}
		return t;
	}
	BuildNodeOrdering(e, t) {
		e.sort(this.Comparison(t));
		for (let n = 0; n < e.length; n++) t.set(e[n], n);
	}
	firstSucc(e) {
		for (let t of this.properLayeredGraph.Succ(e)) return t;
	}
	firstPred(e) {
		for (let t of this.properLayeredGraph.Pred(e)) return t;
	}
	Comparison(e) {
		return (t, n) => {
			let r = this.firstSucc(t), i = this.firstSucc(n), a = this.firstPred(t), o = this.firstPred(n), s = this.nodePositions.get(r), c = this.nodePositions.get(i), l = this.nodePositions.get(a), u = this.nodePositions.get(o);
			if (!s.equal(c)) return l.equal(u) ? s.compareTo(c) : l.compareTo(u);
			if (this.properLayeredGraph.IsVirtualNode(r)) return l.equal(u) ? f(e.get(r), e.get(i)) : l.compareTo(u);
			for (; this.nodePositions.get(a).equal(this.nodePositions.get(o)) && this.properLayeredGraph.IsVirtualNode(a);) a = this.firstPred(a), o = this.firstPred(o);
			return this.nodePositions.get(a).equal(this.nodePositions.get(o)) ? f(t, n) : this.nodePositions.get(a).compareTo(this.nodePositions.get(o));
		};
	}
	RestoreLayerArrays(e) {
		for (let t of this.layerArrays.Layers) {
			let n = 0, r = 0;
			for (; n < t.length;) {
				for (; n < t.length && this.nodePositions.get(t[r]).equal(this.nodePositions.get(t[n]));) n++;
				let i = e.get(this.nodePositions.get(t[r]));
				for (let e = r; e < n; e++) t[e] = i[e - r];
				r = n;
			}
		}
		this.layerArrays.UpdateXFromLayers();
	}
}, Rs = class e {
	static getOrder(t, n) {
		let r = Dn(n.map(([e, t]) => new V(e, t)), t);
		return e.getOrderOnGraph(r);
	}
	static getOrderOnGraph(e) {
		let t = Array(e.nodeCount).fill(!1), n = new N.Stack(), r = [], i;
		for (let a = 0; a < e.nodeCount; a++) {
			if (t[a]) continue;
			let o = a;
			t[o] = !0;
			let s = 0;
			i = e.outEdges[a];
			do {
				for (; s < i.length; s++) {
					let r = i[s].target;
					t[r] || (t[r] = !0, n.push({
						edges: i,
						index: s + 1,
						current_u: o
					}), o = r, i = e.outEdges[o], s = -1);
				}
				if (r.push(o), n.length > 0) {
					let e = n.pop();
					i = e.edges, s = e.index, o = e.current_u;
				} else break;
			} while (!0);
		}
		return r.reverse();
	}
}, zs = class {
	GetLayers() {
		let e = Rs.getOrderOnGraph(this.graph), t = Array(this.graph.nodeCount).fill(0), n = this.graph.nodeCount;
		for (; n-- > 0;) {
			let r = e[n];
			for (let e of this.graph.inEdges[r]) {
				let n = e.source, i = t[r] + e.separation;
				t[n] < i && (t[n] = i);
			}
		}
		return t;
	}
	checkTopoOrder(e) {
		for (let t of this.graph.edges) if (Bs(t, e)) return !1;
		return !0;
	}
	constructor(e) {
		this.graph = e;
	}
};
function Bs(e, t) {
	let n = t.findIndex((t) => t === e.source), r = t.findIndex((t) => t === e.target);
	return n === -1 || r === -1 || n >= r;
}
//#endregion
//#region node_modules/@msagl/core/dist/layout/layered/layering/networkEdge.js
var Vs = class e {
	constructor(t) {
		this.inTree = !1, this.cut = e.infinity, this.iedge = t;
	}
	get source() {
		return this.iedge.source;
	}
	get target() {
		return this.iedge.target;
	}
	get separation() {
		return this.iedge.separation;
	}
	get crossingWeight() {
		return this.iedge.CrossingWeight;
	}
	get weight() {
		return this.iedge.weight;
	}
};
Vs.infinity = 2 ** 53 - 1;
//#endregion
//#region node_modules/@msagl/core/dist/layout/layered/layering/NetworkSimplex.js
function Hs(e) {
	let t = [];
	for (let n of e.edges) t.push(new Vs(n));
	return Dn(t, e.nodeCount);
}
var Us = class {
	constructor(e, t, n, r, i) {
		this.v = e, this.outEnum = t, this.i = n, this.inEnum = r, this.j = i;
	}
}, Ws = class {
	get weight() {
		return this.graph.edges.map((e) => e.weight * (this.layers[e.source] - this.layers[e.target])).reduce((e, t) => e + t, 0);
	}
	get nodeCount() {
		return this.vertices.length;
	}
	setLow(e, t) {
		this.vertices[e].low = t;
	}
	setLim(e, t) {
		this.vertices[e].lim = t;
	}
	setParent(e, t) {
		this.vertices[e].parent = t;
	}
	constructor(e, t) {
		this.layers = null, this.treeVertices = [], this.vertices = [], this.leaves = [], this.graph = Hs(e), this.networkCancelToken = t;
		for (let e = 0; e < this.graph.nodeCount; e++) this.vertices.push({
			inTree: !1,
			lim: -1,
			low: -1,
			parent: null
		});
	}
	GetLayers() {
		return this.layers ?? this.run(), this.layers;
	}
	shiftLayerToZero() {
		let e = Math.min(...this.layers);
		for (let t = 0; t < this.layers.length; t++) this.layers[t] -= e;
	}
	addVertexToTree(e) {
		this.vertices[e].inTree = !0;
	}
	vertexInTree(e) {
		return this.vertices[e].inTree;
	}
	lim(e) {
		return this.vertices[e].lim;
	}
	low(e) {
		return this.vertices[e].low;
	}
	parent(e) {
		return this.vertices[e].parent;
	}
	feasibleTree() {
		for (this.initLayers(); this.tightTree() < this.nodeCount;) {
			let e = this.getNonTreeEdgeIncidentToTheTreeWithMinimalAmountOfSlack();
			if (e == null) break;
			let t = this.slack(e);
			this.vertexInTree(e.source) && (t = -t);
			for (let e of this.treeVertices) this.layers[e] += t;
		}
		this.initCutValues();
	}
	vertexSourceTargetVal(e, t) {
		let n = t.source, r = t.target;
		return this.lim(n) > this.lim(r) ? this.lim(e) <= this.lim(r) && this.low(r) <= this.lim(e) ? 0 : 1 : +(this.lim(e) <= this.lim(n) && this.low(n) <= this.lim(e));
	}
	incidentEdges(e) {
		return this.graph.incidentEdges(e);
	}
	allLowCutsHaveBeenDone(e) {
		for (let t of this.incidentEdges(e)) if (t.inTree && t.cut === Vs.infinity && t !== this.parent(e)) return !1;
		return !0;
	}
	edgeSourceTargetVal(e, t) {
		return this.vertexSourceTargetVal(e.source, t) - this.vertexSourceTargetVal(e.target, t);
	}
	initCutValues() {
		this.initLimLowAndParent();
		let e = new N.Stack();
		for (let t of this.leaves) e.push(t);
		let t = new N.Stack();
		for (; e.length > 0;) {
			for (; e.length > 0;) {
				let n = e.pop(), r = this.parent(n);
				if (r == null) continue;
				let i = 0;
				for (let e of this.incidentEdges(n)) if (e.inTree === !1) {
					let t = this.edgeSourceTargetVal(e, r);
					t !== 0 && (i += t * e.weight);
				} else if (e === r) i += e.weight;
				else {
					let t = r.source === e.target || r.target === e.source ? 1 : -1, a = this.edgeContribution(e, n);
					i += a * t;
				}
				r.cut = i;
				let a = r.source === n ? r.target : r.source;
				this.allLowCutsHaveBeenDone(a) && t.push(a);
			}
			let n = e;
			e = t, t = n;
		}
	}
	edgeContribution(e, t) {
		let n = e.cut - e.weight;
		for (let r of this.incidentEdges(t)) if (r.inTree === !1) {
			let t = this.edgeSourceTargetVal(r, e);
			t === -1 ? n += r.weight : t === 1 && (n -= r.weight);
		}
		return n;
	}
	initLimLowAndParent() {
		this.initLowLimParentAndLeavesOnSubtree(1, 0);
	}
	initLowLimParentAndLeavesOnSubtree(e, t) {
		let n = new N.Stack(), r = this.graph.outEdges[t], i = -1, a = this.graph.inEdges[t], o = -1;
		for (n.push(new Us(t, r, i, a, o)), this.vertices[t].low = e; n.length > 0;) {
			let s = n.pop();
			t = s.v, r = s.outEnum, i = s.i, a = s.inEnum, o = s.j;
			let c;
			do {
				for (c = !0; ++i < r.length;) {
					let s = r[i];
					!s.inTree || this.vertices[s.target].low > 0 || (n.push(new Us(t, r, i, a, o)), t = s.target, this.setParent(t, s), this.setLow(t, e), r = this.graph.outEdges[t], i = -1, a = this.graph.inEdges[t], o = -1);
				}
				for (; ++o < a.length;) {
					let s = a[o];
					if (!(!s.inTree || this.vertices[s.source].low > 0)) {
						n.push(new Us(t, r, i, a, o)), t = s.source, this.setLow(t, e), this.setParent(t, s), r = this.graph.outEdges[t], i = -1, a = this.graph.inEdges[t], o = -1, c = !1;
						break;
					}
				}
			} while (!c);
			this.setLim(t, e++), this.lim(t) === this.low(t) && this.leaves.push(t);
		}
	}
	updateLimLowLeavesAndParentsUnderNode(e) {
		let t = this.vertices[e].low, n = this.vertices[e].lim;
		this.leaves = [];
		for (let e = 0; e < this.nodeCount; e++) t <= this.vertices[e].lim && this.vertices[e].lim <= n ? this.setLow(e, 0) : this.low(e) === this.lim(e) && this.leaves.push(e);
		this.initLowLimParentAndLeavesOnSubtree(t, e);
	}
	slack(e) {
		return this.layers[e.source] - this.layers[e.target] - e.separation;
	}
	getNonTreeEdgeIncidentToTheTreeWithMinimalAmountOfSlack() {
		let e = null, t = Vs.infinity;
		for (let n of this.treeVertices) {
			for (let r of this.graph.outEdges[n]) {
				if (this.vertexInTree(r.source) && this.vertexInTree(r.target)) continue;
				let n = this.slack(r);
				if (n < t && (e = r, t = n, n === 1)) return r;
			}
			for (let r of this.graph.inEdges[n]) {
				if (this.vertexInTree(r.source) && this.vertexInTree(r.target)) continue;
				let n = this.slack(r);
				if (n < t && (e = r, t = n, n === 1)) return r;
			}
		}
		return e;
	}
	tightTree() {
		this.treeVertices = [];
		for (let e of this.graph.edges) e.inTree = !1;
		for (let e = 1; e < this.nodeCount; e++) this.vertices[e].inTree = !1;
		this.vertices[0].inTree = !0, this.treeVertices.push(0);
		let e = new N.Stack();
		for (e.push(0); e.length > 0;) {
			let t = e.pop();
			for (let n of this.graph.outEdges[t]) this.vertexInTree(n.target) || this.layers[n.source] - this.layers[n.target] === n.separation && (e.push(n.target), this.addVertexToTree(n.target), this.treeVertices.push(n.target), n.inTree = !0);
			for (let n of this.graph.inEdges[t]) this.vertexInTree(n.source) || this.layers[n.source] - this.layers[n.target] === n.separation && (e.push(n.source), this.addVertexToTree(n.source), this.treeVertices.push(n.source), n.inTree = !0);
		}
		return this.treeVertices.length;
	}
	leaveEnterEdge() {
		let e, t, n = 0;
		for (let t of this.graph.edges) t.inTree && t.cut < n && (n = t.cut, e = t);
		if (e == null) return null;
		let r = !1, i = Vs.infinity;
		for (let n of this.graph.edges) {
			let a = this.slack(n);
			if (n.inTree === !1 && this.edgeSourceTargetVal(n, e) === -1 && (a < i || a === i && (r = yn(2) === 1))) {
				if (i = a, t = n, i === 0 && !r) break;
				r = !1;
			}
		}
		if (t == null) throw Error();
		return {
			leaving: e,
			entering: t
		};
	}
	exchange(e, t) {
		let n = this.commonPredecessorOfSourceAndTargetOfF(t);
		this.createPathForCutUpdates(e, t, n), this.updateLimLowLeavesAndParentsUnderNode(n), this.updateCuts(e), this.updateLayersUnderNode(n);
	}
	updateLayersUnderNode(e) {
		let t = new N.Stack();
		t.push(e);
		for (let t = 0; t < this.nodeCount; t++) this.low(e) <= this.lim(t) && this.lim(t) <= this.lim(e) && t !== e && (this.layers[t] = Vs.infinity);
		for (; t.length > 0;) {
			let e = t.pop();
			for (let n of this.graph.outEdges[e]) n.inTree && this.layers[n.target] === Vs.infinity && (this.layers[n.target] = this.layers[e] - n.separation, t.push(n.target));
			for (let n of this.graph.inEdges[e]) n.inTree && this.layers[n.source] === Vs.infinity && (this.layers[n.source] = this.layers[e] + n.separation, t.push(n.source));
		}
	}
	updateCuts(e) {
		let t = new N.Stack(), n = new N.Stack();
		for (t.push(e.source), t.push(e.target); t.length > 0;) {
			for (; t.length > 0;) {
				let e = t.pop(), r = this.parent(e);
				if (r == null || r.cut !== Vs.infinity) continue;
				let i = 0;
				for (let t of this.incidentEdges(e)) if (t.inTree === !1) i += this.edgeSourceTargetVal(t, r) * t.weight;
				else if (t === r) i += t.weight;
				else {
					let n = r.source === t.target || r.target === t.source ? 1 : -1, a = this.edgeContribution(t, e);
					i += a * n;
				}
				r.cut = i;
				let a = r.source === e ? r.target : r.source;
				this.allLowCutsHaveBeenDone(a) && n.push(a);
			}
			let e = t;
			t = n, n = e;
		}
	}
	createPathForCutUpdates(e, t, n) {
		let r = t.target;
		for (; r !== n;) {
			let e = this.parent(r);
			e.cut = Vs.infinity, r = e.source === r ? e.target : e.source;
		}
		t.cut = Vs.infinity, e.inTree = !1, t.inTree = !0;
	}
	commonPredecessorOfSourceAndTargetOfF(e) {
		let t, n;
		this.lim(e.source) < this.lim(e.target) ? (t = this.lim(e.source), n = this.lim(e.target)) : (t = this.lim(e.target), n = this.lim(e.source));
		let r = e.source;
		for (; !(this.low(r) <= t && n <= this.lim(r));) {
			let e = this.parent(r);
			e.cut = Vs.infinity, r = e.source === r ? e.target : e.source;
		}
		return r;
	}
	checkCutValues() {
		for (let e of this.graph.edges) if (e.inTree) {
			let t = 0;
			for (let n of this.graph.edges) t += this.edgeSourceTargetVal(n, e) * n.weight;
			e.cut !== t && console.log(U.String.format("cuts are wrong for {0}; should be {1} but is {2}", e, t, e.cut));
		}
	}
	initLayers() {
		return this.layers = new zs(this.graph).GetLayers();
	}
	run() {
		if (this.graph.edges.length === 0 && this.graph.nodeCount === 0) this.layers = [];
		else {
			this.feasibleTree();
			let e;
			for (; (e = this.leaveEnterEdge()) != null;) this.exchange(e.leaving, e.entering);
			this.shiftLayerToZero();
		}
	}
}, Gs = class {
	GetLayers() {
		return new Ws(this.graph, this.Cancel).GetLayers();
	}
	ShrunkComponent(e) {
		let t = [];
		for (let n of e) {
			let r = n[0], i = n[1];
			for (let n of this.graph.outEdges[r]) {
				let r = new Bi(i, e.get(n.target), n.edge);
				r.separation = n.separation, r.weight = n.weight, t.push(r);
			}
		}
		return new ys(t, e.size);
	}
	constructor(e, t) {
		this.graph = e, this.Cancel = t;
	}
}, Ks = class e {
	toString() {
		return "la:ra " + this.la + " " + this.ra + " ta:ba " + this.ta + " " + this.ba + " x:y " + this.x_ + " " + this.y_;
	}
	get leftAnchor() {
		return this.la;
	}
	set leftAnchor(e) {
		this.la = Math.max(e, 0);
	}
	get rightAnchor() {
		return this.ra;
	}
	set rightAnchor(e) {
		this.ra = Math.max(e, 0);
	}
	get topAnchor() {
		return this.ta;
	}
	set topAnchor(e) {
		this.ta = Math.max(e, 0);
	}
	get bottomAnchor() {
		return this.ba;
	}
	set bottomAnchor(e) {
		this.ba = Math.max(e, 0);
	}
	get left() {
		return this.x_ - this.la;
	}
	get right() {
		return this.x_ + this.ra;
	}
	get top() {
		return this.y_ + this.ta;
	}
	set top(e) {
		this.y_ += e - this.ta;
	}
	get bottom() {
		return this.y_ - this.ba;
	}
	set bottom(e) {
		this.y_ += e - this.ba;
	}
	get leftTop() {
		return new y(this.left, this.top);
	}
	get leftBottom() {
		return new y(this.left, this.bottom);
	}
	get rightBottom() {
		return new y(this.right, this.bottom);
	}
	get node() {
		return this.node_;
	}
	set node(e) {
		this.node_ = e, this.polygonalBoundary_ = null;
	}
	get rightTop() {
		return new y(this.right, this.top);
	}
	constructor(e) {
		this.padding = 0, this.alreadySitsOnASpline = !1, this.labelIsToTheLeftOfTheSpline = !1, this.labelIsToTheRightOfTheSpline = !1, this.labelCornersPreserveCoefficient = e;
	}
	static mkAnchor(t, n, r, i, a, o) {
		let s = new e(o);
		return s.la = t, s.ra = n, s.ta = r, s.ba = i, s.node = a, s;
	}
	get x() {
		return this.x_;
	}
	set x(e) {
		this.polygonalBoundary_ = null, this.x_ = e;
	}
	get y() {
		return this.y_;
	}
	set y(e) {
		this.polygonalBoundary_ = null, this.y_ = e;
	}
	get origin() {
		return new y(this.x, this.y);
	}
	get width() {
		return this.la + this.ra;
	}
	get height() {
		return this.ta + this.ba;
	}
	get hasLabel() {
		return this.labelIsToTheLeftOfTheSpline || this.labelIsToTheLeftOfTheSpline;
	}
	get LabelWidth() {
		if (this.labelIsToTheLeftOfTheSpline) return this.leftAnchor;
		if (this.labelIsToTheRightOfTheSpline) return this.rightAnchor;
		throw Error();
	}
	get polygonalBoundary() {
		return this.polygonalBoundary_ == null ? this.polygonalBoundary_ = e.pad(this.creatPolygonalBoundaryWithoutPadding(), this.padding) : this.polygonalBoundary_;
	}
	static pad(t, n) {
		return n === 0 ? t : e.curveIsConvex(t) ? e.padConvexCurve(t, n) : e.padConvexCurve(t.boundingBox.perimeter(), n);
	}
	static padCorner(t, n, r, i, a) {
		let o = e.getPaddedCorner(n, r, i, a);
		t.addPoint(o.a), o.numberOfPoints === 2 && t.addPoint(o.b);
	}
	static padConvexCurve(t, n) {
		let r = new D();
		e.padCorner(r, t.endPoint.prev, t.endPoint, t.startPoint, n), e.padCorner(r, t.endPoint, t.startPoint, t.startPoint.next, n);
		for (let i = t.startPoint; i.next.next != null; i = i.next) e.padCorner(r, i, i.next, i.next.next, n);
		return r.closed = !0, r;
	}
	static getPaddedCorner(e, t, n, r) {
		let i = e.point, a = t.point, o = n.point, s = y.getTriangleOrientation(i, a, o) === _.Counterclockwise, c = a.sub(i), l = c.rotate((s ? -Math.PI : Math.PI) / 2).normalize(), d = c.normalize().add(a.sub(o).normalize());
		if (d.length < u.intersectionEpsilon) return {
			a: a.add(l.mul(r)),
			b: null,
			numberOfPoints: 1
		};
		let f = d.normalize().mul(r), p = f.rotate(Math.PI / 2), m = (r - f.dot(l)) / p.dot(l);
		return {
			a: f.add(p.mul(m)).add(a),
			b: f.sub(p.mul(m)).add(a),
			numberOfPoints: 2
		};
	}
	static *orientations(e) {
		yield y.getTriangleOrientation(e.endPoint.point, e.startPoint.point, e.startPoint.next.point), yield y.getTriangleOrientation(e.endPoint.prev.point, e.endPoint.point, e.startPoint.point);
		let t = e.startPoint;
		for (; t.next.next != null;) yield y.getTriangleOrientation(t.point, t.next.point, t.next.next.point), t = t.next;
	}
	static curveIsConvex(t) {
		let n = _.Collinear;
		for (let r of e.orientations(t)) if (r !== _.Collinear) {
			if (n === _.Collinear) n = r;
			else if (r !== n) return !1;
		}
		return !0;
	}
	creatPolygonalBoundaryWithoutPadding() {
		return this.hasLabel ? this.labelIsToTheLeftOfTheSpline ? this.polygonOnLeftLabel() : this.polygonOnRightLabel() : this.nodeBoundary == null ? this.standardRectBoundary() : E.polylineAroundClosedCurve(this.nodeBoundary);
	}
	get nodeBoundary() {
		return this.node == null ? null : this.node.boundaryCurve;
	}
	standardRectBoundary() {
		let e = new D();
		return e.addPoint(this.leftTop), e.addPoint(this.rightTop), e.addPoint(this.rightBottom), e.addPoint(this.leftBottom), e.closed = !0, e;
	}
	polygonOnLeftLabel() {
		let e = this.left + (1 - this.labelCornersPreserveCoefficient) * this.LabelWidth;
		return D.mkClosedFromPoints([
			new y(e, this.top),
			this.rightTop,
			this.rightBottom,
			new y(e, this.bottom),
			new y(this.left, this.y)
		]);
	}
	polygonOnRightLabel() {
		let e = this.right - (1 - this.labelCornersPreserveCoefficient) * this.LabelWidth;
		return D.mkClosedFromPoints([
			new y(e, this.top),
			new y(this.right, this.y),
			new y(e, this.bottom),
			this.leftBottom,
			this.leftTop
		]);
	}
	move(e) {
		this.x += e.x, this.y += e.y;
	}
}, qs = class e {
	get CurrentEnumRightUp() {
		return +!this.LR + 2 * !this.BT;
	}
	IsVirtual(e) {
		return e >= this.nOfOriginalVertices;
	}
	Source(e) {
		return this.BT ? e.Source : e.Target;
	}
	Target(e) {
		return this.BT ? e.Target : e.Source;
	}
	static CalculateXCoordinates(t, n, r, i, a) {
		new e(t, n, r, i, a).Calculate();
	}
	Calculate() {
		this.SortInAndOutEdges(), this.RightUpSetup(), this.CalcBiasedAlignment(), this.LeftUpSetup(), this.CalcBiasedAlignment(), this.RightDownSetup(), this.CalcBiasedAlignment(), this.LeftDownSetup(), this.CalcBiasedAlignment(), this.HorizontalBalancing();
	}
	SortInAndOutEdges() {
		this.FillLowMedians(), this.FillUpperMedins();
	}
	FillUpperMedins() {
		this.upperMedians = Array(this.graph.NodeCount);
		for (let e = 0; e < this.graph.NodeCount; e++) this.FillUpperMediansForNode(e);
	}
	CompareByX(e, t) {
		return this.la.x[e] - this.la.x[t];
	}
	FillUpperMediansForNode(e) {
		let t = this.graph.InEdgesCount(e);
		if (t > 0) {
			let n = Array(t);
			t = 0;
			for (let r of this.graph.InEdges(e)) n[t++] = r.Source;
			n.sort((e, t) => this.CompareByX(e, t));
			let r = Math.floor(t / 2);
			r * 2 === t ? this.upperMedians[e] = new V(n[r - 1], n[r]) : this.upperMedians[e] = n[r];
		} else this.upperMedians[e] = -1;
	}
	FillLowMedians() {
		this.lowMedians = Array(this.graph.NodeCount);
		for (let e = 0; e < this.graph.NodeCount; e++) this.FillLowMediansForNode(e);
	}
	FillLowMediansForNode(e) {
		let t = this.graph.OutEdgesCount(e);
		if (t > 0) {
			let n = Array(t);
			t = 0;
			for (let r of this.graph.OutEdges(e)) n[t++] = r.Target;
			n.sort((e, t) => this.CompareByX(e, t));
			let r = Math.floor(t / 2);
			r * 2 === t ? this.lowMedians[e] = new V(n[r - 1], n[r]) : this.lowMedians[e] = n[r];
		} else this.lowMedians[e] = -1;
	}
	HorizontalBalancing() {
		let t = -1, n = [
			,
			,
			,
			,
		], r = [
			,
			,
			,
			,
		], i = Number.MAX_VALUE;
		for (let e = 0; e < 4; e++) {
			let a = {
				a: 0,
				b: 0
			};
			this.AssignmentBounds(e, a), n[e] = a.a, r[e] = a.b;
			let o = r[e] - n[e];
			o < i && (t = e, i = o);
		}
		for (let i = 0; i < 4; i++) {
			let a;
			if (a = e.IsLeftMostAssignment(i) ? n[t] - n[i] : r[t] - r[i], this.x = this.xCoords[i], a !== 0) for (let e = 0; e < this.nOfVertices; e++) this.x[e] = this.x[e] + a;
		}
		let a = [
			,
			,
			,
			,
		];
		for (let e = 0; e < this.nOfVertices; e++) a[0] = this.xCoords[0][e], a[1] = this.xCoords[1][e], a[2] = this.xCoords[2][e], a[3] = this.xCoords[3][e], a.sort((e, t) => e - t), this.anchors[e].x = (a[1] + a[2]) / 2;
	}
	static IsLeftMostAssignment(e) {
		return e === 0 || e === 2;
	}
	AssignmentBounds(e, t) {
		if (this.nOfVertices === 0) t.a = 0, t.b = 0;
		else {
			this.x = this.xCoords[e], t.a = t.b = this.x[0];
			for (let e = 1; e < this.nOfVertices; e++) {
				let n = this.x[e];
				n < t.a ? t.a = n : n > t.b && (t.b = n);
			}
		}
	}
	CalcBiasedAlignment() {
		this.ConflictElimination(), this.Align();
	}
	LeftUpSetup() {
		this.LR = !1, this.BT = !0;
	}
	LeftDownSetup() {
		this.LR = !1, this.BT = !1;
	}
	RightDownSetup() {
		this.LR = !0, this.BT = !1;
	}
	RightUpSetup() {
		this.LR = !0, this.BT = !0;
	}
	ConflictElimination() {
		this.RemoveMarksFromEdges(), this.MarkConflictingEdges();
	}
	*UpperEdgeMedians(e) {
		let t = this.BT ? this.upperMedians[e] : this.lowMedians[e];
		if (typeof t != "number") {
			let e = t;
			this.LR ? (yield e.x, yield e.y) : (yield e.y, yield e.x);
		} else {
			let e = t;
			e >= 0 && (yield e);
		}
	}
	MarkConflictingEdges() {
		let e = this.LowerOf(0, this.h - 1), t = e, n = this.UpperOf(0, this.h - 1), r = this.NextLower(n);
		for (; this.IsBelow(e, n); e = this.NextUpper(e)) this.IsBelow(t, e) && this.IsBelow(e, r) && this.ConflictsWithAtLeastOneInnerEdgeForALayer(e);
	}
	NextUpper(e) {
		return this.BT ? e + 1 : e - 1;
	}
	NextLower(e) {
		return this.BT ? e - 1 : e + 1;
	}
	UpperOf(e, t) {
		return this.BT ? Math.max(e, t) : Math.min(e, t);
	}
	LowerOf(e, t) {
		return this.BT ? Math.min(e, t) : Math.max(e, t);
	}
	IsBelow(e, t) {
		return this.BT ? e < t : t < e;
	}
	LeftMost(e, t) {
		return this.LR ? Math.min(e, t) : Math.max(e, t);
	}
	RightMost(e, t) {
		return this.LR ? Math.max(e, t) : Math.min(e, t);
	}
	IsNotRightFrom(e, t) {
		return this.LR ? e <= t : t <= e;
	}
	IsLeftFrom(e, t) {
		return this.LR ? e < t : t < e;
	}
	NextRight(e) {
		return this.LR ? e + 1 : e - 1;
	}
	NextLeft(e) {
		return this.LR ? e - 1 : e + 1;
	}
	ConflictsWithAtLeastOneInnerEdgeForALayer(e) {
		if (e >= 0 && e < this.la.Layers.length) {
			let t = this.la.Layers[e], n = null, r = this.LeftMost(0, t.length - 1), i = this.RightMost(0, t.length - 1);
			for (; this.IsNotRightFrom(r, i) && n == null; r = this.NextRight(r)) n = this.InnerEdgeByTarget(t[r]);
			if (n != null) {
				let e = this.Pos(this.Source(n));
				for (let n = this.LeftMost(0, t.length - 1); this.IsLeftFrom(n, r); n = this.NextRight(n)) for (let r of this.InEdges(t[n])) this.IsLeftFrom(e, this.Pos(this.Source(r))) && this.MarkEdge(r);
				let a = this.Pos(this.Source(n));
				for (; this.IsNotRightFrom(r, i);) {
					let i = this.AlignmentToTheRightOfInner(t, r, e);
					if (r = this.NextRight(r), i != null) {
						let e = this.Pos(this.Source(i));
						this.MarkEdgesBetweenInnerAndNewInnerEdges(t, n, i, a, e), n = i, a = e;
					}
				}
				for (let e = this.NextRight(this.Pos(this.Target(n))); this.IsNotRightFrom(e, i); e = this.NextRight(e)) for (let r of this.InEdges(t[e])) this.IsLeftFrom(this.Pos(this.Source(r)), this.Pos(this.Source(n))) && this.MarkEdge(r);
			}
		}
	}
	InEdgeOfVirtualNode(e) {
		return this.BT ? this.graph.InEdgeOfVirtualNode(e) : this.graph.OutEdgeOfVirtualNode(e);
	}
	InEdges(e) {
		return this.BT ? this.graph.InEdges(e) : this.graph.OutEdges(e);
	}
	MarkEdgesBetweenInnerAndNewInnerEdges(e, t, n, r, i) {
		let a = this.NextRight(this.Pos(this.Target(t)));
		for (; this.IsLeftFrom(a, this.Pos(this.Target(n))); a = this.NextRight(a)) for (let t of this.InEdges(e[a])) {
			let e = this.Pos(this.Source(t));
			(this.IsLeftFrom(e, r) || this.IsLeftFrom(i, e)) && this.MarkEdge(t);
		}
	}
	AlignmentToTheRightOfInner(e, t, n) {
		if (this.NumberOfInEdges(e[t]) === 1) {
			let r = null;
			for (let n of this.InEdges(e[t])) r = n;
			return this.IsInnerEdge(r) && this.IsLeftFrom(n, this.Pos(r.Source)) ? r : null;
		}
		return null;
	}
	NumberOfInEdges(e) {
		return this.BT ? this.graph.InEdgesCount(e) : this.graph.OutEdgesCount(e);
	}
	Pos(e) {
		return this.la.x[e];
	}
	InnerEdgeByTarget(e) {
		if (this.IsVirtual(e)) {
			let t = this.InEdgeOfVirtualNode(e);
			if (this.IsVirtual(this.Source(t))) return t;
		}
		return null;
	}
	IsInnerEdge(e) {
		return this.IsVirtual(e.Source) && this.IsVirtual(e.Target);
	}
	RemoveMarksFromEdges() {
		this.markedEdges.clear();
	}
	constructor(e, t, n, r, i) {
		this.xCoords = [
			,
			,
			,
			,
		], this.la = e, this.graph = t, this.nOfOriginalVertices = n, this.nOfVertices = this.graph.NodeCount, this.markedEdges = new Ei(), this.h = this.la.Layers.length, this.root = Array(this.nOfVertices), this.align = Array(this.nOfVertices), this.anchors = r, this.nodeSep = i;
	}
	Align() {
		this.CreateBlocks(), this.AssignCoordinatesByLongestPath();
	}
	AssignCoordinatesByLongestPath() {
		this.x = this.xCoords[this.CurrentEnumRightUp] = Array(this.nOfVertices);
		let t = [];
		for (let e = 0; e < this.nOfVertices; e++) if (e === this.root[e]) {
			let n = e;
			do {
				let r = { neighbor: 0 };
				this.TryToGetRightNeighbor(n, r) && t.push(new Bi(e, this.root[r.neighbor], null)), n = this.align[n];
			} while (n !== e);
		}
		let n = Dn(t, this.nOfVertices), r = Rs.getOrderOnGraph(n);
		for (let e of r) if (e === this.root[e]) {
			let t = 0, n = !0, r = e;
			do {
				let e = { neighbor: 0 };
				this.TryToGetLeftNeighbor(r, e) && (n ? (t = this.x[this.root[e.neighbor]] + this.DeltaBetweenVertices(e.neighbor, r), n = !1) : t = this.RightMost(t, this.x[this.root[e.neighbor]] + this.DeltaBetweenVertices(e.neighbor, r))), r = this.align[r];
			} while (r !== e);
			this.x[e] = t;
		}
		for (let t of r) if (t === this.root[t] && n.inEdges[t].length === 0) {
			let n = t, r = this.RightMost(-e.infinity, e.infinity), i = r;
			do {
				let e = { neighbor: 0 };
				this.TryToGetRightNeighbor(n, e) && (r = this.LeftMost(r, this.x[this.root[e.neighbor]] - this.DeltaBetweenVertices(n, e.neighbor))), n = this.align[n];
			} while (n !== t);
			i !== r && (this.x[t] = r);
		}
		for (let e = 0; e < this.nOfVertices; e++) e !== this.root[e] && (this.x[e] = this.x[this.root[e]]);
	}
	TryToGetRightNeighbor(e, t) {
		let n = this.NextRight(this.Pos(e)), r = this.la.Layers[this.la.y[e]];
		return n >= 0 && n < r.length ? (t.neighbor = r[n], !0) : !1;
	}
	TryToGetLeftNeighbor(e, t) {
		let n = this.NextLeft(this.Pos(e)), r = this.la.Layers[this.la.y[e]];
		return n >= 0 && n < r.length ? (t.neighbor = r[n], !0) : !1;
	}
	CreateBlocks() {
		for (let e = 0; e < this.nOfVertices; e++) this.root[e] = this.align[e] = e;
		let e = this.LowerOf(0, this.h - 1);
		for (let t = this.NextLower(this.UpperOf(0, this.h - 1)); !this.IsBelow(t, e); t = this.NextLower(t)) {
			let e = this.la.Layers[t], n = this.LeftMost(-1, this.la.Layers[this.NextUpper(t)].length), r = this.RightMost(0, e.length - 1);
			for (let t = this.LeftMost(0, e.length - 1); this.IsNotRightFrom(t, r); t = this.NextRight(t)) {
				let r = e[t];
				for (let e of this.UpperEdgeMedians(r)) if (!this.IsMarked(r, e) && this.IsLeftFrom(n, this.Pos(e))) {
					this.align[e] = r, this.root[r] = this.root[e], this.align[r] = this.root[e], n = this.Pos(e);
					break;
				}
			}
		}
	}
	IsMarked(e, t) {
		return this.BT ? this.markedEdges.hasxy(t, e) : this.markedEdges.hasxy(e, t);
	}
	MarkEdge(e) {
		this.markedEdges.addNN(e.Source, e.Target);
	}
	DeltaBetweenVertices(e, t) {
		let n;
		if (this.Pos(e) > this.Pos(t)) {
			let r = e;
			e = t, t = r, n = -1;
		} else n = 1;
		return (this.anchors[e].rightAnchor + this.anchors[t].leftAnchor + this.nodeSep) * n;
	}
};
qs.infinity = 1e7;
//#endregion
//#region node_modules/@msagl/core/dist/layout/layered/xLayoutGraph.js
var Js = class extends On {
	constructor(e, t, n, r, i) {
		super(), this.weightMultiplierOfOriginalOriginal = 1, this.weightMultOfOneVirtual = 3, this.weightMultiplierOfTwoVirtual = 8, this.SetEdges(r, i), this.virtualVerticesStart = e.nodeCount, this.virtualVerticesEnd = t.NodeCount - 1, this.layeredGraph = t, this.layerArrays = n;
	}
	EdgeWeightMultiplier(e) {
		let t = e.source, n = e.target;
		if (t < this.layeredGraph.NodeCount && this.layerArrays.y[t] === this.layerArrays.y[n] && this.layerArrays.x[t] === this.layerArrays.x[n] + 1) return 0;
		let r = 0, i = -1, a = -1;
		for (let e of this.outEdges[t]) a === -1 ? a = e.target : i = e.target;
		return a >= this.virtualVerticesStart && a <= this.virtualVerticesEnd && r++, i >= this.virtualVerticesStart && i <= this.virtualVerticesEnd && r++, r === 0 ? this.weightMultiplierOfOriginalOriginal : r === 1 ? this.weightMultOfOneVirtual : this.weightMultiplierOfTwoVirtual;
	}
	SetEdgeWeights() {
		for (let e of this.edges) e.weight *= this.EdgeWeightMultiplier(e);
	}
}, $;
(function(e) {
	e[e.Top = 0] = "Top", e[e.Internal = 1] = "Internal", e[e.Bottom = 2] = "Bottom";
})($ ||= {});
//#endregion
//#region node_modules/@msagl/core/dist/layout/layered/HierarchyCalculator.js
var Ys = class e {
	static Calculate(t, n = 0) {
		return new e(t, n).Calculate();
	}
	constructor(e, t) {
		this.groupSplitThreshold = 2, this.initialNodes = e, this.groupSplitThreshold = t;
	}
	Calculate() {
		return this.Calc(this.initialNodes);
	}
	Calc(e) {
		if (e.length === 0) return null;
		if (e.length === 1) return e[0];
		let t = e[0].parallelogram, n = 1, r = x.parallelogramOfTwo(t, e[n].parallelogram).area;
		for (let i = 2; i < e.length; i++) {
			let a = x.parallelogramOfTwo(t, e[i].parallelogram).area;
			a > r && (n = i, r = a);
		}
		let i;
		for (let t = 0; t < e.length; t++) if (t !== n) {
			i = t;
			break;
		}
		r = x.parallelogramOfTwo(e[n].parallelogram, e[i].parallelogram).area;
		for (let t = 0; t < e.length; t++) {
			if (t === n) continue;
			let a = x.parallelogramOfTwo(e[n].parallelogram, e[t].parallelogram).area;
			a > r && (i = t, r = a);
		}
		let a = [], o = [];
		a.push(e[n]), o.push(e[i]);
		let s = e[n].parallelogram, c = e[i].parallelogram;
		for (let t = 0; t < e.length; t++) {
			if (t === n || t === i) continue;
			let r = x.parallelogramOfTwo(s, e[t].parallelogram), l = r.area - s.area, u = x.parallelogramOfTwo(c, e[t].parallelogram), d = u.area - c.area;
			a.length * this.groupSplitThreshold < o.length ? (a.push(e[t]), s = r) : o.length * this.groupSplitThreshold < a.length ? (o.push(e[t]), c = u) : l < d ? (a.push(e[t]), s = r) : (o.push(e[t]), c = u);
		}
		return {
			parallelogram: x.parallelogramOfTwo(s, c),
			node: { children: [this.Calc(a), this.Calc(o)] },
			seg: void 0,
			leafBoxesOffset: void 0
		};
	}
}, Xs = class e {
	constructor(e, t, n, r, i, a, o, s) {
		this.topNode = e, this.bottomNode = t, this.topSite = n, this.bottomSite = n.next, this.currentTopSite = n, this.currentBottomSite = n.next, this.layerArrays = r, this.layeredGraph = i, this.originalGraph = a, this.anchors = o, this.layerSeparation = s;
	}
	static Refine(t, n, r, i, a, o, s, c) {
		new e(t, n, r, a, o, s, i, c).Refine();
	}
	Refine() {
		for (this.Init(); this.InsertSites(););
	}
	FixCorner(e, t, n) {
		if (e.equal(t)) return t;
		let r = y.ClosestPointAtLineSegment(t, e, n), i = t.sub(r), a = Math.abs(i.y), o = this.layerSeparation / 2;
		return a > o && (i = i.mul(o / (a * 2))), i.add(t);
	}
	InsertSites() {
		return yn(2) === 0 ? this.CalculateNewTopSite() || this.CalculateNewBottomSite() : this.CalculateNewBottomSite() || this.CalculateNewTopSite();
	}
	CalculateNewBottomSite() {
		let t = this.currentBottomSite.point.sub(this.currentTopSite.point), n = e.absCotan(t), r, i = !1;
		for (let t of this.bottomCorners()) {
			let a = e.absCotan(t.sub(this.currentBottomSite.point));
			a < n && (n = a, r = t, i = !0);
		}
		return i ? m(n, e.absCotan(t)) ? !1 : (this.currentBottomSite = k.mkSiteSPS(this.currentTopSite, this.FixCorner(this.currentTopSite.point, r, this.currentBottomSite.point), this.currentBottomSite), !0) : !1;
	}
	static absCotan(e) {
		return Math.abs(e.x / e.y);
	}
	CalculateNewTopSite() {
		let t = this.currentBottomSite.point.sub(this.currentTopSite.point), n = e.absCotan(t), r, i = !1;
		for (let t of this.topCorners()) {
			let a = e.absCotan(t.sub(this.currentTopSite.point));
			a < n && (n = a, r = t, i = !0);
		}
		return i ? m(n, e.absCotan(t)) ? !1 : (this.currentTopSite = k.mkSiteSPS(this.currentTopSite, this.FixCorner(this.currentTopSite.point, r, this.currentBottomSite.point), this.currentBottomSite), !0) : !1;
	}
	Init() {
		this.IsTopToTheLeftOfBottom() ? (this.topCorners = () => this.CornersToTheRightOfTop(), this.bottomCorners = () => this.CornersToTheLeftOfBottom()) : (this.topCorners = () => this.CornersToTheLeftOfTop(), this.bottomCorners = () => this.CornersToTheRightOfBottom());
	}
	IsTopToTheLeftOfBottom() {
		return this.topSite.point.x < this.topSite.next.point.x;
	}
	*NodeCorners(e) {
		for (let t of this.anchors[e].polygonalBoundary.polylinePoints()) yield t.point;
	}
	*CornersToTheLeftOfBottom() {
		let t = this.layerArrays.x[this.bottomNode], n = this.currentTopSite.point.x, r = this.currentBottomSite.point.x;
		for (let i of this.LeftFromTheNode(this.NodeLayer(this.bottomNode), t, $.Bottom, n, r)) for (let t of this.NodeCorners(i)) t.y > this.currentBottomSite.point.y && e.PossibleCorner(n, r, t) && (yield t);
	}
	*CornersToTheLeftOfTop() {
		let t = this.layerArrays.x[this.topNode], n = this.currentBottomSite.point.x, r = this.currentTopSite.point.x;
		for (let i of this.LeftFromTheNode(this.NodeLayer(this.topNode), t, $.Top, n, r)) for (let t of this.NodeCorners(i)) t.y < this.currentTopSite.point.y && e.PossibleCorner(n, r, t) && (yield t);
	}
	*CornersToTheRightOfBottom() {
		let t = this.layerArrays.x[this.bottomNode], n = this.currentBottomSite.point.x, r = this.currentTopSite.point.x;
		for (let i of this.RightFromTheNode(this.NodeLayer(this.bottomNode), t, $.Bottom, n, r)) for (let t of this.NodeCorners(i)) t.y > this.currentBottomSite.point.y && e.PossibleCorner(n, r, t) && (yield t);
	}
	*CornersToTheRightOfTop() {
		let t = this.layerArrays.x[this.topNode], n = this.currentTopSite.point.x, r = this.currentBottomSite.point.x;
		for (let i of this.RightFromTheNode(this.NodeLayer(this.topNode), t, $.Top, n, r)) for (let t of this.NodeCorners(i)) t.y < this.currentTopSite.point.y && e.PossibleCorner(n, r, t) && (yield t);
	}
	static PossibleCorner(e, t, n) {
		return n.x > e && n.x < t;
	}
	NodeLayer(e) {
		return this.layerArrays.Layers[this.layerArrays.y[e]];
	}
	IsLabel(e) {
		return this.anchors[e].hasLabel;
	}
	NodeUCanBeCrossedByNodeV(e, t) {
		return this.IsLabel(e) || this.IsLabel(t) ? !1 : !!(this.IsVirtualVertex(e) && this.IsVirtualVertex(t) && this.AdjacentEdgesIntersect(e, t));
	}
	AdjacentEdgesIntersect(e, t) {
		return this.Intersect(this.IncomingEdge(e), this.IncomingEdge(t)) || this.Intersect(this.OutcomingEdge(e), this.OutcomingEdge(t));
	}
	Intersect(e, t) {
		return (this.layerArrays.x[e.Source] - this.layerArrays.x[t.Source]) * (this.layerArrays.x[e.Target] - this.layerArrays.x[t.Target]) < 0;
	}
	IncomingEdge(e) {
		for (let t of this.layeredGraph.InEdges(e)) return t;
		throw Error();
	}
	OutcomingEdge(e) {
		for (let t of this.layeredGraph.OutEdges(e)) return t;
		throw Error();
	}
	IsVirtualVertex(e) {
		return e >= this.originalGraph.shallowNodeCount;
	}
	*RightFromTheNode(e, t, n, r, i) {
		let a = 0, o = 0;
		n === $.Bottom && (a = Number.MAX_VALUE), n === $.Top && (o = Number.MAX_VALUE);
		let s = e[t];
		for (let n = t + 1; n < e.length; n++) {
			let t = e[n];
			if (this.NodeUCanBeCrossedByNodeV(t, s)) continue;
			let c = this.anchors[t];
			if (c.left >= i) break;
			c.right > r && (c.topAnchor > o + u.distanceEpsilon ? (o = c.topAnchor, yield t) : c.bottomAnchor > a + u.distanceEpsilon && (a = c.bottomAnchor, yield t));
		}
	}
	*LeftFromTheNode(e, t, n, r, i) {
		let a = 0, o = 0;
		n === $.Bottom && (a = Number.MAX_VALUE), n === $.Top && (o = Number.MAX_VALUE);
		let s = e[t];
		for (let n = t - 1; n > -1; n--) {
			let t = e[n];
			if (this.NodeUCanBeCrossedByNodeV(t, s)) continue;
			let c = this.anchors[t];
			if (c.right <= r) break;
			c.left < i && (c.topAnchor > o + u.distanceEpsilon ? (o = c.topAnchor, yield t) : c.bottomAnchor > a + u.distanceEpsilon && (a = c.bottomAnchor, yield t));
		}
	}
}, Zs = class e {
	constructor(e, t, n, r, i, a, o) {
		this.thinRightNodes = [], this.thinWestNodes = [], this.database = o, this.edgePath = e, this.anchors = t, this.layerArrays = i, this.originalGraph = n, this.settings = r, this.layeredGraph = a, this.eastHierarchy = this.BuildEastHierarchy(), this.westHierarchy = this.BuildWestHierarchy();
	}
	BuildEastHierarchy() {
		let e = this.FindEastBoundaryAnchorCurves(), t = [];
		for (let n of e) t.push(n.pNodeOverICurve());
		return this.thinEastHierarchy = Ys.Calculate(this.thinRightNodes), Ys.Calculate(t);
	}
	BuildWestHierarchy() {
		let e = this.FindWestBoundaryAnchorCurves(), t = [];
		for (let n of e) t.push(n.pNodeOverICurve());
		return this.thinWestHierarchy = Ys.Calculate(this.thinWestNodes), Ys.Calculate(t);
	}
	FindEastBoundaryAnchorCurves() {
		let e = [], t = 0;
		for (let n of this.edgePath) {
			let r = null;
			for (let i of this.EastBoundaryNodesOfANode(n, Qs.GetNodeKind(t, this.edgePath))) {
				let t = this.anchors[i];
				(r == null || r.origin.x > t.origin.x) && (r = t), e.push(t.polygonalBoundary);
			}
			r != null && this.thinRightNodes.push(S.mkLinePXY(r.origin, this.originalGraph.right, r.y).pNodeOverICurve()), t++;
		}
		return e;
	}
	FindWestBoundaryAnchorCurves() {
		let e = [], t = 0;
		for (let n of this.edgePath.nodes()) {
			let r = -1;
			for (let i of this.LeftBoundaryNodesOfANode(n, Qs.GetNodeKind(t, this.edgePath))) (r === -1 || this.layerArrays.x[i] > this.layerArrays.x[r]) && (r = i), e.push(this.anchors[i].polygonalBoundary);
			if (r !== -1) {
				let e = this.anchors[r];
				this.thinWestNodes.push(S.mkLinePXY(e.origin, this.originalGraph.left, e.origin.y).pNodeOverICurve());
			}
			t++;
		}
		return e;
	}
	*FillRightTopAndBottomVerts(e, t, n) {
		let r = 0, i = 0;
		n === $.Bottom ? r = Number.MAX_VALUE : n === $.Top && (i = Number.MAX_VALUE);
		let a = e[t];
		for (let n = t + 1; n < e.length; n++) {
			let t = e[n], o = this.anchors[t];
			o.topAnchor > i ? this.NodeUCanBeCrossedByNodeV(t, a) || (i = o.topAnchor, o.bottomAnchor > r && (r = o.bottomAnchor), yield t) : o.bottomAnchor > r && (this.NodeUCanBeCrossedByNodeV(t, a) || (r = o.bottomAnchor, o.topAnchor > i && (i = o.topAnchor), yield t));
		}
	}
	*FillLeftTopAndBottomVerts(e, t, n) {
		let r = 0, i = 0;
		n === $.Top ? i = Number.MAX_VALUE : n === $.Bottom && (r = Number.MAX_VALUE);
		let a = e[t];
		for (let n = t - 1; n >= 0; n--) {
			let t = e[n], o = this.anchors[t];
			o.topAnchor > i + u.distanceEpsilon ? this.NodeUCanBeCrossedByNodeV(t, a) || (i = o.topAnchor, r = Math.max(r, o.bottomAnchor), yield t) : o.bottomAnchor > r + u.distanceEpsilon && (this.NodeUCanBeCrossedByNodeV(t, a) || (i = Math.max(i, o.topAnchor), r = o.bottomAnchor, yield t));
		}
	}
	IsVirtualVertex(e) {
		return e >= this.originalGraph.shallowNodeCount;
	}
	IsLabel(e) {
		return this.anchors[e].hasLabel;
	}
	NodeUCanBeCrossedByNodeV(e, t) {
		return this.IsLabel(e) || this.IsLabel(t) ? !1 : !!(this.IsVirtualVertex(e) && this.IsVirtualVertex(t) && this.EdgesIntersectSomewhere(e, t));
	}
	EdgesIntersectSomewhere(e, t) {
		return this.UVAreMiddlesOfTheSameMultiEdge(e, t) ? !1 : this.IntersectAbove(e, t) || this.IntersectBelow(e, t);
	}
	UVAreMiddlesOfTheSameMultiEdge(e, t) {
		return !!(this.database.MultipleMiddles.has(e) && this.database.MultipleMiddles.has(t) && this.SourceOfTheOriginalEdgeContainingAVirtualNode(e) === this.SourceOfTheOriginalEdgeContainingAVirtualNode(t));
	}
	SourceOfTheOriginalEdgeContainingAVirtualNode(e) {
		for (; this.IsVirtualVertex(e);) e = this.IncomingEdge(e).Source;
		return e;
	}
	IntersectBelow(e, t) {
		do {
			let n = this.OutcomingEdge(e), r = this.OutcomingEdge(t);
			if (this.Intersect(n, r)) return !0;
			e = n.Target, t = r.Target;
		} while (this.IsVirtualVertex(e) && this.IsVirtualVertex(t));
		return e === t;
	}
	IntersectAbove(e, t) {
		do {
			let n = this.IncomingEdge(e), r = this.IncomingEdge(t);
			if (this.Intersect(n, r)) return !0;
			e = n.Source, t = r.Source;
		} while (this.IsVirtualVertex(e) && this.IsVirtualVertex(t));
		return e === t;
	}
	Intersect(e, t) {
		let n = this.layerArrays.x[e.Source] - this.layerArrays.x[t.Source], r = this.layerArrays.x[e.Target] - this.layerArrays.x[t.Target];
		return n > 0 && r < 0 || n < 0 && r > 0;
	}
	IncomingEdge(e) {
		return this.layeredGraph.InEdgeOfVirtualNode(e);
	}
	OutcomingEdge(e) {
		return this.layeredGraph.OutEdgeOfVirtualNode(e);
	}
	EastBoundaryNodesOfANode(e, t) {
		return this.FillRightTopAndBottomVerts(this.NodeLayer(e), this.layerArrays.x[e], t);
	}
	NodeLayer(e) {
		return this.layerArrays.Layers[this.layerArrays.y[e]];
	}
	LeftBoundaryNodesOfANode(e, t) {
		return this.FillLeftTopAndBottomVerts(this.NodeLayer(e), this.layerArrays.x[e], t);
	}
	getSpline(e) {
		return this.createRefinedPolyline(e), this.createSmoothedPolyline();
	}
	get GetPolyline() {
		return new he(this.headSite);
	}
	LineSegIntersectBound(t, n) {
		let r = S.mkPP(t, n);
		return e.CurveIntersectsHierarchy(r, this.westHierarchy) || e.CurveIntersectsHierarchy(r, this.thinWestHierarchy) || e.CurveIntersectsHierarchy(r, this.eastHierarchy) || e.CurveIntersectsHierarchy(r, this.thinEastHierarchy);
	}
	SegIntersectWestBound(t, n) {
		return e.SegIntersectsBound(t, n, this.westHierarchy) || e.SegIntersectsBound(t, n, this.thinWestHierarchy);
	}
	SegIntersectEastBound(t, n) {
		return e.SegIntersectsBound(t, n, this.eastHierarchy) || e.SegIntersectsBound(t, n, this.thinEastHierarchy);
	}
	TryToRemoveInflectionCorner(e) {
		if (!e.s.next || !e.s.prev || e.s.turn === _.Counterclockwise && this.SegIntersectEastBound(e.s.prev, e.s.next) || e.s.turn === _.Clockwise && this.SegIntersectWestBound(e.s.prev, e.s.next)) {
			e.cut = !1, e.s = e.s.next;
			return;
		}
		let t = e.s.next;
		e.s.prev.next = t, t.prev = e.s.prev, e.s = t, e.cut = !0;
	}
	static SegIntersectsBound(t, n, r) {
		return e.CurveIntersectsHierarchy(S.mkPP(t.point, n.point), r);
	}
	static CurveIntersectsHierarchy(t, n) {
		if (n == null || !x.intersect(t.pNodeOverICurve().parallelogram, n.parallelogram)) return !1;
		if (n.node.hasOwnProperty("children")) {
			let r = n.node;
			return e.CurveIntersectsHierarchy(t, r.children[0]) || e.CurveIntersectsHierarchy(t, r.children[1]);
		}
		return E.intersectionOne(t, n.seg, !1) != null;
	}
	static Flat(e) {
		return y.getTriangleOrientation(e.prev.point, e.point, e.next.point) === _.Collinear;
	}
	Reverse() {
		let t = new e(this.edgePath, this.anchors, this.originalGraph, this.settings, this.layerArrays, this.layeredGraph, this.database), n = this.headSite, r = null;
		for (; n != null;) t.headSite = n.clone(), t.headSite.next = r, r != null && (r.prev = t.headSite), r = t.headSite, n = n.next;
		return t;
	}
	createRefinedPolyline(e) {
		this.CreateInitialListOfSites();
		let t = this.headSite, n;
		for (let e = 0; e < this.edgePath.count; e++) n = t.next, this.RefineBeetweenNeighborLayers(t, this.EdgePathNode(e), this.EdgePathNode(e + 1)), t = n;
		this.TryToRemoveInflections(), e && this.OptimizeShortPath();
	}
	RefineBeetweenNeighborLayers(e, t, n) {
		Xs.Refine(t, n, e, this.anchors, this.layerArrays, this.layeredGraph, this.originalGraph, this.settings.LayerSeparation);
	}
	CreateInitialListOfSites() {
		let e = this.headSite = k.mkSiteP(this.EdgePathPoint(0));
		for (let t = 1; t <= this.edgePath.count; t++) e = k.mkSiteSP(e, this.EdgePathPoint(t));
	}
	get TailSite() {
		let e = this.headSite;
		for (; e.next != null;) e = e.next;
		return e;
	}
	OptimizeForThreeSites() {
		let e = this.EdgePathNode(0), t = this.EdgePathNode(2), n = this.anchors[e], r = this.anchors[t];
		if (m(n.x, r.x)) return;
		let i = {
			ax: n.x,
			bx: r.x,
			sign: 0
		};
		if (!this.FindLegalPositions(n, r, i)) return;
		let a = (n.y - r.y) / (n.bottom - r.top), o = .5 * (i.ax + i.bx), s = i.sign * ((i.ax - i.bx) * .5);
		i.ax = o + a * (s * i.sign), i.bx = o - a * (s * i.sign), this.headSite.point = new y(i.ax, n.y);
		let c = this.headSite.next, l = c.point.y;
		c.point = new y(this.MiddlePos(i.ax, i.bx, n, r, l), l), c.next.point = new y(i.bx, r.y);
		let u = this.anchors[this.EdgePathNode(1)];
		u.x = c.point.x;
	}
	OptimizeForTwoSites() {
		let e = this.EdgePathNode(0), t = this.EdgePathNode(1), n = this.anchors[e], r = this.anchors[t];
		if (m(n.x, r.x)) return;
		let i = {
			ax: n.x,
			bx: r.x,
			sign: 0
		};
		if (!this.FindPositions(n, r, i)) return;
		let a = (n.y - r.y) / (n.bottom - r.top), o = .5 * (i.ax + i.bx), s = i.sign * ((i.ax - i.bx) * .5);
		i.ax = o + a * (s * i.sign), i.bx = o - a * (s * i.sign), this.headSite.point = new y(i.ax, n.y), this.headSite.next.point = new y(i.bx, r.y);
	}
	FindLegalPositions(e, t, n) {
		return this.FindPositions(e, t, n) ? this.PositionsAreLegal(n.ax, n.bx, n.sign, e, t, this.EdgePathNode(1)) : !1;
	}
	FindPositions(e, t, n) {
		let r, i;
		if (n.ax < n.bx ? (n.sign = 1, i = Math.max(n.ax, t.left), r = Math.min(e.right, n.bx)) : (n.sign = -1, i = Math.max(e.left, n.bx), r = Math.min(t.right, n.ax)), i <= r) n.bx = .5 * (i + r), n.ax = .5 * (i + r);
		else {
			if (this.OriginToOriginSegCrossesAnchorSide(e, t)) return !1;
			n.sign === 1 ? (n.ax = e.right - .1 * e.rightAnchor, n.bx = t.left) : (n.ax = e.left + .1 * e.leftAnchor, n.bx = t.right);
		}
		return !0;
	}
	OriginToOriginSegCrossesAnchorSide(e, t) {
		let n = S.mkPP(e.origin, t.origin);
		return e.x < t.x && E.CurvesIntersect(n, S.mkPP(e.rightBottom, e.rightTop)) || E.CurvesIntersect(n, S.mkPP(t.leftBottom, e.leftTop)) || e.x > t.x && E.CurvesIntersect(n, S.mkPP(e.leftBottom, e.leftTop)) || E.CurvesIntersect(n, S.mkPP(t.rightBottom, e.rightTop));
	}
	OptimizeShortPath() {
		this.edgePath.count > 2 || (this.edgePath.count === 2 && this.headSite.next.next != null && this.headSite.next.next.next == null && this.anchors[this.EdgePathNode(1)].node == null ? this.OptimizeForThreeSites() : this.edgePath.count === 1 && this.OptimizeForTwoSites());
	}
	PositionsAreLegal(e, t, n, r, i, a) {
		if (!m(e, t) && (e - t) * n > 0) return !1;
		let o = this.anchors[a], s = this.MiddlePos(e, t, r, i, o.y);
		return this.MiddleAnchorLegal(s, a, o) ? !this.LineSegIntersectBound(new y(e, r.bottom), new y(t, i.top)) : !1;
	}
	MiddleAnchorLegal(e, t, n) {
		let r = this.NodeLayer(t), i = this.layerArrays.x[t], a = e - n.x;
		return !(i > 0 && this.anchors[r[i - 1]].right > a + n.left || i < r.length - 1 && this.anchors[r[i + 1]].left < a + n.right);
	}
	MiddlePos(e, t, n, r, i) {
		let a = n.y - i, o = i - r.y;
		return (e * a + t * o) / (a + o);
	}
	TryToRemoveInflections() {
		if (this.TurningAlwaySameDirection()) return;
		let e = !0;
		for (; e;) {
			e = !1;
			for (let t = {
				s: this.headSite,
				cut: !1
			}; t.s;) this.TryToRemoveInflectionCorner(t), e = t.cut || e;
		}
	}
	TurningAlwaySameDirection() {
		let e = 0;
		for (let t = this.headSite.next; t != null && t.next != null; t = t.next) {
			let n = t.turn;
			if (e === 0) n > 0 ? e = 1 : n < 0 && (e = -1);
			else if (e * n < 0) return !1;
		}
		return !0;
	}
	EdgePathPoint(e) {
		return this.anchors[this.EdgePathNode(e)].origin;
	}
	EdgePathNode(e) {
		return e === this.edgePath.count ? this.edgePath.LayerEdges[this.edgePath.count - 1].Target : this.edgePath.LayerEdges[e].Source;
	}
	createSmoothedPolyline() {
		this.RemoveVerticesWithNoTurns();
		let e = new E(), t = this.headSite, n = E.findCorner(t);
		return n === void 0 ? e.addSegment(S.mkPP(this.headSite.point, this.TailSite.point)) : (this.createFilletCurve(e, {
			a: t,
			b: n.b,
			c: n.c
		}), e = this.ExtendCurveToEndpoints(e)), e;
	}
	curveIsLegal(e) {
		return !0;
	}
	RemoveVerticesWithNoTurns() {
		for (; this.RemoveVerticesWithNoTurnsOnePass(););
	}
	RemoveVerticesWithNoTurnsOnePass() {
		let t = !1;
		for (let n = this.headSite; n.next != null && n.next.next != null; n = n.next) e.Flat(n.next) && (t = !0, n.next = n.next.next, n.next.prev = n);
		return t;
	}
	ExtendCurveToEndpoints(e) {
		let t = this.headSite.point;
		if (!y.closeDistEps(t, e.start)) {
			let n = new E();
			n.addSegs([S.mkPP(t, e.start), e]), e = n;
		}
		return t = this.TailSite.point, y.closeDistEps(t, e.end) || e.addSegment(S.mkPP(e.end, t)), e;
	}
	createFilletCurve(e, t) {
		for (; this.AddSmoothedCorner(t.a, t.b, t.c, e), t.a = t.b, t.b = t.c, t.b.next != null;) t.c = t.b.next;
	}
	AddSmoothedCorner(e, t, n, r) {
		let i = .5, a;
		do
			a = E.createBezierSeg(i, i, e, t, n), t.previouisBezierCoefficient = i, i /= 2;
		while (this.BezierSegIntersectsBoundary(a));
		if (i *= 2, i < .5) {
			i = .5 * (i + i * 2);
			let r = E.createBezierSeg(i, i, e, t, n);
			this.BezierSegIntersectsBoundary(r) || (t.nextBezierCoefficient = i, t.previouisBezierCoefficient = i, a = r);
		}
		r.segs.length > 0 && !y.closeDistEps(r.end, a.start) && r.addSegment(S.mkPP(r.end, a.start)), r.addSegment(a);
	}
	BezierSegIntersectsBoundary(e) {
		return y.signedDoubledTriangleArea(e.B(0), e.B(1), e.B(2)) < 0 ? this.BezierSegIntersectsTree(e, this.thinWestHierarchy) || this.BezierSegIntersectsTree(e, this.westHierarchy) : this.BezierSegIntersectsTree(e, this.thinEastHierarchy) || this.BezierSegIntersectsTree(e, this.eastHierarchy);
	}
	BezierSegIntersectsTree(t, n) {
		if (n == null) return !1;
		if (x.intersect(t.pNodeOverICurve().parallelogram, n.parallelogram)) if (n.node.hasOwnProperty("children")) {
			let e = n.node;
			return this.BezierSegIntersectsTree(t, e.children[0]) || this.BezierSegIntersectsTree(t, e.children[1]);
		} else return e.BezierSegIntersectsBoundary(t, n.seg);
		else return !1;
	}
	static BezierSegIntersectsBoundary(e, t) {
		for (let n of E.getAllIntersections(e, t, !1)) if (t instanceof E) {
			let e = t;
			if (E.realCutWithClosedCurve(n, e, !1)) return !0;
		} else return !0;
		return !1;
	}
}, Qs = class e extends B {
	constructor(e, t, n, r, i, a) {
		super(null), this.settings = e, this.OriginalGraph = t, this.Database = n, this.ProperLayeredGraph = i, this.LayerArrays = r, this.IntGraph = a;
	}
	run() {
		this.createSplines();
	}
	createSplines() {
		this.createRegularSplines(), this.createSelfSplines(), this.IntGraph != null && this.RouteFlatEdges(), this.OriginalGraph.graph.parent ?? this.RouteUnroutedEdges();
	}
	RouteUnroutedEdges() {
		let e = [];
		for (let t of this.OriginalGraph.deepEdges) t.curve || e.push(t);
		if (e.length == 0) return;
		let t = (this.OriginalGraph.layoutSettings ? this.OriginalGraph.layoutSettings : new Ji()).commonSettings.edgeRoutingSettings;
		new gs(this.OriginalGraph, e, t.padding, t.polylinePadding, t.coneAngle, t.bundlingSettings, this.cancelToken).run(), La.constructorGA(this.OriginalGraph, e).run();
	}
	RouteFlatEdges() {}
	createRegularSplines() {
		for (let e of this.Database.RegularMultiedges()) {
			if ($s(e)) continue;
			let t = e.length, n = t === 1 && this.MayOptimizeEdge(e[0]);
			for (let r = Math.floor(t / 2); r < t; r++) this.createSplineForNonSelfEdge(e[r], n);
			for (let r = Math.floor(t / 2) - 1; r >= 0; r--) this.createSplineForNonSelfEdge(e[r], n);
		}
	}
	MayOptimizeEdge(e) {
		return !(this.ProperLayeredGraph.OutDegreeIsMoreThanOne(e.source) || this.ProperLayeredGraph.InDegreeIsMoreThanOne(e.target) || ec(e.edge.source) || ec(e.edge.target));
	}
	createSelfSplines() {
		for (let [e, t] of this.Database.Multiedges.keyValues()) {
			let n = e;
			if (n.x === n.y) {
				let e = this.Database.Anchors[n.x], r = e.leftAnchor;
				for (let n of t) {
					let t = this.settings.NodeSeparation + (this.settings.MinNodeWidth + r), i = e.bottomAnchor / 2, a = e.origin, o = a.add(new y(0, i)), s = a.add(new y(t, i)), c = a.add(new y(t, -i)), l = a.add(new y(0, -i)), u = k.mkSiteP(a), d = new he(u);
					u = k.mkSiteSP(u, o), u = k.mkSiteSP(u, s), u = k.mkSiteSP(u, c), u = k.mkSiteSP(u, l), k.mkSiteSP(u, a);
					let f = d.createCurve();
					if (n.curve = f, r = t, n.edge.label != null) {
						r += n.edge.label.width;
						let t = new y(f.value((f.parStart + f.parEnd) / 2).x + n.labelWidth / 2, e.y), i = new y(n.edge.label.width / 2, n.edge.label.height / 2), a = O.mkPP(t.add(i), t.sub(i));
						n.edge.label.width = a.width, n.edge.label.height = a.height, n.edge.label.positionCenter(t);
					}
					Qn.trimSplineAndCalculateArrowheadsII(n.edge, n.edge.source.boundaryCurve, n.edge.target.boundaryCurve, f, !1);
				}
			}
		}
	}
	createSplineForNonSelfEdge(e, t) {
		e.LayerEdges != null && (this.drawSplineBySmothingThePolyline(e, t), e.IsVirtualEdge || (e.updateEdgeLabelPosition(this.Database.Anchors), Qn.trimSplineAndCalculateArrowheadsII(e.edge, e.edge.source.boundaryCurve, e.edge.target.boundaryCurve, e.curve, !0)));
	}
	drawSplineBySmothingThePolyline(e, t) {
		let n = new Zs(e, this.Database.Anchors, this.OriginalGraph, this.settings, this.LayerArrays, this.ProperLayeredGraph, this.Database).getSpline(t);
		e.reversed ? e.curve = n.reverse() : e.curve = n;
	}
	static UpdateLabel(t, n) {
		let r = null;
		n.labelIsToTheRightOfTheSpline ? (t.label.positionCenter(new y(n.x + n.rightAnchor / 2, n.y)), r = S.mkPP(t.label.boundingBox.leftTop, t.label.boundingBox.leftBottom)) : n.labelIsToTheLeftOfTheSpline && (t.label.positionCenter(new y(n.x - n.leftAnchor / 2, n.y)), r = S.mkPP(t.label.boundingBox.rightTop, t.label.boundingBox.rightBottom));
		let i = e.GetSegmentInFrontOfLabel(t.curve, t.label.center.y);
		if (i != null && E.getAllIntersections(t.curve, E.polyFromBox(t.label.boundingBox), !1).length === 0) {
			let n = {
				curveClosestPoint: void 0,
				labelSideClosest: void 0
			};
			if (e.FindClosestPoints(n, i, r)) e.ShiftLabel(t, n);
			else {
				let a = i.closestParameter(r.start), o = i.closestParameter(r.end);
				i.value(a).sub(r.start).length < i.value(o).sub(r.end).length ? (n.curveClosestPoint = i.value(a), n.labelSideClosest = r.start) : (n.curveClosestPoint = i.value(o), n.labelSideClosest = r.end), e.ShiftLabel(t, n);
			}
		}
	}
	static ShiftLabel(e, t) {
		let n = e.lineWidth / 2, r = t.curveClosestPoint.sub(t.labelSideClosest), i = r.length;
		i > n && e.label.positionCenter(e.label.center.add(r.div(i * (i - n))));
	}
	static FindClosestPoints(e, t, n) {
		let r = E.minDistWithinIntervals(t, n, t.parStart, t.parEnd, n.parStart, n.parEnd, (t.parStart + t.parEnd) / 2, (n.parStart + n.parEnd) / 2);
		return r ? (e.curveClosestPoint = r.aX, e.labelSideClosest = r.bX, !0) : !1;
	}
	static GetSegmentInFrontOfLabel(e, t) {
		if (e instanceof E) {
			let n = e;
			for (let e of n.segs) if ((e.start.y - t) * (e.end.y - t) <= 0) return e;
		}
		return null;
	}
	static GetNodeKind(e, t) {
		return e === 0 ? $.Top : e < t.count ? $.Internal : $.Bottom;
	}
};
function $s(e) {
	if (e.length < 4) return !1;
	for (let t of e) if (t.edge.label) return !1;
	return !0;
}
function ec(e) {
	return e.node.selfEdges.size > 0;
}
//#endregion
//#region node_modules/@msagl/core/dist/layout/layered/layeredLayout.js
var tc = class extends B {
	get extremeAspectRatio() {
		let e = this.originalGraph.boundingBox, t = e.width / e.height;
		return t < 1 / 50 || t > 50;
	}
	get verticalConstraints() {
		return this.sugiyamaSettings.verticalConstraints;
	}
	get HorizontalConstraints() {
		return this.sugiyamaSettings.horizontalConstraints;
	}
	constructor(e, t, n) {
		if (super(n), this.LayersAreDoubled = !1, e == null) return;
		this.originalGraph = e, this.sugiyamaSettings = t;
		let r = Array.from(e.shallowNodes);
		this.nodeIdToIndex = /* @__PURE__ */ new Map();
		let i = 0;
		for (let e of r) this.nodeIdToIndex.set(e.id, i++);
		let a = [];
		for (let e of this.originalGraph.shallowEdges) {
			let t = this.nodeIdToIndex.get(e.source.id);
			if (t == null) continue;
			let n = this.nodeIdToIndex.get(e.target.id);
			if (n == null) continue;
			let r = new Bi(t, n, e);
			a.push(r);
		}
		this.IntGraph = new ys(a, e.shallowNodeCount), this.IntGraph.nodes = r, this.database = new bs(r.length);
		for (let e of this.IntGraph.edges) this.database.registerOriginalEdgeInMultiedges(e);
		this.cycleRemoval();
	}
	run() {
		if (this.originalGraph.shallowNodeCount === 0) {
			this.originalGraph.boundingBox = O.mkEmpty();
			return;
		}
		xc(this.originalGraph, this.sugiyamaSettings.transform), this.engineLayerArrays = this.calculateLayers(), this.sugiyamaSettings.edgeRoutingSettings.EdgeRoutingMode === Z.SugiyamaSplines && this.runPostLayering(), Sc(this.originalGraph, this.sugiyamaSettings.transform);
	}
	runPostLayering() {
		let e = this.sugiyamaSettings.commonSettings.edgeRoutingSettings, t = this.constrainedOrdering == null ? e.EdgeRoutingMode : Z.Spline;
		this.extremeAspectRatio ? Da(this.originalGraph, Array.from(this.originalGraph.deepEdges), this.cancelToken) : t === Z.SugiyamaSplines ? this.calculateEdgeSplines() : Co(this.originalGraph, Array.from(this.originalGraph.deepEdges), this.cancelToken);
	}
	SetLabels() {
		throw Error("not implementedt");
	}
	cycleRemoval() {
		let e = this.sugiyamaSettings.verticalConstraints, t = e.isEmpty ? cr.getFeedbackSet(this.IntGraph) : e.getFeedbackSetExternal(this.IntGraph, this.nodeIdToIndex);
		this.database.addFeedbackSet(t);
	}
	calculateLayers() {
		this.CreateGluedDagSkeletonForLayering();
		let e = this.CalculateLayerArrays();
		return this.UpdateNodePositionData(), e;
	}
	UpdateNodePositionData() {
		for (let e = 0; e < this.IntGraph.nodeCount && e < this.database.Anchors.length; e++) this.IntGraph.nodes[e].center = this.database.Anchors[e].origin;
		if (this.sugiyamaSettings.GridSizeByX > 0) for (let e = 0; e < this.originalGraph.shallowNodeCount; e++) this.SnapLeftSidesOfTheNodeToGrid(e, this.sugiyamaSettings.GridSizeByX);
	}
	SnapLeftSidesOfTheNodeToGrid(e, t) {
		let n = this.IntGraph.nodes[e], r = this.database.Anchors[e];
		r.leftAnchor -= t / 2, r.rightAnchor -= t / 2;
		let i = n.boundingBox.left, a = i - Math.floor(i / t) * t;
		Math.abs(a) < .001 || (Math.abs(a) <= t / 2 ? n.center = n.center.add(new y(-a, 0)) : n.center = n.center.add(new y(t - a, 0)), r.x = n.center.x);
	}
	GetCurrentHeight() {
		let e = new lr();
		for (let t of this.NodeAnchors()) e.AddValue(t.top), e.AddValue(t.bottom);
		return e.length;
	}
	*NodeAnchors() {
		let e = Math.min(this.IntGraph.nodeCount, this.anchors.length);
		for (let t = 0; t < e; t++) yield this.anchors[t];
	}
	GetCurrentWidth() {
		let e = new lr();
		for (let t of this.NodeAnchors()) e.AddValue(t.left), e.AddValue(t.right);
		return e.length;
	}
	ExtendLayeringToUngluedSameLayerVertices(e) {
		let t = this.verticalConstraints;
		for (let n = 0; n < e.length; n++) e[n] = e[t.nodeToRepr(n)];
		return e;
	}
	calculateEdgeSplines() {
		new Qs(this.sugiyamaSettings, this.originalGraph, this.database, this.engineLayerArrays, this.properLayeredGraph, this.IntGraph).run();
	}
	YLayeringAndOrdering(e) {
		let t = e.GetLayers();
		Cs.Balance(this.gluedDagSkeletonForLayering, t, this.GetNodeCountsOfGluedDag(), null), t = this.ExtendLayeringToUngluedSameLayerVertices(t);
		let n = new Ss(t);
		if (this.HorizontalConstraints == null || this.HorizontalConstraints.IsEmpty) return n = this.YLayeringAndOrderingWithoutHorizontalConstraints(n), n;
		throw Error("not implemented");
	}
	CreateProperLayeredGraph(e) {
		let t = e.length, n = 0;
		for (let r of this.database.SkeletonEdges()) {
			let i = uc(e, r);
			i > 0 && (r.LayerEdges = Array(i));
			let a = 0;
			if (i > 1) {
				let e = t + n++, o = new Ri(r.source, e, r.CrossingWeight, r.weight);
				r.LayerEdges[a++] = o;
				for (let t = 0; t < i - 2; t++) e++, n++, o = new Ri(e - 1, e, r.CrossingWeight, r.weight), r.LayerEdges[a++] = o;
				o = new Ri(e, r.target, r.CrossingWeight, r.weight), r.LayerEdges[a] = o;
			} else if (i === 1) {
				let e = new Ri(r.source, r.target, r.CrossingWeight, r.weight);
				r.LayerEdges[a] = e;
			}
		}
		let r = Array(this.originalGraph.shallowNodeCount + n).fill(0);
		for (let t of this.database.SkeletonEdges()) if (t.LayerEdges != null) {
			let n = e[t.source];
			r[t.source] = n--;
			for (let e of t.LayerEdges) r[e.Target] = n--;
		} else r[t.source] = e[t.source], r[t.target] = e[t.target];
		return this.properLayeredGraph = new ws(new ys(Array.from(this.database.SkeletonEdges()), e.length)), this.properLayeredGraph.BaseGraph.nodes = this.IntGraph.nodes, new Ss(r);
	}
	YLayeringAndOrderingWithoutHorizontalConstraints(e) {
		let t = this.CreateProperLayeredGraph(e.y);
		return Is.OrderLayers(this.properLayeredGraph, t, this.originalGraph.shallowNodeCount, this.sugiyamaSettings, this.cancelToken), Ls.UpdateLayerArrays1(this.properLayeredGraph, t), t;
	}
	CalculateYLayers() {
		let e = this.YLayeringAndOrdering(new Gs(this.gluedDagSkeletonForLayering, this.cancelToken));
		return this.constrainedOrdering == null ? this.InsertLayersIfNeeded(e) : e;
	}
	InsertLayersIfNeeded(e) {
		this.InsertVirtualEdgesIfNeeded(e);
		let t = this.AnalyzeNeedToInsertLayersAndHasMultiedges(e);
		if (t.needToInsertLayers) {
			let t = Ts.InsertLayers(this.properLayeredGraph, e, this.database, this.IntGraph);
			this.properLayeredGraph = t.layeredGraph, e = t.la, this.LayersAreDoubled = !0;
		} else if (t.multipleEdges) {
			let t = Es.InsertPaths(this.properLayeredGraph, e, this.database, this.IntGraph);
			this.properLayeredGraph = t.layeredGraph, e = t.la;
		}
		return this.RecreateIntGraphFromDataBase(), e;
	}
	RecreateIntGraphFromDataBase() {
		let e = [];
		for (let t of this.database.Multiedges.values()) e = e.concat(t);
		this.IntGraph.SetEdges(e, this.IntGraph.nodeCount);
	}
	InsertVirtualEdgesIfNeeded(e) {
		if (this.constrainedOrdering == null) {
			for (let [t, n] of this.database.Multiedges.keyValues()) if (n.length % 2 == 0 && e.y[t.x] - 1 === e.y[t.y]) {
				let e = new be(null), r = new Bi(t.x, t.y, e);
				r.IsVirtualEdge = !0, n.splice(n.length / 2, 0, r), this.IntGraph.addEdge(r);
			}
		}
	}
	AnalyzeNeedToInsertLayersAndHasMultiedges(e) {
		let t = !1, n = !1;
		for (let n of this.IntGraph.edges) if (n.hasLabel && e.y[n.source] !== e.y[n.target]) {
			t = !0;
			break;
		}
		if (t === !1 && this.constrainedOrdering == null) {
			for (let [r, i] of this.database.Multiedges.keyValues()) if (i.length > 1 && (n = !0, e.y[r.x] - e.y[r.y] === 1)) {
				t = !0;
				break;
			}
		}
		return {
			needToInsertLayers: t,
			multipleEdges: n
		};
	}
	UseBrandesXCalculations(e) {
		return e.x.length >= this.sugiyamaSettings.BrandesThreshold;
	}
	CalculateAnchorsAndYPositions(e) {
		this.anchors = ic(this.database, this.properLayeredGraph, this.originalGraph, this.IntGraph, this.sugiyamaSettings), cc(e, 500, this.originalGraph, this.database, this.IntGraph, this.sugiyamaSettings, this.LayersAreDoubled);
	}
	OptimizeEdgeLabelsLocations() {
		for (let e = 0; e < this.anchors.length; e++) {
			let t = this.anchors[e];
			if (t.labelIsToTheRightOfTheSpline) {
				let n = this.GetSuccessorAndPredecessor(e);
				if (!mc(t, n.predecessor, n.successor)) {
					let e = n.predecessor.origin.sub(t.origin).length + n.successor.origin.sub(t.origin).length, r = new y(t.right - t.leftAnchor, t.y);
					n.predecessor.origin.sub(r).length + n.successor.origin.sub(r).length < e && hc(t);
				}
			}
		}
	}
	GetSuccessorAndPredecessor(e) {
		let t;
		for (let n of this.properLayeredGraph.InEdges(e)) t = n.Source;
		let n;
		for (let t of this.properLayeredGraph.OutEdges(e)) n = t.Target;
		return {
			predecessor: this.anchors[t],
			successor: this.anchors[n]
		};
	}
	CalculateLayerArrays() {
		let e = this.CalculateYLayers();
		return this.constrainedOrdering == null ? (this.CalculateAnchorsAndYPositions(e), this.UseBrandesXCalculations(e) ? this.CalculateXPositionsByBrandes(e) : this.CalculateXLayersByGansnerNorth(e)) : this.anchors = this.database.Anchors, this.OptimizeEdgeLabelsLocations(), this.engineLayerArrays = e, this.StraightensShortEdges(), this.CalculateOriginalGraphBox(), e;
	}
	StretchToDesiredAspectRatio(e, t) {
		e > t ? this.StretchInYDirection(e / t) : e < t && this.StretchInXDirection(t / e);
	}
	StretchInYDirection(e) {
		let t = (this.originalGraph.boundingBox.top + this.originalGraph.boundingBox.bottom) / 2;
		for (let n of this.database.Anchors) n.bottomAnchor *= e, n.topAnchor *= e, n.y = t + e * (n.y - t);
		let n = this.originalGraph.height * e;
		this.originalGraph.boundingBox = new O({
			left: this.originalGraph.boundingBox.left,
			top: t + n / 2,
			right: this.originalGraph.boundingBox.right,
			bottom: t - n / 2
		});
	}
	StretchInXDirection(e) {
		let t = (this.originalGraph.boundingBox.left + this.originalGraph.boundingBox.right) / 2;
		for (let n of this.database.Anchors) n.leftAnchor *= e, n.rightAnchor *= e, n.x = t + e * (n.x - t);
		let n = this.originalGraph.width * e;
		this.originalGraph.boundingBox = new O({
			left: t - n / 2,
			top: this.originalGraph.boundingBox.top,
			right: t + n / 2,
			bottom: this.originalGraph.boundingBox.bottom
		});
	}
	CalculateOriginalGraphBox() {
		if (this.anchors.length === 0) return;
		let e = new O({
			left: this.anchors[0].left,
			top: this.anchors[0].top,
			right: this.anchors[0].right,
			bottom: this.anchors[0].bottom
		});
		for (let t = 1; t < this.anchors.length; t++) {
			let n = this.anchors[t];
			e.add(n.leftTop), e.add(n.rightBottom);
		}
		this.originalGraph.labelSize && this.originalGraph.addLabelToGraphBB(e), e.padEverywhere(this.originalGraph.margins), this.originalGraph.boundingBox = e;
	}
	StraightensShortEdges() {
		if (!(this.anchors.length < 20)) for (; this.StraightenEdgePaths(););
	}
	StraightenEdgePaths() {
		let e = !1;
		for (let t of this.database.AllIntEdges()) t.LayerSpan === 2 && (e = this.ShiftVertexWithNeighbors(t.LayerEdges[0].Source, t.LayerEdges[0].Target, t.LayerEdges[1].Target) || e);
		return e;
	}
	ShiftVertexWithNeighbors(e, t, n) {
		let r = this.database.Anchors[e], i = this.database.Anchors[n], a = this.database.Anchors[t], o = (a.y - r.y) * ((i.x - r.x) / (i.y - r.y)) + r.x, s = 1e-4;
		return o > a.x + s ? this.TryShiftToTheRight(o, t) : o < a.x - s ? this.TryShiftToTheLeft(o, t) : !1;
	}
	TryShiftToTheLeft(e, t) {
		let n = this.engineLayerArrays.Layers[this.engineLayerArrays.y[t]], r = this.engineLayerArrays.x[t];
		if (r > 0) {
			let i = this.database.Anchors[n[r - 1]], a = Math.max(i.right + (this.sugiyamaSettings.NodeSeparation + this.database.Anchors[t].leftAnchor), e);
			return a < this.database.Anchors[t].x - 1 ? (this.database.Anchors[t].x = a, !0) : !1;
		}
		return this.database.Anchors[t].x = e, !0;
	}
	TryShiftToTheRight(e, t) {
		let n = this.engineLayerArrays.Layers[this.engineLayerArrays.y[t]], r = this.engineLayerArrays.x[t];
		if (r < n.length - 1) {
			let i = this.database.Anchors[n[r + 1]], a = Math.min(i.left - (this.sugiyamaSettings.NodeSeparation - this.database.Anchors[t].rightAnchor), e);
			return a > this.database.Anchors[t].x + 1 ? (this.database.Anchors[t].x = a, !0) : !1;
		}
		return this.database.Anchors[t].x = e, !0;
	}
	CalculateXLayersByGansnerNorth(e) {
		this.xLayoutGraph = this.CreateXLayoutGraph(e), this.CalculateXLayersByGansnerNorthOnProperLayeredGraph();
	}
	CalculateXLayersByGansnerNorthOnProperLayeredGraph() {
		let e = new Ws(this.xLayoutGraph, null).GetLayers();
		for (let t = 0; t < this.database.Anchors.length; t++) this.anchors[t].x = e[t];
	}
	CreateXLayoutGraph(e) {
		let t = this.properLayeredGraph.NodeCount, n = [];
		for (let e of this.properLayeredGraph.Edges) {
			let r = new Bi(t, e.Source, null), i = new Bi(t, e.Target, null);
			i.weight = e.Weight, r.weight = e.Weight, r.separation = 0, i.separation = 0, t++, n.push(r), n.push(i);
		}
		for (let t of e.Layers) for (let e = t.length - 1; e > 0; e--) {
			let r = t[e], i = t[e - 1], a = new Bi(r, i, null), o = this.database.Anchors[r], s = this.database.Anchors[i], c = o.leftAnchor + (s.rightAnchor + this.sugiyamaSettings.NodeSeparation);
			a.separation = Math.ceil(c + .5), n.push(a);
		}
		let r = new Js(this.IntGraph, this.properLayeredGraph, e, n, t);
		return r.SetEdgeWeights(), r;
	}
	CalculateXPositionsByBrandes(e) {
		qs.CalculateXCoordinates(e, this.properLayeredGraph, this.originalGraph.shallowNodeCount, this.database.Anchors, this.sugiyamaSettings.NodeSeparation);
	}
	GluedDagSkeletonEdges() {
		let e = new gt();
		for (let [t, n] of this.database.Multiedges.keyValues()) {
			if (t.isDiagonal()) continue;
			let r = this.verticalConstraints.gluedIntEdge(n[0]);
			r.source !== r.target && e.set(r.source, r.target, r);
		}
		let t = Array.from(this.verticalConstraints.gluedUpDownIntConstraints.values()).map((e) => lc(e, null));
		for (let n of t) e.set(n.source, n.target, n);
		return Array.from(e.values());
	}
	static CalcAnchorsForOriginalNode(e, t, n, r, i) {
		let a = {
			leftAnchor: 0,
			rightAnchor: 0,
			topAnchor: 0,
			bottomAnchor: 0
		};
		if (t.nodes != null) {
			let n = t.nodes[e];
			vc(a, n, i);
		}
		yc(e, a, r, i);
		let o = i.MinNodeWidth / 2;
		a.leftAnchor < o && (a.leftAnchor = o), a.rightAnchor < o && (a.rightAnchor = o);
		let s = i.MinNodeHeight / 2;
		a.topAnchor < s && (a.topAnchor = s), a.bottomAnchor < s && (a.bottomAnchor = s), n[e] = Ks.mkAnchor(a.leftAnchor, a.rightAnchor, a.topAnchor, a.bottomAnchor, t.nodes[e], i.LabelCornersPreserveCoefficient), n[e].padding = 1;
	}
	CreateGluedDagSkeletonForLayering() {
		this.gluedDagSkeletonForLayering = new ys(this.GluedDagSkeletonEdges(), this.originalGraph.shallowNodeCount), this.SetGluedEdgesWeights();
	}
	SetGluedEdgesWeights() {
		let e = new gt();
		for (let t of this.gluedDagSkeletonForLayering.edges) e.set(t.source, t.target, t);
		for (let [t, n] of this.database.Multiedges.keyValues()) if (t.x !== t.y) {
			let r = this.verticalConstraints.gluedIntPair(t);
			if (r.x === r.y) continue;
			let i = e.get(r.x, r.y);
			for (let e of n) i.weight += e.weight;
		}
	}
	GetNodeCountsOfGluedDag() {
		return this.verticalConstraints.isEmpty ? Array(this.IntGraph.nodeCount).fill(1) : this.verticalConstraints.getGluedNodeCounts();
	}
};
function nc(e, t) {
	if (t === 0) return 0;
	let n = e - Math.floor(e / t) * t;
	return Math.abs(n) < 1e-4 ? 0 : t - n;
}
function rc(e, t) {
	for (let n of e) if (n < t) return !0;
	return !1;
}
function ic(e, t, n, r, i) {
	let a = e.Anchors = Array(t.NodeCount);
	for (let e = 0; e < a.length; e++) a[e] = new Ks(i.LabelCornersPreserveCoefficient);
	for (let t = 0; t < n.shallowNodeCount; t++) tc.CalcAnchorsForOriginalNode(t, r, a, e, i);
	for (let t of e.AllIntEdges()) if (t.LayerEdges != null) {
		for (let n of t.LayerEdges) {
			let r = n.Target;
			if (r !== t.target) {
				let t = a[r];
				e.MultipleMiddles.has(r) ? (t.leftAnchor = t.rightAnchor = ac() * 4, t.topAnchor = t.bottomAnchor = oc(i) / 2) : (t.leftAnchor = t.rightAnchor = ac() / 2, t.topAnchor = t.bottomAnchor = oc(i) / 2);
			}
		}
		if (t.hasLabel) {
			let e = a[t.LayerEdges[t.LayerEdges.length / 2].Source], n = t.labelWidth, r = t.labelHeight;
			e.rightAnchor = n, e.leftAnchor = ac() * 8, e.topAnchor < r / 2 && (e.topAnchor = e.bottomAnchor = r / 2), e.labelIsToTheRightOfTheSpline = !0;
		}
	}
	return a;
}
function ac() {
	return 1;
}
function oc(e) {
	return e.MinNodeHeight * 1.5 / 8;
}
function sc(e, t, n, r, i, a) {
	let o = 0;
	if (n > 0) {
		let s = gc(t.Layers[n - 1], t.y, r);
		if (s.length) {
			let t = i.LayerSeparation / 3, n = a;
			o = Math.max(...s.map((r) => _c(r, n, t, e)));
		}
	}
	return o;
}
function cc(e, t, n, r, i, a, o) {
	let s = r.Anchors, c = n.margins.top + t, l = 0;
	for (let t of e.Layers) {
		let u = 0, d = 0;
		for (let e of t) {
			let t = s[e];
			t.bottomAnchor > u && (u = t.bottomAnchor), t.topAnchor > d && (d = t.topAnchor);
		}
		dc(t, u, d, n.shallowNodeCount, r.Anchors);
		let f = sc(r, e, l, i, a, c), p = c + u + f, m = p + d;
		if (fc(a)) {
			m += nc(m, a.GridSizeByY);
			for (let e of t) s[e].top = m;
		} else if (pc(a)) {
			let e = p - u;
			e += nc(e, e);
			for (let n of t) s[n].bottom = e, m = Math.max(s[n].top, m);
		} else for (let e of t) s[e].y = p;
		let h = a.ActualLayerSeparation(o);
		c = m + h, l++;
	}
	sc(r, e, l, i, a, c);
}
function lc(e, t) {
	let n = new Bi(e.x, e.y, t);
	return n.weight = 0, n.separation = 1, n;
}
function uc(e, t) {
	return e[t.source] - e[t.target];
}
function dc(e, t, n, r, i) {
	if (rc(e, r)) {
		for (let a of e) if (a >= r) {
			let e = i[a];
			e.bottomAnchor = t, e.topAnchor = n;
		}
	}
}
function fc(e) {
	return e.SnapToGridByY === qi.Top;
}
function pc(e) {
	return e.SnapToGridByY === qi.Bottom;
}
function mc(e, t, n) {
	if (e.labelIsToTheRightOfTheSpline) {
		if (y.getTriangleOrientation(t.origin, e.origin, n.origin) === _.Clockwise) return !0;
		let r = e.leftAnchor, i = e.rightAnchor, a = e.x;
		return hc(e), y.getTriangleOrientation(t.origin, e.origin, n.origin) === _.Counterclockwise ? !0 : (e.x = a, e.leftAnchor = r, e.rightAnchor = i, e.labelIsToTheRightOfTheSpline = !0, e.labelIsToTheLeftOfTheSpline = !1, !1);
	}
	return !1;
}
function hc(e) {
	let t = e.right, n = e.leftAnchor;
	e.leftAnchor = e.rightAnchor, e.rightAnchor = n, e.x = t - e.rightAnchor, e.labelIsToTheLeftOfTheSpline = !0, e.labelIsToTheRightOfTheSpline = !1;
}
function gc(e, t, n) {
	let r = new Ei();
	for (let i of e) if (!(i >= n.nodeCount)) for (let e of n.outEdges[i]) t[e.source] === t[e.target] && r.addNN(e.source, e.target);
	return Array.from(r.values());
}
function _c(e, t, n, r) {
	let i = 0, a = r.GetMultiedgeI(e);
	for (let e of a) {
		i += n;
		let r = e.edge.label;
		r != null && (r.positionCenter(new y(r.center.x, t + i + r.height / 2)), i += r.height);
	}
	return i;
}
function vc(e, t, n) {
	e.rightAnchor = e.leftAnchor = (t.width + n.GridSizeByX) / 2, e.topAnchor = e.bottomAnchor = t.height / 2;
}
function yc(e, t, n, r) {
	let i = bc(n, e, t, r);
	t.rightAnchor += i;
}
function bc(e, t, n, r) {
	let i = 0, a = e.GetMultiedge(t, t);
	if (a.length > 0) {
		for (let e of a) e.edge.label != null && (n.rightAnchor += e.edge.label.width, n.topAnchor < e.edge.label.height / 2 && (n.topAnchor = n.bottomAnchor = e.edge.label.height / 2));
		i += (r.NodeSeparation + r.MinNodeWidth) * a.length;
	}
	return i;
}
function xc(e, t) {
	if (t.isIdentity()) return;
	let n = t.inverse();
	for (let t of e.shallowNodes) t.transform(n);
	for (let t of e.shallowEdges) if (t.label != null) {
		let e = O.mkPP(n.multiplyPoint(new y(0, 0)), n.multiplyPoint(new y(t.label.width, t.label.height)));
		t.label.width = e.width, t.label.height = e.height;
	}
}
function Sc(e, t) {
	if (!t.isIdentity()) {
		for (let n of e.shallowNodes) n.transform(t);
		for (let n of e.shallowEdges) if (n.label != null) {
			let e = O.mkPP(t.multiplyPoint(new y(0, 0)), t.multiplyPoint(new y(n.label.width, n.label.height)));
			n.label.width = e.width, n.label.height = e.height;
		}
		Cc(e, t), e.graph.parent ?? (e.boundingBox = null);
	}
}
function Cc(e, t) {
	for (let n of e.shallowEdges) n.label && n.label.transform(t), wc(t, n);
}
function wc(e, t) {
	if (t.curve != null) {
		t.curve = t.curve.transform(e);
		let n = t;
		n.sourceArrowhead != null && (n.sourceArrowhead.tipPosition = e.multiplyPoint(n.sourceArrowhead.tipPosition)), n.targetArrowhead != null && (n.targetArrowhead.tipPosition = e.multiplyPoint(n.targetArrowhead.tipPosition)), Tc(t, e);
	}
}
function Tc(e, t) {
	if (e.smoothedPolyline != null) for (let n = e.smoothedPolyline.headSite; n != null; n = n.next) n.point = t.multiplyPoint(n.point);
}
//#endregion
//#region node_modules/@turf/helpers/dist/esm/index.js
var Ec = 6371008.8, Dc = {
	centimeters: Ec * 100,
	centimetres: Ec * 100,
	degrees: 360 / (2 * Math.PI),
	feet: Ec * 3.28084,
	inches: Ec * 39.37,
	kilometers: Ec / 1e3,
	kilometres: Ec / 1e3,
	meters: Ec,
	metres: Ec,
	miles: Ec / 1609.344,
	millimeters: Ec * 1e3,
	millimetres: Ec * 1e3,
	nauticalmiles: Ec / 1852,
	radians: 1,
	yards: Ec * 1.0936
};
function Oc(e, t, n = {}) {
	let r = { type: "Feature" };
	return (n.id === 0 || n.id) && (r.id = n.id), n.bbox && (r.bbox = n.bbox), r.properties = t || {}, r.geometry = e, r;
}
function kc(e, t, n = {}) {
	if (!e) throw Error("coordinates is required");
	if (!Array.isArray(e)) throw Error("coordinates must be an Array");
	if (e.length < 2) throw Error("coordinates must be at least 2 numbers long");
	if (!Pc(e[0]) || !Pc(e[1])) throw Error("coordinates must contain numbers");
	return Oc({
		type: "Point",
		coordinates: e
	}, t, n);
}
function Ac(e, t = "kilometers") {
	let n = Dc[t];
	if (!n) throw Error(t + " units is invalid");
	return e * n;
}
function jc(e, t = "kilometers") {
	let n = Dc[t];
	if (!n) throw Error(t + " units is invalid");
	return e / n;
}
function Mc(e) {
	return e % (2 * Math.PI) * 180 / Math.PI;
}
function Nc(e) {
	return e % 360 * Math.PI / 180;
}
function Pc(e) {
	return !isNaN(e) && e !== null && !Array.isArray(e);
}
//#endregion
//#region node_modules/@turf/invariant/dist/esm/index.js
function Fc(e) {
	if (!e) throw Error("coord is required");
	if (!Array.isArray(e)) {
		if (e.type === "Feature" && e.geometry !== null && e.geometry.type === "Point") return [...e.geometry.coordinates];
		if (e.type === "Point") return [...e.coordinates];
	}
	if (Array.isArray(e) && e.length >= 2 && !Array.isArray(e[0]) && !Array.isArray(e[1])) return [...e];
	throw Error("coord must be GeoJSON Point or an Array of numbers");
}
//#endregion
//#region node_modules/@turf/bearing/dist/esm/index.js
function Ic(e, t, n = {}) {
	if (n.final === !0) return Lc(e, t);
	let r = Fc(e), i = Fc(t), a = Nc(r[0]), o = Nc(i[0]), s = Nc(r[1]), c = Nc(i[1]), l = Math.sin(o - a) * Math.cos(c), u = Math.cos(s) * Math.sin(c) - Math.sin(s) * Math.cos(c) * Math.cos(o - a);
	return Mc(Math.atan2(l, u));
}
function Lc(e, t) {
	let n = Ic(t, e);
	return n = (n + 180) % 360, n;
}
//#endregion
//#region node_modules/@turf/destination/dist/esm/index.js
function Rc(e, t, n, r = {}) {
	let i = Fc(e), a = Nc(i[0]), o = Nc(i[1]), s = Nc(n), c = jc(t, r.units), l = Math.asin(Math.sin(o) * Math.cos(c) + Math.cos(o) * Math.sin(c) * Math.cos(s)), u = Mc(a + Math.atan2(Math.sin(s) * Math.sin(c) * Math.cos(o), Math.cos(c) - Math.sin(o) * Math.sin(l))), d = Mc(l);
	return i[2] === void 0 ? kc([u, d], r.properties) : kc([
		u,
		d,
		i[2]
	], r.properties);
}
//#endregion
//#region node_modules/@turf/distance/dist/esm/index.js
function zc(e, t, n = {}) {
	var r = Fc(e), i = Fc(t), a = Nc(i[1] - r[1]), o = Nc(i[0] - r[0]), s = Nc(r[1]), c = Nc(i[1]), l = Math.sin(a / 2) ** 2 + Math.sin(o / 2) ** 2 * Math.cos(s) * Math.cos(c);
	return Ac(2 * Math.atan2(Math.sqrt(l), Math.sqrt(1 - l)), n.units);
}
var Bc = zc;
//#endregion
//#region node_modules/@turf/midpoint/dist/esm/index.js
function Vc(e, t) {
	let n = zc(e, t), r = Ic(e, t);
	return Rc(e, n / 2, r);
}
var Hc = Vc;
//#endregion
//#region src/utils/utils.graph.ts
function Uc(e) {
	if (typeof e == "number") {
		let t = e * 6;
		return Math.max(8, Math.min(24, t));
	}
	return 12;
}
function Wc(e) {
	return Uc(e);
}
function Gc(e, t, n) {
	let r = be.getGeom(e) ?? new be(e), i = t?.edgeStyle?.arrow ?? 0, a = Wc(t?.edgeStyle?.size), o = (i === -1 || i === 2) && (n === "start" || n === "both"), s = (i === 1 || i === 2) && (n === "end" || n === "both");
	r.sourceArrowhead = o ? Object.assign(new Qn(), { length: a }) : void 0, r.targetArrowhead = s ? Object.assign(new Qn(), { length: a }) : void 0;
}
function Kc(e, t, n) {
	let r = t === 0, i = t === n - 1;
	if (e === 1) return i ? "end" : "none";
	if (e === -1) return r ? "start" : "none";
	if (e === 2) {
		if (r && i) return "both";
		if (r) return "start";
		if (i) return "end";
	}
	return "none";
}
function qc(e) {
	return e > 180 ? e - 360 : e < -180 ? e + 360 : e;
}
function Jc(e) {
	if (!e?.length) return null;
	let t = e[0];
	if (!t || t.length < 2) return null;
	let n = t[0];
	return {
		base: t[1],
		tip: n
	};
}
function Yc(e) {
	if (!e?.length) return null;
	let t = e[e.length - 1];
	if (!t || t.length < 2) return null;
	let n = t[t.length - 1];
	return {
		base: t[t.length - 2],
		tip: n
	};
}
function Xc(e, t, n) {
	let [r, i] = e, [a, o] = t;
	if (!n) {
		let e = a - r, t = o - i;
		return Math.atan2(t, e) * 180 / Math.PI;
	}
	let s = qc(a - r), c = o - i, l = (i + o) / 2 * Math.PI / 180;
	return s *= Math.cos(l), Math.atan2(c, s) * 180 / Math.PI;
}
function Zc(e, t) {
	let n = Jc(e), r = Yc(e);
	return !n || !r ? null : {
		start: Xc(n.base, n.tip, t),
		end: Xc(r.base, r.tip, t)
	};
}
function Qc(e) {
	return e.sort((e, t) => {
		let n = {
			Alerting: 1,
			Pending: 2,
			Normal: 3
		}, r = e.newState.startsWith("Alerting") ? "Alerting" : e.newState.startsWith("Pending") ? "Pending" : "Normal", i = t.newState.startsWith("Alerting") ? "Alerting" : t.newState.startsWith("Pending") ? "Pending" : "Normal";
		return n[r] - n[i];
	});
}
function $c(e) {
	let { graphA: t, graphB: n, panel: i, parPath: a, layerIdx: o, edgeId: s, dataRecord: c, commentsData: l, theme: u } = e, { isLogic: d, graph: f } = i, { setEdge: p, findNode: m } = t, { setEdge: h, findNode: g } = n, _ = t.nodeCollection.findEdge, v = a[0], y = a.at(-1);
	if (typeof y != "string" || typeof v != "string") return;
	let b = m(v);
	if (!g(y) || !b) return;
	let ee = [], x = [], te = [];
	if (a.forEach((e, t) => {
		if (typeof e == "string") {
			let n = t === a.length - 1 ? g(e) : m(e);
			if (n) {
				let t = n.data.wasmId;
				ee.push(t), x.push(e), te.push(e);
			}
		} else !i.isLogic && Array.isArray(e) && (ee.push(void 0), te.push(e));
	}), !ee.length) return;
	let S = s ?? v + "-" + y, C = _(S), ne;
	if (!C) {
		let e = ee;
		f.getEdgeVerticeIds.push([e, o]), ne = f.getEdgeVerticeIds.length - 1;
		let t = {
			dataRecord: c,
			parPath: te,
			edge_id: ne,
			edgeId: S
		}, r = [];
		if (d && x.length > 2) {
			let [e, n] = a.length ? el(te, i.positions, m, g) : [];
			e?.forEach((n, a) => {
				let o = S + (a ? "--" + a : ""), s = n[0].item.id, l = n.at(-1).item.id, u = p(o, s, l);
				u && (u.setData(t), i.isLogic && Gc(u, c, Kc(c?.edgeStyle?.arrow, a, e.length)), r.push(u));
			});
		} else {
			if (C = p(S, v, y, n), !C) return;
			C?.setData(t), i.isLogic && Gc(C, c, "both"), r.push(C);
		}
		f.getWasmId2Edges[ne] = r;
	} else if (C && (ne = C.data.edge_id, ne !== void 0)) {
		C.setAttrProp(r.EdgeDataIndex, "parPath", te), i.isLogic && Gc(C, c, "both"), f.getEdgeVerticeIds[ne][0];
		let e = ee;
		f.getEdgeVerticeIds[ne][0] = Array.from(e);
	}
	a.forEach((e, n) => {
		if (Array.isArray(e) && e.length > 2) {
			let r = e[3], i = e[4], o = i && u.visualization.getColorByName(i), { style: s, layerName: d } = c || {};
			if (r !== void 0 && s) {
				let i = {
					text: r,
					iconColor: o ?? "#4ec2fc",
					style: s,
					root: t,
					layerName: d,
					locName: a[0],
					index: n,
					coords: e.slice(0, 2),
					edge: C
				};
				l[S] || (l[S] = /* @__PURE__ */ new Map()), l[S].set(n, i);
			}
		}
	});
}
function el(e, t, n, r) {
	if (e.length === 0) return [[]];
	let i = e.map((t, i) => typeof t == "string" ? i === e.length - 1 ? r(t) : n(t) : t).filter((e) => e), a = [], o = [], s = [], c = [];
	for (let e = 0; e < i.length; e++) {
		let n = i[e], r = t[e];
		r && (n.id && s.length > 0 && (s.push({
			item: n,
			gIdx: e,
			coords: r
		}), c.push(t[e]), a.push(s), o.push(c), s = [], c = []), s.push({
			item: n,
			gIdx: e,
			coords: r
		}), c.push(r));
	}
	return [a, o];
}
function tl(e) {
	return typeof e == "string";
}
function nl(e) {
	return e.map((e, t) => tl(e) ? t : -1).filter((e) => e !== -1);
}
function rl(e, t, n) {
	let r = nl(e);
	if (r.length < 2) return {
		parPath: e,
		wasmIds: t
	};
	n.length, nl(e).length - 1;
	let i = [], a = [], o = 0;
	for (let s = 0; s < r.length - 1; s++) {
		let c = r[s];
		r[s + 1], i.push(e[c]), a.push(t[c]);
		let l = n[o++] ?? [];
		for (let e of l) i.push(e), a.push(void 0);
	}
	let s = r.at(-1);
	return i.push(e[s]), a.push(t[s]), {
		parPath: i,
		wasmIds: a
	};
}
function il(e) {
	let t = be.getGeom(e);
	return t?.source ? Array.from(t.getSmoothPolyPoints()).slice(1, -1).map((e) => [e.x, e.y]) : [];
}
function al(e) {
	let t = e.graph, n = mt.getGeom(t);
	n.layoutSettings = new Ji(), n.layoutSettings.layerDirection = Wi.RL, n.layoutSettings.LayerSeparation = 60, n.layoutSettings.commonSettings.NodeSeparation = 40, xo(n);
	let { getEdgeVerticeIds: r, wasm2Edges: i } = t;
	i.forEach((e) => {
		let t = e[0], n = t.data.edge_id, i = t.data.parPath, a = r[n][0], { parPath: o, wasmIds: s } = rl(i, a, e.map(il));
		t.data.parPath = o, r[n][0] = s;
	});
	for (let e of n.deepEdges) e.source, e.target, e.curve;
	for (let t of n.nodesBreadthFirst) {
		let n = t.node;
		if (!n.data) continue;
		let { feature: r, wasmId: i } = n.data;
		e.positions[i * 2] = t.center.x, e.positions[i * 2 + 1] = t.center.y;
	}
}
function ol(e, t, n, r, i) {
	let a = n - t, o = e * i;
	if (o === 0) return t + a * r;
	let s = a / o, c = s * s + 1, l = +(a < 0), u = l ? n : t, d = l ? 1 - r : r;
	return Math.sqrt(d * (c - d)) * o + u;
}
function sl(e, t, n) {
	return n ? [(e[0] + t[0]) / 2, (e[1] + t[1]) / 2] : Hc(e, t).geometry.coordinates;
}
//#endregion
//#region src/utils/utils.turf.ts
function cl(e, t, n = !0) {
	if (e.id) {
		let n = e.data.wasmId, r = t.positions[n * 2], i = t.positions[n * 2 + 1];
		if (r !== void 0) return [r, i];
	} else if (Array.isArray(e)) return n ? e.slice(0, 2) : e;
	return null;
}
function ll(e, t, n, r = !0) {
	return e.map((e, i) => {
		if (typeof e == "string") {
			let e = t[i];
			if (e !== void 0) {
				let t = n[e * 2], r = n[e * 2 + 1];
				if (t !== void 0) return [t, r];
			}
		} else if (Array.isArray(e)) return r ? e.slice(0, 2) : e;
		return null;
	}).filter((e) => e);
}
function ul(e, t) {
	let n = t[0] - e[0], r = t[1] - e[1];
	return Math.sqrt(n * n + r * r);
}
//#endregion
//#region src/utils/defaults.ts
var dl = "#4ec2fc", fl = 1.5, pl = "default", ml = "#0a55a1", hl = "#000000", gl = "#299c46", _l = "#9acd32", vl = "#299C46", yl = "#ed8128", bl = "#f53636", xl = "#ed473b", Sl = ml, Cl = "rgba(154, 205, 50)", wl = "#9acd32", Tl = {
	color: wl,
	lineWidth: fl,
	label: pl
}, El = "#f0fc", Dl = "#e034b8cc", Ol = "#ffdd57e6", kl = "#205299cc", Al = "#ffd70033", jl = "#20529933", Ml = "#ffd70026", Nl = "#42a4f533", Pl = "#e6ca5ce6", Fl = "#dfff7bcc", Il = "#2fa1deb3", Ll = "#f0f0f0", Rl = "#e0be8b", zl = {
	Alerting: "#e0226e",
	Pending: "#ff9900",
	Normal: "#1b855e"
}, Bl = "#cfe3d4", Vl = .5, Hl = {
	255: [
		zl.Alerting,
		"Alerting",
		[
			224,
			34,
			110,
			254
		]
	],
	222: [
		zl.Pending,
		"Pending",
		[
			255,
			153,
			0,
			254
		]
	],
	111: [
		zl.Normal,
		"Normal",
		[
			27,
			133,
			94,
			254
		]
	]
}, Ul = {
	Alerting: Hl[255],
	Pending: Hl[222],
	Normal: Hl[111]
}, Wl = 20, Gl = "new rule", Kl = !0, ql = "", Jl = "cisco/atm-switch", Yl = -5, Xl = 40, Zl = 45, Ql = 16, $l = 2, eu = {}, tu = {
	shape: "binary-feature-collection",
	points: {
		type: "Point",
		positions: {
			value: new Float64Array([]),
			size: 2
		},
		featureIds: {
			value: new Uint32Array([]),
			size: 1
		},
		globalFeatureIds: {
			value: new Uint32Array([]),
			size: 1
		},
		properties: []
	},
	polygons: {
		type: "Polygon",
		positions: {
			value: new Float32Array(),
			size: 2
		},
		featureIds: {
			value: new Uint16Array(),
			size: 1
		},
		globalFeatureIds: {
			value: new Uint16Array(),
			size: 1
		},
		polygonIndices: {
			value: new Uint16Array(),
			size: 1
		},
		primitivePolygonIndices: {
			value: new Uint16Array(),
			size: 1
		},
		properties: []
	},
	lines: {
		type: "LineString",
		positions: {
			value: new Float32Array(),
			size: 2
		},
		featureIds: {
			value: new Uint16Array(),
			size: 1
		},
		pathIndices: {
			value: new Uint16Array(),
			size: 1
		},
		globalFeatureIds: {
			value: new Uint16Array(),
			size: 1
		},
		properties: []
	}
}, nu = [
	yl,
	bl,
	Sl
], ru = "fixed", iu = ".", au = 25, ou = "mapgl", su = "xy-namespaces", cu = "cmn", lu = "external", uu = "annots & alerts query (built-in)", du = "source", fu = {
	longitude: 0,
	latitude: 0,
	zoom: 1,
	yZoom: 2
}, pu;
(function(e) {
	e.GeoJson = "geojson", e.Polygons = "polygons", e.Path = "path", e.Markers = "markers", e.Nodes = "nodes", e.Edges = "edges", e.Hyperedges = "routed", e.Clusters = "clusters", e.SVG = "icon", e.Circle = "circle", e.Label = "label", e.Comments = "comments", e.Hull = "convex-hull", e.Text = "text", e.Bboxes = "bboxes";
})(pu ||= {});
//#endregion
export { ou as $, wl as A, hl as B, Dl as C, Qe as Ct, Gl as D, a as Dt, Kl as E, y as Et, vl as F, Nl as G, nu as H, Yl as I, Il as J, Pl as K, yl as L, Sl as M, xl as N, Wl as O, r as Ot, gl as P, su as Q, El as R, bl as S, mt as St, Jl as T, _e as Tt, jl as U, ml as V, kl as W, au as X, du as Y, iu as Z, Ql as _, vs as _t, Hl as a, cl as at, _l as b, Z as bt, Bl as c, Wc as ct, cu as d, ol as dt, $l as et, Al as f, $c as ft, Zl as g, Bc as gt, Ll as h, Qc as ht, zl as i, ll as it, Cl as j, fl as k, n as kt, Vl as l, Uc as lt, Ml as m, el as mt, fu as n, Tl as nt, uu as o, ul as ot, Ol as p, al as pt, Fl as q, Ul as r, tu as rt, Rl as s, Zc as st, pu as t, eu as tt, lu as u, sl as ut, Xl as v, xo as vt, ql as w, be as wt, dl as x, Wi as xt, pl as y, Ji as yt, ru as z };
