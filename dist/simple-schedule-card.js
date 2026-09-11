/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const B = globalThis, Q = B.ShadowRoot && (B.ShadyCSS === void 0 || B.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, tt = Symbol(), pt = /* @__PURE__ */ new WeakMap();
let It = class {
  constructor(t, s, i) {
    if (this._$cssResult$ = !0, i !== tt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = s;
  }
  get styleSheet() {
    let t = this.o;
    const s = this.t;
    if (Q && t === void 0) {
      const i = s !== void 0 && s.length === 1;
      i && (t = pt.get(s)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && pt.set(s, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const Xt = (e) => new It(typeof e == "string" ? e : e + "", void 0, tt), Zt = (e, ...t) => {
  const s = e.length === 1 ? e[0] : t.reduce((i, n, r) => i + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(n) + e[r + 1], e[0]);
  return new It(s, e, tt);
}, Jt = (e, t) => {
  if (Q) e.adoptedStyleSheets = t.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of t) {
    const i = document.createElement("style"), n = B.litNonce;
    n !== void 0 && i.setAttribute("nonce", n), i.textContent = s.cssText, e.appendChild(i);
  }
}, ut = Q ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let s = "";
  for (const i of t.cssRules) s += i.cssText;
  return Xt(s);
})(e) : e;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Qt, defineProperty: te, getOwnPropertyDescriptor: ee, getOwnPropertyNames: se, getOwnPropertySymbols: ie, getPrototypeOf: ne } = Object, Y = globalThis, ft = Y.trustedTypes, re = ft ? ft.emptyScript : "", oe = Y.reactiveElementPolyfillSupport, z = (e, t) => e, q = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? re : null;
      break;
    case Object:
    case Array:
      e = e == null ? e : JSON.stringify(e);
  }
  return e;
}, fromAttribute(e, t) {
  let s = e;
  switch (t) {
    case Boolean:
      s = e !== null;
      break;
    case Number:
      s = e === null ? null : Number(e);
      break;
    case Object:
    case Array:
      try {
        s = JSON.parse(e);
      } catch {
        s = null;
      }
  }
  return s;
} }, et = (e, t) => !Qt(e, t), mt = { attribute: !0, type: String, converter: q, reflect: !1, useDefault: !1, hasChanged: et };
Symbol.metadata ??= Symbol("metadata"), Y.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let C = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, s = mt) {
    if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(t, s), !s.noAccessor) {
      const i = Symbol(), n = this.getPropertyDescriptor(t, i, s);
      n !== void 0 && te(this.prototype, t, n);
    }
  }
  static getPropertyDescriptor(t, s, i) {
    const { get: n, set: r } = ee(this.prototype, t) ?? { get() {
      return this[s];
    }, set(o) {
      this[s] = o;
    } };
    return { get: n, set(o) {
      const h = n?.call(this);
      r?.call(this, o), this.requestUpdate(t, h, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? mt;
  }
  static _$Ei() {
    if (this.hasOwnProperty(z("elementProperties"))) return;
    const t = ne(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(z("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(z("properties"))) {
      const s = this.properties, i = [...se(s), ...ie(s)];
      for (const n of i) this.createProperty(n, s[n]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const s = litPropertyMetadata.get(t);
      if (s !== void 0) for (const [i, n] of s) this.elementProperties.set(i, n);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [s, i] of this.elementProperties) {
      const n = this._$Eu(s, i);
      n !== void 0 && this._$Eh.set(n, s);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const s = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const n of i) s.unshift(ut(n));
    } else t !== void 0 && s.push(ut(t));
    return s;
  }
  static _$Eu(t, s) {
    const i = s.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
  }
  addController(t) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t), this.renderRoot !== void 0 && this.isConnected && t.hostConnected?.();
  }
  removeController(t) {
    this._$EO?.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), s = this.constructor.elementProperties;
    for (const i of s.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Jt(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, s, i) {
    this._$AK(t, i);
  }
  _$ET(t, s) {
    const i = this.constructor.elementProperties.get(t), n = this.constructor._$Eu(t, i);
    if (n !== void 0 && i.reflect === !0) {
      const r = (i.converter?.toAttribute !== void 0 ? i.converter : q).toAttribute(s, i.type);
      this._$Em = t, r == null ? this.removeAttribute(n) : this.setAttribute(n, r), this._$Em = null;
    }
  }
  _$AK(t, s) {
    const i = this.constructor, n = i._$Eh.get(t);
    if (n !== void 0 && this._$Em !== n) {
      const r = i.getPropertyOptions(n), o = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : q;
      this._$Em = n;
      const h = o.fromAttribute(s, r.type);
      this[n] = h ?? this._$Ej?.get(n) ?? h, this._$Em = null;
    }
  }
  requestUpdate(t, s, i, n = !1, r) {
    if (t !== void 0) {
      const o = this.constructor;
      if (n === !1 && (r = this[t]), i ??= o.getPropertyOptions(t), !((i.hasChanged ?? et)(r, s) || i.useDefault && i.reflect && r === this._$Ej?.get(t) && !this.hasAttribute(o._$Eu(t, i)))) return;
      this.C(t, s, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, s, { useDefault: i, reflect: n, wrapped: r }, o) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, o ?? s ?? this[t]), r !== !0 || o !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (s = void 0), this._$AL.set(t, s)), n === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (s) {
      Promise.reject(s);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
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
        const { wrapped: o } = r, h = this[n];
        o !== !0 || this._$AL.has(n) || h === void 0 || this.C(n, void 0, r, h);
      }
    }
    let t = !1;
    const s = this._$AL;
    try {
      t = this.shouldUpdate(s), t ? (this.willUpdate(s), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(s)) : this._$EM();
    } catch (i) {
      throw t = !1, this._$EM(), i;
    }
    t && this._$AE(s);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((s) => s.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
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
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq &&= this._$Eq.forEach((s) => this._$ET(s, this[s])), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
C.elementStyles = [], C.shadowRootOptions = { mode: "open" }, C[z("elementProperties")] = /* @__PURE__ */ new Map(), C[z("finalized")] = /* @__PURE__ */ new Map(), oe?.({ ReactiveElement: C }), (Y.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const st = globalThis, gt = (e) => e, G = st.trustedTypes, _t = G ? G.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, Rt = "$lit$", A = `lit$${Math.random().toFixed(9).slice(2)}$`, Nt = "?" + A, ae = `<${Nt}>`, T = document, R = () => T.createComment(""), N = (e) => e === null || typeof e != "object" && typeof e != "function", it = Array.isArray, he = (e) => it(e) || typeof e?.[Symbol.iterator] == "function", X = `[ 	
\f\r]`, M = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, vt = /-->/g, yt = />/g, E = RegExp(`>|${X}(?:([^\\s"'>=/]+)(${X}*=${X}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), bt = /'/g, wt = /"/g, Lt = /^(?:script|style|textarea|title)$/i, le = (e) => (t, ...s) => ({ _$litType$: e, strings: t, values: s }), u = le(1), O = Symbol.for("lit-noChange"), f = Symbol.for("lit-nothing"), $t = /* @__PURE__ */ new WeakMap(), S = T.createTreeWalker(T, 129);
function Ht(e, t) {
  if (!it(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return _t !== void 0 ? _t.createHTML(t) : t;
}
const ce = (e, t) => {
  const s = e.length - 1, i = [];
  let n, r = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = M;
  for (let h = 0; h < s; h++) {
    const a = e[h];
    let l, c, d = -1, m = 0;
    for (; m < a.length && (o.lastIndex = m, c = o.exec(a), c !== null); ) m = o.lastIndex, o === M ? c[1] === "!--" ? o = vt : c[1] !== void 0 ? o = yt : c[2] !== void 0 ? (Lt.test(c[2]) && (n = RegExp("</" + c[2], "g")), o = E) : c[3] !== void 0 && (o = E) : o === E ? c[0] === ">" ? (o = n ?? M, d = -1) : c[1] === void 0 ? d = -2 : (d = o.lastIndex - c[2].length, l = c[1], o = c[3] === void 0 ? E : c[3] === '"' ? wt : bt) : o === wt || o === bt ? o = E : o === vt || o === yt ? o = M : (o = E, n = void 0);
    const y = o === E && e[h + 1].startsWith("/>") ? " " : "";
    r += o === M ? a + ae : d >= 0 ? (i.push(l), a.slice(0, d) + Rt + a.slice(d) + A + y) : a + A + (d === -2 ? h : y);
  }
  return [Ht(e, r + (e[s] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class L {
  constructor({ strings: t, _$litType$: s }, i) {
    let n;
    this.parts = [];
    let r = 0, o = 0;
    const h = t.length - 1, a = this.parts, [l, c] = ce(t, s);
    if (this.el = L.createElement(l, i), S.currentNode = this.el.content, s === 2 || s === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (n = S.nextNode()) !== null && a.length < h; ) {
      if (n.nodeType === 1) {
        if (n.hasAttributes()) for (const d of n.getAttributeNames()) if (d.endsWith(Rt)) {
          const m = c[o++], y = n.getAttribute(d).split(A), p = /([.?@])?(.*)/.exec(m);
          a.push({ type: 1, index: r, name: p[2], strings: y, ctor: p[1] === "." ? pe : p[1] === "?" ? ue : p[1] === "@" ? fe : V }), n.removeAttribute(d);
        } else d.startsWith(A) && (a.push({ type: 6, index: r }), n.removeAttribute(d));
        if (Lt.test(n.tagName)) {
          const d = n.textContent.split(A), m = d.length - 1;
          if (m > 0) {
            n.textContent = G ? G.emptyScript : "";
            for (let y = 0; y < m; y++) n.append(d[y], R()), S.nextNode(), a.push({ type: 2, index: ++r });
            n.append(d[m], R());
          }
        }
      } else if (n.nodeType === 8) if (n.data === Nt) a.push({ type: 2, index: r });
      else {
        let d = -1;
        for (; (d = n.data.indexOf(A, d + 1)) !== -1; ) a.push({ type: 7, index: r }), d += A.length - 1;
      }
      r++;
    }
  }
  static createElement(t, s) {
    const i = T.createElement("template");
    return i.innerHTML = t, i;
  }
}
function P(e, t, s = e, i) {
  if (t === O) return t;
  let n = i !== void 0 ? s._$Co?.[i] : s._$Cl;
  const r = N(t) ? void 0 : t._$litDirective$;
  return n?.constructor !== r && (n?._$AO?.(!1), r === void 0 ? n = void 0 : (n = new r(e), n._$AT(e, s, i)), i !== void 0 ? (s._$Co ??= [])[i] = n : s._$Cl = n), n !== void 0 && (t = P(e, n._$AS(e, t.values), n, i)), t;
}
class de {
  constructor(t, s) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = s;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: s }, parts: i } = this._$AD, n = (t?.creationScope ?? T).importNode(s, !0);
    S.currentNode = n;
    let r = S.nextNode(), o = 0, h = 0, a = i[0];
    for (; a !== void 0; ) {
      if (o === a.index) {
        let l;
        a.type === 2 ? l = new H(r, r.nextSibling, this, t) : a.type === 1 ? l = new a.ctor(r, a.name, a.strings, this, t) : a.type === 6 && (l = new me(r, this, t)), this._$AV.push(l), a = i[++h];
      }
      o !== a?.index && (r = S.nextNode(), o++);
    }
    return S.currentNode = T, n;
  }
  p(t) {
    let s = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, s), s += i.strings.length - 2) : i._$AI(t[s])), s++;
  }
}
class H {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, s, i, n) {
    this.type = 2, this._$AH = f, this._$AN = void 0, this._$AA = t, this._$AB = s, this._$AM = i, this.options = n, this._$Cv = n?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const s = this._$AM;
    return s !== void 0 && t?.nodeType === 11 && (t = s.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, s = this) {
    t = P(this, t, s), N(t) ? t === f || t == null || t === "" ? (this._$AH !== f && this._$AR(), this._$AH = f) : t !== this._$AH && t !== O && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : he(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== f && N(this._$AH) ? this._$AA.nextSibling.data = t : this.T(T.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: s, _$litType$: i } = t, n = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = L.createElement(Ht(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === n) this._$AH.p(s);
    else {
      const r = new de(n, this), o = r.u(this.options);
      r.p(s), this.T(o), this._$AH = r;
    }
  }
  _$AC(t) {
    let s = $t.get(t.strings);
    return s === void 0 && $t.set(t.strings, s = new L(t)), s;
  }
  k(t) {
    it(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let i, n = 0;
    for (const r of t) n === s.length ? s.push(i = new H(this.O(R()), this.O(R()), this, this.options)) : i = s[n], i._$AI(r), n++;
    n < s.length && (this._$AR(i && i._$AB.nextSibling, n), s.length = n);
  }
  _$AR(t = this._$AA.nextSibling, s) {
    for (this._$AP?.(!1, !0, s); t !== this._$AB; ) {
      const i = gt(t).nextSibling;
      gt(t).remove(), t = i;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class V {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, s, i, n, r) {
    this.type = 1, this._$AH = f, this._$AN = void 0, this.element = t, this.name = s, this._$AM = n, this.options = r, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = f;
  }
  _$AI(t, s = this, i, n) {
    const r = this.strings;
    let o = !1;
    if (r === void 0) t = P(this, t, s, 0), o = !N(t) || t !== this._$AH && t !== O, o && (this._$AH = t);
    else {
      const h = t;
      let a, l;
      for (t = r[0], a = 0; a < r.length - 1; a++) l = P(this, h[i + a], s, a), l === O && (l = this._$AH[a]), o ||= !N(l) || l !== this._$AH[a], l === f ? t = f : t !== f && (t += (l ?? "") + r[a + 1]), this._$AH[a] = l;
    }
    o && !n && this.j(t);
  }
  j(t) {
    t === f ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class pe extends V {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === f ? void 0 : t;
  }
}
class ue extends V {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== f);
  }
}
class fe extends V {
  constructor(t, s, i, n, r) {
    super(t, s, i, n, r), this.type = 5;
  }
  _$AI(t, s = this) {
    if ((t = P(this, t, s, 0) ?? f) === O) return;
    const i = this._$AH, n = t === f && i !== f || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, r = t !== f && (i === f || n);
    n && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class me {
  constructor(t, s, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = s, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    P(this, t);
  }
}
const ge = st.litHtmlPolyfillSupport;
ge?.(L, H), (st.litHtmlVersions ??= []).push("3.3.3");
const _e = (e, t, s) => {
  const i = s?.renderBefore ?? t;
  let n = i._$litPart$;
  if (n === void 0) {
    const r = s?.renderBefore ?? null;
    i._$litPart$ = n = new H(t.insertBefore(R(), r), r, void 0, s ?? {});
  }
  return n._$AI(e), n;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const nt = globalThis;
class I extends C {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const s = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = _e(s, this.renderRoot, this.renderOptions);
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
I._$litElement$ = !0, I.finalized = !0, nt.litElementHydrateSupport?.({ LitElement: I });
const ve = nt.litElementPolyfillSupport;
ve?.({ LitElement: I });
(nt.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ye = (e) => (t, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const be = { attribute: !0, type: String, converter: q, reflect: !1, hasChanged: et }, we = (e = be, t, s) => {
  const { kind: i, metadata: n } = s;
  let r = globalThis.litPropertyMetadata.get(n);
  if (r === void 0 && globalThis.litPropertyMetadata.set(n, r = /* @__PURE__ */ new Map()), i === "setter" && ((e = Object.create(e)).wrapped = !0), r.set(s.name, e), i === "accessor") {
    const { name: o } = s;
    return { set(h) {
      const a = t.get.call(this);
      t.set.call(this, h), this.requestUpdate(o, a, e, !0, h);
    }, init(h) {
      return h !== void 0 && this.C(o, void 0, e, h), h;
    } };
  }
  if (i === "setter") {
    const { name: o } = s;
    return function(h) {
      const a = this[o];
      t.call(this, h), this.requestUpdate(o, a, e, !0, h);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function Ut(e) {
  return (t, s) => typeof s == "object" ? we(e, t, s) : ((i, n, r) => {
    const o = n.hasOwnProperty(r);
    return n.constructor.createProperty(r, i), o ? Object.getOwnPropertyDescriptor(n, r) : void 0;
  })(e, t, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function w(e) {
  return Ut({ ...e, state: !0, attribute: !1 });
}
function K(e) {
  return new Date(e.getFullYear(), e.getMonth(), e.getDate());
}
function $e(e) {
  const t = K(e), s = (t.getDay() + 6) % 7;
  return t.setDate(t.getDate() - s), t;
}
function xe(e, t, s) {
  const i = $e(e);
  i.setDate(i.getDate() + t * 7);
  const n = new Date(i);
  n.setDate(n.getDate() + 7);
  const r = [];
  for (let o = 0; o < s; o++) {
    const h = new Date(i);
    h.setDate(h.getDate() + o), r.push(h);
  }
  return { start: i, end: n, days: r };
}
function Z(e) {
  return e.getHours() * 60 + e.getMinutes();
}
function xt(e) {
  if (!e || e === "auto") return null;
  const t = /^(\d{1,2}):(\d{2})$/.exec(e.trim());
  if (!t) return null;
  const s = Number(t[1]), i = Number(t[2]);
  return s > 24 || i > 59 ? null : s * 60 + i;
}
function ke(e, t, s) {
  const i = xt(t), n = xt(s);
  if (i !== null && n !== null && n > i)
    return { start: i, end: n };
  let r = 1 / 0, o = -1 / 0;
  for (const l of e) {
    if (l.allDay) continue;
    r = Math.min(r, Z(l.start));
    const c = Z(l.end) === 0 ? 24 * 60 : Z(l.end);
    o = Math.max(o, c);
  }
  (!Number.isFinite(r) || !Number.isFinite(o)) && (r = 8 * 60, o = 16 * 60);
  const h = i !== null ? i : r, a = n !== null ? n : o;
  return a > h ? { start: h, end: a } : { start: h, end: h + 60 };
}
function Ae(e, t, s) {
  if (!e || !e.start || !e.end) return null;
  const i = e.all_day === !0 || !e.start.includes("T"), n = kt(e.start), r = kt(e.end);
  return !n || !r ? null : {
    // recurrence_id is unique per occurrence; uid is not. Index backstops both.
    key: `${t}|${e.recurrence_id ?? e.uid ?? "x"}|${e.start}|${s}`,
    entity: t,
    uid: e.uid ?? void 0,
    recurrenceId: e.recurrence_id ?? void 0,
    summary: (e.summary ?? "").trim() || "(no title)",
    description: e.description ?? void 0,
    location: e.location ?? void 0,
    start: n,
    end: r,
    allDay: i
  };
}
function kt(e) {
  const t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(e);
  if (t) return new Date(Number(t[1]), Number(t[2]) - 1, Number(t[3]));
  const s = new Date(e);
  return Number.isNaN(s.getTime()) ? null : s;
}
function Ee(e, t) {
  return t.filter((s) => s.getDay() === 0 || s.getDay() === 6).some((s) => D(e, s).length > 0);
}
function D(e, t) {
  const s = K(t).getTime(), i = s + 24 * 60 * 60 * 1e3;
  return e.filter((n) => n.start.getTime() < i && n.end.getTime() > s);
}
class Se {
  constructor(t) {
    this._onChange = t, this._unsubs = [], this._byEntity = /* @__PURE__ */ new Map(), this._failed = /* @__PURE__ */ new Set(), this._key = "";
  }
  /** Every subscribed calendar's events, flattened. */
  get events() {
    const t = [];
    for (const s of this._byEntity.values()) t.push(...s);
    return t;
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
  async sync(t, s, i, n, r = !1) {
    const o = `${s.join(",")}|${i.getTime()}|${n.getTime()}`;
    if (o === this._key && this.subscribed && !r) return;
    this._key = o, this.stop();
    const h = At(i), a = At(n);
    for (const l of s)
      try {
        const c = await t.connection.subscribeMessage(
          (d) => {
            this._key === o && (!d || d.events === null ? (this._failed.add(l), this._byEntity.set(l, [])) : (this._failed.delete(l), this._byEntity.set(
              l,
              d.events.map((m, y) => Ae(m, l, y)).filter((m) => m !== null)
            )), this._onChange());
          },
          {
            type: "calendar/event/subscribe",
            entity_id: l,
            start: h,
            end: a
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
  async forceUpdate(t, s) {
    if (s.length)
      try {
        await t.callService("homeassistant", "update_entity", {
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
  async refreshColorHelper(t) {
    try {
      await t.callService("pyscript", "simple_schedule_colors_sync", {});
    } catch {
    }
  }
  stop() {
    for (const t of this._unsubs)
      try {
        t();
      } catch {
      }
    this._unsubs = [];
  }
}
function At(e) {
  const t = (s) => String(s).padStart(2, "0");
  return `${e.getFullYear()}-${t(e.getMonth() + 1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}:${t(e.getSeconds())}`;
}
const Et = [
  "#0a84ff",
  "#30d158",
  "#ff9f0a",
  "#bf5af2",
  "#ff375f",
  "#64d2ff",
  "#ffd60a",
  "#5e5ce6"
];
async function Te(e, t) {
  if (!t.length) return {};
  const s = {};
  try {
    const i = await e.callWS({
      type: "config/entity_registry/get_entries",
      entity_ids: t
    });
    for (const [n, r] of Object.entries(i ?? {})) {
      const o = r?.options?.calendar?.color;
      typeof o == "string" && /^#[0-9a-fA-F]{6}$/.test(o) && (s[n] = o);
    }
  } catch {
  }
  return s;
}
function Ce(e, t, s) {
  return t[e.entity] ?? Et[s % Et.length];
}
function De(e, t) {
  if (!t) return;
  const s = e.trim().toLowerCase();
  for (const [i, n] of Object.entries(t))
    if (i.trim().toLowerCase() === s) return n;
}
const Oe = "/local/simple-schedule-card-data/event-colors.json";
async function Pe(e) {
  try {
    const t = await fetch(e, { cache: "no-cache" });
    if (!t.ok) return null;
    const s = await t.json();
    return {
      by_uid: s.by_uid ?? {},
      by_recurrence_id: s.by_recurrence_id ?? {}
    };
  } catch {
    return null;
  }
}
function Me(e, t, s) {
  if (e) {
    if (s && e.by_recurrence_id[s]) return e.by_recurrence_id[s];
    if (t && e.by_uid[t]) return e.by_uid[t];
  }
}
function St(e, t, s) {
  const i = (n) => {
    const r = n / 255;
    return r <= 0.03928 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * i(e) + 0.7152 * i(t) + 0.0722 * i(s);
}
function Tt(e) {
  return 1.05 / (e + 0.05);
}
function Ft(e, t) {
  const s = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(e);
  if (!s || !(t > 1)) return e;
  const i = parseInt(s[1], 16), n = parseInt(s[2], 16), r = parseInt(s[3], 16);
  if (Tt(St(i, n, r)) >= t) return e;
  let o = 0, h = 1;
  for (let c = 0; c < 24; c++) {
    const d = (o + h) / 2;
    Tt(St(i * d, n * d, r * d)) >= t ? o = d : h = d;
  }
  const a = o, l = (c) => Math.max(0, Math.min(255, Math.round(c * a))).toString(16).padStart(2, "0");
  return `#${l(i)}${l(n)}${l(r)}`;
}
function Ct(e) {
  const t = [...e].sort(
    (n, r) => n.start.getTime() - r.start.getTime() || r.end.getTime() - n.end.getTime() || n.key.localeCompare(r.key)
  ), s = [], i = /* @__PURE__ */ new Map();
  for (const n of t) {
    let r = s.findIndex((o) => o <= n.start.getTime());
    r === -1 && (r = s.length, s.push(0)), s[r] = n.end.getTime(), i.set(n.key, r);
  }
  return i;
}
function Dt(e, t, s) {
  if (t === "packed") {
    const o = e.map((a) => Ct(a));
    let h = 1;
    for (const a of o) h = Math.max(h, Ot(a) + 1);
    return {
      columns: h,
      days: e.map(
        (a, l) => a.map((c) => ({ ev: c, column: o[l].get(c.key) ?? 0 }))
      )
    };
  }
  const i = e.map((o) => {
    const h = /* @__PURE__ */ new Map();
    for (const l of o) {
      const c = h.get(l.entity);
      c ? c.push(l) : h.set(l.entity, [l]);
    }
    const a = /* @__PURE__ */ new Map();
    for (const l of h.values())
      for (const [c, d] of Ct(l)) a.set(c, d);
    return a;
  });
  let n = 1;
  for (const o of i) n = Math.max(n, Ot(o) + 1);
  const r = s.length ? s : [""];
  return {
    columns: r.length * n,
    days: e.map(
      (o, h) => o.map((a) => {
        const l = Math.max(0, r.indexOf(a.entity));
        return { ev: a, column: l * n + (i[h].get(a.key) ?? 0) };
      })
    )
  };
}
function Ot(e) {
  let t = -1;
  for (const s of e.values()) t = Math.max(t, s);
  return t;
}
var ze = Object.defineProperty, Ie = Object.getOwnPropertyDescriptor, v = (e, t, s, i) => {
  for (var n = i > 1 ? void 0 : i ? Ie(t, s) : t, r = e.length - 1, o; r >= 0; r--)
    (o = e[r]) && (n = (i ? o(t, s, n) : o(n)) || n);
  return i && n && ze(t, s, n), n;
};
const Re = "0.1.0", x = {
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
  layout: "auto",
  layout_breakpoint: 560
}, Ne = 28, Le = 40, J = 55, He = 22, Ue = 520, Fe = 64, We = 20, je = 172, Be = 18, qe = 600, Ge = 12e3, Ke = 2200;
let _ = class extends I {
  constructor() {
    super(...arguments), this._sources = [], this._colors = {}, this._eventColors = null, this._weekOffset = 0, this._now = /* @__PURE__ */ new Date(), this._hostWidth = 0, this._refreshing = !1, this._navDir = "none", this._activeIdx = 0, this._pickerOpen = !1, this._animEpoch = 0, this._hThumb = null, this._revision = 0, this._subs = new Se(() => {
      this._revision++;
    }), this._colorKey = "", this._focusPx = 0, this._focusKey = "", this._focusBusy = !1, this._colorsAt = 0, this._eventColorsAt = 0, this._eventColorsPending = !1, this._onOutside = (e) => {
      const t = this.renderRoot?.querySelector(".picker");
      t && e.composedPath().includes(t) || this._setPicker(!1);
    }, this._onPickerKey = (e) => {
      e.key === "Escape" && this._setPicker(!1);
    };
  }
  setConfig(e) {
    if (!e) throw new Error("simple-schedule-card: invalid configuration");
    const t = Ye(e);
    if (!t.length)
      throw new Error(
        'simple-schedule-card: "entity" (a calendar entity_id) or "entities" is required'
      );
    for (const s of t)
      if (!s.entity.startsWith("calendar."))
        throw new Error(`simple-schedule-card: "${s.entity}" is not a calendar entity`);
    this._config = { ...e }, this._sources = t, this._colorKey = "";
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
      ...x
    };
  }
  connectedCallback() {
    super.connectedCallback(), this._tick = setInterval(() => {
      this._now = /* @__PURE__ */ new Date();
    }, 6e4), this._hostRo = new ResizeObserver((e) => {
      const t = Math.round(e[e.length - 1].contentRect.width);
      t && t !== this._hostWidth && (this._hostWidth = t);
    }), this._hostRo.observe(this);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._tick && clearInterval(this._tick), this._tick = void 0, this._spinTimer && clearTimeout(this._spinTimer), this._spinTimer = void 0, this._hostRo?.disconnect(), this._hostRo = void 0, this._setPicker(!1), this._subs.stop();
  }
  updated(e) {
    super.updated(e), !(!this.hass || !this._config) && (this._orientation === "days-as-rows" && (this._measureScrollbar(), this._focusScroller()), this._ensureSubscribed(), this._ensureColors(), this._ensureEventColors());
  }
  /**
   * The week to draw. The window is ALWAYS the full seven days — that is what is
   * subscribed to — and only the day list is trimmed, so `auto` can look at the
   * weekend before deciding whether to show it.
   */
  get _window() {
    const e = xe(this._now, this._weekOffset, 7), t = this._config?.days ?? x.days;
    let s = 5;
    return (t === "mon-sun" || t === "auto" && Ee(this._activeEvents, e.days)) && (s = 7), { start: e.start, end: e.end, days: e.days.slice(0, s) };
  }
  get _entityIds() {
    return this._sources.map((e) => e.entity);
  }
  /** Events of the calendar currently on screen. */
  get _activeEvents() {
    const e = this._sources[Math.min(this._activeIdx, this._sources.length - 1)]?.entity;
    return this._subs.events.filter((t) => t.entity === e);
  }
  async _ensureSubscribed() {
    const e = this._window;
    await this._subs.sync(this.hass, this._entityIds, e.start, e.end);
  }
  /**
   * Re-read the calendars' own colours. Refetched on a TTL rather than once,
   * because the `simple_schedule_colors` helper writes this field in the
   * background when a calendar is recoloured in Google — without a TTL the card
   * would show the stale colour until the page was reloaded.
   */
  async _ensureColors(e = !1) {
    const t = this._entityIds.join(","), s = Date.now() - this._colorsAt > 10 * 6e4;
    !e && t === this._colorKey && !s || (this._colorKey = t, this._colorsAt = Date.now(), this._colors = await Te(this.hass, this._entityIds));
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
    const e = this._config?.min_contrast;
    return typeof e == "number" ? e : x.min_contrast;
  }
  /** URL of the pyscript helper's output, or null when it is switched off. */
  get _helperUrl() {
    const e = this._config?.color_helper;
    return e === !1 ? null : typeof e == "string" && e ? e : Oe;
  }
  /**
   * Refresh the per-event colour map. The helper rewrites it every 15 minutes,
   * so re-reading more often than that is pointless; `force` is for the refresh
   * button. A missing file is the normal "helper not installed" case and leaves
   * `_eventColors` null so every block falls back to its calendar's colour.
   */
  async _ensureEventColors(e = !1) {
    const t = this._helperUrl;
    if (!t) {
      this._eventColors = null;
      return;
    }
    if (!this._eventColorsPending && !(!e && this._eventColorsAt && Date.now() - this._eventColorsAt < 10 * 6e4)) {
      this._eventColorsPending = !0;
      try {
        this._eventColors = await Pe(t), this._eventColorsAt = Date.now();
      } finally {
        this._eventColorsPending = !1;
      }
    }
  }
  _colorFor(e) {
    const t = this._sources.findIndex((i) => i.entity === e), s = this._sources[t] ?? { entity: e };
    return Ce(s, this._colors, t < 0 ? 0 : t);
  }
  /**
   * The colour of one block, most specific first: an explicit `event_colors`
   * title match, then Google's own per-event colour via the helper, then the
   * calendar's colour.
   */
  _colorForEvent(e) {
    return De(e.summary, this._config?.event_colors) ?? Me(this._eventColors, e.uid, e.recurrenceId) ?? this._colorFor(e.entity);
  }
  /** The calendar's own name, as Home Assistant has it. Never a configured one. */
  _nameFor(e) {
    return Ve(this.hass?.states?.[e]?.attributes?.friendly_name ?? e);
  }
  get _active() {
    return this._sources[Math.min(this._activeIdx, this._sources.length - 1)];
  }
  /** The person's picture, if one is configured and set. */
  _avatarFor(e) {
    const t = e.person ? this.hass?.states?.[e.person]?.attributes?.entity_picture : void 0;
    return typeof t == "string" && t ? t : void 0;
  }
  /**
   * Open state for the calendar menu, with a document-level listener while it is
   * open so a click anywhere else dismisses it.
   *
   * The listener has to sit on `document` and test `composedPath()`: the card is
   * in a shadow root, so a click outside it never bubbles to anything the card
   * itself can see.
   */
  _setPicker(e) {
    e !== this._pickerOpen && (this._pickerOpen = e, e || this._animEpoch++, e ? (document.addEventListener("pointerdown", this._onOutside, !0), document.addEventListener("keydown", this._onPickerKey, !0)) : (document.removeEventListener("pointerdown", this._onOutside, !0), document.removeEventListener("keydown", this._onPickerKey, !0)));
  }
  _selectCalendar(e) {
    this._setPicker(!1), e !== this._activeIdx && (this._navDir = e > this._activeIdx ? "fwd" : "back", this._activeIdx = e, this._selected = void 0);
  }
  _goWeek(e) {
    this._navDir = e > 0 ? "fwd" : "back", this._weekOffset += e, this._selected = void 0;
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
    const e = Date.now();
    this._spinTimer && clearTimeout(this._spinTimer);
    const t = setTimeout(() => {
      this._refreshing = !1;
    }, Ge);
    try {
      await this._subs.forceUpdate(this.hass, this._entityIds), await new Promise((i) => setTimeout(i, Ke)), await this._subs.refreshColorHelper(this.hass);
      const s = this._window;
      await Promise.all([
        this._subs.sync(this.hass, this._entityIds, s.start, s.end, !0),
        this._ensureColors(!0),
        this._ensureEventColors(!0)
      ]);
    } finally {
      clearTimeout(t);
      const s = Math.max(0, qe - (Date.now() - e));
      this._spinTimer = setTimeout(() => {
        this._refreshing = !1;
      }, s);
    }
  }
  render() {
    if (!this._config || !this.hass) return f;
    const e = this._config, t = this._window, s = this._active?.entity, i = this._subs.events.filter((h) => h.entity === s), n = i.filter((h) => !h.allDay), r = ke(n, e.day_start ?? x.day_start, e.day_end ?? x.day_end), o = this._mode === "list";
    return u`
      <ha-card>
        <div class="panel ${o ? "narrow" : ""}">
          ${this._renderHead(t.days)}
          ${o ? this._renderList(t.days, i) : this._renderGrid(t.days, i, r)}
        </div>
        ${this._renderSheet()}
      </ha-card>
    `;
  }
  /** Config pins the layout; 'auto' picks by the card's own measured width. */
  get _mode() {
    const e = this._config?.layout ?? x.layout;
    if (e === "grid" || e === "list") return e;
    const t = this._config?.layout_breakpoint ?? x.layout_breakpoint;
    return this._hostWidth > 0 && this._hostWidth < t ? "list" : "grid";
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
  _renderAvatar(e) {
    const t = this._avatarFor(e);
    if (t) return u`<img class="av" src=${t} alt="" />`;
    const s = Ft(this._colorFor(e.entity), this._minContrast), i = (this._nameFor(e.entity).trim()[0] ?? "?").toUpperCase();
    return u`<span class="av init" style="background:${s}">${i}</span>`;
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
    const e = this._sources, t = e.length > 1, s = this._active;
    return u`
      <div class="picker">
        <button
          class="pick-btn ${t ? "" : "static"}"
          ?disabled=${!t}
          aria-haspopup=${t ? "listbox" : f}
          aria-expanded=${t ? this._pickerOpen ? "true" : "false" : f}
          @click=${() => {
      t && this._setPicker(!this._pickerOpen);
    }}
        >
          ${this._renderAvatar(s)}
          <span class="pick-name">${this._nameFor(s.entity)}</span>
          ${t ? u`<ha-icon
                class="pick-chev ${this._pickerOpen ? "open" : ""}"
                icon="mdi:chevron-down"
              ></ha-icon>` : f}
        </button>
        <div class="pick-menu ${this._pickerOpen ? "open" : ""}" role="listbox">
          ${e.map(
      (i, n) => u`
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
  _renderHead(e) {
    const t = this._config, s = this._subs.failed, i = e.length ? `${this._fmtDate(e[0])} – ${this._fmtDate(e[e.length - 1])}` : "";
    return u`
      <div class="head">
        <div class="titles">${this._renderPicker()}</div>
        <div class="head-right">
          <div class="tools">
          ${s.length ? u`<div class="warn" title=${s.join(", ")}>
                <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
              </div>` : f}
          <button class="btn" @click=${() => this._goWeek(-1)} aria-label="Previous week">
            <ha-icon icon="mdi:chevron-left"></ha-icon>
          </button>
          <button
            class="btn today ${this._weekOffset === 0 ? "off" : ""}"
            @click=${() => this._goToday()}
            aria-label="This week"
          >
            <ha-icon icon="mdi:calendar-today"></ha-icon>
          </button>
          <button class="btn" @click=${() => this._goWeek(1)} aria-label="Next week">
            <ha-icon icon="mdi:chevron-right"></ha-icon>
          </button>
          ${t.show_refresh ?? x.show_refresh ? u`<button
                class="btn ${this._refreshing ? "spin" : ""}"
                @click=${() => void this._refresh()}
                aria-label="Refresh"
              >
                <ha-icon icon="mdi:refresh"></ha-icon>
              </button>` : f}
          </div>
          <div class="range">
            ${i}${this._weekLabel ? u`<span class="pill">${this._weekLabel}</span>` : f}
          </div>
        </div>
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
  _measureScrollbar(e) {
    const t = e ?? this.renderRoot?.querySelector(".rscroll");
    if (!t) return;
    const { scrollLeft: s, scrollWidth: i, clientWidth: n } = t;
    if (i <= n + 1) {
      this._hThumb && (this._hThumb = null);
      return;
    }
    const r = Math.max(6, n / i * 100), o = s / (i - n) * (100 - r), h = this._hThumb;
    (!h || Math.abs(h.left - o) > 0.05 || Math.abs(h.width - r) > 0.05) && (this._hThumb = { left: o, width: r });
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
    const e = `${this._weekOffset}|${this._activeIdx}|${this._focusPx}`;
    if (e === this._focusKey || this._focusBusy) return;
    const t = this.renderRoot?.querySelector(".rscroll");
    if (!t) return;
    this._focusBusy = !0;
    let s = 0;
    const i = () => {
      if (t.scrollLeft = this._focusPx, Math.abs(t.scrollLeft - this._focusPx) < 2) {
        this._focusKey = e, this._focusBusy = !1;
        return;
      }
      s++ < 12 ? requestAnimationFrame(i) : this._focusBusy = !1;
    };
    i();
  }
  _onHScroll(e) {
    this._measureScrollbar(e.currentTarget);
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
  _renderGrid(e, t, s) {
    return this._orientation === "days-as-rows" ? this._renderRowsGrid(e, t, s) : this._renderColumnsGrid(e, t, s);
  }
  /** Days down the left, time across the top — the printed-timetable shape. */
  _renderRowsGrid(e, t, s) {
    const i = this._config, n = i.day_height ?? x.day_height, r = i.hour_width ?? x.hour_width, o = this._active?.calendar_mode === "full", h = o ? 0 : s.start, a = o ? 24 * 60 : s.end, l = a - h, c = this._active?.view_width_mode === "adaptive", d = Math.round(l / 60 * r), m = c ? "%" : "px", y = c ? 100 : d, p = (g) => (g - h) / l * (c ? 100 : d), b = e.map((g) => D(t.filter(($) => !$.allDay), g)), U = this._active ? [this._active.entity] : [], rt = Dt(b, i.lane_mode ?? x.lane_mode, U), Wt = rt.columns * n, jt = e.map((g) => D(t.filter(($) => $.allDay), g)), ot = [];
    for (let g = Math.ceil(h / 60) * 60; g <= a; g += 60) ot.push(g);
    const Bt = Math.max(160, (this._hostWidth || 1e3) - je - Be * 2), qt = c ? Bt / (l / 60) : r, Gt = Math.max(1, Math.ceil(Fe / qt)), at = ot.filter((g, $) => $ % Gt === 0), Kt = e.findIndex((g) => Mt(g, this._now));
    return this._focusPx = o && !c ? Math.max(0, Math.round((s.start - We - h) / l * d)) : 0, u`
      <div
        class="rgrid dir-${this._navDir} ${this._receded ? "dimmed" : ""}"
        style="--row-h:${Wt}px; --lane-h:${n}px"
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
            ${e.map(
      (g, $) => u`
                <div
                  class="rday ${$ % 2 ? "alt" : ""} ${$ === Kt ? "today" : ""}"
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
                ${at.map(
      (g) => u`<div
                      class="rhr ${p(g) < 0.5 ? "first" : ""} ${p(g) >= y - 0.5 ? "last" : ""}"
                      style="left:${p(g)}${m}"
                    >
                      ${this._fmtHour(g)}
                    </div>`
    )}
              </div>

              ${e.map((g, $) => {
      const ht = K(g).getTime();
      return u`
                  <div class="rcanvas ${$ % 2 ? "alt" : ""}">
                    <div class="rlines">
                      ${at.map(
        (k) => u`<div class="rline" style="left:${p(k)}${m}"></div>`
      )}
                    </div>
                    ${jt[$].map(
        (k) => u`
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
                    ${rt.days[$].map(({ ev: k, column: Yt }) => {
        const F = Math.max(h, j(k.start, ht)), lt = j(k.end, ht), ct = Math.min(a, lt <= F ? F + 15 : lt);
        if (ct <= h || F >= a) return f;
        const dt = p(F), Vt = p(ct) - dt;
        return u`
                        <div
                          class="ev rev"
                          style="left:${dt}${m}; width:${Vt}${m};
                                 min-width:${Le}px;
                                 top:${Yt * n}px; height:${n}px;
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
        ${this._hThumb ? u`<div class="hbar">
              <div
                class="hthumb"
                style="left:${this._hThumb.left}%; width:${this._hThumb.width}%"
              ></div>
            </div>` : f}
      </div>
    `;
  }
  /** Days across the top, time down the left — the calendar shape. */
  _renderColumnsGrid(e, t, s) {
    this._active?.calendar_mode === "full" && (s = { start: 0, end: 24 * 60 });
    const i = this._config, n = i.hour_height ?? x.hour_height, r = s.end - s.start, o = Math.round(r / 60 * n), h = e.map((p) => D(t.filter((b) => !b.allDay), p)), a = this._active ? [this._active.entity] : [], l = Dt(h, i.lane_mode ?? x.lane_mode, a), c = e.map((p) => D(t.filter((b) => b.allDay), p)), d = c.some((p) => p.length > 0), m = [];
    for (let p = Math.ceil(s.start / 60) * 60; p <= s.end; p += 60) m.push(p);
    const y = e.length;
    return u`
      <div
        class="grid dir-${this._navDir} ${this._receded ? "dimmed" : ""}"
        style="--cols:${y}; --sub:${l.columns}; --body-h:${o}px"
        @animationend=${() => {
      this._navDir = "none";
    }}
      >
        <div class="hdr">
          <div class="corner"></div>
          ${e.map(
      (p, b) => u`
              <div class="dayhead ${b % 2 ? "alt" : ""}">
                <span class="dow">${this._fmtDowLong(p)},</span>
                <span class="dnum">${this._fmtDate(p)}</span>
              </div>
            `
    )}
        </div>

        ${d ? u`
              <div class="allday">
                <div class="gut-lbl">all-day</div>
                ${c.map(
      (p) => u`
                    <div class="ad-cell">
                      ${p.map(
        (b) => u`
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
      (p) => u`<div class="line" style="top:${zt(p, s)}"></div>`
    )}
          </div>
          <div class="gutter">
            ${m.map(
      (p) => u`<div class="hr" style="top:${zt(p, s)}">${this._fmtHour(p)}</div>`
    )}
          </div>
          ${e.map(
      (p, b) => this._renderDay(p, b, l.days[b], l.columns, s, o)
    )}
        </div>
      </div>
    `;
  }
  _renderDay(e, t, s, i, n, r) {
    const o = n.end - n.start, h = K(e).getTime();
    return u`
      <div class="day ${t % 2 ? "alt" : ""}">
        ${s.map(({ ev: a, column: l }) => {
      const c = Math.max(n.start, j(a.start, h)), d = j(a.end, h), m = Math.min(n.end, d <= c ? c + 15 : d);
      if (m <= n.start || c >= n.end) return f;
      const y = (c - n.start) / o * r, p = Math.max(Ne, (m - c) / o * r), b = this._colorForEvent(a), U = p < 46;
      return u`
            <div
              class="ev ${U ? "compact" : ""} ${this._selected?.key === a.key ? "sel" : ""}"
              style="top:${y}px; height:${p}px;
                     left:calc(${l} * (100% / ${i}));
                     width:calc(100% / ${i});
                     animation-name:${this._evAnim}; animation-delay:${t * J}ms;
                     ${W(b, this._minContrast)}"
              @click=${() => this._selected = a}
            >
              <div class="ev-in">
                <div class="ev-name">${a.summary}</div>
                ${U ? f : u`<div class="ev-time">
                      ${this._fmtTime(a.start)} – ${this._fmtTime(a.end)}
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
  _renderList(e, t) {
    let s = 0;
    return u`
      <div
        class="list ${this._receded ? "dimmed" : ""} dir-${this._navDir}"
        @animationend=${() => {
      this._navDir = "none";
    }}
      >
        ${e.map((i) => {
      const n = D(t, i).sort(
        (r, o) => r.start.getTime() - o.start.getTime()
      );
      return u`
            <div class="ld">
              <div class="ld-head ${Mt(i, this._now) ? "today" : ""}">
                <span class="dow">${this._fmtDowLong(i)},</span>
                <span class="dnum">${this._fmtDate(i)}</span>
              </div>
              ${n.length ? n.map(
        (r) => u`
                      <div
                        class="lr"
                        style="animation-name:${this._evAnim};
                               animation-delay:${Math.min(
          s++ * He,
          Ue
        )}ms"
                        @click=${() => this._selected = r}
                      >
                        <span class="lr-bar" style="background:${this._colorForEvent(r)}"></span>
                        <span class="lr-time">
                          ${r.allDay ? "all day" : u`${this._fmtTime(r.start)}<br />${this._fmtTime(r.end)}`}
                        </span>
                        <span class="lr-name">${r.summary}</span>
                      </div>
                    `
      ) : u`<div class="lr empty">Nothing scheduled</div>`}
            </div>
          `;
    })}
      </div>
    `;
  }
  _renderSheet() {
    const e = this._selected;
    return e ? u`
      <div class="scrim" @click=${() => this._closeSheet()}>
        <div
          class="sheet"
          style="--accent:${this._colorForEvent(e)}"
          @click=${(t) => t.stopPropagation()}
        >
          <div class="sh-name">${e.summary}</div>
          <div class="sh-time">
            ${e.allDay ? `${this._fmtDate(e.start)} · all day` : `${this._fmtDow(e.start)} ${this._fmtDate(e.start)} · ${this._fmtTime(
      e.start
    )} – ${this._fmtTime(e.end)}`}
          </div>
          <div class="sh-cal">
            <span class="dot" style="background:${this._colorFor(e.entity)}"></span>
            ${this._nameFor(e.entity)}
          </div>
          ${e.location ? u`<div class="sh-row">${e.location}</div>` : f}
          ${e.description ? u`<div class="sh-row">${e.description}</div>` : f}
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
    const e = this._config?.time_format ?? x.time_format;
    if (e === "12") return !0;
    if (e === "24") return !1;
    const t = this.hass?.locale?.time_format;
    return t === "12" ? !0 : t === "24" ? !1 : new Intl.DateTimeFormat(this._lang, { hour: "numeric" }).resolvedOptions().hour12 ?? !1;
  }
  /** 24h is built by hand: Intl pads the hour to "08:25" whatever you ask for. */
  _fmtTime(e) {
    return this._hour12 ? new Intl.DateTimeFormat(this._lang, {
      hour: "numeric",
      minute: "2-digit",
      hour12: !0
    }).format(e) : `${e.getHours()}:${Pt(e.getMinutes())}`;
  }
  _fmtHour(e) {
    const t = Math.floor(e / 60) % 24;
    if (!this._hour12) return `${t}:${Pt(e % 60)}`;
    const s = new Date(2e3, 0, 1, t, e % 60);
    return new Intl.DateTimeFormat(this._lang, { hour: "numeric", hour12: !0 }).format(s);
  }
  _fmtDow(e) {
    return new Intl.DateTimeFormat(this._lang, { weekday: "short" }).format(e);
  }
  _fmtDowLong(e) {
    return new Intl.DateTimeFormat(this._lang, { weekday: "long" }).format(e);
  }
  /** "Sep 7th". The suffix is English-only, so other locales keep a bare number. */
  _fmtDate(e) {
    return `${new Intl.DateTimeFormat(this._lang, { month: "short" }).format(e)} ${e.getDate()}${Ze(e.getDate(), this._lang)}`;
  }
};
_.styles = Zt`
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
      gap: 8px;
      flex: 0 0 auto;
    }
    /* Narrow chrome. The phone LAYOUT is still undesigned, but the header must
       not visibly break while it waits: the title has to fit, and the week pill
       is redundant next to a date range it would otherwise push onto its own
       line. */
    .narrow {
      padding: 13px 13px 14px;
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
      display: none;
    }
    .narrow .tools {
      gap: 7px;
    }
    .narrow .btn {
      width: 34px;
      height: 34px;
    }
    .narrow .btn ha-icon {
      --mdc-icon-size: 20px;
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
    .picker {
      position: relative;
      display: inline-block;
    }
    .pick-btn,
    .pick-item {
      display: flex;
      align-items: center;
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
    .pick-name {
      font-weight: 700;
      white-space: nowrap;
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

    .pill {
      font-size: 12px;
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
      gap: 10px;
      flex: 0 0 auto;
    }
    .btn {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
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
    .btn.off {
      opacity: 0.3;
      pointer-events: none;
    }
    .btn ha-icon {
      --mdc-icon-size: 23px;
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
    .ev.rev .ev-time {
      font-size: 12px;
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

    .list {
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
  Ut({ attribute: !1 })
], _.prototype, "hass", 2);
v([
  w()
], _.prototype, "_config", 2);
v([
  w()
], _.prototype, "_sources", 2);
v([
  w()
], _.prototype, "_colors", 2);
v([
  w()
], _.prototype, "_eventColors", 2);
v([
  w()
], _.prototype, "_weekOffset", 2);
v([
  w()
], _.prototype, "_now", 2);
v([
  w()
], _.prototype, "_hostWidth", 2);
v([
  w()
], _.prototype, "_refreshing", 2);
v([
  w()
], _.prototype, "_selected", 2);
v([
  w()
], _.prototype, "_navDir", 2);
v([
  w()
], _.prototype, "_activeIdx", 2);
v([
  w()
], _.prototype, "_pickerOpen", 2);
v([
  w()
], _.prototype, "_animEpoch", 2);
v([
  w()
], _.prototype, "_hThumb", 2);
v([
  w()
], _.prototype, "_revision", 2);
_ = v([
  ye("simple-schedule-card")
], _);
function Ye(e) {
  const t = e.entities ?? (e.entity ? [e.entity] : []), s = [];
  for (const i of t)
    typeof i == "string" ? s.push({ entity: i }) : i && typeof i.entity == "string" && s.push({ ...i });
  return s;
}
function W(e, t) {
  return `--accent:${e}; --fill:${Ft(e, t)};`;
}
function Ve(e) {
  return e.replace(/(^|\s)(\p{L})/gu, (t, s, i) => s + i.toUpperCase());
}
function Pt(e) {
  return String(e).padStart(2, "0");
}
const Xe = { one: "st", two: "nd", few: "rd", other: "th" };
function Ze(e, t) {
  if (t && !t.toLowerCase().startsWith("en")) return "";
  try {
    return Xe[new Intl.PluralRules("en", { type: "ordinal" }).select(e)] ?? "";
  } catch {
    return "";
  }
}
function Mt(e, t) {
  return e.getFullYear() === t.getFullYear() && e.getMonth() === t.getMonth() && e.getDate() === t.getDate();
}
function zt(e, t) {
  return `${(e - t.start) / (t.end - t.start) * 100}%`;
}
function j(e, t) {
  return (e.getTime() - t) / 6e4;
}
window.customCards = window.customCards || [];
window.customCards.push({
  type: "simple-schedule-card",
  name: "Simple Schedule Card",
  description: "A whole week of calendar events as a proportional time grid",
  preview: !1
});
console.info(
  `%c SIMPLE-SCHEDULE-CARD %c v${Re} `,
  "color:#fff;background:#0a84ff;font-weight:700;border-radius:3px 0 0 3px;padding:2px 4px",
  "color:#0a84ff;background:#222;border-radius:0 3px 3px 0;padding:2px 4px"
);
export {
  _ as SimpleScheduleCard
};
