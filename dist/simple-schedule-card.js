/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const B = globalThis, Q = B.ShadowRoot && (B.ShadyCSS === void 0 || B.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ee = Symbol(), pe = /* @__PURE__ */ new WeakMap();
let Le = class {
  constructor(e, s, i) {
    if (this._$cssResult$ = !0, i !== ee) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = s;
  }
  get styleSheet() {
    let e = this.o;
    const s = this.t;
    if (Q && e === void 0) {
      const i = s !== void 0 && s.length === 1;
      i && (e = pe.get(s)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && pe.set(s, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const et = (t) => new Le(typeof t == "string" ? t : t + "", void 0, ee), tt = (t, ...e) => {
  const s = t.length === 1 ? t[0] : e.reduce((i, n, r) => i + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(n) + t[r + 1], t[0]);
  return new Le(s, t, ee);
}, st = (t, e) => {
  if (Q) t.adoptedStyleSheets = e.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of e) {
    const i = document.createElement("style"), n = B.litNonce;
    n !== void 0 && i.setAttribute("nonce", n), i.textContent = s.cssText, t.appendChild(i);
  }
}, ue = Q ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let s = "";
  for (const i of e.cssRules) s += i.cssText;
  return et(s);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: it, defineProperty: nt, getOwnPropertyDescriptor: rt, getOwnPropertyNames: ot, getOwnPropertySymbols: at, getPrototypeOf: ht } = Object, K = globalThis, fe = K.trustedTypes, lt = fe ? fe.emptyScript : "", ct = K.reactiveElementPolyfillSupport, I = (t, e) => t, X = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? lt : null;
      break;
    case Object:
    case Array:
      t = t == null ? t : JSON.stringify(t);
  }
  return t;
}, fromAttribute(t, e) {
  let s = t;
  switch (e) {
    case Boolean:
      s = t !== null;
      break;
    case Number:
      s = t === null ? null : Number(t);
      break;
    case Object:
    case Array:
      try {
        s = JSON.parse(t);
      } catch {
        s = null;
      }
  }
  return s;
} }, te = (t, e) => !it(t, e), me = { attribute: !0, type: String, converter: X, reflect: !1, useDefault: !1, hasChanged: te };
Symbol.metadata ??= Symbol("metadata"), K.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let C = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, s = me) {
    if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(e, s), !s.noAccessor) {
      const i = Symbol(), n = this.getPropertyDescriptor(e, i, s);
      n !== void 0 && nt(this.prototype, e, n);
    }
  }
  static getPropertyDescriptor(e, s, i) {
    const { get: n, set: r } = rt(this.prototype, e) ?? { get() {
      return this[s];
    }, set(o) {
      this[s] = o;
    } };
    return { get: n, set(o) {
      const a = n?.call(this);
      r?.call(this, o), this.requestUpdate(e, a, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? me;
  }
  static _$Ei() {
    if (this.hasOwnProperty(I("elementProperties"))) return;
    const e = ht(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(I("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(I("properties"))) {
      const s = this.properties, i = [...ot(s), ...at(s)];
      for (const n of i) this.createProperty(n, s[n]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const s = litPropertyMetadata.get(e);
      if (s !== void 0) for (const [i, n] of s) this.elementProperties.set(i, n);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [s, i] of this.elementProperties) {
      const n = this._$Eu(s, i);
      n !== void 0 && this._$Eh.set(n, s);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const s = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const n of i) s.unshift(ue(n));
    } else e !== void 0 && s.push(ue(e));
    return s;
  }
  static _$Eu(e, s) {
    const i = s.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
  }
  addController(e) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
  }
  removeController(e) {
    this._$EO?.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), s = this.constructor.elementProperties;
    for (const i of s.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return st(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, s, i) {
    this._$AK(e, i);
  }
  _$ET(e, s) {
    const i = this.constructor.elementProperties.get(e), n = this.constructor._$Eu(e, i);
    if (n !== void 0 && i.reflect === !0) {
      const r = (i.converter?.toAttribute !== void 0 ? i.converter : X).toAttribute(s, i.type);
      this._$Em = e, r == null ? this.removeAttribute(n) : this.setAttribute(n, r), this._$Em = null;
    }
  }
  _$AK(e, s) {
    const i = this.constructor, n = i._$Eh.get(e);
    if (n !== void 0 && this._$Em !== n) {
      const r = i.getPropertyOptions(n), o = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : X;
      this._$Em = n;
      const a = o.fromAttribute(s, r.type);
      this[n] = a ?? this._$Ej?.get(n) ?? a, this._$Em = null;
    }
  }
  requestUpdate(e, s, i, n = !1, r) {
    if (e !== void 0) {
      const o = this.constructor;
      if (n === !1 && (r = this[e]), i ??= o.getPropertyOptions(e), !((i.hasChanged ?? te)(r, s) || i.useDefault && i.reflect && r === this._$Ej?.get(e) && !this.hasAttribute(o._$Eu(e, i)))) return;
      this.C(e, s, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, s, { useDefault: i, reflect: n, wrapped: r }, o) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, o ?? s ?? this[e]), r !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (s = void 0), this._$AL.set(e, s)), n === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (s) {
      Promise.reject(s);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [n, r] of this._$Ep) this[n] = r;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [n, r] of i) {
        const { wrapped: o } = r, a = this[n];
        o !== !0 || this._$AL.has(n) || a === void 0 || this.C(n, void 0, r, a);
      }
    }
    let e = !1;
    const s = this._$AL;
    try {
      e = this.shouldUpdate(s), e ? (this.willUpdate(s), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(s)) : this._$EM();
    } catch (i) {
      throw e = !1, this._$EM(), i;
    }
    e && this._$AE(s);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach((s) => s.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq &&= this._$Eq.forEach((s) => this._$ET(s, this[s])), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
C.elementStyles = [], C.shadowRootOptions = { mode: "open" }, C[I("elementProperties")] = /* @__PURE__ */ new Map(), C[I("finalized")] = /* @__PURE__ */ new Map(), ct?.({ ReactiveElement: C }), (K.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const se = globalThis, ge = (t) => t, G = se.trustedTypes, _e = G ? G.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, Ue = "$lit$", A = `lit$${Math.random().toFixed(9).slice(2)}$`, He = "?" + A, dt = `<${He}>`, T = document, R = () => T.createComment(""), N = (t) => t === null || typeof t != "object" && typeof t != "function", ie = Array.isArray, pt = (t) => ie(t) || typeof t?.[Symbol.iterator] == "function", V = `[ 	
\f\r]`, P = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ve = /-->/g, ye = />/g, E = RegExp(`>|${V}(?:([^\\s"'>=/]+)(${V}*=${V}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), we = /'/g, be = /"/g, Fe = /^(?:script|style|textarea|title)$/i, ut = (t) => (e, ...s) => ({ _$litType$: t, strings: e, values: s }), p = ut(1), O = Symbol.for("lit-noChange"), f = Symbol.for("lit-nothing"), xe = /* @__PURE__ */ new WeakMap(), S = T.createTreeWalker(T, 129);
function We(t, e) {
  if (!ie(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return _e !== void 0 ? _e.createHTML(e) : e;
}
const ft = (t, e) => {
  const s = t.length - 1, i = [];
  let n, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = P;
  for (let a = 0; a < s; a++) {
    const h = t[a];
    let l, c, d = -1, m = 0;
    for (; m < h.length && (o.lastIndex = m, c = o.exec(h), c !== null); ) m = o.lastIndex, o === P ? c[1] === "!--" ? o = ve : c[1] !== void 0 ? o = ye : c[2] !== void 0 ? (Fe.test(c[2]) && (n = RegExp("</" + c[2], "g")), o = E) : c[3] !== void 0 && (o = E) : o === E ? c[0] === ">" ? (o = n ?? P, d = -1) : c[1] === void 0 ? d = -2 : (d = o.lastIndex - c[2].length, l = c[1], o = c[3] === void 0 ? E : c[3] === '"' ? be : we) : o === be || o === we ? o = E : o === ve || o === ye ? o = P : (o = E, n = void 0);
    const w = o === E && t[a + 1].startsWith("/>") ? " " : "";
    r += o === P ? h + dt : d >= 0 ? (i.push(l), h.slice(0, d) + Ue + h.slice(d) + A + w) : h + A + (d === -2 ? a : w);
  }
  return [We(t, r + (t[s] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class L {
  constructor({ strings: e, _$litType$: s }, i) {
    let n;
    this.parts = [];
    let r = 0, o = 0;
    const a = e.length - 1, h = this.parts, [l, c] = ft(e, s);
    if (this.el = L.createElement(l, i), S.currentNode = this.el.content, s === 2 || s === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (n = S.nextNode()) !== null && h.length < a; ) {
      if (n.nodeType === 1) {
        if (n.hasAttributes()) for (const d of n.getAttributeNames()) if (d.endsWith(Ue)) {
          const m = c[o++], w = n.getAttribute(d).split(A), u = /([.?@])?(.*)/.exec(m);
          h.push({ type: 1, index: r, name: u[2], strings: w, ctor: u[1] === "." ? gt : u[1] === "?" ? _t : u[1] === "@" ? vt : Y }), n.removeAttribute(d);
        } else d.startsWith(A) && (h.push({ type: 6, index: r }), n.removeAttribute(d));
        if (Fe.test(n.tagName)) {
          const d = n.textContent.split(A), m = d.length - 1;
          if (m > 0) {
            n.textContent = G ? G.emptyScript : "";
            for (let w = 0; w < m; w++) n.append(d[w], R()), S.nextNode(), h.push({ type: 2, index: ++r });
            n.append(d[m], R());
          }
        }
      } else if (n.nodeType === 8) if (n.data === He) h.push({ type: 2, index: r });
      else {
        let d = -1;
        for (; (d = n.data.indexOf(A, d + 1)) !== -1; ) h.push({ type: 7, index: r }), d += A.length - 1;
      }
      r++;
    }
  }
  static createElement(e, s) {
    const i = T.createElement("template");
    return i.innerHTML = e, i;
  }
}
function D(t, e, s = t, i) {
  if (e === O) return e;
  let n = i !== void 0 ? s._$Co?.[i] : s._$Cl;
  const r = N(e) ? void 0 : e._$litDirective$;
  return n?.constructor !== r && (n?._$AO?.(!1), r === void 0 ? n = void 0 : (n = new r(t), n._$AT(t, s, i)), i !== void 0 ? (s._$Co ??= [])[i] = n : s._$Cl = n), n !== void 0 && (e = D(t, n._$AS(t, e.values), n, i)), e;
}
class mt {
  constructor(e, s) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = s;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: s }, parts: i } = this._$AD, n = (e?.creationScope ?? T).importNode(s, !0);
    S.currentNode = n;
    let r = S.nextNode(), o = 0, a = 0, h = i[0];
    for (; h !== void 0; ) {
      if (o === h.index) {
        let l;
        h.type === 2 ? l = new U(r, r.nextSibling, this, e) : h.type === 1 ? l = new h.ctor(r, h.name, h.strings, this, e) : h.type === 6 && (l = new yt(r, this, e)), this._$AV.push(l), h = i[++a];
      }
      o !== h?.index && (r = S.nextNode(), o++);
    }
    return S.currentNode = T, n;
  }
  p(e) {
    let s = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, s), s += i.strings.length - 2) : i._$AI(e[s])), s++;
  }
}
class U {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, s, i, n) {
    this.type = 2, this._$AH = f, this._$AN = void 0, this._$AA = e, this._$AB = s, this._$AM = i, this.options = n, this._$Cv = n?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const s = this._$AM;
    return s !== void 0 && e?.nodeType === 11 && (e = s.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, s = this) {
    e = D(this, e, s), N(e) ? e === f || e == null || e === "" ? (this._$AH !== f && this._$AR(), this._$AH = f) : e !== this._$AH && e !== O && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : pt(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== f && N(this._$AH) ? this._$AA.nextSibling.data = e : this.T(T.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: s, _$litType$: i } = e, n = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = L.createElement(We(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === n) this._$AH.p(s);
    else {
      const r = new mt(n, this), o = r.u(this.options);
      r.p(s), this.T(o), this._$AH = r;
    }
  }
  _$AC(e) {
    let s = xe.get(e.strings);
    return s === void 0 && xe.set(e.strings, s = new L(e)), s;
  }
  k(e) {
    ie(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let i, n = 0;
    for (const r of e) n === s.length ? s.push(i = new U(this.O(R()), this.O(R()), this, this.options)) : i = s[n], i._$AI(r), n++;
    n < s.length && (this._$AR(i && i._$AB.nextSibling, n), s.length = n);
  }
  _$AR(e = this._$AA.nextSibling, s) {
    for (this._$AP?.(!1, !0, s); e !== this._$AB; ) {
      const i = ge(e).nextSibling;
      ge(e).remove(), e = i;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class Y {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, s, i, n, r) {
    this.type = 1, this._$AH = f, this._$AN = void 0, this.element = e, this.name = s, this._$AM = n, this.options = r, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = f;
  }
  _$AI(e, s = this, i, n) {
    const r = this.strings;
    let o = !1;
    if (r === void 0) e = D(this, e, s, 0), o = !N(e) || e !== this._$AH && e !== O, o && (this._$AH = e);
    else {
      const a = e;
      let h, l;
      for (e = r[0], h = 0; h < r.length - 1; h++) l = D(this, a[i + h], s, h), l === O && (l = this._$AH[h]), o ||= !N(l) || l !== this._$AH[h], l === f ? e = f : e !== f && (e += (l ?? "") + r[h + 1]), this._$AH[h] = l;
    }
    o && !n && this.j(e);
  }
  j(e) {
    e === f ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class gt extends Y {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === f ? void 0 : e;
  }
}
class _t extends Y {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== f);
  }
}
class vt extends Y {
  constructor(e, s, i, n, r) {
    super(e, s, i, n, r), this.type = 5;
  }
  _$AI(e, s = this) {
    if ((e = D(this, e, s, 0) ?? f) === O) return;
    const i = this._$AH, n = e === f && i !== f || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, r = e !== f && (i === f || n);
    n && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class yt {
  constructor(e, s, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = s, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    D(this, e);
  }
}
const wt = se.litHtmlPolyfillSupport;
wt?.(L, U), (se.litHtmlVersions ??= []).push("3.3.3");
const bt = (t, e, s) => {
  const i = s?.renderBefore ?? e;
  let n = i._$litPart$;
  if (n === void 0) {
    const r = s?.renderBefore ?? null;
    i._$litPart$ = n = new U(e.insertBefore(R(), r), r, void 0, s ?? {});
  }
  return n._$AI(t), n;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ne = globalThis;
class z extends C {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const s = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = bt(s, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return O;
  }
}
z._$litElement$ = !0, z.finalized = !0, ne.litElementHydrateSupport?.({ LitElement: z });
const xt = ne.litElementPolyfillSupport;
xt?.({ LitElement: z });
(ne.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const $t = (t) => (e, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const kt = { attribute: !0, type: String, converter: X, reflect: !1, hasChanged: te }, At = (t = kt, e, s) => {
  const { kind: i, metadata: n } = s;
  let r = globalThis.litPropertyMetadata.get(n);
  if (r === void 0 && globalThis.litPropertyMetadata.set(n, r = /* @__PURE__ */ new Map()), i === "setter" && ((t = Object.create(t)).wrapped = !0), r.set(s.name, t), i === "accessor") {
    const { name: o } = s;
    return { set(a) {
      const h = e.get.call(this);
      e.set.call(this, a), this.requestUpdate(o, h, t, !0, a);
    }, init(a) {
      return a !== void 0 && this.C(o, void 0, t, a), a;
    } };
  }
  if (i === "setter") {
    const { name: o } = s;
    return function(a) {
      const h = this[o];
      e.call(this, a), this.requestUpdate(o, h, t, !0, a);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function je(t) {
  return (e, s) => typeof s == "object" ? At(t, e, s) : ((i, n, r) => {
    const o = n.hasOwnProperty(r);
    return n.constructor.createProperty(r, i), o ? Object.getOwnPropertyDescriptor(n, r) : void 0;
  })(t, e, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function x(t) {
  return je({ ...t, state: !0, attribute: !1 });
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Et = (t, e, s) => (s.configurable = !0, s.enumerable = !0, Reflect.decorate && typeof e != "object" && Object.defineProperty(t, e, s), s);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function St(t, e) {
  return (s, i, n) => {
    const r = (o) => o.renderRoot?.querySelector(t) ?? null;
    return Et(s, i, { get() {
      return r(this);
    } });
  };
}
function q(t) {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}
function Tt(t) {
  const e = q(t), s = (e.getDay() + 6) % 7;
  return e.setDate(e.getDate() - s), e;
}
function Ct(t, e, s) {
  const i = Tt(t);
  i.setDate(i.getDate() + e * 7);
  const n = new Date(i);
  n.setDate(n.getDate() + 7);
  const r = [];
  for (let o = 0; o < s; o++) {
    const a = new Date(i);
    a.setDate(a.getDate() + o), r.push(a);
  }
  return { start: i, end: n, days: r };
}
function Z(t) {
  return t.getHours() * 60 + t.getMinutes();
}
function $e(t) {
  if (!t || t === "auto") return null;
  const e = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!e) return null;
  const s = Number(e[1]), i = Number(e[2]);
  return s > 24 || i > 59 ? null : s * 60 + i;
}
function Mt(t, e, s) {
  const i = $e(e), n = $e(s);
  if (i !== null && n !== null && n > i)
    return { start: i, end: n };
  let r = 1 / 0, o = -1 / 0;
  for (const l of t) {
    if (l.allDay) continue;
    r = Math.min(r, Z(l.start));
    const c = Z(l.end) === 0 ? 24 * 60 : Z(l.end);
    o = Math.max(o, c);
  }
  (!Number.isFinite(r) || !Number.isFinite(o)) && (r = 8 * 60, o = 16 * 60);
  const a = i !== null ? i : r, h = n !== null ? n : o;
  return h > a ? { start: a, end: h } : { start: a, end: a + 60 };
}
function Ot(t, e, s) {
  if (!t || !t.start || !t.end) return null;
  const i = t.all_day === !0 || !t.start.includes("T"), n = ke(t.start), r = ke(t.end);
  return !n || !r ? null : {
    // recurrence_id is unique per occurrence; uid is not. Index backstops both.
    key: `${e}|${t.recurrence_id ?? t.uid ?? "x"}|${t.start}|${s}`,
    entity: e,
    uid: t.uid ?? void 0,
    recurrenceId: t.recurrence_id ?? void 0,
    summary: (t.summary ?? "").trim() || "(no title)",
    description: t.description ?? void 0,
    location: t.location ?? void 0,
    start: n,
    end: r,
    allDay: i
  };
}
function ke(t) {
  const e = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (e) return new Date(Number(e[1]), Number(e[2]) - 1, Number(e[3]));
  const s = new Date(t);
  return Number.isNaN(s.getTime()) ? null : s;
}
function Dt(t, e) {
  return e.filter((s) => s.getDay() === 0 || s.getDay() === 6).some((s) => M(t, s).length > 0);
}
function M(t, e) {
  const s = q(e).getTime(), i = s + 24 * 60 * 60 * 1e3;
  return t.filter((n) => n.start.getTime() < i && n.end.getTime() > s);
}
class Pt {
  constructor(e) {
    this._onChange = e, this._unsubs = [], this._byEntity = /* @__PURE__ */ new Map(), this._failed = /* @__PURE__ */ new Set(), this._key = "";
  }
  /** Every subscribed calendar's events, flattened. */
  get events() {
    const e = [];
    for (const s of this._byEntity.values()) e.push(...s);
    return e;
  }
  /** Calendars whose last push was an error. */
  get failed() {
    return [...this._failed];
  }
  get subscribed() {
    return this._unsubs.length > 0;
  }
  /**
   * Subscribe to `entityIds` over [start, end). A no-op when already subscribed
   * to exactly that; pass `force` to tear down and rebuild regardless, which is
   * what the refresh button does.
   */
  async sync(e, s, i, n, r = !1) {
    const o = `${s.join(",")}|${i.getTime()}|${n.getTime()}`;
    if (o === this._key && this.subscribed && !r) return;
    this._key = o, this.stop();
    const a = Ae(i), h = Ae(n);
    for (const l of s)
      try {
        const c = await e.connection.subscribeMessage(
          (d) => {
            this._key === o && (!d || d.events === null ? (this._failed.add(l), this._byEntity.set(l, [])) : (this._failed.delete(l), this._byEntity.set(
              l,
              d.events.map((m, w) => Ot(m, l, w)).filter((m) => m !== null)
            )), this._onChange());
          },
          {
            type: "calendar/event/subscribe",
            entity_id: l,
            start: a,
            end: h
          }
        );
        if (this._key !== o) {
          c();
          return;
        }
        this._unsubs.push(c);
      } catch {
        this._failed.add(l), this._byEntity.set(l, []), this._onChange();
      }
  }
  /**
   * Ask Home Assistant to re-poll the calendars now.
   *
   * Google's coordinator serves reads from a cache it refreshes every 15
   * minutes, so without this a change made in Google can take that long to
   * appear. `homeassistant.update_entity` reaches
   * `CoordinatorEntity.async_update` -> `async_request_refresh()`, whose
   * debouncer is immediate, so the poll starts at once. It RETURNS before the
   * poll finishes; the result arrives through the existing subscriptions.
   */
  async forceUpdate(e, s) {
    if (s.length)
      try {
        await e.callService("homeassistant", "update_entity", {
          entity_id: s
        });
      } catch {
      }
  }
  /**
   * Ask the colour helper to republish, if it is installed.
   *
   * It reads Home Assistant's in-memory event store, so this must run AFTER the
   * calendars have re-polled or it will just republish what was already there.
   * Silently ignored when pyscript or the helper is absent — the helper is
   * optional and the card works without it.
   */
  async refreshColorHelper(e) {
    try {
      await e.callService("pyscript", "simple_schedule_colors_sync", {});
    } catch {
    }
  }
  stop() {
    for (const e of this._unsubs)
      try {
        e();
      } catch {
      }
    this._unsubs = [];
  }
}
function Ae(t) {
  const e = (s) => String(s).padStart(2, "0");
  return `${t.getFullYear()}-${e(t.getMonth() + 1)}-${e(t.getDate())}T${e(t.getHours())}:${e(t.getMinutes())}:${e(t.getSeconds())}`;
}
const Ee = [
  "#0a84ff",
  "#30d158",
  "#ff9f0a",
  "#bf5af2",
  "#ff375f",
  "#64d2ff",
  "#ffd60a",
  "#5e5ce6"
];
async function It(t, e) {
  if (!e.length) return {};
  const s = {};
  try {
    const i = await t.callWS({
      type: "config/entity_registry/get_entries",
      entity_ids: e
    });
    for (const [n, r] of Object.entries(i ?? {})) {
      const o = r?.options?.calendar?.color;
      typeof o == "string" && /^#[0-9a-fA-F]{6}$/.test(o) && (s[n] = o);
    }
  } catch {
  }
  return s;
}
function zt(t, e, s) {
  return e[t.entity] ?? Ee[s % Ee.length];
}
function Rt(t, e) {
  if (!e) return;
  const s = t.trim().toLowerCase();
  for (const [i, n] of Object.entries(e))
    if (i.trim().toLowerCase() === s) return n;
}
const Nt = "/local/simple-schedule-card-data/event-colors.json";
async function Lt(t) {
  try {
    const e = await fetch(t, { cache: "no-cache" });
    if (!e.ok) return null;
    const s = await e.json();
    return {
      by_uid: s.by_uid ?? {},
      by_recurrence_id: s.by_recurrence_id ?? {}
    };
  } catch {
    return null;
  }
}
function Ut(t, e, s) {
  if (t) {
    if (s && t.by_recurrence_id[s]) return t.by_recurrence_id[s];
    if (e && t.by_uid[e]) return t.by_uid[e];
  }
}
function Se(t, e, s) {
  const i = (n) => {
    const r = n / 255;
    return r <= 0.03928 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * i(t) + 0.7152 * i(e) + 0.0722 * i(s);
}
function Te(t) {
  return 1.05 / (t + 0.05);
}
function Be(t, e) {
  const s = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(t);
  if (!s || !(e > 1)) return t;
  const i = parseInt(s[1], 16), n = parseInt(s[2], 16), r = parseInt(s[3], 16);
  if (Te(Se(i, n, r)) >= e) return t;
  let o = 0, a = 1;
  for (let c = 0; c < 24; c++) {
    const d = (o + a) / 2;
    Te(Se(i * d, n * d, r * d)) >= e ? o = d : a = d;
  }
  const h = o, l = (c) => Math.max(0, Math.min(255, Math.round(c * h))).toString(16).padStart(2, "0");
  return `#${l(i)}${l(n)}${l(r)}`;
}
function Ce(t) {
  const e = [...t].sort(
    (n, r) => n.start.getTime() - r.start.getTime() || r.end.getTime() - n.end.getTime() || n.key.localeCompare(r.key)
  ), s = [], i = /* @__PURE__ */ new Map();
  for (const n of e) {
    let r = s.findIndex((o) => o <= n.start.getTime());
    r === -1 && (r = s.length, s.push(0)), s[r] = n.end.getTime(), i.set(n.key, r);
  }
  return i;
}
function Me(t, e, s) {
  if (e === "packed") {
    const o = t.map((h) => Ce(h));
    let a = 1;
    for (const h of o) a = Math.max(a, Oe(h) + 1);
    return {
      columns: a,
      days: t.map(
        (h, l) => h.map((c) => ({ ev: c, column: o[l].get(c.key) ?? 0 }))
      )
    };
  }
  const i = t.map((o) => {
    const a = /* @__PURE__ */ new Map();
    for (const l of o) {
      const c = a.get(l.entity);
      c ? c.push(l) : a.set(l.entity, [l]);
    }
    const h = /* @__PURE__ */ new Map();
    for (const l of a.values())
      for (const [c, d] of Ce(l)) h.set(c, d);
    return h;
  });
  let n = 1;
  for (const o of i) n = Math.max(n, Oe(o) + 1);
  const r = s.length ? s : [""];
  return {
    columns: r.length * n,
    days: t.map(
      (o, a) => o.map((h) => {
        const l = Math.max(0, r.indexOf(h.entity));
        return { ev: h, column: l * n + (i[a].get(h.key) ?? 0) };
      })
    )
  };
}
function Oe(t) {
  let e = -1;
  for (const s of t.values()) e = Math.max(e, s);
  return e;
}
var Ht = Object.defineProperty, Ft = Object.getOwnPropertyDescriptor, v = (t, e, s, i) => {
  for (var n = i > 1 ? void 0 : i ? Ft(e, s) : e, r = t.length - 1, o; r >= 0; r--)
    (o = t[r]) && (n = (i ? o(e, s, n) : o(n)) || n);
  return i && n && Ht(e, s, n), n;
};
const Wt = "0.1.0", y = {
  days: "auto",
  day_start: "07:00",
  day_end: "15:00",
  orientation: "days-as-columns",
  hour_height: 84,
  day_height: 72,
  // 192px/hour puts a 45-minute block at 144px, ~126px of text inside, which is
  // about 16 characters at the block's 15px/600 face (measured, not guessed).
  // Wider than the screen for a normal school day, hence the scroller.
  hour_width: 192,
  lane_mode: "by_source",
  time_format: "auto",
  min_contrast: 4.5,
  show_refresh: !0,
  show_mode_toggles: !0,
  mode_toggle_icons: "crop",
  layout: "auto",
  layout_breakpoint: 560
}, jt = 28, Bt = 12, J = 55, Xt = 22, Gt = 520, qt = 64, Kt = 20, Yt = 172, Vt = 18, De = {
  crop: {
    focused: "mdi:crop",
    full: "mdi:crop-free",
    fixed: "mdi:pan-horizontal",
    adaptive: "mdi:fit-to-screen-outline"
  },
  timeline: {
    focused: "mdi:timeline-clock-outline",
    full: "mdi:timeline-outline",
    fixed: "mdi:pan-horizontal",
    adaptive: "mdi:overscan"
  },
  calendar: {
    focused: "mdi:calendar-range",
    full: "mdi:calendar-expand-horizontal",
    fixed: "mdi:pan-horizontal",
    adaptive: "mdi:fit-to-screen-outline"
  },
  arrows: {
    focused: "mdi:arrow-collapse-horizontal",
    full: "mdi:arrow-expand-horizontal",
    fixed: "mdi:pan-horizontal",
    adaptive: "mdi:fit-to-screen-outline"
  }
}, Pe = 6, Zt = 0.22, Jt = 48, Qt = 0.45, es = 0.18, ts = 190, ss = 300, is = 340, Ie = "cubic-bezier(0.32, 0.72, 0, 1)", ns = 600, rs = 12e3, os = 2200;
let _ = class extends z {
  constructor() {
    super(...arguments), this._sources = [], this._colors = {}, this._eventColors = null, this._weekOffset = 0, this._now = /* @__PURE__ */ new Date(), this._hostWidth = 0, this._refreshing = !1, this._navDir = "none", this._activeIdx = 0, this._swipe = null, this._swipeIn = 0, this._modeOverride = {}, this._pickerOpen = !1, this._animEpoch = 0, this._hThumb = null, this._revision = 0, this._subs = new Pt(() => {
      this._revision++;
    }), this._colorKey = "", this._focusPx = 0, this._focusKey = "", this._focusBusy = !1, this._colorsAt = 0, this._eventColorsAt = 0, this._eventColorsPending = !1, this._onOutside = (t) => {
      const e = this.renderRoot?.querySelector(".picker");
      e && t.composedPath().includes(e) || this._setPicker(!1);
    }, this._onPickerKey = (t) => {
      t.key === "Escape" && this._setPicker(!1);
    };
  }
  setConfig(t) {
    if (!t) throw new Error("simple-schedule-card: invalid configuration");
    const e = as(t);
    if (!e.length)
      throw new Error(
        'simple-schedule-card: "entity" (a calendar entity_id) or "entities" is required'
      );
    for (const s of e)
      if (!s.entity.startsWith("calendar."))
        throw new Error(`simple-schedule-card: "${s.entity}" is not a calendar entity`);
    this._config = { ...t }, this._sources = e, this._colorKey = "";
  }
  getCardSize() {
    return 10;
  }
  getGridOptions() {
    return { columns: "full", rows: 10, min_rows: 6 };
  }
  static getStubConfig() {
    return {
      type: "custom:simple-schedule-card",
      entity: "calendar.school",
      ...y
    };
  }
  connectedCallback() {
    super.connectedCallback(), this._tick = setInterval(() => {
      this._now = /* @__PURE__ */ new Date();
    }, 6e4), this._hostRo = new ResizeObserver((t) => {
      const e = Math.round(t[t.length - 1].contentRect.width);
      e && e !== this._hostWidth && (this._hostWidth = e);
    }), this._hostRo.observe(this);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._tick && clearInterval(this._tick), this._tick = void 0, this._spinTimer && clearTimeout(this._spinTimer), this._spinTimer = void 0, this._hostRo?.disconnect(), this._hostRo = void 0, this._setPicker(!1), this._subs.stop();
  }
  /** The arriving half of a committed swipe. */
  _runSwipeIn() {
    const t = this._swipeIn, e = this._listEl;
    if (this._swipeIn = 0, !e) return;
    e.getAnimations().forEach((i) => i.cancel());
    const s = e.clientWidth || 1;
    e.style.transform = "", e.style.opacity = "", !this._reducedMotion && e.animate(
      [
        { transform: "translateX(" + -t * s * 0.55 + "px)", opacity: "0" },
        { transform: "translateX(0px)", opacity: "1" }
      ],
      { duration: ss, easing: Ie }
    );
  }
  updated(t) {
    super.updated(t), this._swipeIn !== 0 && this._runSwipeIn(), !(!this.hass || !this._config) && (this._orientation === "days-as-rows" && (this._measureScrollbar(), this._focusScroller()), this._ensureSubscribed(), this._ensureColors(), this._ensureEventColors());
  }
  /**
   * The week to draw. The window is ALWAYS the full seven days — that is what is
   * subscribed to — and only the day list is trimmed, so `auto` can look at the
   * weekend before deciding whether to show it.
   */
  get _window() {
    const t = Ct(this._now, this._weekOffset, 7), e = this._config?.days ?? y.days;
    let s = 5;
    return (e === "mon-sun" || e === "auto" && Dt(this._activeEvents, t.days)) && (s = 7), { start: t.start, end: t.end, days: t.days.slice(0, s) };
  }
  get _entityIds() {
    return this._sources.map((t) => t.entity);
  }
  /** Events of the calendar currently on screen. */
  get _activeEvents() {
    const t = this._sources[Math.min(this._activeIdx, this._sources.length - 1)]?.entity;
    return this._subs.events.filter((e) => e.entity === t);
  }
  async _ensureSubscribed() {
    const t = this._window;
    await this._subs.sync(this.hass, this._entityIds, t.start, t.end);
  }
  /**
   * Re-read the calendars' own colours. Refetched on a TTL rather than once,
   * because the `simple_schedule_colors` helper writes this field in the
   * background when a calendar is recoloured in Google — without a TTL the card
   * would show the stale colour until the page was reloaded.
   */
  async _ensureColors(t = !1) {
    const e = this._entityIds.join(","), s = Date.now() - this._colorsAt > 10 * 6e4;
    !t && e === this._colorKey && !s || (this._colorKey = e, this._colorsAt = Date.now(), this._colors = await It(this.hass, this._entityIds));
  }
  /** The colour of a whole calendar — used by the legend. */
  /**
   * True whenever something is layered in front of the schedule — the calendar
   * menu or an event's detail sheet. Both recede the grid the same way, so the
   * card has one behaviour for "there is something on top of this" rather than
   * two that drift apart.
   */
  get _receded() {
    return this._pickerOpen || !!this._selected;
  }
  /** Close the detail sheet, replaying the entry cascade as the menu does. */
  _closeSheet() {
    this._selected && (this._selected = void 0, this._animEpoch++);
  }
  /** Alternating keyframe name — see _animEpoch. */
  get _evAnim() {
    return this._animEpoch % 2 ? "evInB" : "evIn";
  }
  get _minContrast() {
    const t = this._config?.min_contrast;
    return typeof t == "number" ? t : y.min_contrast;
  }
  /** URL of the pyscript helper's output, or null when it is switched off. */
  get _helperUrl() {
    const t = this._config?.color_helper;
    return t === !1 ? null : typeof t == "string" && t ? t : Nt;
  }
  /**
   * Refresh the per-event colour map. The helper rewrites it every 15 minutes,
   * so re-reading more often than that is pointless; `force` is for the refresh
   * button. A missing file is the normal "helper not installed" case and leaves
   * `_eventColors` null so every block falls back to its calendar's colour.
   */
  async _ensureEventColors(t = !1) {
    const e = this._helperUrl;
    if (!e) {
      this._eventColors = null;
      return;
    }
    if (!this._eventColorsPending && !(!t && this._eventColorsAt && Date.now() - this._eventColorsAt < 10 * 6e4)) {
      this._eventColorsPending = !0;
      try {
        this._eventColors = await Lt(e), this._eventColorsAt = Date.now();
      } finally {
        this._eventColorsPending = !1;
      }
    }
  }
  _colorFor(t) {
    const e = this._sources.findIndex((i) => i.entity === t), s = this._sources[e] ?? { entity: t };
    return zt(s, this._colors, e < 0 ? 0 : e);
  }
  /**
   * The colour of one block, most specific first: an explicit `event_colors`
   * title match, then Google's own per-event colour via the helper, then the
   * calendar's colour.
   */
  _colorForEvent(t) {
    return Rt(t.summary, this._config?.event_colors) ?? Ut(this._eventColors, t.uid, t.recurrenceId) ?? this._colorFor(t.entity);
  }
  /** The calendar's own name, as Home Assistant has it. Never a configured one. */
  _nameFor(t) {
    return hs(this.hass?.states?.[t]?.attributes?.friendly_name ?? t);
  }
  /**
   * The active calendar, with any header-toggle override folded in. Every read
   * of calendar_mode and view_width_mode goes through here, so overriding at
   * this one point reaches the axis, the lane packing and both renderers
   * without any of them knowing the modes can be changed at runtime.
   */
  get _active() {
    const t = this._sources[Math.min(this._activeIdx, this._sources.length - 1)];
    if (!t) return t;
    const e = this._modeOverride[t.entity];
    return e ? { ...t, ...e } : t;
  }
  /** The active calendar's mode, override first, then config, then default. */
  get _calendarMode() {
    return this._active?.calendar_mode === "full" ? "full" : "focused";
  }
  get _widthMode() {
    return this._active?.view_width_mode === "adaptive" ? "adaptive" : "fixed";
  }
  /**
   * Flip one mode for the active calendar only. Keyed by entity so each
   * calendar remembers its own shape while the card is open - a timetable and
   * a household calendar want different ones, which is why these are per
   * calendar in config to begin with. Deliberately NOT persisted: the YAML
   * stays the source of truth and a reload returns to it.
   */
  _toggleMode(t) {
    const e = this._sources[Math.min(this._activeIdx, this._sources.length - 1)];
    if (!e) return;
    const s = this._active, i = t === "calendar_mode" ? { calendar_mode: s.calendar_mode === "full" ? "focused" : "full" } : {
      view_width_mode: s.view_width_mode === "adaptive" ? "fixed" : "adaptive"
    };
    this._modeOverride = {
      ...this._modeOverride,
      [e.entity]: { ...this._modeOverride[e.entity], ...i }
    }, this._animEpoch++;
  }
  /** The person's picture, if one is configured and set. */
  _avatarFor(t) {
    const e = t.person ? this.hass?.states?.[t.person]?.attributes?.entity_picture : void 0;
    return typeof e == "string" && e ? e : void 0;
  }
  /**
   * Open state for the calendar menu, with a document-level listener while it is
   * open so a click anywhere else dismisses it.
   *
   * The listener has to sit on `document` and test `composedPath()`: the card is
   * in a shadow root, so a click outside it never bubbles to anything the card
   * itself can see.
   */
  _setPicker(t) {
    t !== this._pickerOpen && (this._pickerOpen = t, t || this._animEpoch++, t ? (document.addEventListener("pointerdown", this._onOutside, !0), document.addEventListener("keydown", this._onPickerKey, !0)) : (document.removeEventListener("pointerdown", this._onOutside, !0), document.removeEventListener("keydown", this._onPickerKey, !0)));
  }
  _selectCalendar(t) {
    this._setPicker(!1), t !== this._activeIdx && (this._navDir = t > this._activeIdx ? "fwd" : "back", this._activeIdx = t, this._selected = void 0);
  }
  /**
   * Week navigation by drag, for the list layout, where the two week arrows are
   * hidden. The content tracks the finger and only changes week once the drag
   * passes a threshold or is flicked, which is what makes the gesture feel
   * committed rather than guessed at.
   *
   * Driven by direct style writes rather than reactive state: a Lit re-render
   * per pointermove would rebuild every row of the list sixty times a second.
   */
  get _reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  _rubber(t, e) {
    const s = e * es, i = Math.abs(t);
    if (i <= s) return t;
    const n = i - s;
    return Math.sign(t) * (s + n / (1 + n / (e * 0.32)));
  }
  _swipeStart(t) {
    const e = this._listEl;
    if (!(!e || this._mode !== "list" || this._swipeIn !== 0)) {
      e.getAnimations().forEach((s) => s.cancel()), e.style.transition = "none";
      try {
        e.setPointerCapture(t.pointerId);
      } catch {
      }
      this._swipe = { x: t.clientX, w: e.clientWidth || 1, dragging: !1, lastX: t.clientX, lastT: performance.now(), v: 0 };
    }
  }
  _swipeMove(t) {
    const e = this._swipe, s = this._listEl;
    if (!e || !s) return;
    const i = t.clientX - e.x;
    if (!e.dragging) {
      if (Math.abs(i) < Pe) return;
      e.dragging = !0;
    }
    const n = performance.now(), r = n - e.lastT;
    r > 0 && (e.v = (t.clientX - e.lastX) / r), e.lastX = t.clientX, e.lastT = n;
    const o = this._rubber(i, e.w);
    s.style.transform = "translateX(" + o + "px)", s.style.opacity = String(1 - Math.min(0.3, Math.abs(o) / e.w));
  }
  /** Finger lifted: either carry the week over, or spring back to where it was. */
  _swipeEnd(t) {
    const e = this._swipe, s = this._listEl;
    if (this._swipe = null, !e || !s || !e.dragging) return;
    const i = t.clientX - e.x, n = Math.max(Jt, e.w * Zt), r = Math.abs(e.v) > Qt && Math.abs(i) > Pe * 2;
    Math.abs(i) >= n || r ? this._swipeCommit(i > 0 ? 1 : -1, e.w) : this._swipeRelease();
  }
  /** Nothing committed - ease back to rest. */
  _swipeRelease() {
    const t = this._listEl;
    t && (this._reducedMotion || t.animate(
      [{ transform: t.style.transform || "translateX(0px)", opacity: t.style.opacity || "1" }, { transform: "translateX(0px)", opacity: "1" }],
      { duration: is, easing: Ie }
    ), t.style.transform = "", t.style.opacity = "");
  }
  /**
   * Carry the content the rest of the way out, change the week, then bring the
   * new one in from the other side. Two halves rather than one cross-fade: the
   * week that is leaving and the week arriving are the same element, so they
   * cannot occupy it at once.
   */
  _swipeCommit(t, e) {
    const s = this._listEl;
    if (!s) return;
    if (this._reducedMotion) {
      s.style.transform = "", s.style.opacity = "", this._navDir = "none", this._weekOffset += t, this._selected = void 0;
      return;
    }
    const i = s.style.transform || "translateX(0px)";
    s.animate(
      [{ transform: i, opacity: s.style.opacity || "1" }, { transform: "translateX(" + t * e * 0.55 + "px)", opacity: "0" }],
      { duration: ts, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" }
    ).finished.then(() => {
      this._swipeIn = t, this._navDir = "none", this._weekOffset += t, this._selected = void 0;
    }).catch(() => {
    });
  }
  _goWeek(t) {
    this._navDir = t > 0 ? "fwd" : "back", this._weekOffset += t, this._selected = void 0;
  }
  _goToday() {
    this._weekOffset !== 0 && (this._navDir = this._weekOffset > 0 ? "back" : "fwd", this._weekOffset = 0, this._selected = void 0);
  }
  /**
   * Refresh everything, in the order the data actually flows.
   *
   * A refresh that only re-read what Home Assistant already held was useless:
   * Google's coordinator caches for 15 minutes, so a change made in Google
   * simply was not there yet. The full chain is
   *
   *   1. force the calendars to re-poll Google,
   *   2. wait for that to land,
   *   3. have the colour helper republish from the freshly updated store,
   *   4. re-subscribe and re-read both colour sources.
   *
   * Steps 1 and 3 are best-effort: neither the integration's polling nor the
   * helper is guaranteed to be present, and the card must still refresh what it
   * can without them.
   */
  async _refresh() {
    if (this._refreshing || !this.hass) return;
    this._refreshing = !0;
    const t = Date.now();
    this._spinTimer && clearTimeout(this._spinTimer);
    const e = setTimeout(() => {
      this._refreshing = !1;
    }, rs);
    try {
      await this._subs.forceUpdate(this.hass, this._entityIds), await new Promise((i) => setTimeout(i, os)), await this._subs.refreshColorHelper(this.hass);
      const s = this._window;
      await Promise.all([
        this._subs.sync(this.hass, this._entityIds, s.start, s.end, !0),
        this._ensureColors(!0),
        this._ensureEventColors(!0)
      ]);
    } finally {
      clearTimeout(e);
      const s = Math.max(0, ns - (Date.now() - t));
      this._spinTimer = setTimeout(() => {
        this._refreshing = !1;
      }, s);
    }
  }
  render() {
    if (!this._config || !this.hass) return f;
    const t = this._config, e = this._window, s = this._active?.entity, i = this._subs.events.filter((a) => a.entity === s), n = i.filter((a) => !a.allDay), r = Mt(n, t.day_start ?? y.day_start, t.day_end ?? y.day_end), o = this._mode === "list";
    return p`
      <ha-card>
        <div class="panel ${o ? "narrow" : ""}">
          ${this._renderHead(e.days)}
          ${o ? this._renderList(e.days, i) : this._renderGrid(e.days, i, r)}
        </div>
        ${this._renderSheet()}
      </ha-card>
    `;
  }
  /** Config pins the layout; 'auto' picks by the card's own measured width. */
  get _mode() {
    const t = this._config?.layout ?? y.layout;
    if (t === "grid" || t === "list") return t;
    const e = this._config?.layout_breakpoint ?? y.layout_breakpoint;
    return this._hostWidth > 0 && this._hostWidth < e ? "list" : "grid";
  }
  /**
   * The pill next to the date range. Only the three weeks either side of now get
   * one — past that the range itself is the clearer label, and "in 7 weeks" is
   * not something anyone reads off a wall.
   */
  get _weekLabel() {
    return this._weekOffset === 0 ? "This week" : this._weekOffset === 1 ? "Next week" : this._weekOffset === -1 ? "Previous week" : null;
  }
  /** Avatar, or the calendar's initial on its own colour when there is none. */
  _renderAvatar(t) {
    const e = this._avatarFor(t);
    if (e) return p`<img class="av" src=${e} alt="" />`;
    const s = Be(this._colorFor(t.entity), this._minContrast), i = (this._nameFor(t.entity).trim()[0] ?? "?").toUpperCase();
    return p`<span class="av init" style="background:${s}">${i}</span>`;
  }
  /**
   * The card's heading: avatar, the calendar's own name, and — when there is
   * more than one calendar — a chevron. The whole thing is the target, not just
   * the chevron.
   *
   * There is no separate card title. The calendar being shown IS the title, so
   * a single calendar renders the same heading without the chevron or the menu,
   * rather than a control that cannot do anything.
   */
  _renderPicker() {
    const t = this._sources, e = t.length > 1, s = this._active;
    return p`
      <div class="picker">
        <button
          class="pick-btn ${e ? "" : "static"}"
          ?disabled=${!e}
          aria-haspopup=${e ? "listbox" : f}
          aria-expanded=${e ? this._pickerOpen ? "true" : "false" : f}
          @click=${() => {
      e && this._setPicker(!this._pickerOpen);
    }}
        >
          ${this._renderAvatar(s)}
          <span class="pick-name">${this._nameFor(s.entity)}</span>
          ${e ? p`<ha-icon
                class="pick-chev ${this._pickerOpen ? "open" : ""}"
                icon="mdi:chevron-down"
              ></ha-icon>` : f}
        </button>
        <div class="pick-menu ${this._pickerOpen ? "open" : ""}" role="listbox">
          ${t.map(
      (i, n) => p`
              <button
                class="pick-item ${n === this._activeIdx ? "sel" : ""}"
                role="option"
                aria-selected=${n === this._activeIdx ? "true" : "false"}
                @click=${() => this._selectCalendar(n)}
              >
                ${this._renderAvatar(i)}
                <span class="pick-name">${this._nameFor(i.entity)}</span>
              </button>
            `
    )}
        </div>
      </div>
    `;
  }
  _renderHead(t) {
    const e = this._config, s = this._mode === "list", i = this._subs.failed, n = t.length ? `${this._fmtDate(t[0])} – ${this._fmtDate(t[t.length - 1])}` : "";
    return p`
      <div class="head">
        <div class="titles">${this._renderPicker()}</div>
        ${this._renderModeToggles()}
        <div class="head-right">
          <div class="tools">
          ${i.length ? p`<div class="warn" title=${i.join(", ")}>
                <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
              </div>` : f}
          ${s ? f : p`<button
                class="btn"
                @click=${() => this._goWeek(-1)}
                aria-label="Previous week"
              >
                <ha-icon icon="mdi:chevron-left"></ha-icon>
              </button>`}
          <button
            class="btn today ${this._weekOffset === 0 ? "off" : ""}"
            @click=${() => this._goToday()}
            aria-label="This week"
          >
            <ha-icon icon="mdi:calendar-today"></ha-icon>
          </button>
          ${s ? f : p`<button class="btn" @click=${() => this._goWeek(1)} aria-label="Next week">
                <ha-icon icon="mdi:chevron-right"></ha-icon>
              </button>`}
          ${e.show_refresh ?? y.show_refresh ? p`<button
                class="btn ${this._refreshing ? "spin" : ""}"
                @click=${() => void this._refresh()}
                aria-label="Refresh"
              >
                <ha-icon icon="mdi:refresh"></ha-icon>
              </button>` : f}
          </div>
          <div class="range">
            ${n}${this._weekLabel ? p`<span class="pill">${this._weekLabel}</span>` : f}
          </div>
        </div>
      </div>
    `;
  }
  /**
   * The two mode toggles, centred in the header.
   *
   * Each shows the mode it is CURRENTLY in rather than the one it would switch
   * to - a toggle that displays its own destination reads backwards the moment
   * you stop looking at it - and is highlighted when it is on the non-default
   * setting, so a glance says whether the view has been reshaped.
   *
   * Only offered where they mean something: the list layout has no time axis at
   * all, and view_width_mode has nothing to fit unless the days run as rows.
   */
  _renderModeToggles() {
    const t = this._config;
    if (!(t.show_mode_toggles ?? y.show_mode_toggles) || this._mode !== "grid") return f;
    const e = this._calendarMode === "full", s = this._widthMode === "adaptive", i = this._orientation === "days-as-rows", n = De[t.mode_toggle_icons ?? y.mode_toggle_icons] ?? De[y.mode_toggle_icons];
    return p`
      <div class="mode-toggles">
        <button
          class="btn ${e ? "on" : ""}"
          @click=${() => this._toggleMode("calendar_mode")}
          title=${e ? "Whole day - tap to fit the events" : "Fitted to the events - tap for the whole day"}
          aria-pressed=${e ? "true" : "false"}
          aria-label="Time span"
        >
          <ha-icon icon=${e ? n.full : n.focused}></ha-icon>
        </button>
        ${i ? p`<button
              class="btn ${s ? "on" : ""}"
              @click=${() => this._toggleMode("view_width_mode")}
              title=${s ? "Fitted to the card - tap for a fixed scale" : "Fixed scale, scrolls - tap to fit the card"}
              aria-pressed=${s ? "true" : "false"}
              aria-label="Width"
            >
              <ha-icon icon=${s ? n.adaptive : n.fixed}></ha-icon>
            </button>` : f}
      </div>
    `;
  }
  /**
   * Size and place the custom scrollbar thumb.
   *
   * Called on scroll AND from `updated`, because on first paint there has been
   * no scroll event yet and the bar has to be there from the start — its job is
   * to tell you there is more schedule off-screen, which is most useful before
   * you have touched anything.
   *
   * Fractions rather than pixels: the track sits under the hour columns only, so
   * it is narrower than the scroller.
   */
  _measureScrollbar(t) {
    const e = t ?? this.renderRoot?.querySelector(".rscroll");
    if (!e) return;
    const { scrollLeft: s, scrollWidth: i, clientWidth: n } = e;
    if (i <= n + 1) {
      this._hThumb && (this._hThumb = null);
      return;
    }
    const r = Math.max(6, n / i * 100), o = s / (i - n) * (100 - r), a = this._hThumb;
    (!a || Math.abs(a.left - o) > 0.05 || Math.abs(a.width - r) > 0.05) && (this._hThumb = { left: o, width: r });
  }
  /**
   * Park the scroller where the active calendar should open: just before the
   * first event for a full-day calendar, and 0 for a focused one — where x=0 is
   * the first event already, but still needs setting so a switch does not
   * inherit the previous calendar's position.
   *
   * The assignment is retried across a few frames because layout is not settled
   * on the update that first renders the grid, and a scrollLeft set before the
   * content is scrollable is silently CLAMPED TO ZERO — recording the position
   * as done before checking left the card sitting at midnight.
   */
  _focusScroller() {
    const t = `${this._weekOffset}|${this._activeIdx}|${this._focusPx}`;
    if (t === this._focusKey || this._focusBusy) return;
    const e = this.renderRoot?.querySelector(".rscroll");
    if (!e) return;
    this._focusBusy = !0;
    let s = 0;
    const i = () => {
      if (e.scrollLeft = this._focusPx, Math.abs(e.scrollLeft - this._focusPx) < 2) {
        this._focusKey = t, this._focusBusy = !1;
        return;
      }
      s++ < 12 ? requestAnimationFrame(i) : this._focusBusy = !1;
    };
    i();
  }
  _onHScroll(t) {
    this._measureScrollbar(t.currentTarget);
  }
  get _orientation() {
    return this._config?.orientation === "days-as-rows" ? "days-as-rows" : "days-as-columns";
  }
  /**
   * The two orientations share everything that matters — the same events, the
   * same lane packing, the same colours, the same uniform-lattice rule. Only the
   * axis each one runs along differs, so `placeWeek`'s `column` is read as a
   * sub-column in one and a stacked sub-row in the other.
   */
  _renderGrid(t, e, s) {
    return this._orientation === "days-as-rows" ? this._renderRowsGrid(t, e, s) : this._renderColumnsGrid(t, e, s);
  }
  /** Days down the left, time across the top — the printed-timetable shape. */
  _renderRowsGrid(t, e, s) {
    const i = this._config, n = i.day_height ?? y.day_height, r = i.hour_width ?? y.hour_width, o = this._calendarMode === "full", a = o ? 0 : s.start, h = o ? 24 * 60 : s.end, l = h - a, c = this._widthMode === "adaptive", d = Math.round(l / 60 * r), m = c ? "%" : "px", w = c ? 100 : d, u = (g) => (g - a) / l * (c ? 100 : d), b = u(a + Bt) - u(a), H = t.map((g) => M(e.filter(($) => !$.allDay), g)), Xe = this._active ? [this._active.entity] : [], re = Me(H, i.lane_mode ?? y.lane_mode, Xe), Ge = re.columns * n, qe = t.map((g) => M(e.filter(($) => $.allDay), g)), oe = [];
    for (let g = Math.ceil(a / 60) * 60; g <= h; g += 60) oe.push(g);
    const Ke = Math.max(160, (this._hostWidth || 1e3) - Yt - Vt * 2), Ye = c ? Ke / (l / 60) : r, Ve = Math.max(1, Math.ceil(qt / Ye)), ae = oe.filter((g, $) => $ % Ve === 0), Ze = t.findIndex((g) => Re(g, this._now));
    return this._focusPx = o && !c ? Math.max(0, Math.round((s.start - Kt - a) / l * d)) : 0, p`
      <div
        class="rgrid dir-${this._navDir} ${this._receded ? "dimmed" : ""}"
        style="--row-h:${Ge}px; --lane-h:${n}px"
      >
        <div
          class="rframe"
          @animationend=${() => {
      this._navDir = "none";
    }}
        >
          <!-- Outside the scroller on purpose. As a sticky child it bulged
               during the rubber-band: overscroll drives scrollLeft negative,
               and sticky only ever pushes an element right, so it travelled
               with the content. Out here it cannot move at all, while the hours
               keep their bounce. -->
          <div class="rdays">
            <div class="rcorner"></div>
            ${t.map(
      (g, $) => p`
                <div
                  class="rday ${$ % 2 ? "alt" : ""} ${$ === Ze ? "today" : ""}"
                >
                  <span class="dow">${this._fmtDowLong(g)},</span>
                  <span class="dnum">${this._fmtDate(g)}</span>
                </div>
              `
    )}
          </div>

          <div class="rscroll" @scroll=${(g) => this._onHScroll(g)}>
            <div class="rinner" style="--axis-w:${c ? "100%" : `${d}px`}">
              <div class="rtimes">
                ${ae.map(
      (g) => p`<div
                      class="rhr ${u(g) < 0.5 ? "first" : ""} ${u(g) >= w - 0.5 ? "last" : ""}"
                      style="left:${u(g)}${m}"
                    >
                      ${this._fmtHour(g)}
                    </div>`
    )}
              </div>

              ${t.map((g, $) => {
      const he = q(g).getTime();
      return p`
                  <div class="rcanvas ${$ % 2 ? "alt" : ""}">
                    <div class="rlines">
                      ${ae.map(
        (k) => p`<div class="rline" style="left:${u(k)}${m}"></div>`
      )}
                    </div>
                    ${qe[$].map(
        (k) => p`
                        <div
                          class="ev rev"
                          style="left:0; width:100%; top:0; height:${n}px;
                                 animation-name:${this._evAnim}; animation-delay:${$ * J}ms;
                                 ${W(this._colorForEvent(k), this._minContrast)}"
                          @click=${() => this._selected = k}
                        >
                          <div class="ev-in"><div class="ev-name">${k.summary}</div></div>
                        </div>
                      `
      )}
                    ${re.days[$].map(({ ev: k, column: Je }) => {
        const F = Math.max(a, j(k.start, he)), le = j(k.end, he), ce = Math.min(h, le <= F ? F + 15 : le);
        if (ce <= a || F >= h) return f;
        const de = u(F), Qe = Math.max(u(ce) - de, b);
        return p`
                        <div
                          class="ev rev"
                          style="left:${de}${m}; width:${Qe}${m};
                                 top:${Je * n}px; height:${n}px;
                                 animation-name:${this._evAnim}; animation-delay:${$ * J}ms;
                                 ${W(this._colorForEvent(k), this._minContrast)}"
                          @click=${() => this._selected = k}
                        >
                          <div class="ev-in">
                            <div class="ev-name">${k.summary}</div>
                            <div class="ev-time">
                              ${this._fmtTime(k.start)} – ${this._fmtTime(k.end)}
                            </div>
                          </div>
                        </div>
                      `;
      })}
                  </div>
                `;
    })}
            </div>
          </div>
        </div>
        ${this._hThumb ? p`<div class="hbar">
              <div
                class="hthumb"
                style="left:${this._hThumb.left}%; width:${this._hThumb.width}%"
              ></div>
            </div>` : f}
      </div>
    `;
  }
  /** Days across the top, time down the left — the calendar shape. */
  _renderColumnsGrid(t, e, s) {
    this._calendarMode === "full" && (s = { start: 0, end: 24 * 60 });
    const i = this._config, n = i.hour_height ?? y.hour_height, r = s.end - s.start, o = Math.round(r / 60 * n), a = t.map((u) => M(e.filter((b) => !b.allDay), u)), h = this._active ? [this._active.entity] : [], l = Me(a, i.lane_mode ?? y.lane_mode, h), c = t.map((u) => M(e.filter((b) => b.allDay), u)), d = c.some((u) => u.length > 0), m = [];
    for (let u = Math.ceil(s.start / 60) * 60; u <= s.end; u += 60) m.push(u);
    const w = t.length;
    return p`
      <div
        class="grid dir-${this._navDir} ${this._receded ? "dimmed" : ""}"
        style="--cols:${w}; --sub:${l.columns}; --body-h:${o}px"
        @animationend=${() => {
      this._navDir = "none";
    }}
      >
        <div class="hdr">
          <div class="corner"></div>
          ${t.map(
      (u, b) => p`
              <div class="dayhead ${b % 2 ? "alt" : ""}">
                <span class="dow">${this._fmtDowLong(u)},</span>
                <span class="dnum">${this._fmtDate(u)}</span>
              </div>
            `
    )}
        </div>

        ${d ? p`
              <div class="allday">
                <div class="gut-lbl">all-day</div>
                ${c.map(
      (u) => p`
                    <div class="ad-cell">
                      ${u.map(
        (b) => p`
                          <div
                            class="ad"
                            style=${W(this._colorForEvent(b), this._minContrast)}
                            @click=${() => this._selected = b}
                          >
                            ${b.summary}
                          </div>
                        `
      )}
                    </div>
                  `
    )}
              </div>
            ` : f}

        <div class="body">
          <div class="lines">
            ${m.map(
      (u) => p`<div class="line" style="top:${Ne(u, s)}"></div>`
    )}
          </div>
          <div class="gutter">
            ${m.map(
      (u) => p`<div class="hr" style="top:${Ne(u, s)}">${this._fmtHour(u)}</div>`
    )}
          </div>
          ${t.map(
      (u, b) => this._renderDay(u, b, l.days[b], l.columns, s, o)
    )}
        </div>
      </div>
    `;
  }
  _renderDay(t, e, s, i, n, r) {
    const o = n.end - n.start, a = q(t).getTime();
    return p`
      <div class="day ${e % 2 ? "alt" : ""}">
        ${s.map(({ ev: h, column: l }) => {
      const c = Math.max(n.start, j(h.start, a)), d = j(h.end, a), m = Math.min(n.end, d <= c ? c + 15 : d);
      if (m <= n.start || c >= n.end) return f;
      const w = (c - n.start) / o * r, u = Math.max(jt, (m - c) / o * r), b = this._colorForEvent(h), H = u < 46;
      return p`
            <div
              class="ev ${H ? "compact" : ""} ${this._selected?.key === h.key ? "sel" : ""}"
              style="top:${w}px; height:${u}px;
                     left:calc(${l} * (100% / ${i}));
                     width:calc(100% / ${i});
                     animation-name:${this._evAnim}; animation-delay:${e * J}ms;
                     ${W(b, this._minContrast)}"
              @click=${() => this._selected = h}
            >
              <div class="ev-in">
                <div class="ev-name">${h.summary}</div>
                ${H ? f : p`<div class="ev-time">
                      ${this._fmtTime(h.start)} – ${this._fmtTime(h.end)}
                    </div>`}
              </div>
            </div>
          `;
    })}
      </div>
    `;
  }
  /**
   * Narrow fallback. Deliberately minimal for v0.1.0 — the phone design is a
   * later pass; this exists so the card is not broken when it lands on one.
   */
  _renderList(t, e) {
    let s = 0;
    return p`
      <div
        class="list ${this._receded ? "dimmed" : ""} dir-${this._navDir}"
        @pointerdown=${(i) => this._swipeStart(i)}
        @pointermove=${(i) => this._swipeMove(i)}
        @pointerup=${(i) => this._swipeEnd(i)}
        @pointercancel=${() => {
      this._swipe?.dragging && this._swipeRelease(), this._swipe = null;
    }}
        @animationend=${() => {
      this._navDir = "none";
    }}
      >
        ${t.map((i) => {
      const n = M(e, i).sort(
        (r, o) => r.start.getTime() - o.start.getTime()
      );
      return p`
            <div class="ld">
              <div class="ld-head ${Re(i, this._now) ? "today" : ""}">
                <span class="dow">${this._fmtDowLong(i)},</span>
                <span class="dnum">${this._fmtDate(i)}</span>
              </div>
              ${n.length ? n.map(
        (r) => p`
                      <div
                        class="lr"
                        style="animation-name:${this._evAnim};
                               animation-delay:${Math.min(
          s++ * Xt,
          Gt
        )}ms"
                        @click=${() => this._selected = r}
                      >
                        <span class="lr-bar" style="background:${this._colorForEvent(r)}"></span>
                        <span class="lr-time">
                          ${r.allDay ? "all day" : p`${this._fmtTime(r.start)}<br />${this._fmtTime(r.end)}`}
                        </span>
                        <span class="lr-name">${r.summary}</span>
                      </div>
                    `
      ) : p`<div class="lr empty">Nothing scheduled</div>`}
            </div>
          `;
    })}
      </div>
    `;
  }
  _renderSheet() {
    const t = this._selected;
    return t ? p`
      <div class="scrim" @click=${() => this._closeSheet()}>
        <div
          class="sheet"
          style="--accent:${this._colorForEvent(t)}"
          @click=${(e) => e.stopPropagation()}
        >
          <div class="sh-name">${t.summary}</div>
          <div class="sh-time">
            ${t.allDay ? `${this._fmtDate(t.start)} · all day` : `${this._fmtDow(t.start)} ${this._fmtDate(t.start)} · ${this._fmtTime(
      t.start
    )} – ${this._fmtTime(t.end)}`}
          </div>
          <div class="sh-cal">
            <span class="dot" style="background:${this._colorFor(t.entity)}"></span>
            ${this._nameFor(t.entity)}
          </div>
          ${t.location ? p`<div class="sh-row">${t.location}</div>` : f}
          ${t.description ? p`<div class="sh-row">${t.description}</div>` : f}
        </div>
      </div>
    ` : f;
  }
  get _lang() {
    return this.hass?.locale?.language;
  }
  /**
   * Home Assistant's own setting wins by default, but a timetable is written in
   * 24h in most of the world regardless of what the rest of the frontend does,
   * and '1:55 PM' does not fit a 45-minute block. `time_format` pins it here
   * without touching the global setting.
   */
  get _hour12() {
    const t = this._config?.time_format ?? y.time_format;
    if (t === "12") return !0;
    if (t === "24") return !1;
    const e = this.hass?.locale?.time_format;
    return e === "12" ? !0 : e === "24" ? !1 : new Intl.DateTimeFormat(this._lang, { hour: "numeric" }).resolvedOptions().hour12 ?? !1;
  }
  /** 24h is built by hand: Intl pads the hour to "08:25" whatever you ask for. */
  _fmtTime(t) {
    return this._hour12 ? new Intl.DateTimeFormat(this._lang, {
      hour: "numeric",
      minute: "2-digit",
      hour12: !0
    }).format(t) : `${t.getHours()}:${ze(t.getMinutes())}`;
  }
  _fmtHour(t) {
    const e = Math.floor(t / 60) % 24;
    if (!this._hour12) return `${e}:${ze(t % 60)}`;
    const s = new Date(2e3, 0, 1, e, t % 60);
    return new Intl.DateTimeFormat(this._lang, { hour: "numeric", hour12: !0 }).format(s);
  }
  _fmtDow(t) {
    return new Intl.DateTimeFormat(this._lang, { weekday: "short" }).format(t);
  }
  _fmtDowLong(t) {
    return new Intl.DateTimeFormat(this._lang, { weekday: "long" }).format(t);
  }
  /** "Sep 7th". The suffix is English-only, so other locales keep a bare number. */
  _fmtDate(t) {
    return `${new Intl.DateTimeFormat(this._lang, { month: "short" }).format(t)} ${t.getDate()}${cs(t.getDate(), this._lang)}`;
  }
};
_.styles = tt`
    /*
     * Sizing and weight carry the hierarchy here, never colour. Every piece of
     * text is full-strength foreground; what changes between a subject name and
     * its time is size and weight. Grey secondary text was tried and rejected -
     * on a wall tablet at arm's length it simply reads as unreadable rather than
     * as unimportant.
     *
     * The card sits on the THEME's own card background, the same fill every
     * other card in this config uses. An earlier draft floated a translucent
     * white panel on the page background and it came out muddy grey.
     */
    :host {
      --ssc-font: system-ui, 'SF Pro Display', 'SF Pro Text', Inter, 'Helvetica Neue', Roboto,
        sans-serif;
      --ssc-fg: var(--primary-text-color, #fff);
      --ssc-line: rgba(255, 255, 255, 0.13);
      --ssc-line-strong: rgba(255, 255, 255, 0.22);
      /* Column banding. Deliberately tiny: it should guide the eye along a row
         without ever reading as two different kinds of day. */
      --ssc-band: rgba(255, 255, 255, 0.042);
      --ssc-gutter: 62px;
      --ssc-spring: cubic-bezier(0.34, 1.42, 0.64, 1);
      --ssc-glide: cubic-bezier(0.22, 1, 0.36, 1);
      /* Week transition. A long, heavily front-loaded ease — most of the
         distance is covered early and it settles slowly, which is what reads as
         iOS rather than as a linear slide. The block cascade uses a gentler
         spring than --ssc-spring: at this duration the sharper one overshoots
         far enough to look like a bounce. */
      /* How far the schedule recedes behind the open calendar menu. Opacity is
         how much is faded OUT: 0.1 leaves a tenth showing, i.e. 90% gone. Lift
         and scale are the fold — the cells drop back and shrink, so they read as
         folding away from the menu rather than merely dimming under it. */
      --ssc-dim-opacity: 0.1;
      --ssc-dim-lift: 18px;
      --ssc-dim-scale: 0.9;
      --ssc-dim-lift-list: 26px;
      --ssc-dim-scale-list: 0.86;
      --ssc-week-ease: cubic-bezier(0.32, 0.72, 0, 1);
      --ssc-week-dur: 560ms;
      --ssc-block-ease: cubic-bezier(0.24, 1.12, 0.4, 1);
      --ssc-block-dur: 620ms;
      /* custom elements default to inline, and inline boxes measure width 0 in a
         ResizeObserver, which would wedge layout auto in list mode */
      display: block;
      font-family: var(--ssc-font);
      color: var(--ssc-fg);
    }
    ha-card {
      background: var(--ha-card-background, var(--card-background-color, #1c1c1e));
      border-radius: 0;
      color: var(--ssc-fg);
      overflow: hidden;
      position: relative;
    }
    .panel {
      padding: 18px;
      box-sizing: border-box;
    }

    .head {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 14px;
    }
    /* Buttons and the week range share the right-hand column, the range tucked
       under them, so the heading has the whole left side to itself. */
    .head-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 14px;
      flex: 0 0 auto;
    }
    /* Centred on the CARD, not between its neighbours. As a flex item the
       group would sit wherever the title happened to end, and forcing it with
       equal flex bases on the side groups squashes a long calendar name.
       Taken out of flow it lands on the centre line whatever the sides do. */
    .mode-toggles {
      position: absolute;
      left: 50%;
      top: 0;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 15px;
    }
    /* Narrow chrome. The phone LAYOUT is still undesigned, but the header must
       not visibly break while it waits: the title has to fit, and the week pill
       is redundant next to a date range it would otherwise push onto its own
       line. */
    .narrow {
      padding: 13px 13px 14px;
      /* The week drag moves the list sideways by up to half the card. Without
         clipping here that travel becomes page-wide horizontal overflow and
         the phone grows a scrollbar along the bottom mid-gesture. */
      overflow-x: hidden;
    }
    /* The phone header WRAPS: the calendar name takes the first row and the
       week nav sits under it. On one row, four 44px buttons leave about 69px
       for the name, which cut "Ella's Calendar" down to "Ella'..." - and the
       name is the thing that says whose week you are looking at. Wrapping is
       what lets the buttons stay full size AND the name stay whole. */
    .narrow .head {
      flex-wrap: wrap;
    }
    .narrow .titles {
      flex: 1 1 100%;
    }
    /* Left-aligned once wrapped. Right-aligning a full-width second row put
       the week nav on the opposite side of the card from the calendar name it
       belongs to, with a gap between them; under the name it reads as one
       header block. */
    .narrow .head-right {
      flex: 1 1 100%;
      align-items: flex-start;
    }
    .narrow .head-right .range {
      justify-content: flex-start;
    }
    .narrow .pick-btn .pick-name {
      font-size: 20px;
    }
    .narrow .pick-btn .av {
      width: 28px;
      height: 28px;
    }
    .narrow .range {
      font-size: 13px;
      white-space: nowrap;
    }
    .narrow .pill {
      font-size: 12px;
    }
    /* 10% under the grid's 44px. The phone had been at 37px with a 7px gap,
       which was too small; the full 44px with two week arrows removed is too
       much chrome for a narrow header. 40px keeps a comfortable thumb target
       while giving the row back some air. The gap stays at the shared 15px. */
    .narrow .btn {
      width: 40px;
      height: 40px;
    }
    .narrow .btn ha-icon {
      --mdc-icon-size: 23px;
    }
    .titles {
      min-width: 0;
      flex: 1 1 auto;
    }
    .head-right .range {
      margin-top: 0;
      justify-content: flex-end;
    }
    .range {
      display: flex;
      align-items: center;
      gap: 9px;
      margin-top: 8px;
      font-size: 15px;
      font-weight: 400;
      letter-spacing: 0;
    }
    /* Avatar, name and chevron are one target. The menu expands with the same
       max-height/opacity move the Protect card's camera strip uses. */
    /* inline-block so the picker is only as wide as its own contents. As a
       block it filled .titles, and the menu's min-width:100% then stretched to
       the whole card. */
    /* inline-block so the menu's min-width:100% measures the BUTTON and not the
       whole header - see the menu rules below. max-width lets it shrink inside
       .titles: without it the picker kept its natural width on a phone, spilled
       out of its flex item and painted over the week-nav buttons (measured as a
       9px overlap on the mobile Schedules view at a 404px card). */
    .picker {
      position: relative;
      display: inline-block;
      max-width: 100%;
      min-width: 0;
    }
    .pick-btn,
    .pick-item {
      display: flex;
      align-items: center;
      min-width: 0;
      max-width: 100%;
      gap: 12px;
      padding: 4px 8px 4px 4px;
      border: none;
      background: transparent;
      color: var(--ssc-fg);
      font: inherit;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s ease;
    }
    .pick-btn:hover,
    .pick-item:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    /* The name is the part that gives way when the header runs out of room:
       the avatar and chevron stay whole and a long calendar name ellipsises,
       which beats either overlapping the buttons or wrapping the header. */
    .pick-name {
      font-weight: 700;
      white-space: nowrap;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /* The heading. There is no separate card title, so this carries that role —
       and matches Home Assistant's own card header exactly, tokens included, so
       it sits at the same weight and size as every other card on the dashboard.
       Notably that is font-weight NORMAL, not bold. */
    .pick-btn .pick-name {
      font-family: var(--ha-card-header-font-family, inherit);
      font-size: var(--ha-card-header-font-size, var(--ha-font-size-2xl, 24px));
      font-weight: var(--ha-font-weight-normal, 400);
      letter-spacing: -0.012em;
      line-height: var(--ha-line-height-condensed, 1.2);
    }
    .pick-btn .av {
      width: 34px;
      height: 34px;
    }
    .pick-btn .av.init {
      font-size: 17px;
    }
    .pick-btn.static {
      cursor: default;
      padding-right: 4px;
    }
    .pick-btn.static:hover {
      background: transparent;
    }
    .pick-item .pick-name {
      font-size: 16px;
      letter-spacing: -0.2px;
    }
    .av {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      object-fit: cover;
      flex: 0 0 auto;
      display: grid;
      place-items: center;
    }
    .av.init {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
    }
    .pick-chev {
      --mdc-icon-size: 24px;
      transition: transform 220ms var(--ssc-week-ease);
    }
    .pick-chev.open {
      transform: rotate(180deg);
    }
    .pick-menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      z-index: 20;
      /* At least as wide as the button, otherwise sized by the longest calendar
         name in the list. */
      min-width: 100%;
      width: max-content;
      max-width: 80vw;
      display: flex;
      flex-direction: column;
      background: var(--ha-card-background, var(--card-background-color, #1c1c1e));
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.5);
      max-height: 0;
      opacity: 0;
      overflow: hidden;
      pointer-events: none;
      transition:
        max-height 0.22s ease,
        opacity 0.22s ease;
    }
    .pick-menu.open {
      max-height: 320px;
      opacity: 1;
      pointer-events: auto;
    }
    .pick-item {
      padding: 9px 14px 9px 10px;
      width: 100%;
      box-sizing: border-box;
    }
    .pick-item.sel {
      background: rgba(255, 255, 255, 0.13);
    }

    /* One below the date beside it - 15px range, 14px pill - in the grid, and
       13/12 in the list. It was a flat 12px, which read as a footnote next to
       the date rather than as the label for the week being shown. */
    .pill {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.3px;
      padding: 3px 9px;
      background: rgba(255, 255, 255, 0.14);
    }
    /* Finger-sized gaps. On the kiosk tablet these sat 3px apart and the wrong
       button got hit; 40px targets need real space between them, not just size. */
    .tools {
      display: flex;
      align-items: center;
      gap: 15px;
      flex: 0 0 auto;
    }
    .btn {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      padding: 0;
      border: none;
      border-radius: 0;
      background: rgba(255, 255, 255, 0.08);
      color: var(--ssc-fg);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s ease, transform 0.12s ease;
    }
    .btn:hover {
      background: rgba(255, 255, 255, 0.17);
    }
    .btn:active {
      transform: scale(0.92);
    }
    /* On = the non-default setting, so a glance says the view has been
       reshaped from what the YAML asked for. Same inversion as today's cell.
       This MUST come after :hover. Both selectors have the same specificity,
       so when .btn.on sat earlier in the sheet the hover grey won and a
       pressed button went grey instead of white - and on a touch screen the
       hover state sticks after the tap, so it stayed grey. */
    .btn.on,
    .btn.on:hover {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    .btn.off {
      opacity: 0.3;
      pointer-events: none;
    }
    .btn ha-icon {
      --mdc-icon-size: 25px;
    }
    .btn.spin ha-icon {
      animation: spin 850ms linear infinite;
    }
    .warn {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      color: var(--error-color, #ff6b6b);
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .dot {
      width: 12px;
      height: 12px;
      flex: 0 0 auto;
    }

    /* THE LATTICE. One grid template shared by the header, the all-day strip and
       the body, so a column edge is the same x in all three. Days are 1fr each:
       an empty Friday is exactly as wide as a busy Monday, always. */
    .hdr,
    .allday,
    .body {
      display: grid;
      grid-template-columns: var(--ssc-gutter) repeat(var(--cols), 1fr);
    }
    /* One line, "Wednesday, Sep 9". The weekday is what the eye lands on, so it
       carries the weight; the date is the same colour two sizes down. */
    .dayhead {
      display: flex;
      flex-direction: row;
      align-items: baseline;
      justify-content: center;
      gap: 5px;
      padding: 5px 4px 10px;
      text-align: center;
      line-height: 1.15;
    }
    .dayhead.alt {
      background: var(--ssc-band);
    }
    .dayhead .dow {
      font-size: 16px;
      font-weight: 700;
      flex: 0 1 auto;
      letter-spacing: -0.2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
    .dayhead .dnum {
      font-size: 14px;
      font-weight: 400;
    }

    .allday {
      margin-bottom: 8px;
      align-items: start;
    }
    .gut-lbl {
      font-size: 13px;
      font-weight: 500;
      padding-right: 10px;
      text-align: right;
      align-self: center;
    }
    .ad-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 0 3px;
    }
    .ad {
      font-size: 14px;
      font-weight: 600;
      padding: 5px 9px;
      background: var(--fill);
      color: #fff;
      cursor: pointer;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .body {
      position: relative;
      height: var(--body-h);
      border-top: 1px solid var(--ssc-line-strong);
    }

    /* ------------------------------------------------------------------ *
     * days-as-rows: the same lattice, transposed. Day labels down the
     * left, the hour axis across the top, blocks sized along x. Colour,
     * type and contrast handling are shared with the other orientation --
     * only the axes swap.
     * ------------------------------------------------------------------ */
    .rgrid {
      --rday-w: 172px;
      position: relative;
      /* Room for the scrollbar BELOW the last day's row rather than lying over
         it. The bar is an overlay, so without this it clips Friday. */
      padding-bottom: 18px;
    }
    /* Only the hour columns scroll. The title, week range and buttons above stay
       put, and the date column is a sibling of the scroller rather than a child
       of it -- see the note in the template. */
    .rframe {
      display: flex;
      align-items: flex-start;
    }
    .rdays {
      flex: 0 0 var(--rday-w);
      box-sizing: border-box;
    }
    .rscroll {
      flex: 1 1 auto;
      min-width: 0;
      /* The whole grid is PAINTED here rather than placed in the content. A
         scroll container's own background sits on its border box and does not
         move when the content rubber-bands, so the ruling holds and a bounce
         reads as the grid carrying on rather than as flat card.

         Only the ROW BANDING is painted here. It is constant along x, so it
         needs no phase and cannot fall out of register with the content, and
         because it does not move it fills the area a bounce exposes.

         The vertical hour lines are NOT painted: they are elements inside each
         row. Painting them needs background-attachment local to keep them in
         register with the blocks through a bounce, and that drops the scroller
         onto the main thread, which loses the rubber-band entirely. Elements
         move with the content for free and cost nothing.
         (No backticks in this comment: one ends the css template literal and
         the error surfaces hundreds of lines away.)

         The second layer masks the hour axis so the banding does not run up
         behind the times: a tiled gradient repeats in BOTH directions from its
         position, so the strip above y=31 would otherwise show the tail of the
         previous cycle as a grey band. */
      background-image:
        linear-gradient(
          var(--ha-card-background, var(--card-background-color, #1c1c1e)),
          var(--ha-card-background, var(--card-background-color, #1c1c1e))
        ),
        linear-gradient(
          to bottom,
          transparent 0,
          transparent var(--row-h),
          var(--ssc-band) var(--row-h),
          var(--ssc-band) 100%
        );
      background-position:
        0 0,
        0 31px;
      /* ONE CYCLE PER TILE, and let background-repeat do the repeating. Using a
         repeating-gradient at auto size instead makes the tile as wide as the
         scrollport, so its internal rhythm is cut mid-cycle and every tile edge
         injects a stray line off the hour. That is what put extra verticals
         between the real ones. */
      background-size:
        100% 31px,
        100% calc(var(--row-h) * 2);
      background-repeat: no-repeat, repeat;
      overflow-x: auto;
      overflow-y: hidden;
      overscroll-behavior-x: contain;
      -webkit-overflow-scrolling: touch;
      touch-action: pan-x pan-y;
      scrollbar-width: none; /* the custom thumb below replaces it */
    }
    .rscroll::-webkit-scrollbar {
      display: none;
    }
    .rinner {
      width: var(--axis-w);
      box-sizing: border-box;
      /* Closes the far end of the axis, mirroring the 2px the day column draws
         at the near end. Without it the grid just stopped. */
      border-right: 2px solid var(--ssc-line-strong);
    }
    /* The two halves are aligned by sharing these heights, not by living in one
       grid: corner to rtimes, rday to rcanvas. The corner carries only the
       horizontal rule -- the column's own side borders start at the first day
       row, so no stubs hang above it. */
    /* No top or bottom rule: the grid reads as floating rather than boxed in. */
    .rcorner,
    .rtimes {
      height: 30px;
      box-sizing: border-box;
    }
    .rtimes {
      position: relative;
    }
    .rhr {
      position: absolute;
      bottom: 7px;
      transform: translateX(-50%);
      font-size: 14px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    /* A label sitting on x=0 would have half of it outside the axis and read as
       ":00", so that one is left-aligned. The test is against ~0 rather than a
       pixel threshold because pos() is a percentage in adaptive mode, where a
       22px threshold would have caught the first five hours. */
    .rhr.first {
      transform: none;
    }
    /* And the one ON the far end would hang past it, which in adaptive mode is
       enough overflow to give the scroller a few stray pixels to scroll. */
    .rhr.last {
      transform: translateX(-100%);
    }
    .rday,
    .rcanvas {
      height: var(--row-h);
      box-sizing: border-box;
    }
    .rday.alt {
      background: var(--ssc-band);
    }
    .rday {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 1px;
      padding: 0 12px 0 10px;
      line-height: 1.15;
      /* Both lines are 2px against the hour grid's 1px, so the column reads as
         fixed furniture rather than another scrolling gridline. They live on the
         cells, not the column, so nothing hangs above the first day row. */
      border-left: 2px solid var(--ssc-line-strong);
      border-right: 2px solid var(--ssc-line-strong);
    }
    .rday .dow {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }
    .rday .dnum {
      font-size: 14px;
      font-weight: 400;
    }
    /* Today: the day/date cell only, inverted out of the dark card so it reads
       at a glance without touching the blocks themselves. */
    .rday.today,
    .rday.alt.today {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    .rcanvas {
      position: relative;
    }
    /* Elements, not paint — see the note on .rscroll's background. They sit
       inside the rows, so they never reach up into the hour labels. */
    .rlines {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .rline {
      position: absolute;
      top: 0;
      bottom: 0;
      border-left: 1px solid var(--ssc-line);
    }
    /* Same block, laid out along x instead of y: a 1px right inset keeps
       back-to-back lessons legible now the fills are opaque. */
    .ev.rev {
      padding: 1px 1px 1px 0;
    }
    .ev.rev .ev-in {
      padding: 5px 9px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      /* Same 1px as the date column, so name-over-time reads identically in
         both. The generic .ev-time margin is for the other orientation. */
      gap: 1px;
    }
    .ev.rev .ev-time {
      margin-top: 0;
    }
    /* One line, always. The axis is scaled so ~16 characters fit; anything
       longer truncates and the full title is in the detail sheet. Wrapping to a
       second line was tried and makes rows of different-length titles ragged. */
    .ev.rev .ev-name {
      font-size: 15px;
      line-height: 1.2;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /* 13px, not 12: measured on the tablet as the hardest thing on the card
       to read at arm's length. One pixel is the whole budget - the block is
       only 72px tall and has to hold the name above this. */
    .ev.rev .ev-time {
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Overlay scrollbar. Chrome on the tablet draws a permanent chunky native
       bar that steals a row of pixels and never fades, so the native one is
       hidden and this mirrors the platform behaviour: visible while scrolling,
       gone about a second after it stops. */
    /* Spans the hour columns only. The day column does not scroll -- it is
       sticky -- so a track running under it would imply otherwise. */
    /* Centred in the whole gap below the last row, which is .rgrid's 18px of
       padding PLUS the panel's own 18px — hence the negative offset, which
       drops it past .rgrid's edge into the panel's padding. Centring inside
       .rgrid alone left it sitting high. Always visible whenever there is
       something to scroll to: fading it out was misleading, the card looked
       complete when there was more week off to the right. */
    .hbar {
      position: absolute;
      left: var(--rday-w);
      right: 0;
      bottom: -3px;
      height: 6px;
      pointer-events: none;
    }
    .hthumb {
      position: absolute;
      top: 0;
      height: 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.42);
    }

    .rgrid.dir-fwd .rframe,
    .list.dir-fwd {
      animation: inFromRight var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    .rgrid.dir-back .rframe,
    .list.dir-back {
      animation: inFromLeft var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    .lines {
      position: absolute;
      top: 0;
      bottom: 0;
      left: var(--ssc-gutter);
      right: 0;
      pointer-events: none;
      z-index: 2;
    }
    .line {
      position: absolute;
      left: 0;
      right: 0;
      border-top: 1px solid var(--ssc-line);
    }
    .gutter {
      position: relative;
    }
    .hr {
      position: absolute;
      right: 11px;
      transform: translateY(-50%);
      font-size: 14px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .day {
      position: relative;
      border-left: 1px solid var(--ssc-line);
    }
    .day.alt {
      background: var(--ssc-band);
    }

    .ev {
      position: absolute;
      box-sizing: border-box;
      padding: 0 2px 1px;
      cursor: pointer;
      z-index: 3;
      -webkit-tap-highlight-color: transparent;
      /* Fill mode BACKWARDS, never both. Both pins the end state after the
         animation finishes, which outranks the dimmed rule below and freezes
         the cells. Backwards still covers the staggered delay, and the end state
         is the element's normal CSS anyway.
         (No backticks anywhere in this literal - one ends it and the error lands
         hundreds of lines away. This is the second time.) */
      animation: evIn var(--ssc-block-dur) var(--ssc-block-ease) backwards;
    }
    /* Each block is its own query container, so one that is too narrow for its
       time line can drop it and hand the room to the name. Width-driven rather
       than mode-driven: the same block is 144px in fixed mode and 36px in
       adaptive over a whole day, and it has to read in both. */
    .ev {
      container-type: inline-size;
    }
    /* Measured: the time is 65-80px of digits, while a 36px block has 18px of
       content box once padding is taken. It cannot fit at any font size, and
       keeping it truncated BOTH lines to a single letter and an ellipsis.
       Dropping it, and pulling the padding in, gets most subject names fully
       legible instead - which is the only thing worth reading at that size. */
    @container (max-width: 90px) {
      .ev.rev .ev-time {
        display: none;
      }
      /* text-align, but NOT align-items: center. As a centred flex item the
         name sizes to its CONTENT, so a long one overflowed the block on both
         sides and you were left reading its middle - "/ MG" out of
         "ICT / MGeo". Stretched to the block instead, a short name still
         centres and a long one clips from the start with an ellipsis, which
         is the half worth keeping. */
      .ev.rev .ev-in {
        padding: 4px 3px;
        text-align: center;
      }
      .ev.rev .ev-name {
        letter-spacing: -0.3px;
      }
    }
    /* Opaque: the event's colour, nothing of the grid behind it showing through,
       and square. The label is white the way Google's own calendar draws it. */
    .ev-in {
      height: 100%;
      box-sizing: border-box;
      padding: 7px 10px;
      overflow: hidden;
      background: var(--fill);
      color: #fff;
      transition: transform 160ms var(--ssc-glide), filter 160ms ease;
    }
    .ev:active .ev-in {
      transform: scale(0.97);
    }
    .ev.sel .ev-in {
      filter: brightness(1.3);
    }
    .ev-name {
      font-size: 17px;
      font-weight: 700;
      line-height: 1.18;
      letter-spacing: -0.25px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    /* Same colour as the name, two steps down in size and three in weight. That
       is the entire hierarchy mechanism in this card. */
    .ev-time {
      margin-top: 2px;
      font-size: 13px;
      font-weight: 400;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .ev.compact .ev-in {
      padding: 4px 10px;
      display: flex;
      align-items: center;
    }
    .ev.compact .ev-name {
      font-size: 15px;
      -webkit-line-clamp: 1;
    }
    @keyframes evIn {
      from {
        opacity: 0;
        transform: translateY(9px) scale(0.965);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    /* Identical to evIn. Alternating between the two is what restarts the
       cascade when the calendar menu closes — a CSS animation only restarts on a
       change of NAME. */
    @keyframes evInB {
      from {
        opacity: 0;
        transform: translateY(9px) scale(0.965);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    /* While the calendar menu is open the schedule recedes: dimmed to a fifth
       and the cells folded most of the way back out, so the menu is plainly the
       thing in focus.
       The transitions live on the DIMMED rule only, so going in is a glide and
       coming out is instant — the entry cascade then replays over the top and
       carries the fade back in itself. Two overlapping fades looked like a
       flicker. */
    .rgrid.dimmed .rframe,
    .grid.dimmed .body,
    .grid.dimmed .hdr {
      opacity: var(--ssc-dim-opacity, 0.1);
      transition: opacity 240ms var(--ssc-glide);
    }
    .rgrid.dimmed .ev,
    .grid.dimmed .ev {
      transform: translateY(var(--ssc-dim-lift, 9px)) scale(var(--ssc-dim-scale, 0.963));
      transition: transform 240ms var(--ssc-glide);
    }
    /* The list recedes further than the grid does. It is the phone layout, the
       rows are big targets, and there is no fine ruling to lose — so it can take
       a deeper fold without turning to mush. */
    .list.dimmed {
      opacity: var(--ssc-dim-opacity, 0.1);
      transition: opacity 240ms var(--ssc-glide);
    }
    .list.dimmed .lr,
    .list.dimmed .ld-head {
      transform: translateY(var(--ssc-dim-lift-list, 26px))
        scale(var(--ssc-dim-scale-list, 0.86));
      transition: transform 260ms var(--ssc-glide);
    }


    /* Week navigation: the whole lattice slides a short distance and fades. The
       blocks re-run their own stagger on top, so the new week assembles rather
       than snapping. */
    .grid.dir-fwd .body,
    .grid.dir-fwd .hdr {
      animation: inFromRight var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    .grid.dir-back .body,
    .grid.dir-back .hdr {
      animation: inFromLeft var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    @keyframes inFromRight {
      from {
        opacity: 0;
        transform: translateX(28px);
      }
    }
    @keyframes inFromLeft {
      from {
        opacity: 0;
        transform: translateX(-28px);
      }
    }

    /* The shared week animation is a 28px nudge, which is invisible across a
       full-width list - it was reported as "super fast and almost
       undetectable". The list gets its own, a real slide, without disturbing
       the grid that shares inFromRight/inFromLeft. */
    .list.dir-fwd {
      animation: listInRight var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    .list.dir-back {
      animation: listInLeft var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    @keyframes listInRight {
      from {
        opacity: 0;
        transform: translateX(38%);
      }
    }
    @keyframes listInLeft {
      from {
        opacity: 0;
        transform: translateX(-38%);
      }
    }

    /* pan-y hands vertical scrolling back to the browser while leaving the
       horizontal axis to the week-swipe handler. Without it the browser claims
       both axes and the swipe never fires. */
    .list {
      touch-action: pan-y;
      will-change: transform;
      display: flex;
      flex-direction: column;
      /* The whole gap between one day's last event and the next day's heading
         is this plus the two groups' own padding: 4 + 15 + 8 = 27px. */
      gap: 15px;
    }
    .ld {
      padding: 8px 10px 4px;
    }
    /* Padding and the negative margin are on EVERY heading, not just today's,
       so the text stays on the same left edge whichever day it is and only the
       fill changes. */
    .ld-head {
      display: flex;
      align-items: baseline;
      gap: 8px;
      padding: 6px 10px;
      margin: 0 -10px 4px;
    }
    /* Same inversion as the grid's day cell. */
    .ld-head.today {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    .ld-head .dow {
      font-size: 17px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }
    .ld-head .dnum {
      font-size: 14px;
      font-weight: 400;
    }
    .lr {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 10px;
      margin: 0 -10px;
      border-top: 1px solid var(--ssc-line);
      cursor: pointer;
      animation: evIn var(--ssc-block-dur) var(--ssc-block-ease) backwards;
    }
    /* Banding alternates per EVENT ROW, not per day. The day heading is the
       first child, so a row's own index is one behind its child index: odd
       children are the even rows, which is what gets banded. The negative margin
       lets the band run to the card's edges past .ld's padding. */
    .lr:nth-child(odd) {
      background: var(--ssc-band);
    }
    .lr-bar {
      width: 5px;
      align-self: stretch;
      flex: 0 0 auto;
    }
    .lr-time {
      font-size: 13px;
      font-weight: 400;
      line-height: 1.25;
      font-variant-numeric: tabular-nums;
      min-width: 52px;
    }
    .lr-name {
      font-size: 17px;
      font-weight: 700;
      letter-spacing: -0.2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .lr.empty {
      font-size: 15px;
      font-weight: 400;
      opacity: 0.55;
      cursor: default;
      animation: none;
    }

    /* FIXED, not absolute. In the list layout the card is far taller than the
       viewport, so an absolutely-positioned scrim centres itself in the CARD —
       which put the sheet somewhere down the page, out of sight until you
       scrolled to it. Fixed centres it in the viewport in both layouts.
       The wash is light because the schedule behind it already recedes; the
       two together were near-black. */
    .scrim {
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      background: rgba(0, 0, 0, 0.32);
      z-index: 10;
      animation: fadeIn 180ms ease both;
    }
    .sheet {
      min-width: 240px;
      max-width: 76%;
      background: var(--ha-card-background, #1c1c1e);
      padding: 18px 20px 20px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
      border-top: 5px solid var(--accent);
      animation: sheetIn 460ms var(--ssc-block-ease) both;
    }
    .sh-name {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.4px;
      line-height: 1.18;
    }
    .sh-time {
      margin-top: 12px;
      font-size: 17px;
      font-weight: 600;
    }
    .sh-cal {
      display: flex;
      align-items: center;
      gap: 9px;
      margin-top: 10px;
      font-size: 15px;
      font-weight: 400;
    }
    .sh-row {
      margin-top: 10px;
      font-size: 15px;
      font-weight: 400;
      line-height: 1.4;
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
    }
    @keyframes sheetIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(10px);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ev,
      .lr,
      .sheet,
      .scrim,
      .grid.dir-fwd .body,
      .grid.dir-fwd .hdr,
      .grid.dir-back .body,
      .grid.dir-back .hdr,
      .rgrid.dir-fwd .rframe,
      .rgrid.dir-back .rframe,
      .list.dir-fwd,
      .list.dir-back {
        animation: none;
      }
      .btn.spin ha-icon {
        animation: none;
      }
      .ev-in {
        transition: none;
      }
    }
  `;
v([
  je({ attribute: !1 })
], _.prototype, "hass", 2);
v([
  x()
], _.prototype, "_config", 2);
v([
  x()
], _.prototype, "_sources", 2);
v([
  x()
], _.prototype, "_colors", 2);
v([
  x()
], _.prototype, "_eventColors", 2);
v([
  x()
], _.prototype, "_weekOffset", 2);
v([
  x()
], _.prototype, "_now", 2);
v([
  x()
], _.prototype, "_hostWidth", 2);
v([
  x()
], _.prototype, "_refreshing", 2);
v([
  x()
], _.prototype, "_selected", 2);
v([
  x()
], _.prototype, "_navDir", 2);
v([
  x()
], _.prototype, "_activeIdx", 2);
v([
  St(".list")
], _.prototype, "_listEl", 2);
v([
  x()
], _.prototype, "_modeOverride", 2);
v([
  x()
], _.prototype, "_pickerOpen", 2);
v([
  x()
], _.prototype, "_animEpoch", 2);
v([
  x()
], _.prototype, "_hThumb", 2);
v([
  x()
], _.prototype, "_revision", 2);
_ = v([
  $t("simple-schedule-card")
], _);
function as(t) {
  const e = t.entities ?? (t.entity ? [t.entity] : []), s = [];
  for (const i of e)
    typeof i == "string" ? s.push({ entity: i }) : i && typeof i.entity == "string" && s.push({ ...i });
  return s;
}
function W(t, e) {
  return `--accent:${t}; --fill:${Be(t, e)};`;
}
function hs(t) {
  return t.replace(/(^|\s)(\p{L})/gu, (e, s, i) => s + i.toUpperCase());
}
function ze(t) {
  return String(t).padStart(2, "0");
}
const ls = { one: "st", two: "nd", few: "rd", other: "th" };
function cs(t, e) {
  if (e && !e.toLowerCase().startsWith("en")) return "";
  try {
    return ls[new Intl.PluralRules("en", { type: "ordinal" }).select(t)] ?? "";
  } catch {
    return "";
  }
}
function Re(t, e) {
  return t.getFullYear() === e.getFullYear() && t.getMonth() === e.getMonth() && t.getDate() === e.getDate();
}
function Ne(t, e) {
  return `${(t - e.start) / (e.end - e.start) * 100}%`;
}
function j(t, e) {
  return (t.getTime() - e) / 6e4;
}
window.customCards = window.customCards || [];
window.customCards.push({
  type: "simple-schedule-card",
  name: "Simple Schedule Card",
  description: "A whole week of calendar events as a proportional time grid",
  preview: !1
});
console.info(
  `%c SIMPLE-SCHEDULE-CARD %c v${Wt} `,
  "color:#fff;background:#0a84ff;font-weight:700;border-radius:3px 0 0 3px;padding:2px 4px",
  "color:#0a84ff;background:#222;border-radius:0 3px 3px 0;padding:2px 4px"
);
export {
  _ as SimpleScheduleCard
};
