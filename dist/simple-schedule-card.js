/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ne = globalThis, ye = ne.ShadowRoot && (ne.ShadyCSS === void 0 || ne.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, we = Symbol(), Ae = /* @__PURE__ */ new WeakMap();
let at = class {
  constructor(t, s, i) {
    if (this._$cssResult$ = !0, i !== we) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = s;
  }
  get styleSheet() {
    let t = this.o;
    const s = this.t;
    if (ye && t === void 0) {
      const i = s !== void 0 && s.length === 1;
      i && (t = Ae.get(s)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && Ae.set(s, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const $t = (e) => new at(typeof e == "string" ? e : e + "", void 0, we), Tt = (e, ...t) => {
  const s = e.length === 1 ? e[0] : t.reduce((i, n, a) => i + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(n) + e[a + 1], e[0]);
  return new at(s, e, we);
}, Et = (e, t) => {
  if (ye) e.adoptedStyleSheets = t.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of t) {
    const i = document.createElement("style"), n = ne.litNonce;
    n !== void 0 && i.setAttribute("nonce", n), i.textContent = s.cssText, e.appendChild(i);
  }
}, Ce = ye ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let s = "";
  for (const i of t.cssRules) s += i.cssText;
  return $t(s);
})(e) : e;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Dt, defineProperty: St, getOwnPropertyDescriptor: Mt, getOwnPropertyNames: At, getOwnPropertySymbols: Ct, getPrototypeOf: Ot } = Object, he = globalThis, Oe = he.trustedTypes, Pt = Oe ? Oe.emptyScript : "", Lt = he.reactiveElementPolyfillSupport, j = (e, t) => e, ae = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? Pt : null;
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
} }, ve = (e, t) => !Dt(e, t), Pe = { attribute: !0, type: String, converter: ae, reflect: !1, useDefault: !1, hasChanged: ve };
Symbol.metadata ??= Symbol("metadata"), he.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let z = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, s = Pe) {
    if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(t, s), !s.noAccessor) {
      const i = Symbol(), n = this.getPropertyDescriptor(t, i, s);
      n !== void 0 && St(this.prototype, t, n);
    }
  }
  static getPropertyDescriptor(t, s, i) {
    const { get: n, set: a } = Mt(this.prototype, t) ?? { get() {
      return this[s];
    }, set(o) {
      this[s] = o;
    } };
    return { get: n, set(o) {
      const l = n?.call(this);
      a?.call(this, o), this.requestUpdate(t, l, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? Pe;
  }
  static _$Ei() {
    if (this.hasOwnProperty(j("elementProperties"))) return;
    const t = Ot(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(j("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(j("properties"))) {
      const s = this.properties, i = [...At(s), ...Ct(s)];
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
      for (const n of i) s.unshift(Ce(n));
    } else t !== void 0 && s.push(Ce(t));
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
    return Et(t, this.constructor.elementStyles), t;
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
      const a = (i.converter?.toAttribute !== void 0 ? i.converter : ae).toAttribute(s, i.type);
      this._$Em = t, a == null ? this.removeAttribute(n) : this.setAttribute(n, a), this._$Em = null;
    }
  }
  _$AK(t, s) {
    const i = this.constructor, n = i._$Eh.get(t);
    if (n !== void 0 && this._$Em !== n) {
      const a = i.getPropertyOptions(n), o = typeof a.converter == "function" ? { fromAttribute: a.converter } : a.converter?.fromAttribute !== void 0 ? a.converter : ae;
      this._$Em = n;
      const l = o.fromAttribute(s, a.type);
      this[n] = l ?? this._$Ej?.get(n) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, s, i, n = !1, a) {
    if (t !== void 0) {
      const o = this.constructor;
      if (n === !1 && (a = this[t]), i ??= o.getPropertyOptions(t), !((i.hasChanged ?? ve)(a, s) || i.useDefault && i.reflect && a === this._$Ej?.get(t) && !this.hasAttribute(o._$Eu(t, i)))) return;
      this.C(t, s, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, s, { useDefault: i, reflect: n, wrapped: a }, o) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, o ?? s ?? this[t]), a !== !0 || o !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (s = void 0), this._$AL.set(t, s)), n === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
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
        for (const [n, a] of this._$Ep) this[n] = a;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [n, a] of i) {
        const { wrapped: o } = a, l = this[n];
        o !== !0 || this._$AL.has(n) || l === void 0 || this.C(n, void 0, a, l);
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
z.elementStyles = [], z.shadowRootOptions = { mode: "open" }, z[j("elementProperties")] = /* @__PURE__ */ new Map(), z[j("finalized")] = /* @__PURE__ */ new Map(), Lt?.({ ReactiveElement: z }), (he.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const xe = globalThis, Le = (e) => e, oe = xe.trustedTypes, Ie = oe ? oe.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, ot = "$lit$", E = `lit$${Math.random().toFixed(9).slice(2)}$`, rt = "?" + E, It = `<${rt}>`, C = document, q = () => C.createComment(""), G = (e) => e === null || typeof e != "object" && typeof e != "function", ke = Array.isArray, zt = (e) => ke(e) || typeof e?.[Symbol.iterator] == "function", de = `[ 	
\f\r]`, H = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ze = /-->/g, Re = />/g, D = RegExp(`>|${de}(?:([^\\s"'>=/]+)(${de}*=${de}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Ne = /'/g, We = /"/g, lt = /^(?:script|style|textarea|title)$/i, Rt = (e) => (t, ...s) => ({ _$litType$: e, strings: t, values: s }), c = Rt(1), W = Symbol.for("lit-noChange"), u = Symbol.for("lit-nothing"), Fe = /* @__PURE__ */ new WeakMap(), A = C.createTreeWalker(C, 129);
function ht(e, t) {
  if (!ke(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Ie !== void 0 ? Ie.createHTML(t) : t;
}
const Nt = (e, t) => {
  const s = e.length - 1, i = [];
  let n, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = H;
  for (let l = 0; l < s; l++) {
    const r = e[l];
    let h, d, p = -1, f = 0;
    for (; f < r.length && (o.lastIndex = f, d = o.exec(r), d !== null); ) f = o.lastIndex, o === H ? d[1] === "!--" ? o = ze : d[1] !== void 0 ? o = Re : d[2] !== void 0 ? (lt.test(d[2]) && (n = RegExp("</" + d[2], "g")), o = D) : d[3] !== void 0 && (o = D) : o === D ? d[0] === ">" ? (o = n ?? H, p = -1) : d[1] === void 0 ? p = -2 : (p = o.lastIndex - d[2].length, h = d[1], o = d[3] === void 0 ? D : d[3] === '"' ? We : Ne) : o === We || o === Ne ? o = D : o === ze || o === Re ? o = H : (o = D, n = void 0);
    const v = o === D && e[l + 1].startsWith("/>") ? " " : "";
    a += o === H ? r + It : p >= 0 ? (i.push(h), r.slice(0, p) + ot + r.slice(p) + E + v) : r + E + (p === -2 ? l : v);
  }
  return [ht(e, a + (e[s] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class K {
  constructor({ strings: t, _$litType$: s }, i) {
    let n;
    this.parts = [];
    let a = 0, o = 0;
    const l = t.length - 1, r = this.parts, [h, d] = Nt(t, s);
    if (this.el = K.createElement(h, i), A.currentNode = this.el.content, s === 2 || s === 3) {
      const p = this.el.content.firstChild;
      p.replaceWith(...p.childNodes);
    }
    for (; (n = A.nextNode()) !== null && r.length < l; ) {
      if (n.nodeType === 1) {
        if (n.hasAttributes()) for (const p of n.getAttributeNames()) if (p.endsWith(ot)) {
          const f = d[o++], v = n.getAttribute(p).split(E), b = /([.?@])?(.*)/.exec(f);
          r.push({ type: 1, index: a, name: b[2], strings: v, ctor: b[1] === "." ? Ft : b[1] === "?" ? Ut : b[1] === "@" ? Ht : ce }), n.removeAttribute(p);
        } else p.startsWith(E) && (r.push({ type: 6, index: a }), n.removeAttribute(p));
        if (lt.test(n.tagName)) {
          const p = n.textContent.split(E), f = p.length - 1;
          if (f > 0) {
            n.textContent = oe ? oe.emptyScript : "";
            for (let v = 0; v < f; v++) n.append(p[v], q()), A.nextNode(), r.push({ type: 2, index: ++a });
            n.append(p[f], q());
          }
        }
      } else if (n.nodeType === 8) if (n.data === rt) r.push({ type: 2, index: a });
      else {
        let p = -1;
        for (; (p = n.data.indexOf(E, p + 1)) !== -1; ) r.push({ type: 7, index: a }), p += E.length - 1;
      }
      a++;
    }
  }
  static createElement(t, s) {
    const i = C.createElement("template");
    return i.innerHTML = t, i;
  }
}
function F(e, t, s = e, i) {
  if (t === W) return t;
  let n = i !== void 0 ? s._$Co?.[i] : s._$Cl;
  const a = G(t) ? void 0 : t._$litDirective$;
  return n?.constructor !== a && (n?._$AO?.(!1), a === void 0 ? n = void 0 : (n = new a(e), n._$AT(e, s, i)), i !== void 0 ? (s._$Co ??= [])[i] = n : s._$Cl = n), n !== void 0 && (t = F(e, n._$AS(e, t.values), n, i)), t;
}
class Wt {
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
    const { el: { content: s }, parts: i } = this._$AD, n = (t?.creationScope ?? C).importNode(s, !0);
    A.currentNode = n;
    let a = A.nextNode(), o = 0, l = 0, r = i[0];
    for (; r !== void 0; ) {
      if (o === r.index) {
        let h;
        r.type === 2 ? h = new V(a, a.nextSibling, this, t) : r.type === 1 ? h = new r.ctor(a, r.name, r.strings, this, t) : r.type === 6 && (h = new Bt(a, this, t)), this._$AV.push(h), r = i[++l];
      }
      o !== r?.index && (a = A.nextNode(), o++);
    }
    return A.currentNode = C, n;
  }
  p(t) {
    let s = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, s), s += i.strings.length - 2) : i._$AI(t[s])), s++;
  }
}
class V {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, s, i, n) {
    this.type = 2, this._$AH = u, this._$AN = void 0, this._$AA = t, this._$AB = s, this._$AM = i, this.options = n, this._$Cv = n?.isConnected ?? !0;
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
    t = F(this, t, s), G(t) ? t === u || t == null || t === "" ? (this._$AH !== u && this._$AR(), this._$AH = u) : t !== this._$AH && t !== W && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : zt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== u && G(this._$AH) ? this._$AA.nextSibling.data = t : this.T(C.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: s, _$litType$: i } = t, n = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = K.createElement(ht(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === n) this._$AH.p(s);
    else {
      const a = new Wt(n, this), o = a.u(this.options);
      a.p(s), this.T(o), this._$AH = a;
    }
  }
  _$AC(t) {
    let s = Fe.get(t.strings);
    return s === void 0 && Fe.set(t.strings, s = new K(t)), s;
  }
  k(t) {
    ke(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let i, n = 0;
    for (const a of t) n === s.length ? s.push(i = new V(this.O(q()), this.O(q()), this, this.options)) : i = s[n], i._$AI(a), n++;
    n < s.length && (this._$AR(i && i._$AB.nextSibling, n), s.length = n);
  }
  _$AR(t = this._$AA.nextSibling, s) {
    for (this._$AP?.(!1, !0, s); t !== this._$AB; ) {
      const i = Le(t).nextSibling;
      Le(t).remove(), t = i;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class ce {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, s, i, n, a) {
    this.type = 1, this._$AH = u, this._$AN = void 0, this.element = t, this.name = s, this._$AM = n, this.options = a, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = u;
  }
  _$AI(t, s = this, i, n) {
    const a = this.strings;
    let o = !1;
    if (a === void 0) t = F(this, t, s, 0), o = !G(t) || t !== this._$AH && t !== W, o && (this._$AH = t);
    else {
      const l = t;
      let r, h;
      for (t = a[0], r = 0; r < a.length - 1; r++) h = F(this, l[i + r], s, r), h === W && (h = this._$AH[r]), o ||= !G(h) || h !== this._$AH[r], h === u ? t = u : t !== u && (t += (h ?? "") + a[r + 1]), this._$AH[r] = h;
    }
    o && !n && this.j(t);
  }
  j(t) {
    t === u ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Ft extends ce {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === u ? void 0 : t;
  }
}
class Ut extends ce {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== u);
  }
}
class Ht extends ce {
  constructor(t, s, i, n, a) {
    super(t, s, i, n, a), this.type = 5;
  }
  _$AI(t, s = this) {
    if ((t = F(this, t, s, 0) ?? u) === W) return;
    const i = this._$AH, n = t === u && i !== u || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, a = t !== u && (i === u || n);
    n && this.element.removeEventListener(this.name, this, i), a && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Bt {
  constructor(t, s, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = s, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    F(this, t);
  }
}
const jt = xe.litHtmlPolyfillSupport;
jt?.(K, V), (xe.litHtmlVersions ??= []).push("3.3.3");
const Yt = (e, t, s) => {
  const i = s?.renderBefore ?? t;
  let n = i._$litPart$;
  if (n === void 0) {
    const a = s?.renderBefore ?? null;
    i._$litPart$ = n = new V(t.insertBefore(q(), a), a, void 0, s ?? {});
  }
  return n._$AI(e), n;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const $e = globalThis;
class Y extends z {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const s = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Yt(s, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return W;
  }
}
Y._$litElement$ = !0, Y.finalized = !0, $e.litElementHydrateSupport?.({ LitElement: Y });
const qt = $e.litElementPolyfillSupport;
qt?.({ LitElement: Y });
($e.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Gt = (e) => (t, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Kt = { attribute: !0, type: String, converter: ae, reflect: !1, hasChanged: ve }, Xt = (e = Kt, t, s) => {
  const { kind: i, metadata: n } = s;
  let a = globalThis.litPropertyMetadata.get(n);
  if (a === void 0 && globalThis.litPropertyMetadata.set(n, a = /* @__PURE__ */ new Map()), i === "setter" && ((e = Object.create(e)).wrapped = !0), a.set(s.name, e), i === "accessor") {
    const { name: o } = s;
    return { set(l) {
      const r = t.get.call(this);
      t.set.call(this, l), this.requestUpdate(o, r, e, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(o, void 0, e, l), l;
    } };
  }
  if (i === "setter") {
    const { name: o } = s;
    return function(l) {
      const r = this[o];
      t.call(this, l), this.requestUpdate(o, r, e, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function ct(e) {
  return (t, s) => typeof s == "object" ? Xt(e, t, s) : ((i, n, a) => {
    const o = n.hasOwnProperty(a);
    return n.constructor.createProperty(a, i), o ? Object.getOwnPropertyDescriptor(n, a) : void 0;
  })(e, t, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function _(e) {
  return ct({ ...e, state: !0, attribute: !1 });
}
function N(e) {
  return new Date(e.getFullYear(), e.getMonth(), e.getDate());
}
function Vt(e) {
  const t = N(e), s = (t.getDay() + 6) % 7;
  return t.setDate(t.getDate() - s), t;
}
function pe(e, t, s) {
  const i = Vt(e);
  i.setDate(i.getDate() + t * 7);
  const n = new Date(i);
  n.setDate(n.getDate() + 7);
  const a = [];
  for (let o = 0; o < s; o++) {
    const l = new Date(i);
    l.setDate(l.getDate() + o), a.push(l);
  }
  return { start: i, end: n, days: a };
}
function ue(e) {
  return e.getHours() * 60 + e.getMinutes();
}
function Ue(e) {
  if (!e || e === "auto") return null;
  const t = /^(\d{1,2}):(\d{2})$/.exec(e.trim());
  if (!t) return null;
  const s = Number(t[1]), i = Number(t[2]);
  return s > 24 || i > 59 ? null : s * 60 + i;
}
function Zt(e, t, s) {
  const i = Ue(t), n = Ue(s);
  if (i !== null && n !== null && n > i)
    return { start: i, end: n };
  let a = 1 / 0, o = -1 / 0;
  for (const h of e) {
    if (h.allDay) continue;
    a = Math.min(a, ue(h.start));
    const d = ue(h.end) === 0 ? 24 * 60 : ue(h.end);
    o = Math.max(o, d);
  }
  (!Number.isFinite(a) || !Number.isFinite(o)) && (a = 8 * 60, o = 16 * 60);
  const l = i !== null ? i : a, r = n !== null ? n : o;
  return r > l ? { start: l, end: r } : { start: l, end: l + 60 };
}
function Qt(e, t, s) {
  if (!e || !e.start || !e.end) return null;
  const i = e.all_day === !0 || !e.start.includes("T"), n = He(e.start), a = He(e.end);
  return !n || !a ? null : {
    // recurrence_id is unique per occurrence; uid is not. Index backstops both.
    key: `${t}|${e.recurrence_id ?? e.uid ?? "x"}|${e.start}|${s}`,
    entity: t,
    uid: e.uid ?? void 0,
    recurrenceId: e.recurrence_id ?? void 0,
    summary: (e.summary ?? "").trim() || "(no title)",
    description: e.description ?? void 0,
    location: e.location ?? void 0,
    start: n,
    end: a,
    allDay: i
  };
}
function He(e) {
  const t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(e);
  if (t) return new Date(Number(t[1]), Number(t[2]) - 1, Number(t[3]));
  const s = new Date(e);
  return Number.isNaN(s.getTime()) ? null : s;
}
function Jt(e, t) {
  return t.filter((s) => s.getDay() === 0 || s.getDay() === 6).some((s) => R(e, s).length > 0);
}
function R(e, t) {
  const s = N(t).getTime(), i = s + 24 * 60 * 60 * 1e3;
  return e.filter((n) => n.start.getTime() < i && n.end.getTime() > s);
}
class es {
  constructor(t) {
    this._onChange = t, this._unsubs = [], this._byEntity = /* @__PURE__ */ new Map(), this._failed = /* @__PURE__ */ new Set(), this._key = "";
  }
  /** Every calendar's cached events, flattened. */
  get events() {
    const t = [];
    for (const s of this._byEntity.values()) t.push(...s);
    return t;
  }
  /**
   * Fold a window's worth of pushed events into the cache for one entity.
   *
   * Anything cached that overlaps [start, end) is dropped first: the push is the
   * complete truth for that span, so an event it no longer contains is gone.
   */
  _merge(t, s, i, n) {
    const a = i.getTime(), o = n.getTime(), l = (this._byEntity.get(t) ?? []).filter(
      (r) => r.start.getTime() >= o || r.end.getTime() <= a
    );
    this._byEntity.set(t, [...l, ...s]);
  }
  /** Forget everything cached. Used when a refresh must not show stale events. */
  clear() {
    this._byEntity.clear();
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
  async sync(t, s, i, n, a = !1) {
    const o = `${s.join(",")}|${i.getTime()}|${n.getTime()}`;
    if (o === this._key && this.subscribed && !a) return;
    this._key = o, this.stop();
    const l = Be(i), r = Be(n);
    for (const h of s)
      try {
        const d = await t.connection.subscribeMessage(
          (p) => {
            this._key === o && (!p || p.events === null ? this._failed.add(h) : (this._failed.delete(h), this._merge(
              h,
              p.events.map((f, v) => Qt(f, h, v)).filter((f) => f !== null),
              i,
              n
            )), this._onChange());
          },
          {
            type: "calendar/event/subscribe",
            entity_id: h,
            start: l,
            end: r
          }
        );
        if (this._key !== o) {
          d();
          return;
        }
        this._unsubs.push(d);
      } catch {
        this._failed.add(h), this._onChange();
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
function Be(e) {
  const t = (s) => String(s).padStart(2, "0");
  return `${e.getFullYear()}-${t(e.getMonth() + 1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}:${t(e.getSeconds())}`;
}
const je = [
  "#0a84ff",
  "#30d158",
  "#ff9f0a",
  "#bf5af2",
  "#ff375f",
  "#64d2ff",
  "#ffd60a",
  "#5e5ce6"
];
async function ts(e, t) {
  if (!t.length) return {};
  const s = {};
  try {
    const i = await e.callWS({
      type: "config/entity_registry/get_entries",
      entity_ids: t
    });
    for (const [n, a] of Object.entries(i ?? {})) {
      const o = a?.options?.calendar?.color;
      typeof o == "string" && /^#[0-9a-fA-F]{6}$/.test(o) && (s[n] = o);
    }
  } catch {
  }
  return s;
}
function ss(e, t, s) {
  return t[e.entity] ?? je[s % je.length];
}
function is(e, t) {
  if (!t) return;
  const s = e.trim().toLowerCase();
  for (const [i, n] of Object.entries(t))
    if (i.trim().toLowerCase() === s) return n;
}
const ns = "/local/simple-schedule-card-data/event-colors.json";
async function as(e) {
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
function os(e, t, s) {
  if (e) {
    if (s && e.by_recurrence_id[s]) return e.by_recurrence_id[s];
    if (t && e.by_uid[t]) return e.by_uid[t];
  }
}
function Ye(e, t, s) {
  const i = (n) => {
    const a = n / 255;
    return a <= 0.03928 ? a / 12.92 : ((a + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * i(e) + 0.7152 * i(t) + 0.0722 * i(s);
}
function qe(e) {
  return 1.05 / (e + 0.05);
}
function dt(e, t) {
  const s = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(e);
  if (!s || !(t > 1)) return e;
  const i = parseInt(s[1], 16), n = parseInt(s[2], 16), a = parseInt(s[3], 16);
  if (qe(Ye(i, n, a)) >= t) return e;
  let o = 0, l = 1;
  for (let d = 0; d < 24; d++) {
    const p = (o + l) / 2;
    qe(Ye(i * p, n * p, a * p)) >= t ? o = p : l = p;
  }
  const r = o, h = (d) => Math.max(0, Math.min(255, Math.round(d * r))).toString(16).padStart(2, "0");
  return `#${h(i)}${h(n)}${h(a)}`;
}
function Ge(e) {
  const t = [...e].sort(
    (n, a) => n.start.getTime() - a.start.getTime() || a.end.getTime() - n.end.getTime() || n.key.localeCompare(a.key)
  ), s = [], i = /* @__PURE__ */ new Map();
  for (const n of t) {
    let a = s.findIndex((o) => o <= n.start.getTime());
    a === -1 && (a = s.length, s.push(0)), s[a] = n.end.getTime(), i.set(n.key, a);
  }
  return i;
}
function Ke(e, t, s) {
  if (t === "packed") {
    const o = e.map((r) => Ge(r));
    let l = 1;
    for (const r of o) l = Math.max(l, Xe(r) + 1);
    return {
      columns: l,
      days: e.map(
        (r, h) => r.map((d) => ({ ev: d, column: o[h].get(d.key) ?? 0 }))
      )
    };
  }
  const i = e.map((o) => {
    const l = /* @__PURE__ */ new Map();
    for (const h of o) {
      const d = l.get(h.entity);
      d ? d.push(h) : l.set(h.entity, [h]);
    }
    const r = /* @__PURE__ */ new Map();
    for (const h of l.values())
      for (const [d, p] of Ge(h)) r.set(d, p);
    return r;
  });
  let n = 1;
  for (const o of i) n = Math.max(n, Xe(o) + 1);
  const a = s.length ? s : [""];
  return {
    columns: a.length * n,
    days: e.map(
      (o, l) => o.map((r) => {
        const h = Math.max(0, a.indexOf(r.entity));
        return { ev: r, column: h * n + (i[l].get(r.key) ?? 0) };
      })
    )
  };
}
function Xe(e) {
  let t = -1;
  for (const s of e.values()) t = Math.max(t, s);
  return t;
}
const re = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"], X = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"], pt = ["MO", "TU", "WE", "TH", "FR"], ut = {
  1: "first",
  2: "second",
  3: "third",
  4: "fourth",
  [-1]: "last"
};
function rs(e) {
  const t = Math.ceil(e.getDate() / 7);
  return t >= 5 ? -1 : t;
}
function ft(e, t) {
  if (e.length !== t.length) return !1;
  const s = [...e].sort(), i = [...t].sort();
  return s.every((n, a) => n === i[a]);
}
function mt(e) {
  return [...e].sort((t, s) => X.indexOf(t) - X.indexOf(s));
}
function gt(e, t) {
  const s = re[e.getDay()], i = new Intl.DateTimeFormat(t, { weekday: "long" }).format(e), n = rs(e), a = new Intl.DateTimeFormat(t, { month: "long", day: "numeric" }).format(e), o = { kind: "never" };
  return [
    { key: "none", label: "Does not repeat", rule: null },
    { key: "daily", label: "Daily", rule: { freq: "DAILY", interval: 1, byDay: [], end: o } },
    {
      key: "weekly",
      label: `Weekly on ${i}`,
      rule: { freq: "WEEKLY", interval: 1, byDay: [s], end: o }
    },
    {
      key: "monthly",
      label: `Monthly on the ${ut[n]} ${i}`,
      rule: {
        freq: "MONTHLY",
        interval: 1,
        byDay: [],
        byPos: { pos: n, day: s },
        end: o
      }
    },
    {
      key: "yearly",
      label: `Annually on ${a}`,
      rule: { freq: "YEARLY", interval: 1, byDay: [], end: o }
    },
    {
      key: "weekdays",
      label: "Every weekday (Monday to Friday)",
      rule: { freq: "WEEKLY", interval: 1, byDay: [...pt], end: o }
    }
  ];
}
function ls(e, t) {
  return !e || !t ? e === t : e.freq !== t.freq || e.interval !== t.interval || !ft(e.byDay, t.byDay) || !!e.byPos != !!t.byPos || e.byPos && t.byPos && (e.byPos.pos !== t.byPos.pos || e.byPos.day !== t.byPos.day) || e.end.kind !== t.end.kind ? !1 : e.end.kind === "on" && t.end.kind === "on" ? e.end.date === t.end.date : e.end.kind === "after" && t.end.kind === "after" ? e.end.count === t.end.count : !0;
}
function hs(e, t, s) {
  const i = gt(t, s).find((n) => ls(n.rule, e));
  return i ? i.key : "custom";
}
function cs(e, t) {
  if (t) return e.replace(/-/g, "");
  const s = /* @__PURE__ */ new Date(`${e}T23:59:59`), i = (n) => String(n).padStart(2, "0");
  return `${s.getUTCFullYear()}${i(s.getUTCMonth() + 1)}${i(s.getUTCDate())}T${i(s.getUTCHours())}${i(s.getUTCMinutes())}${i(s.getUTCSeconds())}Z`;
}
function ds(e, t = !1) {
  const s = [`FREQ=${e.freq}`];
  return e.interval > 1 && s.push(`INTERVAL=${e.interval}`), e.freq === "WEEKLY" && e.byDay.length && s.push(`BYDAY=${mt(e.byDay).join(",")}`), e.freq === "MONTHLY" && e.byPos && s.push(`BYDAY=${e.byPos.pos}${e.byPos.day}`), e.end.kind === "on" && s.push(`UNTIL=${cs(e.end.date, t)}`), e.end.kind === "after" && s.push(`COUNT=${e.end.count}`), `RRULE:${s.join(";")}`;
}
function ps(e, t) {
  const s = mt(e).map((i) => {
    const n = X.indexOf(i);
    return new Intl.DateTimeFormat(t, { weekday: "long" }).format(new Date(2024, 0, 1 + n));
  });
  return s.length < 2 ? s.join("") : `${s.slice(0, -1).join(", ")} and ${s[s.length - 1]}`;
}
function fe(e, t, s) {
  if (!e) return "Does not repeat";
  const i = e.interval > 1 ? `Every ${e.interval} ` : "";
  let n;
  switch (e.freq) {
    case "DAILY":
      n = i ? `${i}days` : "Daily";
      break;
    case "WEEKLY": {
      const a = e.byDay.length ? e.byDay : [re[t.getDay()]];
      if (!i && ft(a, pt)) {
        n = "Every weekday (Monday to Friday)";
        break;
      }
      const o = `on ${ps(a, s)}`;
      n = i ? `${i}weeks ${o}` : `Weekly ${o}`;
      break;
    }
    case "MONTHLY": {
      const a = e.byPos ? `on the ${ut[e.byPos.pos]} ${new Intl.DateTimeFormat(s, {
        weekday: "long"
      }).format(new Date(2024, 0, 1 + X.indexOf(e.byPos.day)))}` : `on day ${t.getDate()}`;
      n = i ? `${i}months ${a}` : `Monthly ${a}`;
      break;
    }
    default: {
      const a = new Intl.DateTimeFormat(s, {
        month: "long",
        day: "numeric"
      }).format(t);
      n = i ? `${i}years` : `Annually on ${a}`;
      break;
    }
  }
  if (e.end.kind === "on") {
    const a = /* @__PURE__ */ new Date(`${e.end.date}T00:00`), o = Number.isNaN(a.getTime()) ? e.end.date : new Intl.DateTimeFormat(s, {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(a);
    return `${n}, until ${o}`;
  }
  return e.end.kind === "after" ? `${n}, ${e.end.count} time${e.end.count === 1 ? "" : "s"}` : n;
}
const us = "https://photon.komoot.io/api/", bt = 3;
function _t(e) {
  const t = [e.street, e.housenumber].filter(Boolean).join(" "), s = [e.postcode, e.city].filter(Boolean).join(" "), i = e.name || t || e.city || e.country || "", n = [];
  e.name && t && n.push(t), s && s !== i && n.push(s), e.district && !s.includes(e.district) && e.district !== i && n.push(e.district), e.country && e.country !== i && n.push(e.country);
  const a = n.join(", ");
  return { name: i, detail: a, label: a ? `${i}, ${a}` : i };
}
async function Ve(e, t = {}) {
  const s = e.trim();
  if (s.length < bt) return [];
  const i = new URLSearchParams({ q: s, limit: String(t.limit ?? 6) });
  typeof t.lat == "number" && typeof t.lon == "number" && (i.set("lat", String(t.lat)), i.set("lon", String(t.lon))), t.lang && i.set("lang", t.lang);
  try {
    const n = await fetch(`${us}?${i.toString()}`, { signal: t.signal });
    if (!n.ok) return [];
    const a = await n.json(), o = [];
    for (const l of a.features ?? []) {
      const r = l.geometry?.coordinates;
      if (!r || r.length < 2) continue;
      const { name: h, detail: d, label: p } = _t(l.properties ?? {});
      p && o.push({ label: p, name: h, detail: d, lat: r[1], lon: r[0] });
    }
    return o;
  } catch {
    return [];
  }
}
const S = 256;
function fs(e, t, s) {
  const i = S * 2 ** s, n = (t + 180) / 360 * i, o = Math.max(-85.05112878, Math.min(85.05112878, e)) * Math.PI / 180, l = (1 - Math.log(Math.tan(o) + 1 / Math.cos(o)) / Math.PI) / 2 * i;
  return { x: n, y: l };
}
function ms(e, t, s, i, n, a = "Dark") {
  const o = fs(e, t, s), l = o.x - i / 2, r = o.y - n / 2, h = 2 ** s, d = [], p = [], f = Math.floor(l / S), v = Math.floor(r / S), b = Math.floor((l + i) / S), w = Math.floor((r + n) / S);
  for (let T = v; T <= w; T++)
    if (!(T < 0 || T >= h))
      for (let O = f; O <= b; O++) {
        const Z = (O % h + h) % h, U = O * S - l, Q = T * S - r, J = "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas";
        d.push({ url: `${J}/World_${a}_Gray_Base/MapServer/tile/${s}/${T}/${Z}`, left: U, top: Q }), p.push({
          url: `${J}/World_${a}_Gray_Reference/MapServer/tile/${s}/${T}/${Z}`,
          left: U,
          top: Q
        });
      }
  return { base: d, labels: p };
}
const Ze = {
  street: {
    // World_TOPO_Map, not World_Street_Map. Compared at zoom 18 over a Czech
    // village, Street draws ONE ROAD LINE and nothing else — no buildings, no
    // street names — while Topo draws the buildings and names the streets. Esri's
    // street rendering thins out badly outside cities, which is exactly where a
    // child's after-school club is.
    //
    // NOT tile.openstreetmap.org either: their policy forbids third-party apps
    // and their servers enforce it with 403 "Access blocked", rendered as a
    // yellow hazard-striped tile. A browser cannot send an identifying
    // User-Agent, so there is no compliant way to use them.
    url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    maxNativeZoom: 19,
    attribution: "© Esri"
  }
}, gs = "/static/images/leaflet/leaflet.css";
let te = null;
function bs() {
  return te || (te = (async () => {
    const e = window;
    if (e.L) return e.L;
    if (!e.loadCardHelpers) return null;
    try {
      const s = await (await e.loadCardHelpers()).createCardElement({ type: "map", entities: [] });
      s.style.cssText = "position:absolute;left:-9999px;top:0;width:1px;height:1px;visibility:hidden", document.body.appendChild(s);
      for (let i = 0; i < 60 && !e.L; i++)
        await new Promise((n) => setTimeout(n, 50));
      return s.remove(), e.L ?? null;
    } catch {
      return null;
    }
  })(), te);
}
async function _s(e, t, s = {}) {
  const i = new URLSearchParams({ lat: String(e), lon: String(t) });
  s.lang && i.set("lang", s.lang);
  try {
    const n = await fetch(`https://photon.komoot.io/reverse?${i.toString()}`, {
      signal: s.signal
    });
    if (!n.ok) return null;
    const o = (await n.json()).features?.[0];
    if (!o) return null;
    const { name: l, detail: r, label: h } = _t(o.properties ?? {});
    if (!h) return null;
    const d = o.geometry?.coordinates;
    return {
      label: h,
      name: l,
      detail: r,
      lat: d?.[1] ?? e,
      lon: d?.[0] ?? t
    };
  } catch {
    return null;
  }
}
function ys(e, t, s) {
  return typeof t == "number" && typeof s == "number" ? `https://www.google.com/maps/search/?api=1&query=${t},${s}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e)}`;
}
var ws = Object.defineProperty, vs = Object.getOwnPropertyDescriptor, g = (e, t, s, i) => {
  for (var n = i > 1 ? void 0 : i ? vs(t, s) : t, a = e.length - 1, o; a >= 0; a--)
    (o = e[a]) && (n = (i ? o(t, s, n) : o(n)) || n);
  return i && n && ws(t, s, n), n;
};
const xs = "2.0.0", k = {
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
  animations: "auto",
  layout: "auto",
  layout_breakpoint: 560
}, Qe = 22, ks = 28, $s = 12, me = 55, Ts = 22, Es = 520, Ds = 8, Ss = 4.345, Ms = 52.18, As = 230, Cs = "cubic-bezier(0.4, 0, 1, 1)", Je = 16, Os = 0.985, se = [
  ["1", "#a4bdfc", "Lavender"],
  ["2", "#7ae7bf", "Sage"],
  ["3", "#dbadff", "Grape"],
  ["4", "#ff887c", "Flamingo"],
  ["5", "#fbd75b", "Banana"],
  ["6", "#ffb878", "Tangerine"],
  ["7", "#46d6db", "Peacock"],
  ["8", "#e1e1e1", "Graphite"],
  ["9", "#5484ed", "Blueberry"],
  ["10", "#51b749", "Basil"],
  ["11", "#dc2127", "Tomato"]
], B = 44, Ps = 5;
function M(e) {
  const t = (s) => String(s).padStart(2, "0");
  return {
    date: `${e.getFullYear()}-${t(e.getMonth() + 1)}-${t(e.getDate())}`,
    time: `${t(e.getHours())}:${t(e.getMinutes())}`
  };
}
function Ls(e) {
  const t = /* @__PURE__ */ new Date(`${e}T00:00`);
  return t.setDate(t.getDate() + 1), M(t).date;
}
const et = 520, tt = 10, le = 15, ge = 30;
function Is(e) {
  return Math.max(0, Math.floor(e / le) * le);
}
function be(e) {
  return { axis: "y", start: e, span: 0, kind: "label", ghost: () => "" };
}
const zs = 64, Rs = 20, Ns = 172, Ws = 18, st = {
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
}, Fs = 600, Us = 12e3, Hs = 2200, Bs = 56, js = 190, Ys = 6e3, qs = 700, Gs = 120;
let m = class extends Y {
  constructor() {
    super(...arguments), this._sources = [], this._colors = {}, this._eventColors = null, this._weekOffset = 0, this._now = /* @__PURE__ */ new Date(), this._hostWidth = 0, this._refreshing = !1, this._navDir = "none", this._activeIdx = 0, this._motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)"), this._onMotionChange = () => {
      this.requestUpdate();
    }, this._navAnims = [], this._staleAnims = [], this._modeOverride = {}, this._pickerOpen = !1, this._animEpoch = 0, this._hThumb = null, this._axisPx = 0, this._editMode = !1, this._menuOpen = !1, this._draft = null, this._scope = "instance", this._busy = !1, this._editError = null, this._confirmDelete = !1, this._press = null, this._pressFrom = null, this._openPicker = null, this._pickerMonth = null, this._pickerClosing = null, this._pickerOutField = null, this._flipFrom = null, this._calDir = 0, this._calEpoch = 0, this._detailsOpen = !1, this._colorOpen = !1, this._repeatOpen = !1, this._customOpen = !1, this._custom = null, this._customClosing = !1, this._endsOpen = !1, this._places = [], this._placesBusy = !1, this._mapOpen = !1, this._mapPoint = null, this._baseMap = "street", this._baseLayers = [], this._leafletMap = null, this._leafletMarker = null, this._mapPickSeq = 0, this._mapWanted = !1, this._leaflet = null, this._leafletOk = !1, this._flash = 0, this._flashOut = !1, this._wheelsPending = !1, this._revision = 0, this._subs = new es(() => {
      this._revision++;
    }), this._colorKey = "", this._focusPx = 0, this._focusKey = "", this._focusBusy = !1, this._colorsAt = 0, this._eventColorsAt = 0, this._eventColorsPending = !1, this._onMenuOutside = (e) => {
      const t = this.renderRoot?.querySelector(".tools-menu-wrap");
      t && e.composedPath().includes(t) || this._setMenu(!1);
    }, this._onMenuKey = (e) => {
      e.key === "Escape" && this._setMenu(!1);
    }, this._onPressMove = (e) => {
      const t = this._pressFrom;
      t && (Math.abs(e.clientX - t.x) > tt || Math.abs(e.clientY - t.y) > tt) && this._pressCancel();
    }, this._onPressEnd = () => {
      this._pressCancel();
    }, this._rubberFrom = null, this._rubberAt = 0, this._onOutside = (e) => {
      const t = this.renderRoot?.querySelector(".picker");
      t && e.composedPath().includes(t) || this._setPicker(!1);
    }, this._onPickerKey = (e) => {
      e.key === "Escape" && this._setPicker(!1);
    }, this._barDrag = null, this._wheelTimers = {};
  }
  setConfig(e) {
    if (!e) throw new Error("simple-schedule-card: invalid configuration");
    const t = Ks(e);
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
      ...k
    };
  }
  connectedCallback() {
    super.connectedCallback(), this._tick = setInterval(() => {
      this._now = /* @__PURE__ */ new Date();
    }, 6e4), this._hostRo = new ResizeObserver((e) => {
      const t = Math.round(e[e.length - 1].contentRect.width);
      t && t !== this._hostWidth && (this._hostWidth = t);
    }), this._hostRo.observe(this), this._motionQuery.addEventListener("change", this._onMotionChange);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._tick && clearInterval(this._tick), this._tick = void 0, this._spinTimer && clearTimeout(this._spinTimer), this._spinTimer = void 0, this._hostRo?.disconnect(), this._hostRo = void 0, this._motionQuery.removeEventListener("change", this._onMotionChange), this._setPicker(!1), this._setMenu(!1), this._pressCancel(), this._subs.stop();
  }
  updated(e) {
    if (super.updated(e), this._staleAnims.length) {
      for (const t of this._staleAnims) t.cancel();
      this._staleAnims = [];
    }
    this._wheelsPending && (this._wheelsPending = !1, this._positionWheels()), this._animatePicker(), this._flipPlay(), this._syncLeaflet(), !(!this.hass || !this._config) && (this._orientation === "days-as-rows" && (this._measureScrollbar(), this._focusScroller()), this._ensureSubscribed(), this._ensureColors(), this._ensureEventColors());
  }
  /**
   * The week to draw. The window is ALWAYS the full seven days — that is what is
   * subscribed to — and only the day list is trimmed, so `auto` can look at the
   * weekend before deciding whether to show it.
   */
  get _window() {
    const e = pe(this._now, this._weekOffset, 7), t = this._config?.days ?? k.days;
    let s = 5;
    return (t === "mon-sun" || t === "auto" && Jt(this._activeEvents, e.days)) && (s = 7), { start: e.start, end: e.end, days: e.days.slice(0, s) };
  }
  get _entityIds() {
    return this._sources.map((e) => e.entity);
  }
  /** Events of the calendar currently on screen. */
  get _activeEvents() {
    const e = this._sources[Math.min(this._activeIdx, this._sources.length - 1)]?.entity;
    return this._subs.events.filter((t) => t.entity === e);
  }
  /**
   * What is SUBSCRIBED: three weeks — the one on screen and one either side.
   *
   * Stepping a week then re-subscribes to a window that still overlaps most of
   * the last one, and the subscription cache keeps whatever falls outside it, so
   * the week being stepped onto is already drawn before its own push arrives.
   * With a one-week window there was nothing cached for it at all, and clicking
   * through weeks quickly showed a second or two of empty calendar each time.
   *
   * Everything that reasons about ONE week filters by day (eventsForDay) or by
   * range, so the wider window never widens what is drawn.
   */
  get _subWindow() {
    return {
      start: pe(this._now, this._weekOffset - 1, 7).start,
      end: pe(this._now, this._weekOffset + 1, 7).end
    };
  }
  async _ensureSubscribed() {
    const e = this._subWindow;
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
    !e && t === this._colorKey && !s || (this._colorKey = t, this._colorsAt = Date.now(), this._colors = await ts(this.hass, this._entityIds));
  }
  /** The colour of a whole calendar — used by the legend. */
  /**
   * True whenever something is layered in front of the schedule — the calendar
   * menu or an event's detail sheet. Both recede the grid the same way, so the
   * card has one behaviour for "there is something on top of this" rather than
   * two that drift apart.
   */
  /**
   * Is the schedule standing back behind something?
   *
   * The overflow menu counts, exactly as the calendar picker does. Both are
   * menus that open over the week, and only one of them used to push the week
   * away — so opening the other one left the schedule sitting at full strength
   * behind a floating panel, which is the thing that read as "no animation".
   */
  get _receded() {
    return this._pickerOpen || this._menuOpen || !!this._selected || !!this._draft;
  }
  /** Close the detail sheet, replaying the entry cascade as the menu does. */
  _closeSheet() {
    this._selected && (this._selected = void 0, this._animEpoch++);
  }
  /* ------------------------------------------------------------------ *
   * Editing.
   *
   * Every write goes through pyscript/simple_schedule_edit.py, because Home
   * Assistant itself cannot change a Google event: the integration declares
   * CREATE and DELETE only, so core's calendar/event/update refuses. That
   * file's header has the whole of why.
   * ------------------------------------------------------------------ */
  /**
   * Google's own id for an event, which is what the edit services take.
   *
   * A recurring occurrence has a recurrence_id — `<master>_<utc stamp>` — and
   * that IS the id. A one-off has none, and its id is the uid with Google's
   * suffix taken off. Checked against a real calendar both ways round.
   */
  _googleId(e) {
    return e.recurrenceId ? e.recurrenceId : e.uid ? e.uid.replace(/@google\.com$/i, "") : null;
  }
  _isRecurring(e) {
    return !!e.recurrenceId && e.recurrenceId.includes("_");
  }
  _setMenu(e) {
    e !== this._menuOpen && (this._menuOpen = e, e || this._animEpoch++, e ? (document.addEventListener("pointerdown", this._onMenuOutside, !0), document.addEventListener("keydown", this._onMenuKey, !0)) : (document.removeEventListener("pointerdown", this._onMenuOutside, !0), document.removeEventListener("keydown", this._onMenuKey, !0)));
  }
  _toggleEditMode() {
    this._setMenu(!1), this._editMode = !this._editMode, this._editMode || this._closeEditor(), this._reducedMotion || (this._flashOut = !this._editMode, this._flash++);
  }
  /**
   * The palette id matching an event's current colour, or '' for the default.
   *
   * The colour helper publishes hex, not ids, so this maps back through Google's
   * own palette — which is where the helper got those hexes from, so the match
   * is exact rather than nearest.
   */
  _colorIdFor(e) {
    const t = this._eventColors;
    if (!t) return "";
    const s = (e.recurrenceId ? t.by_recurrence_id?.[e.recurrenceId] : void 0) ?? (e.uid ? t.by_uid?.[e.uid] : void 0);
    if (!s) return "";
    const i = se.find(([, n]) => n.toLowerCase() === s.toLowerCase());
    return i ? i[0] : "";
  }
  /** Build the form from an event. */
  _openEditor(e) {
    const t = this._googleId(e);
    if (!t) {
      this._editError = "This event has no id Google would recognise.";
      return;
    }
    const s = M(e.start), i = M(e.end);
    this._draft = {
      key: e.key,
      entity: e.entity,
      eventId: t,
      isNew: !1,
      recurring: this._isRecurring(e),
      summary: e.summary,
      startDate: s.date,
      startTime: s.time,
      endDate: i.date,
      endTime: i.time,
      location: e.location ?? "",
      description: e.description ?? "",
      allDay: e.allDay,
      colorId: this._colorIdFor(e),
      // Not offered when editing: changing a rule on a live series is a
      // different operation from setting one, with the scope question tangled
      // into it. The form hides the row rather than showing one that lies.
      repeat: null
    }, this._openPicker = null, this._pickerClosing = null, this._pickerMonth = null, this._detailsOpen = !!(e.location || e.description), this._colorOpen = !1, this._places = [], this._mapOpen = !1, this._mapPoint = null, this._scope = "instance", this._editError = null, this._confirmDelete = !1;
  }
  /**
   * The same form, empty, for an event that does not exist yet.
   *
   * It lands on the calendar currently on screen. That is the one being looked
   * at, the one whose colour the sheet takes, and the only one the card can
   * name — a calendar chooser inside the sheet would be a second picker
   * answering a question the header has already answered.
   */
  _openCreator(e, t = ge) {
    const s = this._active?.entity;
    if (!s) return;
    const i = M(e), n = M(new Date(e.getTime() + t * 6e4));
    this._selected = void 0, this._draft = {
      key: `new:${e.getTime()}`,
      entity: s,
      eventId: "",
      isNew: !0,
      // "recurring" is about the event on Google, which this one is not yet; it
      // is what puts the scope question on the EDIT form. A repeat rule set here
      // is carried in `repeat` and applies from the moment it is created.
      recurring: !1,
      summary: "",
      startDate: i.date,
      startTime: i.time,
      endDate: n.date,
      endTime: n.time,
      location: "",
      description: "",
      allDay: !1,
      colorId: "",
      repeat: null
    }, this._openPicker = null, this._pickerClosing = null, this._pickerMonth = null, this._detailsOpen = !1, this._colorOpen = !1, this._repeatOpen = !1, this._cancelCustom(), this._places = [], this._mapOpen = !1, this._mapPoint = null, this._scope = "instance", this._editError = null, this._confirmDelete = !1;
  }
  /**
   * What the + button means by "now": the next slot on the snap grid.
   *
   * UP, where a press on the grid rounds down. A press names a slot and gets
   * that slot; the + names no time at all, and starting an event a quarter of
   * an hour in the past is a worse guess than starting it at the next one.
   */
  get _nowSlot() {
    const e = new Date(this._now);
    return e.setSeconds(0, 0), e.setMinutes(Math.ceil(e.getMinutes() / le) * le), e;
  }
  /** The same moment as minutes from midnight, which is what a day label takes. */
  get _nowMinutes() {
    const e = this._nowSlot;
    return e.getHours() * 60 + e.getMinutes();
  }
  /**
   * Begin a press-and-hold on empty space.
   *
   * Only in edit mode. The grid is also what a tablet gets held by, and in the
   * default view-only mode a press has to stay inert — a kiosk on a wall must
   * not be able to put an event in somebody's calendar by being leant on.
   *
   * Two surfaces offer it. A press on the TIMELINE claims the slot under the
   * finger; a press on a DAY LABEL claims the day at the current clock time.
   * They share a day index, which is why the press records which kind it is —
   * without that, pressing the label lit the row beside it as well.
   */
  _pressStart(e, t, s, i) {
    if (this._pressCancel(), !this._editMode || this._draft || e.button !== 0 || e.target?.closest(".ev, .lr:not(.empty)")) return;
    const n = e.currentTarget.getBoundingClientRect(), a = i.axis === "x" ? n.width : n.height;
    if (a <= 0) return;
    const o = i.axis === "x" ? e.clientX - n.left : e.clientY - n.top, l = Math.min(1, Math.max(0, o / a)), { from: r, to: h } = this._fitSlot(t, i.start + l * i.span);
    this._pressFrom = { x: e.clientX, y: e.clientY }, this._press = {
      idx: s,
      kind: i.kind,
      style: `${i.ghost(r, Math.min(h, i.start + i.span))};
              animation-duration:${et}ms`
    };
    const d = new Date(N(t).getTime() + r * 6e4), p = h - r;
    window.addEventListener("pointermove", this._onPressMove, !0), window.addEventListener("pointerup", this._onPressEnd, !0), window.addEventListener("pointercancel", this._onPressEnd, !0), window.addEventListener("scroll", this._onPressEnd, !0), this._pressTimer = setTimeout(() => {
      this._pressTimer = void 0, this._press = null, this._pressCancel(), this._openCreator(d, p);
    }, et);
  }
  /**
   * The slot a press actually claims, once the events around it are taken in.
   *
   * Half an hour by default, but a timetable is mostly gaps of five and fifteen
   * minutes, and an event that spills over the lesson after it is wrong in a way
   * that takes a trip to Google to undo. So the end is cut at whatever starts
   * next, and — just as important — the START is held at whatever ended last:
   * snapping to the quarter hour alone would push a press in the 9:15-9:30 gap
   * back to 9:15 and into the lesson before it when that ran to 9:20.
   */
  _fitSlot(e, t) {
    const s = N(e).getTime(), i = this._active?.entity;
    let n = 0, a = 24 * 60;
    for (const r of this._subs.events) {
      if (r.entity !== i || r.allDay) continue;
      const h = I(r.start, s), d = I(r.end, s);
      d <= t && d > n && (n = d), h > t && h < a && (a = h);
    }
    const o = Math.max(Is(t), n), l = a - o;
    return { from: o, to: o + (l > 0 ? Math.min(ge, l) : ge) };
  }
  _pressCancel() {
    this._pressTimer && clearTimeout(this._pressTimer), this._pressTimer = void 0, this._pressFrom = null, this._press && (this._press = null), window.removeEventListener("pointermove", this._onPressMove, !0), window.removeEventListener("pointerup", this._onPressEnd, !0), window.removeEventListener("pointercancel", this._onPressEnd, !0), window.removeEventListener("scroll", this._onPressEnd, !0);
  }
  _closeEditor() {
    this._selected || this._animEpoch++, this._draft = null, this._editError = null, this._confirmDelete = !1, this._busy = !1, this._openPicker = null, this._pickerClosing = null, this._pickerMonth = null, this._cancelCustom(), this._closeSheet();
  }
  /**
   * Collapse the open picker, letting the exit play.
   *
   * Everything that closes a picker while the FORM stays open goes through
   * here. The teardown paths — closing the editor, closing the window — clear
   * both fields instead, because there is nothing left to animate against.
   */
  _closePicker() {
    this._openPicker && (this._pickerClosing = this._openPicker, this._openPicker = null);
  }
  /** Open one inline picker, closing whichever was open. iOS shows one at a time. */
  _togglePicker(e) {
    if (this._confirmDelete = !1, this._openPicker === e) {
      this._closePicker();
      return;
    }
    this._pickerClosing = this._openPicker === e ? null : this._openPicker, this._openPicker = e, this._calDir = 0;
    const t = e === "untilDate" ? this._custom?.end.kind === "on" ? this._custom.end.date : "" : this._draft?.[e] ?? "";
    if (e !== "startTime" && e !== "endTime") {
      const [s, i] = t.split("-").map(Number);
      this._pickerMonth = { y: s || (/* @__PURE__ */ new Date()).getFullYear(), m: (i || 1) - 1 };
    }
    this._wheelsPending = !0;
  }
  /**
   * Keep the end after the start when the start moves.
   *
   * Picking a start later than the end is the single easiest mistake to make in
   * a form like this, and a validation error afterwards is a worse answer than
   * simply carrying the end along — which is what every calendar app does.
   */
  _patchStart(e) {
    const t = this._draft;
    if (!t) return;
    const s = (/* @__PURE__ */ new Date(`${t.startDate}T${t.startTime || "00:00"}`)).getTime(), i = (/* @__PURE__ */ new Date(`${t.endDate}T${t.endTime || "00:00"}`)).getTime(), n = Number.isFinite(s) && Number.isFinite(i) ? i - s : 0, a = { ...t, ...e }, o = (/* @__PURE__ */ new Date(`${a.startDate}T${a.startTime || "00:00"}`)).getTime();
    if (n > 0 && Number.isFinite(o)) {
      const l = new Date(o + n), r = M(l);
      a.endDate = r.date, a.endTime = r.time;
    }
    this._draft = a, this._confirmDelete = !1;
  }
  /**
   * Tapping an event: read it, or edit it.
   *
   * One entry point for all five places an event can be tapped — two grids, the
   * list, the all-day strip — so the mode can never be honoured in some of them
   * and not others.
   */
  _pickEvent(e) {
    this._selected = e, this._editMode && this._openEditor(e);
  }
  _patchDraft(e) {
    this._draft && (this._draft = { ...this._draft, ...e }, this._confirmDelete = !1);
  }
  /**
   * Call one of the pyscript services and report what came back.
   *
   * pyscript raises on failure and Home Assistant turns that into a rejected
   * call, so an error here is the real reason rather than a guess. It is shown
   * in the form instead of being thrown away, because the alternative is a Save
   * button that silently does nothing.
   */
  async _callEdit(e, t) {
    this._busy = !0, this._editError = null;
    try {
      return await this.hass.callService("pyscript", e, t), !0;
    } catch (s) {
      const i = s?.message ?? String(s);
      return this._editError = i.replace(/^[\s\S]*ValueError:\s*/, "").slice(0, 300), !1;
    }
  }
  /** The scope to send: meaningless for a one-off, so pinned to the occurrence. */
  get _sendScope() {
    return this._draft?.recurring ? this._scope : "instance";
  }
  /**
   * Everything the card is currently DRAWING, as one string.
   *
   * Compared before and after a write to tell whether the change has arrived.
   * It carries the fields the form can change — including colour, so that a
   * colour-only edit is noticed too — and nothing else, because anything else
   * would make it change for reasons that have nothing to do with this write.
   */
  _viewFingerprint() {
    const e = this._active?.entity, t = this._window;
    return this._subs.events.filter((s) => s.entity === e && s.start < t.end && s.end > t.start).map(
      (s) => [
        s.key,
        s.summary,
        s.start.getTime(),
        s.end.getTime(),
        s.allDay,
        s.location ?? "",
        s.description ?? "",
        this._colorForEvent(s)
      ].join("|")
    ).sort().join(`
`);
  }
  /**
   * Hold on until the week on screen reflects the write that just happened.
   *
   * Re-fetches on a slow beat and looks on a fast one, because the two are
   * different questions: Google may not have propagated yet (so ask again), and
   * a push may still be in flight (so look again). Gives up after
   * WRITE_SETTLE_MAX_MS — the write itself succeeded either way, and a form
   * that will not close is worse than one that closes a moment early.
   */
  async _settleAfterWrite(e, t) {
    if (!this.hass) return;
    const s = Date.now() + Ys;
    let i = 0;
    for (; Date.now() < s; ) {
      if (Date.now() >= i) {
        i = Date.now() + qs;
        const n = this._subWindow;
        await this._subs.forceUpdate(this.hass, this._entityIds), await this._subs.sync(this.hass, this._entityIds, n.start, n.end, !0), t && (await this._subs.refreshColorHelper(this.hass), await this._ensureEventColors(!0));
      }
      if (await new Promise((n) => setTimeout(n, Gs)), this._viewFingerprint() !== e) return;
    }
  }
  /**
   * The thing that actually scrolls inside a draggable surface.
   *
   * The edit sheet scrolls itself; the custom-recurrence window scrolls its
   * body, and it is the WINDOW that should move when the body has nowhere to
   * go — a body sliding under its own header looks like a broken layout.
   */
  _dragScroller(e) {
    return e.querySelector(".rec-body") ?? e;
  }
  _onDragStart(e) {
    this._rubberFrom = e.touches.length === 1 ? e.touches[0].clientY : null;
  }
  _onDragMove(e) {
    const t = this._rubberFrom;
    if (t === null || e.touches.length !== 1) return;
    const s = e.currentTarget, i = this._dragScroller(s), n = e.touches[0].clientY - t, a = i.scrollHeight - i.clientHeight;
    if (!(a <= 1 || n > 0 && i.scrollTop <= 0 || n < 0 && i.scrollTop >= a - 1)) {
      this._rubberAt && this._setRubber(s, 0, !0);
      return;
    }
    e.cancelable && e.preventDefault();
    const l = Bs * (1 - Math.exp(-Math.abs(n) / js));
    this._setRubber(s, Math.sign(n) * l, !1);
  }
  _onDragEnd(e) {
    this._rubberFrom = null, this._rubberAt && this._setRubber(e.currentTarget, 0, !0);
  }
  /**
   * Written straight to the element, not through state.
   *
   * This runs on every touchmove; re-rendering the whole card sixty times a
   * second to move one box by a few pixels is not a trade worth making.
   */
  _setRubber(e, t, s) {
    this._rubberAt = t, e.classList.toggle("springing", s), e.style.setProperty("--rubber", `${t}px`);
  }
  /** Whether this save moves the colour, which needs the helper to re-run. */
  _colourMoved(e) {
    const t = this._selected ? this._colorIdFor(this._selected) : "";
    return e.colorId !== t;
  }
  async _saveDraft() {
    const e = this._draft;
    if (!e || this._busy) return;
    if (!e.summary.trim()) {
      this._editError = "A title is required.";
      return;
    }
    const t = e.allDay && e.endDate <= e.startDate ? Ls(e.startDate) : e.endDate, s = e.allDay ? e.startDate : `${e.startDate} ${e.startTime}:00`, i = e.allDay ? t : `${e.endDate} ${e.endTime}:00`;
    if (!e.allDay && new Date(s.replace(" ", "T")) >= new Date(i.replace(" ", "T"))) {
      this._editError = "The end has to come after the start.";
      return;
    }
    const n = {
      entity_id: e.entity,
      summary: e.summary.trim(),
      start: s,
      end: i,
      all_day: e.allDay,
      location: e.location,
      description: e.description,
      // Omitted entirely when unset: sending an empty colour is not the same as
      // not mentioning it, and only one of those leaves the calendar's own
      // colour alone.
      ...e.colorId ? { color_id: e.colorId } : {}
    }, a = this._viewFingerprint();
    let o = !1;
    try {
      o = e.isNew ? await this._callEdit("simple_schedule_event_create", {
        ...n,
        // Only when there is one: the service reads a present rrule as "set
        // the recurrence", and an empty string would mean "clear it".
        ...e.repeat ? { rrule: ds(e.repeat, e.allDay) } : {}
      }) : await this._callEdit("simple_schedule_event_update", {
        ...n,
        event_id: e.eventId,
        scope: this._sendScope
      }), o && await this._settleAfterWrite(a, this._colourMoved(e));
    } finally {
      this._busy = !1;
    }
    o && this._closeEditor();
  }
  /** First press arms, second press deletes. Destructive and one-way. */
  async _deleteDraft() {
    const e = this._draft;
    if (!e || this._busy || e.isNew) return;
    if (!this._confirmDelete) {
      this._confirmDelete = !0;
      return;
    }
    const t = this._viewFingerprint();
    let s = !1;
    try {
      s = await this._callEdit("simple_schedule_event_delete", {
        entity_id: e.entity,
        event_id: e.eventId,
        scope: this._sendScope
      }), s && await this._settleAfterWrite(t, !1);
    } finally {
      this._busy = !1;
    }
    s && this._closeEditor();
  }
  /** Alternating keyframe name — see _animEpoch. */
  get _evAnim() {
    return this._animEpoch % 2 ? "evInB" : "evIn";
  }
  get _minContrast() {
    const e = this._config?.min_contrast;
    return typeof e == "number" ? e : k.min_contrast;
  }
  /** URL of the pyscript helper's output, or null when it is switched off. */
  get _helperUrl() {
    const e = this._config?.color_helper;
    return e === !1 ? null : typeof e == "string" && e ? e : ns;
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
        this._eventColors = await as(t), this._eventColorsAt = Date.now();
      } finally {
        this._eventColorsPending = !1;
      }
    }
  }
  _colorFor(e) {
    const t = this._sources.findIndex((i) => i.entity === e), s = this._sources[t] ?? { entity: e };
    return ss(s, this._colors, t < 0 ? 0 : t);
  }
  /**
   * The colour of one block, most specific first: an explicit `event_colors`
   * title match, then Google's own per-event colour via the helper, then the
   * calendar's colour.
   */
  _colorForEvent(e) {
    return is(e.summary, this._config?.event_colors) ?? os(this._eventColors, e.uid, e.recurrenceId) ?? this._colorFor(e.entity);
  }
  /** The calendar's own name, as Home Assistant has it. Never a configured one. */
  _nameFor(e) {
    return Xs(this.hass?.states?.[e]?.attributes?.friendly_name ?? e);
  }
  /**
   * The active calendar, with any header-toggle override folded in. Every read
   * of calendar_mode and view_width_mode goes through here, so overriding at
   * this one point reaches the axis, the lane packing and both renderers
   * without any of them knowing the modes can be changed at runtime.
   */
  get _active() {
    const e = this._sources[Math.min(this._activeIdx, this._sources.length - 1)];
    if (!e) return e;
    const t = this._modeOverride[e.entity];
    return t ? { ...e, ...t } : e;
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
  _toggleMode(e) {
    const t = this._sources[Math.min(this._activeIdx, this._sources.length - 1)];
    if (!t) return;
    const s = this._active, i = e === "calendar_mode" ? { calendar_mode: s.calendar_mode === "full" ? "focused" : "full" } : {
      view_width_mode: s.view_width_mode === "adaptive" ? "fixed" : "adaptive"
    };
    this._modeOverride = {
      ...this._modeOverride,
      [t.entity]: { ...this._modeOverride[t.entity], ...i }
    }, this._animEpoch++;
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
    if (this._setPicker(!1), e === this._activeIdx) return;
    const t = e > this._activeIdx ? "fwd" : "back";
    this._navigate(t, () => {
      this._activeIdx = e;
    });
  }
  _goWeek(e) {
    this._navigate(e > 0 ? "fwd" : "back", () => {
      this._weekOffset += e;
    });
  }
  _goToday() {
    if (this._weekOffset === 0) return;
    const e = this._weekOffset > 0 ? "back" : "fwd";
    this._navigate(e, () => {
      this._weekOffset = 0;
    });
  }
  /* ------------------------------------------------------------------ *
   * Changing week, in two halves.
   *
   * The week leaving FADES AND FOLDS AWAY first, and only then is the new one
   * built and brought in, cell by cell. One half on its own is what made this
   * read as "basic" - the CSS `.dir-*` rules bring a week in, but nothing ever
   * saw the old one go, so the change was a 28px nudge over content that had
   * already been swapped underneath it.
   *
   * The out half has to be imperative: the old week's DOM stops existing the
   * moment the state changes, so it cannot be animated by a rule that only
   * applies after the render.
   * ------------------------------------------------------------------ */
  /**
   * Whether this card should hold still.
   *
   * Follows the OPERATING SYSTEM by default, which is why an identical card can
   * animate on one machine and not on another: Windows' Settings > Accessibility
   * > Visual effects > Animation effects, and macOS' Reduce Motion, are both
   * reported to the browser as `prefers-reduced-motion: reduce`, and that used
   * to silence every animation here with no way to say otherwise. `animations`
   * is that way — see the option's docs.
   *
   * Read through a getter rather than cached because the OS setting can be
   * flipped while the page is open; _motionQuery re-renders when it is.
   */
  get _reducedMotion() {
    const e = this._config?.animations ?? k.animations;
    return e === "always" ? !1 : e === "off" ? !0 : this._motionQuery.matches;
  }
  /**
   * Exactly the elements the CSS `.dir-fwd` / `.dir-back` rules bring back in.
   *
   * The week range is one of them. It names the week being shown, so leaving it
   * to swap its text under a schedule that fades and slides made it the one part
   * of the card that jump-cut.
   */
  get _contentEls() {
    return Array.from(
      this.renderRoot?.querySelectorAll(
        ".range, .list, .rgrid .rframe, .grid .body, .grid .hdr"
      ) ?? []
    );
  }
  /**
   * Commit a navigation whose fade-out is still running.
   *
   * Clicking an arrow twice quickly must step two weeks, not one. The pending
   * change is applied at once and the new one starts its own fade, so the second
   * click is never swallowed by the first click's animation.
   */
  _flushNav() {
    const e = this._navApply;
    e && e();
  }
  _navigate(e, t) {
    this._flushNav(), this._selected = void 0;
    const s = () => {
      this._navApply = void 0, this._staleAnims.push(...this._navAnims), this._navAnims = [], t(), this._navDir = e, this._animEpoch++;
    }, i = this._contentEls;
    if (this._reducedMotion || !i.length) {
      s();
      return;
    }
    const n = e === "fwd" ? -Je : Je;
    this._navApply = s, this._navAnims = i.map(
      (o) => o.animate(
        [
          { opacity: "1", transform: "none" },
          { opacity: "0", transform: `translateX(${n}px) scale(${Os})` }
        ],
        { duration: As, easing: Cs, fill: "forwards" }
      )
    ), this._navAnims[this._navAnims.length - 1].finished.then(() => this._flushNav()).catch(() => {
    });
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
    }, Us);
    try {
      await this._subs.forceUpdate(this.hass, this._entityIds), await new Promise((i) => setTimeout(i, Hs)), await this._subs.refreshColorHelper(this.hass);
      const s = this._subWindow;
      this._subs.clear(), await Promise.all([
        this._subs.sync(this.hass, this._entityIds, s.start, s.end, !0),
        this._ensureColors(!0),
        this._ensureEventColors(!0)
      ]);
    } finally {
      clearTimeout(t);
      const s = Math.max(0, Fs - (Date.now() - e));
      this._spinTimer = setTimeout(() => {
        this._refreshing = !1;
      }, s);
    }
  }
  render() {
    if (!this._config || !this.hass) return u;
    const e = this._config, t = this._window, s = this._active?.entity, i = this._subs.events.filter(
      (l) => l.entity === s && l.start < t.end && l.end > t.start
    ), n = i.filter((l) => !l.allDay), a = Zt(n, e.day_start ?? k.day_start, e.day_end ?? k.day_end), o = this._mode === "list";
    return c`
      <ha-card>
        <div
          class="panel ${o ? "narrow" : ""} ${this._reducedMotion ? "reduce" : ""} ${this._flash ? this._flashOut ? "flash-out" : "flash" : ""}"
        >
          ${this._renderHead(t.days)}
          ${o ? this._renderList(t.days, i) : this._renderGrid(t.days, i, a)}
        </div>
        ${this._renderSheet()}
        <!-- The one-shot wash on entering edit mode. Keyed on a counter so a
             second entry re-runs it: an animation only restarts when the
             element is new, and this element is otherwise identical. -->
        ${this._flash ? c`<div
              class="mode-flash ${this._flashOut ? "out" : ""}"
              .key=${this._flash}
              @animationend=${() => this._flash = 0}
            ></div>` : u}
      </ha-card>
    `;
  }
  /** Config pins the layout; 'auto' picks by the card's own measured width. */
  get _mode() {
    const e = this._config?.layout ?? k.layout;
    if (e === "grid" || e === "list") return e;
    const t = this._config?.layout_breakpoint ?? k.layout_breakpoint;
    return this._hostWidth > 0 && this._hostWidth < t ? "list" : "grid";
  }
  /**
   * How far the week on screen is from the current one, in words.
   *
   * ALWAYS returns something. It used to go blank past one week either side, on
   * the reasoning that the date range said it better — but the list layout drops
   * the range entirely, so the pill became the only thing naming the week and a
   * blank pill left nothing at all.
   *
   * The unit coarsens as the distance grows, because "In 34 Weeks" is a number
   * to be decoded rather than read. Weeks up to WEEKS_BEFORE_MONTHS, then
   * months, then years once the month count would reach twelve.
   */
  get _weekLabel() {
    const e = this._weekOffset;
    if (e === 0) return "This Week";
    const t = e > 0, s = Math.abs(e);
    if (s === 1) return t ? "Next Week" : "Last Week";
    let i = s, n = "Week";
    s > Ds && (i = Math.round(s / Ss), n = "Month", i >= 12 && (i = Math.round(s / Ms), n = "Year"));
    const a = `${i} ${n}${i === 1 ? "" : "s"}`;
    return t ? `In ${a}` : `${a} Ago`;
  }
  /** Avatar, or the calendar's initial on its own colour when there is none. */
  _renderAvatar(e) {
    const t = this._avatarFor(e);
    if (t) return c`<img class="av" src=${t} alt="" />`;
    const s = dt(this._colorFor(e.entity), this._minContrast), i = (this._nameFor(e.entity).trim()[0] ?? "?").toUpperCase();
    return c`<span class="av init" style="background:${s}">${i}</span>`;
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
    return c`
      <div class="picker">
        <button
          class="pick-btn ${t ? "" : "static"}"
          ?disabled=${!t}
          aria-haspopup=${t ? "listbox" : u}
          aria-expanded=${t ? this._pickerOpen ? "true" : "false" : u}
          @click=${() => {
      t && this._setPicker(!this._pickerOpen);
    }}
        >
          ${this._renderAvatar(s)}
          <span class="pick-name">${this._nameFor(s.entity)}</span>
          ${t ? c`<ha-icon
                class="pick-chev ${this._pickerOpen ? "open" : ""}"
                icon="mdi:chevron-down"
              ></ha-icon>` : u}
        </button>
        <div class="pick-menu ${this._pickerOpen ? "open" : ""}" role="listbox">
          ${e.map(
      (i, n) => c`
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
    const t = this._config, s = this._subs.failed, n = this._mode === "list" || !e.length ? "" : `${this._fmtDate(e[0])} – ${this._fmtDate(e[e.length - 1])}`;
    return c`
      <div class="head">
        <div class="titles">
          ${this._renderPicker()}
          <!-- Both only in edit mode, and both in the same breath: the pill says
               the card is armed, and the + is the one thing that mode offers
               which pressing the grid cannot reach on a phone, where the list
               layout has no timeline to press. -->
          ${this._editMode ? c`
                <span class="pill edit-pill">Edit Mode</span>
                <button
                  class="pill add-pill"
                  aria-label="Add event"
                  title="Add event"
                  @click=${() => this._openCreator(this._nowSlot)}
                >
                  <ha-icon icon="mdi:plus"></ha-icon>
                </button>
              ` : u}
        </div>
        ${this._renderModeToggles()}
        <div class="head-right">
          <div class="tools">
          ${s.length ? c`<div class="warn" title=${s.join(", ")}>
                <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
              </div>` : u}
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
          ${t.show_refresh ?? k.show_refresh ? this._renderToolsMenu() : u}
          </div>
          <div class="range dir-${this._navDir}">
            ${n}<span class="pill">${this._weekLabel}</span>
          </div>
        </div>
      </div>
    `;
  }
  /**
   * The overflow menu, in the slot the refresh button used to hold on its own.
   *
   * Refresh moved INTO it rather than sitting beside it: the header already
   * carries four buttons on a phone, and a fifth for a mode that is used once in
   * a while would have cost the calendar name the width it needs. The button
   * still spins while a refresh runs, so the feedback did not move with it.
   */
  _renderToolsMenu() {
    const e = this._menuOpen;
    return c`
      <div class="tools-menu-wrap">
        <button
          class="btn ${this._refreshing ? "spin" : ""} ${e ? "on" : ""}"
          aria-haspopup="menu"
          aria-expanded=${e ? "true" : "false"}
          aria-label="More"
          @click=${() => this._setMenu(!e)}
        >
          <ha-icon icon=${this._refreshing ? "mdi:refresh" : "mdi:dots-horizontal"}></ha-icon>
        </button>
        <div class="pick-menu menu-right ${e ? "open" : ""}" role="menu">
          <button
            class="pick-item"
            role="menuitem"
            @click=${() => {
      this._setMenu(!1), this._refresh();
    }}
          >
            <ha-icon icon="mdi:refresh"></ha-icon>
            <span class="pick-name">Refresh calendar</span>
          </button>
          <button
            class="pick-item ${this._editMode ? "sel" : ""}"
            role="menuitem"
            @click=${() => this._toggleEditMode()}
          >
            <ha-icon icon=${this._editMode ? "mdi:pencil-off" : "mdi:pencil"}></ha-icon>
            <span class="pick-name">
              ${this._editMode ? "Leave Edit Mode" : "Enter Edit Mode"}
            </span>
          </button>
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
    const e = this._config;
    if (!(e.show_mode_toggles ?? k.show_mode_toggles) || this._mode !== "grid") return u;
    const t = this._calendarMode === "full", s = this._widthMode === "adaptive", i = this._orientation === "days-as-rows", n = st[e.mode_toggle_icons ?? k.mode_toggle_icons] ?? st[k.mode_toggle_icons];
    return c`
      <div class="mode-toggles">
        <button
          class="btn ${t ? "on" : ""}"
          @click=${() => this._toggleMode("calendar_mode")}
          title=${t ? "Whole day - tap to fit the events" : "Fitted to the events - tap for the whole day"}
          aria-pressed=${t ? "true" : "false"}
          aria-label="Time span"
        >
          <ha-icon icon=${t ? n.full : n.focused}></ha-icon>
        </button>
        ${i ? c`<button
              class="btn ${s ? "on" : ""}"
              @click=${() => this._toggleMode("view_width_mode")}
              title=${s ? "Fitted to the card - tap for a fixed scale" : "Fixed scale, scrolls - tap to fit the card"}
              aria-pressed=${s ? "true" : "false"}
              aria-label="Width"
            >
              <ha-icon icon=${s ? n.adaptive : n.fixed}></ha-icon>
            </button>` : u}
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
    if (n && Math.abs(n - this._axisPx) > 0.5 && (this._axisPx = n), i <= n + 1) {
      this._hThumb && (this._hThumb = null);
      return;
    }
    const a = Math.max(6, n / i * 100), o = s / (i - n) * (100 - a), l = this._hThumb;
    (!l || Math.abs(l.left - o) > 0.05 || Math.abs(l.width - a) > 0.05) && (this._hThumb = { left: o, width: a });
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
  get _scrollerEl() {
    return this.renderRoot?.querySelector(".rscroll") ?? null;
  }
  _barDown(e) {
    const t = e.currentTarget, s = t.querySelector(".hthumb"), i = this._scrollerEl;
    if (!s || !i) return;
    const n = t.getBoundingClientRect(), a = s.getBoundingClientRect(), o = i.scrollWidth - i.clientWidth, l = Math.max(1, n.width - a.width);
    if (o <= 0) return;
    let r = a.left - n.left;
    (e.clientX < a.left || e.clientX > a.right) && (r = Math.max(0, Math.min(l, e.clientX - n.left - a.width / 2)), i.scrollLeft = r / l * o), this._barDrag = { x0: e.clientX, left0: r, travel: l, max: o }, t.classList.add("dragging");
    try {
      t.setPointerCapture(e.pointerId);
    } catch {
    }
    e.preventDefault();
  }
  _barMove(e) {
    const t = this._barDrag, s = this._scrollerEl;
    if (!t || !s) return;
    const i = Math.max(0, Math.min(t.travel, t.left0 + (e.clientX - t.x0)));
    s.scrollLeft = i / t.travel * t.max, e.preventDefault();
  }
  _barUp(e) {
    if (!this._barDrag) return;
    this._barDrag = null;
    const t = e.currentTarget;
    t.classList.remove("dragging");
    try {
      t.releasePointerCapture(e.pointerId);
    } catch {
    }
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
    const i = this._config, n = i.day_height ?? k.day_height, a = i.hour_width ?? k.hour_width, o = this._calendarMode === "full", l = o ? 0 : s.start, r = o ? 24 * 60 : s.end, h = r - l, d = this._widthMode === "adaptive", p = Math.round(h / 60 * a), f = d ? "%" : "px", v = d ? 100 : p, b = (y) => (y - l) / h * (d ? 100 : p), w = b(l + $s) - b(l), T = d ? Qe / Math.max(1, this._axisPx || p) * 100 : Qe, O = e.map((y) => R(t.filter((x) => !x.allDay), y)), Z = this._active ? [this._active.entity] : [], U = Ke(O, i.lane_mode ?? k.lane_mode, Z), Q = U.columns * n, J = e.map((y) => R(t.filter((x) => x.allDay), y)), Te = [];
    for (let y = Math.ceil(l / 60) * 60; y <= r; y += 60) Te.push(y);
    const yt = Math.max(160, (this._hostWidth || 1e3) - Ns - Ws * 2), wt = d ? yt / (h / 60) : a, vt = Math.max(1, Math.ceil(zs / wt)), Ee = Te.filter((y, x) => x % vt === 0), xt = e.findIndex((y) => _e(y, this._now));
    return this._focusPx = o && !d ? Math.max(0, Math.round((s.start - Rs - l) / h * p)) : 0, c`
      <div
        class="rgrid dir-${this._navDir} ${this._receded ? "dimmed" : ""} ${this._editMode ? "editing" : ""}"
        style="--row-h:${Q}px; --lane-h:${n}px"
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
      (y, x) => c`
                <div
                  class="rday ${x % 2 ? "alt" : ""} ${x === xt ? "today" : ""}"
                  @pointerdown=${(P) => this._pressStart(P, y, x, be(this._nowMinutes))}
                  @contextmenu=${(P) => {
        this._editMode && P.preventDefault();
      }}
                >
                  <span class="dow">${this._fmtDowLong(y)},</span>
                  <span class="dnum">${this._fmtDate(y)}</span>
                  ${this._press?.idx === x && this._press.kind === "label" ? c`<div class="press-ghost head" style=${this._press.style}></div>` : u}
                </div>
              `
    )}
          </div>

          <div class="rscroll" @scroll=${(y) => this._onHScroll(y)}>
            <div class="rinner" style="--axis-w:${d ? "100%" : `${p}px`}">
              <div class="rtimes">
                ${Ee.map(
      (y) => c`<div
                      class="rhr ${b(y) < 0.5 ? "first" : ""} ${b(y) >= v - T ? "last" : ""}"
                      style="left:${b(y)}${f}"
                    >
                      ${this._fmtHour(y)}
                    </div>`
    )}
              </div>

              ${e.map((y, x) => {
      const P = N(y).getTime();
      return c`
                  <div
                    class="rcanvas ${x % 2 ? "alt" : ""}"
                    @pointerdown=${($) => this._pressStart($, y, x, {
        axis: "x",
        start: l,
        span: h,
        // NO minimum width, unlike a real block. The floor is
        // there so a five-minute lesson is still readable; on
        // the ghost it made a five-minute SLOT draw twelve
        // minutes wide and reach into the lesson after it, which
        // read as the gap not working at all. It has to tell the
        // truth about what it is claiming, however thin.
        kind: "slot",
        ghost: (ee, L) => `left:${b(ee)}${f}; width:${b(L) - b(ee)}${f};
                           top:0; height:100%`
      })}
                    @contextmenu=${($) => {
        this._editMode && $.preventDefault();
      }}
                  >
                    ${this._press?.idx === x && this._press.kind === "slot" ? c`<div class="press-ghost" style=${this._press.style}></div>` : u}
                    <div class="rlines">
                      ${Ee.map(
        ($) => c`<div class="rline" style="left:${b($)}${f}"></div>`
      )}
                    </div>
                    ${J[x].map(
        ($) => c`
                        <div
                          class="ev rev"
                          style="left:0; width:100%; top:0; height:${n}px;
                                 animation-name:${this._evAnim}; animation-delay:${x * me}ms;
                                 ${ie(this._colorForEvent($), this._minContrast)}"
                          @click=${() => this._pickEvent($)}
                        >
                          <div class="ev-in"><div class="ev-name">${$.summary}</div></div>
                        </div>
                      `
      )}
                    ${U.days[x].map(({ ev: $, column: ee }) => {
        const L = Math.max(l, I($.start, P)), De = I($.end, P), Se = Math.min(r, De <= L ? L + 15 : De);
        if (Se <= l || L >= r) return u;
        const Me = b(L), kt = Math.max(b(Se) - Me, w);
        return c`
                        <div
                          class="ev rev"
                          style="left:${Me}${f}; width:${kt}${f};
                                 top:${ee * n}px; height:${n}px;
                                 animation-name:${this._evAnim}; animation-delay:${x * me}ms;
                                 ${ie(this._colorForEvent($), this._minContrast)}"
                          @click=${() => this._pickEvent($)}
                        >
                          <div class="ev-in">
                            <div class="ev-name">${$.summary}</div>
                            <div class="ev-time">
                              ${this._fmtTime($.start)} – ${this._fmtTime($.end)}
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
        ${this._hThumb ? c`<div
              class="hbar"
              @pointerdown=${(y) => this._barDown(y)}
              @pointermove=${(y) => this._barMove(y)}
              @pointerup=${(y) => this._barUp(y)}
              @pointercancel=${(y) => this._barUp(y)}
            >
              <div
                class="hthumb"
                style="left:${this._hThumb.left}%; width:${this._hThumb.width}%"
              ></div>
            </div>` : u}
      </div>
    `;
  }
  /** Days across the top, time down the left — the calendar shape. */
  _renderColumnsGrid(e, t, s) {
    this._calendarMode === "full" && (s = { start: 0, end: 24 * 60 });
    const i = this._config, n = i.hour_height ?? k.hour_height, a = s.end - s.start, o = Math.round(a / 60 * n), l = e.map((b) => R(t.filter((w) => !w.allDay), b)), r = this._active ? [this._active.entity] : [], h = Ke(l, i.lane_mode ?? k.lane_mode, r), d = e.map((b) => R(t.filter((w) => w.allDay), b)), p = d.some((b) => b.length > 0), f = [];
    for (let b = Math.ceil(s.start / 60) * 60; b <= s.end; b += 60) f.push(b);
    const v = e.length;
    return c`
      <div
        class="grid dir-${this._navDir} ${this._receded ? "dimmed" : ""} ${this._editMode ? "editing" : ""}"
        style="--cols:${v}; --sub:${h.columns}; --body-h:${o}px"
        @animationend=${() => {
      this._navDir = "none";
    }}
      >
        <div class="hdr">
          <div class="corner"></div>
          ${e.map(
      (b, w) => c`
              <div
                class="dayhead ${w % 2 ? "alt" : ""}"
                @pointerdown=${(T) => this._pressStart(T, b, w, be(this._nowMinutes))}
                @contextmenu=${(T) => {
        this._editMode && T.preventDefault();
      }}
              >
                <span class="dow">${this._fmtDowLong(b)},</span>
                <span class="dnum">${this._fmtDate(b)}</span>
                ${this._press?.idx === w && this._press.kind === "label" ? c`<div class="press-ghost head" style=${this._press.style}></div>` : u}
              </div>
            `
    )}
        </div>

        ${p ? c`
              <div class="allday">
                <div class="gut-lbl">all-day</div>
                ${d.map(
      (b) => c`
                    <div class="ad-cell">
                      ${b.map(
        (w) => c`
                          <div
                            class="ad"
                            style=${ie(this._colorForEvent(w), this._minContrast)}
                            @click=${() => this._pickEvent(w)}
                          >
                            ${w.summary}
                          </div>
                        `
      )}
                    </div>
                  `
    )}
              </div>
            ` : u}

        <div class="body">
          <div class="lines">
            ${f.map(
      (b) => c`<div class="line" style="top:${nt(b, s)}"></div>`
    )}
          </div>
          <div class="gutter">
            ${f.map(
      (b) => c`<div class="hr" style="top:${nt(b, s)}">${this._fmtHour(b)}</div>`
    )}
          </div>
          ${e.map(
      (b, w) => this._renderDay(b, w, h.days[w], h.columns, s, o)
    )}
        </div>
      </div>
    `;
  }
  _renderDay(e, t, s, i, n, a) {
    const o = n.end - n.start, l = N(e).getTime();
    return c`
      <div
        class="day ${t % 2 ? "alt" : ""}"
        @pointerdown=${(r) => this._pressStart(r, e, t, {
      axis: "y",
      start: n.start,
      span: o,
      kind: "slot",
      // No minimum height, for the reason the rows grid has no minimum
      // width: the ghost is the slot, not a block.
      ghost: (h, d) => `top:${(h - n.start) / o * a}px;
               height:${(d - h) / o * a}px;
               left:0; width:100%`
    })}
        @contextmenu=${(r) => {
      this._editMode && r.preventDefault();
    }}
      >
        ${this._press?.idx === t && this._press.kind === "slot" ? c`<div class="press-ghost" style=${this._press.style}></div>` : u}
        ${s.map(({ ev: r, column: h }) => {
      const d = Math.max(n.start, I(r.start, l)), p = I(r.end, l), f = Math.min(n.end, p <= d ? d + 15 : p);
      if (f <= n.start || d >= n.end) return u;
      const v = (d - n.start) / o * a, b = Math.max(ks, (f - d) / o * a), w = this._colorForEvent(r), T = b < 46;
      return c`
            <div
              class="ev ${T ? "compact" : ""} ${this._selected?.key === r.key ? "sel" : ""}"
              style="top:${v}px; height:${b}px;
                     left:calc(${h} * (100% / ${i}));
                     width:calc(100% / ${i});
                     animation-name:${this._evAnim}; animation-delay:${t * me}ms;
                     ${ie(w, this._minContrast)}"
              @click=${() => this._pickEvent(r)}
            >
              <div class="ev-in">
                <div class="ev-name">${r.summary}</div>
                ${T ? u : c`<div class="ev-time">
                      ${this._fmtTime(r.start)} – ${this._fmtTime(r.end)}
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
    const i = be(this._nowMinutes);
    return c`
      <div
        class="list ${this._receded ? "dimmed" : ""} ${this._editMode ? "editing" : ""} dir-${this._navDir}"
        @animationend=${() => {
      this._navDir = "none";
    }}
      >
        ${e.map((n, a) => {
      const o = R(t, n).sort(
        (l, r) => l.start.getTime() - r.start.getTime()
      );
      return c`
            <div class="ld">
              <div
                class="ld-head ${_e(n, this._now) ? "today" : ""}"
                @pointerdown=${(l) => this._pressStart(l, n, a, i)}
                @contextmenu=${(l) => {
        this._editMode && l.preventDefault();
      }}
              >
                <!-- The row lives in an inner box so the heading itself is a
                     plain block: an absolutely positioned child of a FLEX
                     container does not resolve inset:0 against the padding box
                     here, and the overlay came up 6px short of the heading it
                     is supposed to cover. -->
                <span class="ld-head-in">
                  <span class="dow">${this._fmtDowLong(n)},</span>
                  <span class="dnum">${this._fmtDate(n)}</span>
                </span>
                ${this._press?.idx === a && this._press.kind === "label" ? c`<div class="press-ghost head" style=${this._press.style}></div>` : u}
              </div>
              ${o.length ? o.map(
        (l) => c`
                      <div
                        class="lr"
                        style="animation-name:${this._evAnim};
                               animation-delay:${Math.min(
          s++ * Ts,
          Es
        )}ms"
                        @click=${() => this._pickEvent(l)}
                      >
                        <span class="lr-bar" style="background:${this._colorForEvent(l)}"></span>
                        <span class="lr-time">
                          ${l.allDay ? "all day" : c`${this._fmtTime(l.start)}<br />${this._fmtTime(l.end)}`}
                        </span>
                        <span class="lr-name">${l.summary}</span>
                      </div>
                    `
      ) : c`<div class="lr empty">Nothing scheduled</div>`}
            </div>
          `;
    })}
      </div>
    `;
  }
  /* ---- the date and time pickers ------------------------------------
   *
   * Built rather than borrowed. `<input type="date">` and `<input type="time">`
   * are small, keyboard-shaped controls that follow the BROWSER's locale, so on
   * this setup they showed 12-hour time inside a card configured for 24 — and on
   * a wall tablet they are close to unusable with a finger.
   *
   * These are the two iOS shapes instead: a month grid for a date, a scrolling
   * drum for a time, both with 44px targets, opened inline under the row rather
   * than in a modal on top of a modal.
   * ------------------------------------------------------------------ */
  /** Snap a wheel column to the row nearest its resting position. */
  _onWheelScroll(e, t, s) {
    const i = e.currentTarget;
    window.clearTimeout(this._wheelTimers[t]), this._wheelTimers[t] = window.setTimeout(() => {
      const n = Math.round(i.scrollTop / B), a = this._draft;
      if (!a) return;
      const [o, l] = (a[s] || "00:00").split(":").map(Number), r = t === "hour" ? Math.min(23, Math.max(0, n)) : o, h = t === "minute" ? Math.min(59, Math.max(0, n)) : l, d = (f) => String(f).padStart(2, "0"), p = `${d(r)}:${d(h)}`;
      p !== a[s] && (s === "startTime" ? this._patchStart({ startTime: p }) : this._patchDraft({ endTime: p }));
    }, 140);
  }
  /** Put every open wheel at its selected row. Called from updated(). */
  /**
   * Send a drum to one row, which is how a MOUSE drives this thing.
   *
   * The wheels were built for a thumb and only ever responded to a drag, which
   * on a desktop leaves a control you have to fling with a trackpad to set a
   * time. Both routes below just scroll the column; the existing debounced
   * scroll handler is what commits the value, so there is one path to the draft
   * however the row was chosen.
   */
  _spinWheel(e, t, s) {
    const i = Math.min(s, Math.max(0, t)) * B;
    e.scrollTo({ top: i, behavior: this._reducedMotion ? "auto" : "smooth" });
  }
  /** One notch of the mouse wheel is one row, over whichever column is hovered. */
  _onWheelTick(e, t) {
    const s = Math.sign(e.deltaY);
    if (!s) return;
    e.preventDefault(), e.stopPropagation();
    const i = e.currentTarget;
    this._spinWheel(i, Math.round(i.scrollTop / B) + s, t);
  }
  _positionWheels() {
    const e = this.renderRoot?.querySelectorAll(".wheel-col");
    if (e?.length)
      for (const t of e) {
        const s = Number(t.dataset.index ?? 0);
        t.scrollTop = s * B;
      }
  }
  _renderWheel(e) {
    const t = this._draft?.[e] ?? "00:00", [s, i] = t.split(":").map(Number), n = [];
    for (let r = 0; r < 24; r++) n.push(r);
    const a = [];
    for (let r = 0; r < 60; r++) a.push(r);
    const o = (r) => String(r).padStart(2, "0"), l = (r) => this._hour12 ? `${r % 12 === 0 ? 12 : r % 12} ${r < 12 ? "AM" : "PM"}` : o(r);
    return c`
      <div class="wheel" style="--wheel-h:${B * Ps}px">
        <div class="wheel-band"></div>
        <div
          class="wheel-col"
          data-index=${s}
          @scroll=${(r) => this._onWheelScroll(r, "hour", e)}
          @wheel=${(r) => this._onWheelTick(r, 23)}
        >
          <div class="wheel-pad"></div>
          ${n.map(
      (r) => c`<div
              class="wheel-item ${r === s ? "sel" : ""}"
              @click=${(h) => this._spinWheel(h.currentTarget.parentElement, r, 23)}
            >
              ${l(r)}
            </div>`
    )}
          <div class="wheel-pad"></div>
        </div>
        <div class="wheel-sep">:</div>
        <div
          class="wheel-col"
          data-index=${i}
          @scroll=${(r) => this._onWheelScroll(r, "minute", e)}
          @wheel=${(r) => this._onWheelTick(r, 59)}
        >
          <div class="wheel-pad"></div>
          ${a.map(
      (r) => c`<div
              class="wheel-item ${r === i ? "sel" : ""}"
              @click=${(h) => this._spinWheel(h.currentTarget.parentElement, r, 59)}
            >
              ${o(r)}
            </div>`
    )}
          <div class="wheel-pad"></div>
        </div>
      </div>
    `;
  }
  _renderCalendar(e, t) {
    const s = this._pickerMonth ?? { y: (/* @__PURE__ */ new Date()).getFullYear(), m: (/* @__PURE__ */ new Date()).getMonth() }, i = new Date(s.y, s.m, 1), n = (i.getDay() + 6) % 7, a = new Date(s.y, s.m + 1, 0).getDate(), o = [];
    for (let f = 0; f < n; f++) o.push(null);
    for (let f = 1; f <= a; f++) o.push(new Date(s.y, s.m, f));
    const l = (f) => String(f).padStart(2, "0"), r = i.toLocaleDateString(this._lang, { month: "long", year: "numeric" }), h = [];
    for (let f = 0; f < 7; f++)
      h.push(new Date(2024, 0, 1 + f).toLocaleDateString(this._lang, { weekday: "narrow" }));
    const d = this._calEpoch % 2 ? "calDayB" : "calDayA", p = this._calDir * 22;
    return c`
      <div class="cal" style="--cal-from:${p}px">
        <div class="cal-head">
          <button class="cal-nav" @click=${() => this._stepMonth(-1)} aria-label="Previous month">
            <ha-icon icon="mdi:chevron-left"></ha-icon>
          </button>
          <span class="cal-month" style="animation-name:${d}">${r}</span>
          <button class="cal-nav" @click=${() => this._stepMonth(1)} aria-label="Next month">
            <ha-icon icon="mdi:chevron-right"></ha-icon>
          </button>
        </div>
        <div class="cal-grid">
          ${h.map((f) => c`<div class="cal-dow">${f}</div>`)}
          ${o.map((f, v) => {
      const b = Math.floor(v / 7) * 26;
      if (!f) return c`<div></div>`;
      const w = `${f.getFullYear()}-${l(f.getMonth() + 1)}-${l(f.getDate())}`;
      return c`
              <button
                class="cal-day ${w === e ? "sel" : ""} ${_e(f, this._now) ? "today" : ""}"
                style="animation-name:${d}; animation-delay:${b}ms"
                @click=${() => {
        t(w), this._closePicker();
      }}
              >
                ${f.getDate()}
              </button>
            `;
    })}
        </div>
      </div>
    `;
  }
  /**
   * A foldable group: a header row with a chevron, and content that springs.
   *
   * The content stays MOUNTED and is collapsed rather than removed. Lit dropping
   * it would make opening and closing instant, with nothing to animate — the
   * same reason the all-day time chip is collapsed instead of conditional.
   */
  _renderFold(e, t, s, i, n, a = !1) {
    return c`
      <div class="ed-group">
        <button
          class="ed-row ed-disclose"
          aria-expanded=${s ? "true" : "false"}
          @click=${() => {
      i(), this._confirmDelete = !1;
    }}
        >
          <span class="ed-lbl">${e}</span>
          <span class="ed-sub">${t}</span>
          <ha-icon class="ed-chev ${s ? "open" : ""}" icon="mdi:chevron-down"></ha-icon>
        </button>
        <div class="ed-fold ${s ? "open" : ""} ${a ? "tall" : ""}">
          <div class="ed-fold-in">${n}</div>
        </div>
      </div>
    `;
  }
  /** A panel is on screen while it is open, and while it is collapsing away. */
  _showPicker(e) {
    return this._openPicker === e || this._pickerClosing === e;
  }
  /** One row of the form whose value opens a picker under it. */
  _renderPickerRow(e, t, s) {
    const i = this._draft, n = /* @__PURE__ */ new Date(`${i[t]}T00:00`), a = Number.isNaN(n.getTime()) ? i[t] : n.toLocaleDateString(this._lang, { weekday: "short", day: "numeric", month: "short" }), o = this._hour12 ? (/* @__PURE__ */ new Date(`2000-01-01T${i[s]}`)).toLocaleTimeString(this._lang, {
      hour: "numeric",
      minute: "2-digit"
    }) : i[s];
    return c`
      <div class="ed-row">
        <span class="ed-lbl">${e}</span>
        <span class="ed-vals picks">
          <button
            class="ed-chip ${this._openPicker === t ? "on" : ""}"
            @click=${() => this._togglePicker(t)}
          >
            ${a}
          </button>
          <!-- Kept in the DOM when all-day is on, not removed. Lit dropping the
               element would give an instant disappearance and nothing to animate
               back in; collapsing it lets both directions spring. -->
          <button
            class="ed-chip time ${i.allDay ? "gone" : ""} ${this._openPicker === s ? "on" : ""}"
            tabindex=${i.allDay ? "-1" : "0"}
            aria-hidden=${i.allDay ? "true" : "false"}
            @click=${() => {
      i.allDay || this._togglePicker(s);
    }}
          >
            <span class="chip-in">${o}</span>
          </button>
        </span>
      </div>
      ${this._showPicker(t) ? c`<div class="ed-picker" data-field=${t}>
            ${this._renderCalendar(
      i[t],
      (l) => t === "startDate" ? this._patchStart({ startDate: l }) : this._patchDraft({ endDate: l })
    )}
          </div>` : u}
      ${this._showPicker(s) && !i.allDay ? c`<div class="ed-picker" data-field=${s}>
            ${this._renderWheel(s)}
          </div>` : u}
    `;
  }
  /* ---- location lookup ---------------------------------------------- */
  /**
   * Search as the user types, debounced, with the previous request dropped.
   *
   * Aborting matters more than the debounce does: without it a slow answer for
   * "gym" can land after a fast one for "gymnastika praha" and replace the good
   * suggestions with stale ones.
   */
  _searchLocation(e) {
    if (this._patchDraft({ location: e }), this._placeTimer && clearTimeout(this._placeTimer), this._placeAbort?.abort(), e.trim().length < bt) {
      this._places = [], this._placesBusy = !1;
      return;
    }
    this._placesBusy = !0, this._placeTimer = setTimeout(() => {
      const t = new AbortController();
      this._placeAbort = t;
      const s = this.hass?.states?.["zone.home"]?.attributes;
      Ve(e, {
        lat: typeof s?.latitude == "number" ? s.latitude : void 0,
        lon: typeof s?.longitude == "number" ? s.longitude : void 0,
        lang: this._lang?.split("-")[0],
        signal: t.signal
      }).then((i) => {
        t.signal.aborted || (this._places = i, this._placesBusy = !1);
      });
    }, 320);
  }
  /**
   * Choosing a suggestion fills the field and stops there.
   *
   * It used to open the map as well, which is an interruption: picking from the
   * list IS the answer, and the map is for the times it is not. The coordinates
   * are kept, so opening the map afterwards starts in the right place without
   * having to geocode the text again.
   */
  _pickPlace(e) {
    this._patchDraft({ location: e.label }), this._places = [], this._mapPoint = { lat: e.lat, lon: e.lon }, this._mapWanted = !0;
  }
  /**
   * Borrow Home Assistant's Leaflet, once per session.
   *
   * Called from EVERY path that opens the map — there are two, the map button
   * and picking a suggestion, and having only the button ask for it left the
   * other one showing the static preview for no reason anyone could see.
   */
  async _ensureLeaflet() {
    if (this._leaflet) return;
    const e = await bs();
    this._leaflet = e, this._leafletOk = !!e;
  }
  /**
   * Show the map for whatever is in the location box.
   *
   * A place picked from the list already has its coordinates. Anything typed by
   * hand, or loaded from an existing event, is only text — so it is geocoded on
   * demand here rather than kept, because Google's event has nowhere to store a
   * latitude and the text is the only thing that survives a save.
   */
  async _toggleMap() {
    if (this._mapOpen) {
      this._mapOpen = !1;
      return;
    }
    if (this._mapOpen = !0, this._mapWanted = !0, await this._ensureLeaflet(), this._mapPoint) return;
    const e = this._draft?.location?.trim();
    if (!e) return;
    this._placesBusy = !0;
    const t = await Ve(e, { limit: 1 });
    this._placesBusy = !1, t.length && (this._mapPoint = { lat: t[0].lat, lon: t[0].lon });
  }
  /**
   * The map, interactive where it can be.
   *
   * Leaflet is Home Assistant's own, borrowed at runtime — see loadLeaflet. When
   * it is unavailable the same tiles are laid out statically instead, which
   * still shows WHERE the place is and only loses the panning.
   *
   * The pin does not move: it is fixed to the centre and the MAP moves under it.
   * That is the phone convention, and it avoids asking a finger to hit a 14px
   * target that is also the thing being dragged.
   */
  /* ---- repeat rules -------------------------------------------------- */
  /**
   * Open and close the inline picker panel, in height.
   *
   * Imperative rather than CSS, and height rather than max-height, because the
   * panel is a month grid one time and a pair of drums the next — 330px and
   * 220px — and one max-height covering both means the taller one crawls and
   * the shorter one is over before it starts. Measuring is the only way both
   * land on the same curve.
   *
   * Runs from updated(), which is the first moment the panel exists and has a
   * height to measure.
   */
  _animatePicker() {
    const e = this._pickerClosing;
    if (!e || e === this._openPicker || this._pickerOutField === e) return;
    if (this._reducedMotion) {
      this._pickerClosing = null;
      return;
    }
    const t = this.renderRoot?.querySelector(
      `.ed-picker[data-field="${e}"]`
    );
    if (!t) {
      this._pickerClosing = null;
      return;
    }
    this._pickerOutField = e, this._pickerOutAnim?.cancel();
    const s = t.animate(
      [
        { height: `${t.scrollHeight}px`, opacity: 1, transform: "none" },
        { height: "0px", opacity: 0, transform: "translateY(-8px)" }
      ],
      { duration: 240, easing: "cubic-bezier(0.4, 0, 0.9, 1)", fill: "forwards" }
    );
    this._pickerOutAnim = s, s.finished.then(() => {
      this._pickerOutAnim === s && (this._pickerOutField = null, this._pickerClosing = null);
    }).catch(() => {
    });
  }
  /**
   * Animate the "Repeat every" row through a reflow.
   *
   * "week" becoming "weeks" makes that button wider, which makes the group
   * wider, which — the group being right-aligned — shoves the stepper left. All
   * of it landed in one frame.
   *
   * Widths are what is animated, NOT positions. Animate a translate and the
   * boxes glide while the container's border snaps to its new size around them;
   * animate the widths and the layout does the rest for free, so the stepper
   * slides left because the thing beside it is genuinely growing.
   *
   * Only the BUTTONS are animated. The .seg around them is inline-flex and
   * sizes to its contents, so it follows them frame by frame; animating it as
   * well gave it a width of its own that disagreed with the sum of its children
   * mid-flight, and the row jolted back into line at the end.
   *
   * Call _flipCapture BEFORE the state change; updated() plays it after.
   */
  _flipCapture() {
    if (this._reducedMotion) {
      this._flipFrom = null;
      return;
    }
    const e = this.renderRoot?.querySelector(".rec-every");
    e && (this._flipFrom = [...e.querySelectorAll(".seg-btn")].map((t) => ({
      el: t,
      w: t.getBoundingClientRect().width
    })));
  }
  _flipPlay() {
    const e = this._flipFrom;
    if (e) {
      this._flipFrom = null;
      for (const { el: t, w: s } of e) {
        if (!t.isConnected) continue;
        const i = t.getBoundingClientRect().width;
        Math.abs(i - s) < 0.5 || t.animate(
          // An EMPTY final keyframe means "whatever the layout says", so it lands
          // on the natural width instead of a measured one a fraction of a pixel
          // away from it. A measured endpoint is a guaranteed hop on the last
          // frame, which is exactly what a re-alignment jolt looks like.
          [{ width: `${s}px` }, {}],
          {
            duration: 380,
            // NOT the spring. Overshooting a WIDTH makes the row bulge past where
            // it is going and come back, and four buttons overshooting by four
            // different amounts is a wobble, not a settle.
            easing: "cubic-bezier(0.32, 0.72, 0, 1)",
            fill: "none"
          }
        );
      }
    }
  }
  /** Step the month, with the direction the grid should slide from. */
  _stepMonth(e) {
    const t = this._pickerMonth ?? { y: this._now.getFullYear(), m: this._now.getMonth() };
    this._pickerMonth = { y: t.y, m: t.m + e }, this._calDir = e, this._calEpoch++;
  }
  /**
   * The colour the whole form is accented with.
   *
   * Follows the colour PICKER rather than the event it was opened from, so a
   * new event has an accent before it exists and changing the colour shows at
   * once. For an existing event the two agree: colorId was read off the same
   * map _colorForEvent resolves through.
   */
  get _draftAccent() {
    const e = this._draft;
    return e ? e.colorId ? se.find(([t]) => t === e.colorId)?.[1] ?? this._colorFor(e.entity) : this._colorFor(e.entity) : "var(--ssc-fg)";
  }
  /** The draft's start as a Date, which every repeat label is generated from. */
  get _draftStart() {
    const e = this._draft, t = /* @__PURE__ */ new Date(`${e?.startDate ?? ""}T${e?.allDay ? "00:00" : e?.startTime ?? "00:00"}`);
    return Number.isNaN(t.getTime()) ? new Date(this._now) : t;
  }
  /** Open the custom window on a working copy, seeded from whatever is set. */
  _openCustom() {
    const e = this._draftStart;
    this._custom = this._draft?.repeat ? { ...this._draft.repeat, byDay: [...this._draft.repeat.byDay] } : {
      freq: "WEEKLY",
      interval: 1,
      byDay: [re[e.getDay()]],
      end: { kind: "never" }
    }, this._openPicker = null, this._pickerClosing = null, this._endsOpen = !1, clearTimeout(this._customCloseTimer), this._customClosing = !1, this._customOpen = !0;
  }
  _patchCustom(e) {
    this._custom && (this._custom = { ...this._custom, ...e });
  }
  /** What the folded Ends row says when it is shut. */
  get _endsSummary() {
    const e = this._custom?.end;
    if (!e || e.kind === "never") return "Never";
    if (e.kind === "after")
      return `After ${e.count} occurrence${e.count === 1 ? "" : "s"}`;
    const t = /* @__PURE__ */ new Date(`${e.date}T00:00`);
    return `On ${Number.isNaN(t.getTime()) ? e.date : t.toLocaleDateString(this._lang, { year: "numeric", month: "short", day: "numeric" })}`;
  }
  /**
   * The repeat options: Google's six, then Custom.
   *
   * Radio rows rather than a dropdown. The card already speaks in rows — the
   * recurrence scope above it is the same control — and a native select on a
   * wall tablet opens the browser's own list, at the browser's own size, in the
   * browser's own locale.
   */
  _renderRepeat() {
    const e = this._draft, t = this._draftStart, s = hs(e.repeat, t, this._lang), i = [
      ...gt(t, this._lang).map((n) => ({
        key: n.key,
        label: n.label,
        pick: () => this._patchDraft({ repeat: n.rule })
      })),
      {
        key: "custom",
        label: s === "custom" ? fe(e.repeat, t, this._lang) : "Custom…",
        pick: () => this._openCustom()
      }
    ];
    return c`
      ${i.map(
      (n) => c`
          <button
            class="ed-row scope ${s === n.key ? "sel" : ""}"
            role="radio"
            aria-checked=${s === n.key ? "true" : "false"}
            @click=${n.pick}
          >
            <span class="ed-lbl">${n.label}</span>
            ${n.key === "custom" ? c`<ha-icon class="ed-chev" icon="mdi:tune-variant"></ha-icon>` : c`<span class="radio"><span class="radio-dot"></span></span>`}
          </button>
        `
    )}
    `;
  }
  /**
   * −/+ around a number, at a size a finger can hit.
   *
   * The current value arrives as a GETTER, not a number: two taps inside one
   * frame would otherwise both read the value this render captured and land on
   * the same result, because the re-render between them has not happened yet.
   */
  _renderStepper(e, t, s, i, n, a = !0) {
    const o = e(), l = (r) => Math.min(s, Math.max(t, r));
    return c`
      <span class="stepper ${a ? "on" : ""}">
        <button
          class="st-btn"
          aria-label=${`One fewer ${n}`}
          ?disabled=${o <= t}
          @click=${() => i(l(e() - 1))}
        >
          <ha-icon icon="mdi:minus"></ha-icon>
        </button>
        <input
          class="st-val"
          type="text"
          inputmode="numeric"
          aria-label=${n}
          .value=${String(o)}
          @change=${(r) => {
      const h = parseInt(r.target.value, 10);
      i(Number.isFinite(h) ? l(h) : o);
    }}
        />
        <button
          class="st-btn"
          aria-label=${`One more ${n}`}
          ?disabled=${o >= s}
          @click=${() => i(l(e() + 1))}
        >
          <ha-icon icon="mdi:plus"></ha-icon>
        </button>
      </span>
    `;
  }
  /**
   * The custom recurrence window.
   *
   * Google's dialog, in this card's language: every row of it is a control that
   * already exists elsewhere in the form, so it inherits the 44px targets and
   * the springs rather than introducing a third idiom.
   *
   * Nothing here touches the draft until Done. Cancel is free, and a half-built
   * rule — "every 2 weeks on no days at all" — never reaches it.
   */
  _renderCustomModal() {
    if (!this._customOpen && !this._customClosing || !this._custom) return u;
    const e = this._custom, t = [
      ["DAILY", e.interval === 1 ? "day" : "days"],
      ["WEEKLY", e.interval === 1 ? "week" : "weeks"],
      ["MONTHLY", e.interval === 1 ? "month" : "months"],
      ["YEARLY", e.interval === 1 ? "year" : "years"]
    ], s = this._draftStart, i = e.end.kind === "on" ? e.end.date : this._defaultUntil, n = e.end.kind === "after" ? e.end.count : 13, a = (/* @__PURE__ */ new Date(`${i}T00:00`)).toLocaleDateString(this._lang, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
    return c`
      <div class="recwrap ${this._customClosing ? "out" : ""}">
        <!-- The accent is set HERE as well as on the sheet: this window is a
             SIBLING of it, not a child, so it inherits nothing from it. Without
             this the chosen day painted itself dark-on-nothing and vanished. -->
        <div
          class="recmodal"
          style="--accent:${this._draftAccent}"
          @click=${(o) => o.stopPropagation()}
          @touchstart=${(o) => this._onDragStart(o)}
          @touchmove=${(o) => this._onDragMove(o)}
          @touchend=${(o) => this._onDragEnd(o)}
          @touchcancel=${(o) => this._onDragEnd(o)}
        >
        <div class="mm-head">
          <span class="mm-title">Custom recurrence</span>
          <button class="mm-close" aria-label="Close" @click=${() => this._closeCustom(!1)}>
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
        <div class="rec-body">
          <div class="ed-row rec-every">
            <span class="ed-lbl">Repeat every</span>
            <span class="ed-vals">
              ${this._renderStepper(
      () => this._custom?.interval ?? 1,
      1,
      99,
      (o) => {
        this._flipCapture(), this._patchCustom({ interval: o });
      },
      "interval"
    )}
              <span class="seg">
                ${t.map(
      ([o, l]) => c`
                    <button
                      class="seg-btn ${e.freq === o ? "on" : ""}"
                      @click=${() => {
        this._flipCapture(), this._patchCustom({ freq: o });
      }}
                    >
                      ${l}
                    </button>
                  `
    )}
              </span>
            </span>
          </div>

          <!-- Collapsed rather than dropped when it does not apply, so switching
               to weeks and back springs instead of jumping. -->
          <div class="rec-days ${e.freq === "WEEKLY" ? "open" : ""}">
            <div class="rec-days-in">
              <div class="ed-head">Repeat on</div>
              <div class="dow-row">
                ${X.map((o, l) => {
      const r = e.byDay.includes(o), h = new Date(2024, 0, 1 + l).toLocaleDateString(this._lang, {
        weekday: "narrow"
      });
      return c`
                    <button
                      class="dow-btn ${r ? "on" : ""}"
                      aria-pressed=${r ? "true" : "false"}
                      @click=${() => {
        const d = r ? e.byDay.filter((p) => p !== o) : [...e.byDay, o];
        this._patchCustom({
          byDay: d.length ? d : [re[s.getDay()]]
        });
      }}
                    >
                      ${h}
                    </button>
                  `;
    })}
              </div>
            </div>
          </div>

          <!-- Folded like Location and Colour. Most rules never end, so the
               three rows that say how one does are two taps away rather than a
               third of the window; the summary carries the answer when they
               are shut. -->
          ${this._renderFold(
      "Ends",
      this._endsSummary,
      this._endsOpen,
      () => {
        this._endsOpen = !this._endsOpen, this._endsOpen || this._closePicker();
      },
      c`
              <!-- Whole ROWS, not just the dots. The dot is 24px of a 44px row
                   and was the only live part of it, so tapping the obvious
                   place - the word, the date, anywhere across - did nothing. -->
              <button
                class="ed-row scope ${e.end.kind === "never" ? "sel" : ""}"
                role="radio"
                aria-checked=${e.end.kind === "never" ? "true" : "false"}
                @click=${() => {
        this._closePicker(), this._patchCustom({ end: { kind: "never" } });
      }}
              >
                <span class="ed-lbl">Never</span>
                <span class="radio"><span class="radio-dot"></span></span>
              </button>

              <div
                class="ed-row scope ends ${e.end.kind === "on" ? "sel" : ""}"
                role="radio"
                aria-checked=${e.end.kind === "on" ? "true" : "false"}
                @click=${() => this._patchCustom({ end: { kind: "on", date: i } })}
              >
                <span class="ed-lbl">On</span>
                <button
                  class="ed-chip ${this._openPicker === "untilDate" ? "on" : ""}"
                  @click=${(o) => {
        o.stopPropagation(), this._patchCustom({ end: { kind: "on", date: i } }), this._togglePicker("untilDate");
      }}
                >
                  ${a}
                </button>
                <span class="radio"><span class="radio-dot"></span></span>
              </div>
              ${this._showPicker("untilDate") ? c`<div class="ed-picker" data-field="untilDate">
                    ${this._renderCalendar(
        i,
        (o) => this._patchCustom({ end: { kind: "on", date: o } })
      )}
                  </div>` : u}

              <div
                class="ed-row scope ends ${e.end.kind === "after" ? "sel" : ""}"
                role="radio"
                aria-checked=${e.end.kind === "after" ? "true" : "false"}
                @click=${() => {
        this._closePicker(), this._patchCustom({ end: { kind: "after", count: n } });
      }}
              >
                <span class="ed-lbl">After</span>
                <!-- Stopped, and this one MUST be: the row's handler would run
                     after the step and write the count back as it was. -->
                <span class="stop" @click=${(o) => o.stopPropagation()}>
                  ${this._renderStepper(
        () => this._custom?.end.kind === "after" ? this._custom.end.count : n,
        1,
        999,
        (o) => this._patchCustom({ end: { kind: "after", count: o } }),
        "occurrences",
        e.end.kind === "after"
      )}
                </span>
                <span class="ed-sub occ">occurrences</span>
                <span class="radio"><span class="radio-dot"></span></span>
              </div>
            `,
      // Only while the month grid is actually inside it. max-height is a
      // CEILING, and one four times the content's height opens the clip
      // in a quarter of the time — the three rows on their own snapped
      // open in 80ms of a 360ms move.
      this._showPicker("untilDate")
    )}

          <div class="rec-says">${fe(e, s, this._lang)}</div>
        </div>
        <div class="mm-foot">
          <span class="mm-addr"></span>
          <button class="ed-btn small" @click=${() => this._closeCustom(!1)}>Cancel</button>
          <button class="ed-btn primary small" @click=${() => this._closeCustom(!0)}>
            Done
          </button>
        </div>
        </div>
      </div>
    `;
  }
  /**
   * Close the custom window, keeping it on screen for the length of its exit.
   *
   * `apply` is the difference between Done and Cancel, and it is the only one:
   * the rule was being edited on a copy, so walking away from it costs nothing.
   */
  _closeCustom(e) {
    if (this._customOpen) {
      if (e && this._patchDraft({ repeat: this._custom }), this._customOpen = !1, this._openPicker = null, this._pickerClosing = null, clearTimeout(this._customCloseTimer), this._reducedMotion) {
        this._custom = null;
        return;
      }
      this._customClosing = !0, this._customCloseTimer = setTimeout(() => {
        this._customClosing = !1, this._custom = null;
      }, 200);
    }
  }
  /** Teardown, for the paths where the whole form is going away anyway. */
  _cancelCustom() {
    clearTimeout(this._customCloseTimer), this._customOpen = !1, this._customClosing = !1, this._custom = null, this._openPicker = null, this._pickerClosing = null;
  }
  /** A year out, which is where Google's own "On" date starts. */
  get _defaultUntil() {
    const e = this._draftStart;
    return e.setFullYear(e.getFullYear() + 1), M(e).date;
  }
  /**
   * The location picker, as a window of its own.
   *
   * It was a 505x360 panel wedged into the edit form, and at that size you
   * cannot get your bearings, let alone find a side entrance — the user's word
   * for it was "useless", and they were right. Choosing a place on a map is its
   * own task and it gets the whole screen.
   *
   * Tapping picks, immediately, and the field behind updates as you go. The
   * button says Done rather than "use this location" because the choice was
   * already made by the tap; this only closes the window.
   */
  _renderMapModal() {
    if (!this._mapOpen) return u;
    const e = this._mapPoint;
    return c`
      <link rel="stylesheet" href=${gs} />
      <div class="mapmodal" @click=${(t) => t.stopPropagation()}>
        <div class="mm-head">
          <span class="mm-title">Choose a location</span>
          <button class="mm-close" aria-label="Close" @click=${() => this._mapOpen = !1}>
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
        <div class="mm-body">
          ${e ? this._leafletOk ? c`
                  <div class="map live">
                    <div class="map-canvas"></div>
                    <span class="map-credit">${Ze[this._baseMap].attribution}</span>
                  </div>
                ` : (
      // Leaflet could not be borrowed. Still shows WHERE the place is,
      // just without panning — better than an empty window.
      c`
                  <div class="map static-fallback" style="--map-h:340px">
                    ${(() => {
        const { base: t, labels: s } = ms(e.lat, e.lon, 16, 520, 340, "Light"), i = (n) => c`<img src=${n.url} alt="" style="left:${n.left}px; top:${n.top}px" />`;
        return c`
                        <div class="map-layer">${t.map(i)}</div>
                        <div class="map-layer labels">${s.map(i)}</div>
                        <div class="map-pin"></div>
                      `;
      })()}
                  </div>
                `
    ) : c`<div class="map-none">
                ${this._placesBusy ? "Looking that up…" : "Search for an address first, or open this from a place that has one."}
              </div>`}
        </div>
        <div class="mm-foot">
          <span class="mm-addr">${this._draft?.location || "Tap the map to pick a place."}</span>
          <a
            class="ed-btn small"
            href=${ys(this._draft?.location ?? "", e?.lat, e?.lon)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ha-icon icon="mdi:open-in-new"></ha-icon>
          </a>
          <button class="ed-btn primary small" @click=${() => this._mapOpen = !1}>Done</button>
        </div>
      </div>
    `;
  }
  /**
   * Build the Leaflet map once its container is in the DOM, or tear it down.
   *
   * Called from updated(), because the container only exists after a render and
   * Leaflet measures it on construction — building it earlier gives a map that
   * thinks it is 0x0 and renders one tile in the corner.
   */
  _syncLeaflet() {
    const e = this._mapOpen && !!this._mapPoint && this._leafletOk, t = this.renderRoot?.querySelector(".map-canvas");
    if (!e || !t) {
      this._leafletMap && (this._leafletMap.remove(), this._leafletMap = null, this._leafletMarker = null);
      return;
    }
    if (this._leafletMap) {
      this._mapWanted && (this._mapWanted = !1, this._leafletMap.setView([this._mapPoint.lat, this._mapPoint.lon], 16), this._leafletMarker?.setLatLng([this._mapPoint.lat, this._mapPoint.lon])), this._leafletMap.invalidateSize();
      return;
    }
    const s = this._leaflet;
    if (!s) return;
    const i = s.map(t, {
      attributionControl: !1,
      zoomControl: !0,
      scrollWheelZoom: !0,
      tap: !0
    }).setView([this._mapPoint.lat, this._mapPoint.lon], 16);
    this._applyBaseMap(i, s);
    const n = s.marker([this._mapPoint.lat, this._mapPoint.lon], {
      draggable: !0,
      keyboard: !1,
      icon: s.divIcon({
        className: "ssc-pin",
        html: "<span></span>",
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      })
    }).addTo(i);
    n.on("dragend", () => {
      const a = n.getLatLng();
      this._pickAt(a.lat, a.lng);
    }), i.on("click", (a) => {
      n.setLatLng(a.latlng), this._pickAt(a.latlng.lat, a.latlng.lng);
    }), this._leafletMarker = n, this._leafletMap = i, setTimeout(() => i.invalidateSize(), 120);
  }
  /**
   * Put the chosen basemap on the map, replacing whatever was there.
   *
   * Drawn at full strength: the earlier version darkened the tiles to match the
   * card, which on an already-sparse basemap left almost nothing visible. A map
   * you cannot read is not worth matching the furniture.
   */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  _applyBaseMap(e, t) {
    for (const a of this._baseLayers) e.removeLayer(a);
    this._baseLayers = [];
    const s = Ze[this._baseMap], i = { maxNativeZoom: s.maxNativeZoom, maxZoom: 19 }, n = t.tileLayer(s.url, i).addTo(e);
    this._baseLayers.push(n), s.overlay && this._baseLayers.push(t.tileLayer(s.overlay, i).addTo(e));
  }
  /**
   * Point at something and it becomes the location.
   *
   * Straight into the field, with no confirmation step: the tap already said
   * which place, and a second button asking "really?" is the thing that made the
   * first version of this useless. The field is a text box — if the answer is
   * wrong, typing over it is right there.
   */
  async _pickAt(e, t) {
    this._mapPickSeq === void 0 && (this._mapPickSeq = 0);
    const s = ++this._mapPickSeq;
    this._mapPoint = { lat: e, lon: t };
    const i = await _s(e, t, { lang: this._lang?.split("-")[0] });
    s !== this._mapPickSeq || !i || (this._patchDraft({ location: i.label }), this._places = []);
  }
  /** All-day on or off, closing any time wheel that no longer applies. */
  _setAllDay(e) {
    e && (this._openPicker === "startTime" || this._openPicker === "endTime") && this._closePicker(), this._patchDraft({ allDay: e });
  }
  /**
   * The edit form.
   *
   * iOS-shaped — a grouped list of labelled rows, then the actions — but square,
   * because this card has no rounded corners anywhere and one rounded box would
   * look like a mistake rather than a flourish.
   *
   * Nothing here writes until Save is pressed. The draft is a copy, so Cancel is
   * genuinely free and a re-render mid-typing cannot rebind the form to a
   * different event.
   */
  _renderEditor() {
    const e = this._draft;
    if (!e) return u;
    const t = this._draftAccent, s = [
      ["instance", "This event"],
      ["future", "This and future"],
      ["series", "All events"]
    ];
    return c`
      <div
        class="scrim"
        @click=${() => {
      this._customOpen ? this._closeCustom(!1) : this._mapOpen ? this._mapOpen = !1 : this._closeEditor();
    }}
      >
        ${this._renderMapModal()} ${this._renderCustomModal()}
        <div
          class="sheet editor ${this._mapOpen || this._customOpen ? "behind" : ""}"
          style="--accent:${t}"
          @click=${(i) => i.stopPropagation()}
          @touchstart=${(i) => this._onDragStart(i)}
          @touchmove=${(i) => this._onDragMove(i)}
          @touchend=${(i) => this._onDragEnd(i)}
          @touchcancel=${(i) => this._onDragEnd(i)}
        >
          <input
            class="ed-title"
            .value=${e.summary}
            placeholder=${e.isNew ? "New event" : "Title"}
            aria-label="Title"
            @input=${(i) => this._patchDraft({ summary: i.target.value })}
          />

          <div class="ed-group">
            <label class="ed-row">
              <span class="ed-lbl">All-day</span>
              <input
                type="checkbox"
                class="ed-check"
                .checked=${e.allDay}
                @change=${(i) => this._setAllDay(i.target.checked)}
              />
            </label>
            ${this._renderPickerRow("Starts", "startDate", "startTime")}
            ${this._renderPickerRow("Ends", "endDate", "endTime")}
          </div>

          ${e.recurring ? c`
                <div class="ed-group">
                  <div class="ed-head">Applies to</div>
                  ${s.map(
      ([i, n]) => c`
                      <button
                        class="ed-row scope ${this._scope === i ? "sel" : ""}"
                        role="radio"
                        aria-checked=${this._scope === i ? "true" : "false"}
                        @click=${() => {
        this._scope = i, this._confirmDelete = !1;
      }}
                      >
                        <span class="ed-lbl">${n}</span>
                        <!-- A drawn radio, not the native one: accent-color can
                             paint it but nothing can animate it, and the dot
                             springing in is the whole point here. -->
                        <span class="radio"><span class="radio-dot"></span></span>
                      </button>
                    `
    )}
                  <!-- Three separate branches rather than one interpolated
                       string, so Lit builds a NEW element per scope and the
                       entry animation actually re-runs. Swapping the text inside
                       one element changes nothing a CSS animation can see. -->
                  ${this._scope === "instance" ? c`<div class="ed-note">Only the occurrence you opened changes.</div>` : this._scope === "future" ? c`<div class="ed-note">
                          This occurrence and every later one. Earlier ones are left alone.
                        </div>` : c`<div class="ed-note">
                          Every occurrence, including ones already past.
                        </div>`}
                </div>
              ` : u}

          <!-- Repeat, colour and details all fold, and all sit after the
               recurrence options: what a change APPLIES TO is the decision with
               consequences, so it comes before the cosmetic ones. Repeat leads
               the three because it is the one that changes how many events
               exist, and it is offered only when creating - see _openEditor. -->
          ${e.isNew ? this._renderFold(
      "Repeat",
      fe(e.repeat, this._draftStart, this._lang),
      this._repeatOpen,
      () => {
        this._repeatOpen = !this._repeatOpen;
      },
      this._renderRepeat()
    ) : u}
          ${this._renderFold(
      "Colour",
      e.colorId ? se.find(([i]) => i === e.colorId)?.[2] ?? "" : "Calendar's colour",
      this._colorOpen,
      () => {
        this._colorOpen = !this._colorOpen;
      },
      c`
              <!-- Google's own picker: round swatches in a grid with a tick on
                   the one that is set. -->
              <div class="sw-grid">
                <button
                  class="sw none ${e.colorId === "" ? "sel" : ""}"
                  title="The calendar's own colour"
                  aria-label="The calendar's own colour"
                  @click=${() => this._patchDraft({ colorId: "" })}
                >
                  ${e.colorId === "" ? c`<ha-icon icon="mdi:check"></ha-icon>` : u}
                </button>
                ${se.map(
        ([i, n, a]) => c`
                    <button
                      class="sw ${e.colorId === i ? "sel" : ""}"
                      style="--sw:${n}"
                      title=${a}
                      aria-label=${a}
                      @click=${() => this._patchDraft({ colorId: i })}
                    >
                      ${e.colorId === i ? c`<ha-icon icon="mdi:check"></ha-icon>` : u}
                    </button>
                  `
      )}
              </div>
            `
    )}
          ${this._renderFold(
      "Details",
      e.location || e.description ? [e.location, e.description].filter(Boolean).join(" · ").slice(0, 40) : "Location, notes",
      this._detailsOpen,
      () => {
        this._detailsOpen = !this._detailsOpen;
      },
      c`
              <div class="ed-row loc">
                <span class="ed-lbl">Location</span>
                <span class="ed-vals">
                  <input
                    type="text"
                    placeholder="Search an address"
                    autocomplete="off"
                    .value=${e.location}
                    @input=${(i) => this._searchLocation(i.target.value)}
                  />
                  <button
                    class="ed-mapbtn ${this._mapOpen ? "on" : ""}"
                    ?disabled=${!e.location.trim()}
                    aria-label="Show on a map"
                    title="Show on a map"
                    @click=${() => void this._toggleMap()}
                  >
                    <ha-icon icon="mdi:map-outline"></ha-icon>
                  </button>
                </span>
              </div>
              <!-- Suggestions sit under the field, not over it: the form is
                   already inside a sheet, and a second floating layer on a phone
                   ends up half off the screen. -->
              ${this._places.length ? c`
                    <div class="loc-list">
                      ${this._places.map(
        (i) => c`
                          <button class="loc-item" @click=${() => this._pickPlace(i)}>
                            <ha-icon icon="mdi:map-marker-outline"></ha-icon>
                            <span class="loc-text">
                              <span class="loc-name">${i.name}</span>
                              ${i.detail ? c`<span class="loc-detail">${i.detail}</span>` : u}
                            </span>
                          </button>
                        `
      )}
                    </div>
                  ` : u}
              <div class="ed-row notes">
                <span class="ed-lbl">Notes</span>
                <textarea
                  rows="2"
                  placeholder="None"
                  .value=${e.description}
                  @input=${(i) => this._patchDraft({ description: i.target.value })}
                ></textarea>
              </div>
            `
    )}

          ${this._editError ? c`<div class="ed-error">${this._editError}</div>` : u}

          <div class="ed-actions">
            <!-- Nothing to delete yet. Cancel is the way out of a new event,
                 and it is already the next button along. -->
            ${e.isNew ? u : c`<button
                  class="ed-btn danger ${this._confirmDelete ? "armed" : ""}"
                  ?disabled=${this._busy}
                  @click=${() => void this._deleteDraft()}
                >
                  ${this._busy && this._confirmDelete ? "Deleting…" : this._confirmDelete ? "Tap again to delete" : "Delete"}
                </button>`}
            <span class="ed-spacer"></span>
            <button class="ed-btn" ?disabled=${this._busy} @click=${() => this._closeEditor()}>
              Cancel
            </button>
            <button
              class="ed-btn primary"
              ?disabled=${this._busy}
              @click=${() => void this._saveDraft()}
            >
              <!-- Silent during a delete: that button is doing the talking,
                   and two buttons announcing different jobs at once is one
                   of them lying. -->
              ${this._busy && !this._confirmDelete ? e.isNew ? "Adding…" : "Saving…" : e.isNew ? "Add" : "Save"}
            </button>
          </div>
        </div>
      </div>
    `;
  }
  _renderSheet() {
    if (this._draft) return this._renderEditor();
    const e = this._selected;
    return e ? c`
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
          ${e.location ? c`<div class="sh-row">${e.location}</div>` : u}
          ${e.description ? c`<div class="sh-row">${e.description}</div>` : u}
        </div>
      </div>
    ` : u;
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
    const e = this._config?.time_format ?? k.time_format;
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
    }).format(e) : `${e.getHours()}:${it(e.getMinutes())}`;
  }
  _fmtHour(e) {
    const t = Math.floor(e / 60) % 24;
    if (!this._hour12) return `${t}:${it(e % 60)}`;
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
    return `${new Intl.DateTimeFormat(this._lang, { month: "short" }).format(e)} ${e.getDate()}${Zs(e.getDate(), this._lang)}`;
  }
};
m.styles = Tt`
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
      /* The list's week animation is a 34% slide. Without this it becomes
         page-wide overflow and the phone grows a scrollbar along the bottom
         every time the week changes. */
      overflow-x: hidden;
    }
    /* The phone header WRAPS: the calendar name takes the first row and the
       week nav sits under it. On one row, four 44px buttons leave about 69px
       for the name, which cut a two-word calendar name down to its first - and the
       name is the thing that says whose week you are looking at. Wrapping is
       what lets the buttons stay full size AND the name stay whole. */
    .narrow .head {
      flex-wrap: wrap;
      /* 6px off the shared 14px — the other 6px went onto .head-right's top
         margin, so the block moves down without the header growing. */
      margin-bottom: 6px;
    }
    .narrow .titles {
      flex: 1 1 100%;
    }
    /* Left-aligned once wrapped. Right-aligning a full-width second row put
       the week nav on the opposite side of the card from the calendar name it
       belongs to, with a gap between them; under the name it reads as one
       header block. */
    /* The header wraps on a phone, so the buttons and the week range sit UNDER
       the calendar name rather than beside it. That block is pushed down 12px
       from the name and left only 8px clear of the schedule below (the shared
       .head margin is 14px), so it reads as belonging to the week it labels
       rather than floating between the two. Moving it down without also closing
       the gap underneath would just make the header taller. */
    .narrow .head-right {
      flex: 1 1 100%;
      align-items: flex-start;
      margin-top: 12px;
    }
    .narrow .head-right .range {
      justify-content: flex-start;
    }
    /* First day only, so the gap under the header is controlled by the header's
       own margin-bottom and nothing else. .ld's padding is on every day group,
       so changing it there would move Tuesday away from Monday too. */
    .narrow .list > .ld:first-child {
      padding-top: 0;
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
       which quietly undid the tablet sizing pass - .narrow .tools overrode the
       wider gap, so the extra air never reached the list layout and the buttons
       read noticeably smaller than the same controls on the tablet. 40px keeps a
       comfortable thumb target while giving a narrow header back some air. The
       gap stays at the shared 15px, and the calendar NAME absorbs the
       difference by ellipsising. */
    .narrow .btn {
      width: 40px;
      height: 40px;
    }
    .narrow .btn ha-icon {
      --mdc-icon-size: 23px;
    }
    /* A row, so the edit-mode pill can sit beside the calendar name. The picker
       keeps min-width:0 so a long name still ellipsises rather than pushing the
       pill off the card. */
    .titles {
      min-width: 0;
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      gap: 10px;
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
      white-space: nowrap;
    }
    /* Says the card is armed, in the place the eye already goes for "whose week
       is this". Red because edit mode is the only state where a tap can change
       somebody's timetable. Same face and size as the week pill by design. */
    .edit-pill {
      background: rgba(255, 71, 51, 1);
      color: #fff;
      flex: 0 0 auto;
      align-self: center;
      animation: editPillIn 420ms var(--ssc-spring) both;
    }
    /* The + reads as a sibling of the Edit Mode pill: same height, same face,
       square rather than lozenge-wide because it holds a glyph and not a word.
       It follows the pill in rather than arriving with it, so the eye is told
       "armed" first and "and here is what you can do" second. */
    .add-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      align-self: center;
      border: none;
      padding: 3px 7px;
      color: var(--ssc-fg);
      /* family only - size and weight come from .pill, and the shorthand would
         take the parent's size instead. line-height is NOT inherited by a
         button: the browser's own sheet sets it to normal, which is what left
         this chip 2px shorter than the pill next to it. */
      font-family: inherit;
      line-height: inherit;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      animation: editPillIn 420ms var(--ssc-spring) 90ms both;
      transition: background 0.15s ease, transform 0.15s ease;
    }
    /* A zero-width space, so the button takes the same line box the word pills
       do and the two chips are exactly the same height. A fixed px height
       cannot track that: the same rule measures 23px beside the tablet pill and
       25 beside the phone's, the line-height coming from the theme. The icon is
       kept under 1em so the strut, not the glyph, is what sets the height. */
    .add-pill::before {
      content: '\\200b';
    }
    .add-pill ha-icon {
      --mdc-icon-size: 1.3em;
      width: 1.3em;
      height: 1.3em;
      /* The ha-svg-icon INSIDE ha-icon is inline-flex, so it sits on a text
         baseline and the line box's descender pushed the glyph ~3px below
         centre — the box measured dead centre while the ink did not. Zeroing
         the line box is what removes that; the flex centring covers the rest. */
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }
    .add-pill:hover {
      background: rgba(255, 255, 255, 0.24);
    }
    .add-pill:active {
      transform: scale(0.9);
    }
    /* Arrives from behind the calendar name and settles — the same spring the
       blocks use, so it reads as part of the card rather than bolted on. */
    @keyframes editPillIn {
      from {
        opacity: 0;
        transform: translateX(-10px) scale(0.82);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    /* The wash on entering edit mode. Covers the whole card, ignores the
       pointer, and is gone in under half a second — long enough to register,
       short enough that it never gets in the way of the tap that follows. */
    /* Entering edit mode, in three layers over the same 700ms.
       A flat rectangle fading out is a screen dimmer, not a flash - which is
       what the first two attempts were. What makes this read is that the layers
       decay at DIFFERENT rates: the wash is gone in a fifth of a second, the
       edge glow lingers behind it, and the card itself takes a small knock. */
    .mode-flash {
      position: absolute;
      inset: 0;
      z-index: 30;
      pointer-events: none;
    }
    /* 1. The wash. Full strength in the first frame and mostly gone by 180ms,
          so the eye catches an afterimage rather than a red screen. */
    .mode-flash::before {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(255, 71, 51, 1);
      animation: flashWash 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    /* LEAVING edit mode. NOT the entry played backwards — reversing it verbatim
       builds the red up and then cuts it, which reads as something starting, the
       exact opposite of what it has to say.

       Entering is an impact: full strength instantly, then decay. Leaving is a
       RELEASE: the red is already there, it lets go of the edges and drains
       outward, and it never reaches the strength the entry does. Quieter and a
       little quicker, because nothing is being warned about any more. */
    .mode-flash.out::before {
      animation: flashDrainWash 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .mode-flash.out::after {
      animation: flashDrain 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    @keyframes flashDrainWash {
      0% {
        opacity: 0.2;
      }
      100% {
        opacity: 0;
      }
    }
    /* Pulled outward and away rather than blooming in from the edges. */
    @keyframes flashDrain {
      0% {
        opacity: 0.62;
        transform: scale(1);
      }
      100% {
        opacity: 0;
        transform: scale(1.22);
      }
    }
    /* 2. The bloom — a radial VIGNETTE, not an inset shadow.
          An inset shadow is drawn inward from the edges however it is tuned, so
          it always ends up looking like a red border sitting on the card; that
          was the "still too red at the end". A radial gradient with a long
          falloff has no edge to hug, and it is gone well before the animation
          ends rather than lingering at a tenth of a percent. */
    .mode-flash::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(
        130% 120% at 50% 50%,
        rgba(255, 71, 51, 0) 38%,
        rgba(255, 71, 51, 0.55) 78%,
        rgba(255, 71, 51, 0.9) 100%
      );
      animation: flashBloom 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    /* Smoothed out rather than cliff-edged: the old curve dropped from 0.62 to
       0.14 in a quarter of the run and then crawled, which is the "raw" part. */
    @keyframes flashWash {
      0% {
        opacity: 0.55;
      }
      18% {
        opacity: 0.3;
      }
      46% {
        opacity: 0.08;
      }
      100% {
        opacity: 0;
      }
    }
    @keyframes flashBloom {
      0% {
        opacity: 0.9;
        transform: scale(1);
      }
      60% {
        opacity: 0.12;
        transform: scale(1.06);
      }
      /* Zero well before the end, so nothing is left painted on the card while
         the knock finishes settling. */
      82%,
      100% {
        opacity: 0;
        transform: scale(1.1);
      }
    }
    /* 3. The knock. The card gives a little under the flash and springs back —
          the physical half of the effect, and the half that makes it feel like
          something happened TO the card rather than on top of it. */
    .panel.flash {
      animation: flashKnock 620ms var(--ssc-spring) both;
    }
    .panel.flash-out {
      animation: flashKnockOut 620ms var(--ssc-spring) both;
    }
    @keyframes flashKnock {
      0% {
        transform: scale(0.982);
      }
      100% {
        transform: none;
      }
    }
    /* The card breathes back OUT as the red lets go, rather than being knocked
       in. Same spring, opposite sense. */
    @keyframes flashKnockOut {
      0% {
        transform: scale(1.012);
      }
      100% {
        transform: none;
      }
    }
    .panel.reduce ~ .mode-flash {
      animation: none;
      display: none;
    }

    /* The overflow menu hangs off the RIGHT edge: its button is the last one in
       the header, so a left-aligned menu would run off the card. */
    .tools-menu-wrap {
      position: relative;
      display: inline-flex;
    }
    /* The overflow menu gets a POPOVER animation rather than the picker's
       max-height one. With two items its content is 88px against a 320px
       max-height, so the shared transition revealed all of it in the first 61ms
       of 220 and read as instant. Transform and opacity do not care how tall the
       content is, so this lands the same however many items it ends up with. */
    /* The same unfold the calendar picker uses — the real work of the
       transition is the SCHEDULE receding behind it (see _receded), which is
       what was missing and what made this look static.

       The one difference is the max-height, sized to this menu's own content.
       Sharing the picker's 320px meant the 84px here was fully revealed in the
       first 61ms of the transition, with the rest animating empty space. The
       doubled class beats .pick-menu.open, which is otherwise equally specific
       and comes earlier. */
    .menu-right {
      left: auto;
      right: 0;
    }
    .menu-right.menu-right.open {
      max-height: 104px;
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
    /* The bar is a 16px-tall grab target with the 6px rail drawn inside it. A
       6px target is fine for a finger on the content itself, which scrolls
       directly, but it is a miserable thing to hit with a mouse - and this is
       the only way to scroll with one, since the native bar is hidden. */
    .hbar {
      position: absolute;
      left: var(--rday-w);
      right: 0;
      bottom: -8px;
      height: 16px;
      cursor: pointer;
      touch-action: none;
    }
    /* The rail, so the bar reads as something you can aim at rather than a lone
       floating thumb. Drawn on the bar's own box, centred in the grab area. */
    .hbar::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 5px;
      height: 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.08);
    }
    .hthumb {
      position: absolute;
      top: 5px;
      height: 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.42);
      cursor: grab;
    }
    .hbar:hover .hthumb {
      background: rgba(255, 255, 255, 0.6);
    }
    /* On the BAR, not the thumb: during a drag the pointer is captured by the
       bar and routinely leaves the thumb, and the cursor has to stay grabbing. */
    .hbar.dragging {
      cursor: grabbing;
    }
    .hbar.dragging .hthumb {
      cursor: grabbing;
      background: rgba(255, 255, 255, 0.75);
    }

    .rgrid.dir-fwd .rframe {
      animation: inFromRight var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    .rgrid.dir-back .rframe {
      animation: inFromLeft var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    .list.dir-fwd {
      animation: listInRight var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    .list.dir-back {
      animation: listInLeft var(--ssc-week-dur) var(--ssc-week-ease) both;
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

    /* ---- press-and-hold on empty space ------------------------------- *
     *
     * Half a second is a long time to hold something that gives nothing back,
     * so the slot draws itself while the finger is down: it is the only signal
     * that the press has been noticed AND the only preview of where the event
     * will land. It fills as the hold completes, so letting go early visibly
     * abandons something rather than silently doing nothing.
     *
     * Selection and the long-press callout are off in edit mode only. Outside
     * it the grid is ordinary text again, and turning either off globally would
     * make the card the one thing on the dashboard you cannot copy out of.
     */
    .rgrid.editing .rcanvas,
    .rgrid.editing .rday,
    .grid.editing .day,
    .grid.editing .dayhead,
    .list.editing .ld-head {
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
      cursor: cell;
    }
    /* Every day label is a press target, and each holds its own overlay. */
    .rday,
    .dayhead {
      position: relative;
    }
    .press-ghost {
      position: absolute;
      z-index: 2;
      box-sizing: border-box;
      pointer-events: none;
      background: rgba(255, 255, 255, 0.14);
      border: 2px solid var(--ssc-fg, #fff);
      /* animation-duration comes inline, off the same constant the timer uses -
         the fill has to finish exactly when the sheet opens, not near it. */
      animation-name: pressHold;
      animation-timing-function: cubic-bezier(0.33, 0, 0.2, 1);
      animation-fill-mode: both;
    }
    /* Fills the day label that is being held — the cell down the left of the
       transposed grid, the heading across the top of the other one, or the day
       heading in the list. It never covers the timeline beside it: what is
       being claimed is the DAY, and the time comes from the clock. */
    /* height:100%, not inset:0. Measured: with top and bottom both zero the box
       came out 6px short — the heading's bottom padding — while height:100%
       resolves against the full padding box every time. Do not "simplify" this
       back to inset. */
    .press-ghost.head {
      top: 0;
      left: 0;
      right: 0;
      height: 100%;
    }
    @keyframes pressHold {
      0% {
        opacity: 0;
        transform: scale(0.86);
      }
      45% {
        opacity: 0.5;
        transform: scale(1);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
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
    /* The fold: the lattice arrives slightly small and settles to size as it
       fades up, which is what stops a pure slide reading as a jump cut. Paired
       with the imperative fade-out in _navigate - the week goes one way, the
       next one comes from the other. */
    @keyframes inFromRight {
      from {
        opacity: 0;
        transform: translateX(30px) scale(0.985);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes inFromLeft {
      from {
        opacity: 0;
        transform: translateX(-30px) scale(0.985);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    /* The week range travels with the schedule, but a short distance and on its
       own timing. It is one line of text a few centimetres wide: the lattice's
       30px reads as a slide there and as a lurch here.

       Deliberately SHORTER than --ssc-week-dur. The dir class is cleared by the
       content's own animationend, so an animation that outlasted it would have
       the class pulled out from under it mid-move; finishing first means the
       clear lands on an element already at rest. */
    .range.dir-fwd {
      animation: rangeInRight 420ms var(--ssc-week-ease) both;
    }
    .range.dir-back {
      animation: rangeInLeft 420ms var(--ssc-week-ease) both;
    }
    @keyframes rangeInRight {
      from {
        opacity: 0;
        transform: translateX(14px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes rangeInLeft {
      from {
        opacity: 0;
        transform: translateX(-14px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    /* The shared 30px nudge is invisible across a full-width list, where it was
       reported as almost undetectable. The list gets a real slide of its own,
       without disturbing the grid that shares inFromRight/inFromLeft. */
    @keyframes listInRight {
      from {
        opacity: 0;
        transform: translateX(34%) scale(0.985);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes listInLeft {
      from {
        opacity: 0;
        transform: translateX(-34%) scale(0.985);
      }
      to {
        opacity: 1;
        transform: none;
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
      display: block;
      padding: 6px 10px;
      margin: 0 -10px 4px;
      /* Holds the press overlay, which fills it. */
      position: relative;
    }
    .ld-head-in {
      display: flex;
      align-items: baseline;
      gap: 8px;
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
      /* BACKWARDS, not both. Both pins the end state after the animation, which
         outranks the rubber band's transform and leaves the sheet unable to
         move — the same trap the event blocks hit. */
      animation: sheetIn 460ms var(--ssc-block-ease) backwards;
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

    /* ---- the edit form -------------------------------------------------
       Shaped like an iOS grouped list - labelled rows in banded groups, the
       actions last - but SQUARE, because nothing in this card has a rounded
       corner and one rounded box here would read as a mistake. Wider than the
       read-only sheet, and scrollable, because a form has to fit a phone in
       landscape with a keyboard over half of it. */
    .sheet.editor {
      width: 520px;
      max-width: 94vw;
      max-height: 90vh;
      overflow-y: auto;
      padding: 16px 18px 18px;
      /* Stops a scroll that reaches the end of this box from continuing into
         the week behind it. The case where the box does not scroll AT ALL is
         not this property's to solve - see _onDragMove. */
      overscroll-behavior: contain;
    }
    /* The rubber band. The offset is written straight to the element during the
       drag, with no transition, and the class is added on release so the spring
       is the only animated part of the gesture. */
    .sheet.editor,
    .recmodal {
      transform: translateY(var(--rubber, 0px));
    }
    .sheet.editor.springing,
    .recmodal.springing {
      transition: transform 520ms var(--ssc-spring);
    }
    .panel.reduce ~ .scrim .sheet.editor.springing,
    .panel.reduce ~ .scrim .recmodal.springing {
      transition: none;
    }
    .ed-title {
      width: 100%;
      box-sizing: border-box;
      background: transparent;
      border: none;
      border-bottom: 1px solid var(--ssc-line-strong);
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.3px;
      padding: 2px 0 10px;
      outline: none;
    }
    .ed-title:focus {
      border-bottom-color: var(--accent);
    }
    .ed-group {
      margin-top: 16px;
      background: var(--ssc-band);
    }
    .ed-head {
      padding: 10px 12px 9px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      opacity: 0.75;
    }
    .ed-row {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 44px;
      padding: 6px 12px;
      border-top: 1px solid var(--ssc-line);
    }
    /* The group's first row sits against the heading or the group edge, so it
       needs no rule above it. */
    .ed-row:first-child,
    .ed-head + .ed-row {
      border-top: none;
    }
    .ed-lbl {
      flex: 0 0 auto;
      min-width: 78px;
      font-size: 15px;
      font-weight: 600;
    }
    .ed-vals {
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      min-width: 0;
    }
    /* No flex gap on a picker row: the time chip carries its own margin so the
       space between the two chips can collapse with the chip itself. A class
       rather than :has(), which iOS Safari only learned in 15.4 and this has to
       work on whatever phone is in the house. */
    .ed-vals.picks {
      gap: 0;
    }
    /* The tappable value on a date or time row — iOS's grey value chip, square.
       44px tall because this is the control a finger actually aims at. */
    .ed-chip {
      border: 1px solid transparent;
      background: rgba(255, 255, 255, 0.09);
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 15px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      padding: 0 14px;
      min-height: 40px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s ease;
    }
    .ed-chip:hover {
      background: rgba(255, 255, 255, 0.14);
    }
    /* Open, and showing its picker below. Inverted rather than merely tinted, so
       which of the four rows you are editing is never in question. */
    .ed-chip.on {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    /* The time chip collapses rather than disappearing when all-day goes on, so
       both directions can spring. Everything that contributes to its width has
       to be in the transition — max-width alone leaves the padding and the flex
       gap behind, and the row jumps by the difference. */
    .ed-chip.time {
      margin-left: 8px;
      max-width: 160px;
      overflow: hidden;
      white-space: nowrap;
      transform-origin: right center;
      transition:
        max-width 0.4s var(--ssc-spring),
        padding 0.4s var(--ssc-spring),
        margin 0.4s var(--ssc-spring),
        opacity 0.26s ease,
        transform 0.4s var(--ssc-spring);
    }
    .ed-chip.time .chip-in {
      display: block;
    }
    .ed-chip.time.gone {
      max-width: 0;
      padding-left: 0;
      padding-right: 0;
      margin-left: 0;
      border-width: 0;
      opacity: 0;
      transform: scale(0.6);
      pointer-events: none;
    }
    /* Two animations, not one. The OUTER box opens the space it needs on a
       plain ease, because height overshooting would shove the rest of the form
       up and back; the INNER content drops in on the overshooting spring, which
       is where the elastic settle actually belongs. Running the spring on the
       height instead looks like a glitch. */
    .ed-picker {
      border-top: 1px solid var(--ssc-line);
      background: rgba(0, 0, 0, 0.18);
      overflow: hidden;
      animation: pickerOpen 260ms var(--ssc-week-ease) both;
    }
    .ed-picker > * {
      animation: pickerDrop 420ms var(--ssc-spring) both;
    }
    @keyframes pickerOpen {
      from {
        max-height: 0;
        opacity: 0;
      }
      to {
        max-height: 460px;
        opacity: 1;
      }
    }
    @keyframes pickerDrop {
      from {
        transform: translateY(-14px) scale(0.94);
        opacity: 0;
      }
      to {
        transform: none;
        opacity: 1;
      }
    }

    /* ---- month grid ---- */
    .cal {
      padding: 8px 10px 12px;
    }
    .cal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .cal-month {
      font-size: 16px;
      font-weight: 700;
    }
    .cal-nav {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border: none;
      background: transparent;
      color: var(--ssc-fg);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .cal-nav:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .cal-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      margin-top: 6px;
    }
    /* The month arriving. Two names for one animation so that alternating them
       restarts it on every step - see _stepMonth. The offset comes in as a
       custom property, signed by the direction of travel, so a month stepped
       forward slides in from the right and back from the left. */
    .cal-month,
    .cal-day {
      animation-duration: 300ms;
      animation-timing-function: var(--ssc-block-ease);
      animation-fill-mode: backwards;
    }
    @keyframes calDayA {
      from {
        opacity: 0;
        transform: translateX(var(--cal-from, 0px));
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes calDayB {
      from {
        opacity: 0;
        transform: translateX(var(--cal-from, 0px));
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    .cal-dow {
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      opacity: 0.6;
      padding-bottom: 4px;
    }
    /* 40px square: the smallest a day can be and still be hit reliably with a
       thumb, which is the whole reason this replaced the native picker. */
    .cal-day {
      min-height: 40px;
      border: none;
      background: transparent;
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 15px;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .cal-day:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .cal-day.today {
      font-weight: 700;
      box-shadow: inset 0 0 0 1px var(--ssc-line-strong);
    }
    .cal-day.sel {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
      font-weight: 700;
    }

    /* ---- time drum ----
       Two scroll-snap columns with a fixed band across the middle. The padding
       rows are what let the first and last values reach the centre. */
    .wheel {
      position: relative;
      display: flex;
      align-items: stretch;
      justify-content: center;
      gap: 6px;
      height: var(--wheel-h);
      padding: 0 10px;
    }
    .wheel-band {
      position: absolute;
      left: 10px;
      right: 10px;
      top: calc(50% - 22px);
      height: 44px;
      background: rgba(255, 255, 255, 0.08);
      pointer-events: none;
    }
    .wheel-col {
      flex: 0 1 120px;
      overflow-y: scroll;
      scroll-snap-type: y mandatory;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      text-align: center;
    }
    .wheel-col::-webkit-scrollbar {
      display: none;
    }
    .wheel-pad {
      height: calc(var(--wheel-h) / 2 - 22px);
    }
    .wheel-item {
      height: 44px;
      line-height: 44px;
      scroll-snap-align: center;
      /* A row is a target, not just something to drag past — see _spinWheel. */
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      font-size: 20px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      opacity: 0.45;
      transition: opacity 0.15s ease;
    }
    .wheel-item:hover {
      opacity: 0.8;
    }
    .wheel-item.sel {
      opacity: 1;
      font-weight: 700;
    }
    .wheel-sep {
      align-self: center;
      font-size: 20px;
      font-weight: 700;
      opacity: 0.5;
    }

    /* ---- colour swatches, Google's shape ----
       ROUND, which is the one place this card breaks its own no-radius rule:
       the palette is lifted from Google Calendar deliberately, so that it is
       recognisably the same control, and a grid of squares is not it. */
    /* Six across, at roughly Google's own size. They were 42px, which on a
       12-swatch grid dominated the form; the grid is a glance-and-tap target,
       not the point of the screen. */
    .sw-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 10px;
      padding: 12px;
      justify-items: center;
    }
    .sw {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: none;
      padding: 0;
      display: grid;
      place-items: center;
      background: var(--sw, transparent);
      color: #fff;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition:
        transform 0.2s var(--ssc-spring),
        box-shadow 0.2s ease;
    }
    .sw:hover {
      transform: scale(1.08);
    }
    .sw:active {
      transform: scale(0.94);
    }
    .sw ha-icon {
      --mdc-icon-size: 17px;
      /* A tick has to read on banana as well as on tomato. */
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45));
    }
    /* "Whatever the calendar is" — an outline, because it is the ABSENCE of an
       override rather than a twelfth colour. Google's picker puts a + here; this
       is not adding anything, so a slashed ring says it better. */
    .sw.none {
      box-shadow: inset 0 0 0 2px var(--ssc-line-strong);
      color: var(--ssc-fg);
      position: relative;
      overflow: hidden;
    }
    .sw.none::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom right,
        transparent calc(50% - 1px),
        var(--ssc-line-strong) calc(50% - 1px),
        var(--ssc-line-strong) calc(50% + 1px),
        transparent calc(50% + 1px)
      );
    }
    .sw.none.sel::after {
      display: none;
    }
    .sw.sel {
      box-shadow: 0 0 0 2px var(--ha-card-background, #1c1c1e), 0 0 0 4px var(--ssc-fg);
    }

    /* ---- the foldable groups ----
       Content stays mounted and collapses, so both directions animate. The
       height rides a plain ease while the CONTENT springs: a height that
       overshoots shoves everything below it and snaps back, which reads as a
       bug, whereas content that overshoots reads as weight. */
    .ed-fold {
      max-height: 0;
      opacity: 0;
      overflow: hidden;
      transition:
        max-height 0.36s var(--ssc-week-ease),
        opacity 0.2s ease;
    }
    .ed-fold.open {
      max-height: 320px;
      opacity: 1;
    }
    /* A fold that can hold an open month grid. max-height is a ceiling, not the
       height, so the only cost of a generous one is that the CLIP finishes
       early - and the spring on .ed-fold-in is what the eye is following. */
    .ed-fold.tall.open {
      max-height: 680px;
    }
    .ed-fold-in {
      transform: translateY(-12px) scale(0.96);
      opacity: 0;
      transition:
        transform 0.44s var(--ssc-spring),
        opacity 0.3s ease;
    }
    .ed-fold.open .ed-fold-in {
      transform: none;
      opacity: 1;
    }
    /* Springs too, rather than turning on a linear ease — it is the one part of
       the row that moves, so it carries the whole gesture. */
    .ed-chev {
      transition: transform 0.44s var(--ssc-spring);
    }

    /* ---- location lookup and its map ---- */
    .ed-row.loc .ed-vals {
      gap: 8px;
    }
    .ed-mapbtn {
      flex: 0 0 auto;
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border: none;
      background: rgba(255, 255, 255, 0.09);
      color: var(--ssc-fg);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition:
        background 0.2s ease,
        transform 0.3s var(--ssc-spring);
    }
    .ed-mapbtn:hover {
      background: rgba(255, 255, 255, 0.16);
    }
    .ed-mapbtn.on {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
      transform: scale(1.06);
    }
    .ed-mapbtn[disabled] {
      opacity: 0.4;
      cursor: default;
    }
    .loc-list {
      display: flex;
      flex-direction: column;
      border-top: 1px solid var(--ssc-line);
      background: rgba(0, 0, 0, 0.18);
      animation: pickerOpen 260ms var(--ssc-week-ease) both;
      overflow: hidden;
    }
    .loc-item {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 48px;
      padding: 8px 12px;
      border: none;
      border-bottom: 1px solid var(--ssc-line);
      background: transparent;
      color: var(--ssc-fg);
      font: inherit;
      text-align: left;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s ease;
    }
    .loc-item:last-child {
      border-bottom: none;
    }
    .loc-item:hover {
      background: rgba(255, 255, 255, 0.07);
    }
    .loc-item ha-icon {
      flex: 0 0 auto;
      --mdc-icon-size: 20px;
      opacity: 0.6;
    }
    .loc-text {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .loc-name {
      font-size: 15px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .loc-detail {
      font-size: 13px;
      opacity: 0.65;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* The preview. Tiles are absolutely placed inside a clipped box — no map
       library, because the only interaction is "look at it", and Home
       Assistant's own Leaflet comes with CARTO tiles that are stamped
       "API KEY REQUIRED" right across them (verified by rendering ha-map).
       Esri needs no key. */
    .map {
      position: relative;
      height: var(--map-h, 170px);
      overflow: hidden;
      background: #1a1a1e;
    }
    .map-layer {
      position: absolute;
      inset: 0;
    }
    /* Esri's "Dark Gray" basemap is a MID grey — against a card on rgb(32,27,37)
       it reads as a bright slab dropped into the form. Pulled down to the card's
       own darkness, with the label layer pushed the other way so street names
       stay readable through it. */
    .map-layer img {
      position: absolute;
      width: 256px;
      height: 256px;
      filter: brightness(0.42) contrast(1.15) saturate(0.8);
    }
    .map-layer.labels img {
      filter: brightness(1.25) contrast(1.1);
    }
    .map-pin {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 14px;
      height: 14px;
      margin: -7px 0 0 -7px;
      border-radius: 50%;
      background: rgba(255, 71, 51, 1);
      box-shadow:
        0 0 0 3px rgba(255, 255, 255, 0.9),
        0 2px 8px rgba(0, 0, 0, 0.6);
      animation: pinDrop 460ms var(--ssc-spring) both;
    }
    @keyframes pinDrop {
      from {
        transform: translateY(-16px) scale(0.4);
        opacity: 0;
      }
      to {
        transform: none;
        opacity: 1;
      }
    }
    .map-open {
      position: absolute;
      right: 8px;
      top: 8px;
      z-index: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 10px;
      background: rgba(0, 0, 0, 0.72);
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
    }
    .map-open ha-icon {
      --mdc-icon-size: 16px;
    }
    .map-none {
      padding: 18px 12px;
      font-size: 14px;
      opacity: 0.7;
    }

    /* ---- the location picker window ----
       Its own window, not a panel inside the form. Choosing a place on a map is
       a task in itself and it needs room: the inline version was 505x360 and you
       could not get your bearings in it. */
    /* Centred and CAPPED. At inset:3vh 3vw it filled a desktop screen, which put
       its close button right beside the pop-up's own — two X's side by side —
       and made a village map the size of a wall. Big enough to navigate, small
       enough to still read as a window over the card. */
    .mapmodal {
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: min(860px, 92vw);
      height: min(620px, 88vh);
      z-index: 40;
      display: flex;
      flex-direction: column;
      background: var(--ha-card-background, #1c1c1e);
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.7);
      animation: sheetIn 380ms var(--ssc-block-ease) both;
    }
    /* Centred by a FLEX WRAPPER, not by translate(-50%, -50%).
       The window is animated, and a transform keyframe replaces the centring
       one outright — so the panel started each open with its top-left corner ON
       the centre point and flew in from the bottom right. Nothing short of
       repeating the offset in every keyframe fixes that, and then every future
       keyframe has to remember. A wrapper leaves transform free.
       It ignores the pointer so that a tap beside the window still reaches the
       scrim underneath, which is what closes it. */
    .recwrap {
      position: fixed;
      inset: 0;
      z-index: 40;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    /* Sized to its own content rather than to a map: a dialog of six rows has
       no reason to be 620px tall, and Google's is a narrow column. It scrolls
       rather than growing, because the day circles plus an open month grid is
       taller than a phone. */
    .recmodal {
      pointer-events: auto;
      /* Wide enough for "Repeat every [1] [day week month year]" on one line at
         the sizes above; below that .rec-every wraps rather than squashing. */
      width: min(540px, 94vw);
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      background: var(--ha-card-background, #1c1c1e);
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.7);
      transform-origin: center;
      /* BACKWARDS, like the sheet. Fill mode both would pin transform:none
         after the entry and the rubber band could not move it.
         (No backticks in this comment - one ends the css literal.) */
      animation: recIn 420ms var(--ssc-spring) backwards;
    }
    .recwrap.out .recmodal {
      animation: recOut 190ms cubic-bezier(0.4, 0, 1, 1) both;
    }
    /* Rises into place with the overshoot the rest of the card uses, and leaves
       on a plain accelerating ease - an exit that springs reads as arriving. */
    @keyframes recIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(18px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes recOut {
      from {
        opacity: 1;
        transform: none;
      }
      to {
        opacity: 0;
        transform: scale(0.96) translateY(8px);
      }
    }
    .rec-body {
      flex: 1 1 auto;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding-bottom: 4px;
    }
    /* The rule in words, under the controls that built it. Two people have to
       agree here - what you set and what it means - and the second one is the
       only thing that will be true a year from now. */
    .rec-says {
      padding: 14px 12px 4px;
      font-size: 14px;
      font-weight: 600;
      opacity: 0.8;
    }
    /* Collapsed, not dropped, so switching units springs. Same trick as the
       all-day time chip. */
    .rec-days {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.42s var(--ssc-spring);
    }
    .rec-days.open {
      grid-template-rows: 1fr;
    }
    .rec-days-in {
      overflow: hidden;
      min-height: 0;
    }
    .dow-row {
      display: flex;
      gap: 6px;
      padding: 0 12px 10px;
    }
    .dow-btn {
      flex: 1 1 0;
      height: 42px;
      border: 1px solid var(--ssc-line);
      background: transparent;
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition:
        background 0.2s ease,
        transform 0.32s var(--ssc-spring),
        color 0.2s ease;
    }
    .dow-btn.on {
      background: var(--accent);
      border-color: var(--accent);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    .dow-btn:active {
      transform: scale(0.92);
    }
    /* Wraps instead of overlapping. Flex items squashed below their content
       width do not politely shrink here - the stepper is a fixed-size control,
       so the row simply ran the two on top of each other on a narrow card. */
    .rec-every {
      flex-wrap: wrap;
      row-gap: 10px;
    }
    .rec-every .ed-vals {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    /* The unit picker: one control, four states, sized for a finger. */
    .seg {
      display: inline-flex;
      border: 1px solid var(--ssc-line);
    }
    .seg-btn {
      min-width: 52px;
      padding: 0 10px;
      height: 40px;
      border: none;
      border-left: 1px solid var(--ssc-line);
      background: transparent;
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.2s ease;
    }
    .seg-btn:first-child {
      border-left: none;
    }
    /* The accent, exactly as the chosen weekday below it wears it. A grey fill
       reads as "disabled" sitting directly above a pink one, which is the
       opposite of what it means. */
    .seg-btn.on {
      background: var(--accent);
      border-color: var(--accent);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    .stepper {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--ssc-line);
    }
    .st-btn {
      width: 40px;
      height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: var(--ssc-fg);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.2s ease, opacity 0.2s ease;
    }
    .st-btn ha-icon {
      --mdc-icon-size: 18px;
    }
    .st-btn[disabled] {
      opacity: 0.3;
      cursor: default;
    }
    .st-val {
      width: 44px;
      height: 40px;
      border: none;
      border-left: 1px solid var(--ssc-line);
      border-right: 1px solid var(--ssc-line);
      background: transparent;
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 16px;
      font-weight: 700;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
    /* The number is the value the row is about, so it carries the accent too —
       but only while the row it sits in is the live one. The occurrence count
       under an unselected "After" is a number nothing is using. */
    .stepper.on .st-val {
      background: var(--accent);
      color: var(--ssc-today-cell-fg, #16161a);
      border-color: var(--accent);
      font-weight: 700;
    }
    .st-val:focus {
      outline: none;
    }
    .stepper:not(.on) .st-val:focus {
      background: rgba(255, 255, 255, 0.07);
    }
    /* The two Ends rows that carry a control: a DIV, because the value inside
       them is its own button and a button inside a button is not markup. The
       whole row is the target all the same — see the handlers. */
    .ed-row.scope.ends {
      display: flex;
      gap: 10px;
      cursor: pointer;
    }
    .ed-row.scope.ends .ed-lbl {
      flex: 1 1 auto;
      min-width: 0;
    }
    /* Wrapper whose only job is to swallow clicks bound for the row. */
    .stop {
      display: inline-flex;
      align-items: center;
    }
    .ed-sub.occ {
      flex: 0 0 auto;
    }
    /* The Custom row ends in an icon where every row above it ends in a radio,
       and the radio is what carries the margin that pushes it there. */
    .ed-row.scope .ed-chev {
      margin-left: auto;
    }
    /* The form stays put underneath but stops competing for attention. */
    .sheet.editor.behind {
      opacity: 0.25;
      pointer-events: none;
    }
    .mm-head {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 10px 12px 16px;
      border-bottom: 1px solid var(--ssc-line);
    }
    .mm-title {
      flex: 1 1 auto;
      font-size: 17px;
      font-weight: 700;
    }
    .mm-close {
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      border: none;
      background: transparent;
      color: var(--ssc-fg);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .mm-close:hover {
      background: rgba(255, 255, 255, 0.09);
    }
    /* The map takes every pixel left over. */
    .mm-body {
      flex: 1 1 auto;
      min-height: 0;
      position: relative;
    }
    .mm-body .map {
      position: absolute;
      inset: 0;
      height: auto;
    }
    .mm-foot {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-top: 1px solid var(--ssc-line);
    }
    .mm-addr {
      flex: 1 1 auto;
      min-width: 0;
      font-size: 14px;
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .ed-btn.small ha-icon {
      --mdc-icon-size: 18px;
    }
    a.ed-btn {
      display: grid;
      place-items: center;
      text-decoration: none;
    }
    /* ---- the interactive version ---- */
    .map-canvas {
      position: absolute;
      inset: 0;
    }
    /* NO filter on the live map's tiles. Tinting them to match the card was
       what made it unreadable: on a basemap that is already sparse, dropping it
       to 46% brightness leaves nothing to recognise a place by. A map has to be
       legible before it has to be on-brand. */
    .map.live .leaflet-control-zoom a {
      background: rgba(0, 0, 0, 0.72);
      color: #fff;
      border: none;
    }
    .map.live .leaflet-control-zoom a:hover {
      background: rgba(0, 0, 0, 0.88);
    }
    /* The dropped pin. Draggable, so unlike the static preview's pin it must
       NOT ignore the pointer. */
    .ssc-pin {
      display: grid;
      place-items: center;
      cursor: grab;
    }
    .ssc-pin:active {
      cursor: grabbing;
    }
    .ssc-pin span {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: rgba(255, 71, 51, 1);
      box-shadow:
        0 0 0 3px rgba(255, 255, 255, 0.92),
        0 2px 8px rgba(0, 0, 0, 0.65);
      animation: pinDrop 380ms var(--ssc-spring) both;
    }
    .map.live .leaflet-container {
      cursor: crosshair;
    }
    /* The maps link lives at the TOP right: the form's action bar is sticky and
       overlays the bottom of the map whenever the sheet is not scrolled all the
       way down, which hid anything placed there. */
    /* Attribution, as Esri's terms require. */
    .map-credit {
      position: absolute;
      left: 8px;
      bottom: 8px;
      z-index: 500;
      padding: 3px 7px;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      font-size: 11px;
      pointer-events: none;
    }
    .map-addr {
      flex: 1 1 auto;
      min-width: 0;
      font-size: 13px;
      line-height: 1.3;
      opacity: 0.8;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .ed-btn.small {
      flex: 0 0 auto;
      min-height: 36px;
      padding: 8px 12px;
      font-size: 14px;
    }

    /* ---- the details disclosure ---- */
    .ed-disclose {
      width: 100%;
      box-sizing: border-box;
      border: none;
      background: transparent;
      color: var(--ssc-fg);
      font-family: inherit;
      text-align: left;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .ed-sub {
      flex: 1 1 auto;
      min-width: 0;
      text-align: right;
      font-size: 14px;
      opacity: 0.6;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ed-chev {
      flex: 0 0 auto;
      --mdc-icon-size: 22px;
      opacity: 0.7;
    }
    .ed-chev.open {
      transform: rotate(180deg);
    }

    /* One rule for every text-ish control in the form. The dark scheme is set
       explicitly so any native control comes up dark too, rather than flashing a
       white panel over a dark card. */
    .ed-vals input,
    .ed-row textarea {
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid transparent;
      color: var(--ssc-fg);
      color-scheme: dark;
      font-family: inherit;
      font-size: 15px;
      padding: 7px 9px;
      min-width: 0;
      outline: none;
    }
    .ed-vals input[type='text'] {
      flex: 1 1 auto;
    }
    .ed-vals input:focus,
    .ed-row textarea:focus {
      border-color: var(--accent);
    }
    .ed-row.notes {
      align-items: flex-start;
      padding-top: 10px;
    }
    .ed-row.notes .ed-lbl {
      padding-top: 8px;
    }
    .ed-row textarea {
      flex: 1 1 auto;
      resize: vertical;
      line-height: 1.35;
    }
    .ed-check {
      margin-left: auto;
      width: 20px;
      height: 20px;
      accent-color: var(--accent);
    }
    .ed-row.scope {
      cursor: pointer;
      width: 100%;
      box-sizing: border-box;
      border: none;
      border-top: 1px solid var(--ssc-line);
      background: transparent;
      color: var(--ssc-fg);
      font: inherit;
      text-align: left;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.28s var(--ssc-week-ease);
    }
    .ed-row.scope {
      position: relative;
      overflow: hidden;
    }
    .ed-row.scope.sel {
      background: rgba(255, 255, 255, 0.07);
    }
    /* A bar that wipes down the left edge of the chosen row. This is the part
       that carries the change at a glance — a dot 20px wide at the far right of
       a 400px row is not something the eye catches, however well it springs. */
    .ed-row.scope::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--accent);
      transform: scaleY(0);
      transform-origin: top center;
      transition: transform 0.42s var(--ssc-spring);
    }
    .ed-row.scope.sel::before {
      transform: scaleY(1);
    }
    /* And the label leans in with it. */
    .ed-row.scope .ed-lbl {
      transition:
        transform 0.42s var(--ssc-spring),
        font-weight 0.2s ease;
    }
    .ed-row.scope.sel .ed-lbl {
      transform: translateX(6px);
      font-weight: 700;
    }
    .radio {
      margin-left: auto;
      flex: 0 0 auto;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      box-shadow: inset 0 0 0 2px var(--ssc-line-strong);
      transition:
        box-shadow 0.3s var(--ssc-week-ease),
        transform 0.42s var(--ssc-spring);
    }
    .scope.sel .radio {
      box-shadow: inset 0 0 0 2px var(--accent);
      transform: scale(1.12);
    }
    /* Springs in from nothing and settles past full size. Bigger than before,
       and it rotates as it lands so the arrival has some weight to it. */
    .radio-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--accent);
      transform: scale(0) rotate(-90deg);
      transition: transform 0.46s var(--ssc-spring);
    }
    .scope.sel .radio-dot {
      transform: scale(1) rotate(0deg);
    }
    /* Says in words what the chosen scope will do. The three options differ by
       exactly one word otherwise, and "future" is the one nobody should have to
       guess about - it cannot be undone. */
    /* Ruled off, or it reads as a caption belonging to the last option rather
       than to whichever one is selected. */
    .ed-note {
      padding: 9px 12px 10px;
      border-top: 1px solid var(--ssc-line);
      font-size: 13px;
      line-height: 1.35;
      opacity: 0.8;
      animation: noteIn 360ms var(--ssc-spring) both;
    }
    @keyframes noteIn {
      from {
        opacity: 0;
        transform: translateY(-6px);
      }
      to {
        opacity: 0.8;
        transform: none;
      }
    }
    .ed-error {
      margin-top: 14px;
      padding: 10px 12px;
      background: rgba(255, 71, 51, 0.16);
      border-left: 3px solid rgba(255, 71, 51, 1);
      font-size: 14px;
      line-height: 1.35;
    }
    /* Pinned to the bottom of the sheet, not the bottom of the content. The form
       is taller than a phone once the recurrence options are in it, and Save
       scrolling off the screen is the one thing a form must never do. The
       negative offset and matching padding cancel the sheet's own bottom
       padding, so it sits flush against the edge rather than floating. */
    .ed-actions {
      position: sticky;
      bottom: -18px;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 18px;
      padding: 10px 0 18px;
      background: var(--ha-card-background, #1c1c1e);
      box-shadow: 0 -10px 14px -6px var(--ha-card-background, #1c1c1e);
    }
    .ed-spacer {
      flex: 1 1 auto;
    }
    .ed-btn {
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 15px;
      font-weight: 600;
      padding: 11px 16px;
      min-height: 44px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s ease;
    }
    .ed-btn:hover {
      background: rgba(255, 255, 255, 0.16);
    }
    .ed-btn[disabled] {
      opacity: 0.5;
      cursor: default;
    }
    /* The same inversion today's heading and the armed week pill use — NOT the
       event's accent. The accent is whatever colour the calendar happens to be,
       and on a red calendar it made Save and Delete the same colour: the one
       pair of buttons in the card that must never be confused for each other. */
    .ed-btn.primary {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
      font-weight: 700;
    }
    .ed-btn.danger {
      background: transparent;
      color: rgba(255, 71, 51, 1);
    }
    /* Armed, after the first press. Filled rather than merely re-labelled: the
       second press is the irreversible one and it should not look like the
       first. */
    .ed-btn.danger.armed {
      background: rgba(255, 71, 51, 1);
      color: #fff;
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

    /* Stillness, gated on a CLASS rather than straight on the media query.

       As a bare @media block there was no way to opt back in: a machine whose OS
       has animations turned off system-wide got a card with no week transition
       and a refresh button whose spinner never span, and no amount of config
       could bring them back. .reduce is put on by _reducedMotion, which reads
       the media query but lets animations:always overrule it.
       (No backticks in this comment: one ends the css template literal.) */
    .panel.reduce .ev,
    .panel.reduce .lr,
    .panel.reduce .sheet,
    .panel.reduce .scrim,
    .panel.reduce .grid.dir-fwd .body,
    .panel.reduce .grid.dir-fwd .hdr,
    .panel.reduce .grid.dir-back .body,
    .panel.reduce .grid.dir-back .hdr,
    .panel.reduce .rgrid.dir-fwd .rframe,
    .panel.reduce .rgrid.dir-back .rframe,
    .panel.reduce .list.dir-fwd,
    .panel.reduce .list.dir-back,
    .panel.reduce .range.dir-fwd,
    .panel.reduce .range.dir-back {
      animation: none;
    }
    .panel.reduce .btn.spin ha-icon {
      animation: none;
    }
    /* The edit form's own motion, off with everything else. The chip keeps its
       collapse - it is a layout change, not a flourish - but loses the spring. */
    .panel.reduce ~ .sheet .ed-picker,
    .panel.reduce ~ .sheet .ed-picker > *,
    .panel.reduce ~ .scrim .ed-picker,
    .panel.reduce ~ .scrim .ed-picker > *,
    .panel.reduce ~ .scrim .ed-note,
    .panel.reduce ~ .scrim .cal-day,
    .panel.reduce ~ .scrim .cal-month,
    .panel.reduce ~ .scrim .recmodal,
    .panel.reduce .edit-pill,
    .panel.reduce .add-pill {
      animation: none;
    }
    /* The press ghost keeps its job without the growth: it is an affordance, not
       a flourish, and a press with no feedback at all reads as a dead card. */
    .panel.reduce .press-ghost {
      animation: none;
      opacity: 1;
    }
    .panel.reduce ~ .scrim .radio-dot,
    .panel.reduce ~ .scrim .ed-fold,
    .panel.reduce ~ .scrim .ed-fold-in,
    .panel.reduce ~ .scrim .ed-chip.time,
    .panel.reduce .menu-right {
      transition: none;
    }
    .panel.reduce .ev-in {
      transition: none;
    }
  `;
g([
  ct({ attribute: !1 })
], m.prototype, "hass", 2);
g([
  _()
], m.prototype, "_config", 2);
g([
  _()
], m.prototype, "_sources", 2);
g([
  _()
], m.prototype, "_colors", 2);
g([
  _()
], m.prototype, "_eventColors", 2);
g([
  _()
], m.prototype, "_weekOffset", 2);
g([
  _()
], m.prototype, "_now", 2);
g([
  _()
], m.prototype, "_hostWidth", 2);
g([
  _()
], m.prototype, "_refreshing", 2);
g([
  _()
], m.prototype, "_selected", 2);
g([
  _()
], m.prototype, "_navDir", 2);
g([
  _()
], m.prototype, "_activeIdx", 2);
g([
  _()
], m.prototype, "_modeOverride", 2);
g([
  _()
], m.prototype, "_pickerOpen", 2);
g([
  _()
], m.prototype, "_animEpoch", 2);
g([
  _()
], m.prototype, "_hThumb", 2);
g([
  _()
], m.prototype, "_axisPx", 2);
g([
  _()
], m.prototype, "_editMode", 2);
g([
  _()
], m.prototype, "_menuOpen", 2);
g([
  _()
], m.prototype, "_draft", 2);
g([
  _()
], m.prototype, "_scope", 2);
g([
  _()
], m.prototype, "_busy", 2);
g([
  _()
], m.prototype, "_editError", 2);
g([
  _()
], m.prototype, "_confirmDelete", 2);
g([
  _()
], m.prototype, "_press", 2);
g([
  _()
], m.prototype, "_openPicker", 2);
g([
  _()
], m.prototype, "_pickerMonth", 2);
g([
  _()
], m.prototype, "_pickerClosing", 2);
g([
  _()
], m.prototype, "_calDir", 2);
g([
  _()
], m.prototype, "_calEpoch", 2);
g([
  _()
], m.prototype, "_detailsOpen", 2);
g([
  _()
], m.prototype, "_colorOpen", 2);
g([
  _()
], m.prototype, "_repeatOpen", 2);
g([
  _()
], m.prototype, "_customOpen", 2);
g([
  _()
], m.prototype, "_custom", 2);
g([
  _()
], m.prototype, "_customClosing", 2);
g([
  _()
], m.prototype, "_endsOpen", 2);
g([
  _()
], m.prototype, "_places", 2);
g([
  _()
], m.prototype, "_placesBusy", 2);
g([
  _()
], m.prototype, "_mapOpen", 2);
g([
  _()
], m.prototype, "_mapPoint", 2);
g([
  _()
], m.prototype, "_baseMap", 2);
g([
  _()
], m.prototype, "_leafletOk", 2);
g([
  _()
], m.prototype, "_flash", 2);
g([
  _()
], m.prototype, "_flashOut", 2);
g([
  _()
], m.prototype, "_revision", 2);
m = g([
  Gt("simple-schedule-card")
], m);
function Ks(e) {
  const t = e.entities ?? (e.entity ? [e.entity] : []), s = [];
  for (const i of t)
    typeof i == "string" ? s.push({ entity: i }) : i && typeof i.entity == "string" && s.push({ ...i });
  return s;
}
function ie(e, t) {
  return `--accent:${e}; --fill:${dt(e, t)};`;
}
function Xs(e) {
  return e.replace(/(^|\s)(\p{L})/gu, (t, s, i) => s + i.toUpperCase());
}
function it(e) {
  return String(e).padStart(2, "0");
}
const Vs = { one: "st", two: "nd", few: "rd", other: "th" };
function Zs(e, t) {
  if (t && !t.toLowerCase().startsWith("en")) return "";
  try {
    return Vs[new Intl.PluralRules("en", { type: "ordinal" }).select(e)] ?? "";
  } catch {
    return "";
  }
}
function _e(e, t) {
  return e.getFullYear() === t.getFullYear() && e.getMonth() === t.getMonth() && e.getDate() === t.getDate();
}
function nt(e, t) {
  return `${(e - t.start) / (t.end - t.start) * 100}%`;
}
function I(e, t) {
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
  `%c SIMPLE-SCHEDULE-CARD %c v${xs} `,
  "color:#fff;background:#0a84ff;font-weight:700;border-radius:3px 0 0 3px;padding:2px 4px",
  "color:#0a84ff;background:#222;border-radius:0 3px 3px 0;padding:2px 4px"
);
export {
  m as SimpleScheduleCard
};
