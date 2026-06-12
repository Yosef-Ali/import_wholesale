# Shipment Intake — Walkthrough with Your Real Documents

*BuildSupply Pro · Import & Wholesale — a step-by-step guide for entering one import
shipment from your hard-copy customs paperwork. This copy uses your declaration
**4-013659** (Suqian Panda, PVC & Blockboard) as the worked example; every number below
is printed on one of your own documents.*

---

## Before you start

Stack the papers in this order:

1. Commercial Invoice
2. Packing List
3. Customs Declaration (DVP sheet)
4. Freight Invoice (B/L)
5. Clearing / Transitor agent invoice
6. Bank Permit & charge advice
7. Insurance Certificate
8. **Your own hand-made cost sheet — keep it last. You will not type anything from it;
   it is how we check the computer did it right.**

Open the app → sign in → in the left menu under **Buying & Import**, click
**Shipment Intake**.

The strip across the top shows where this step lives in the workflow:
*Purchase Order → **Document Intake** (you are here) → Cost Sheet Review →
Submit → Purchase Receipt.*

Type a shipment title, e.g. `Suqian Panda — PVC & Blockboard`.

---

## 1 · Commercial Invoice  *(pick up invoice V-HY2501)*

| Field on screen | Copy from the paper |
|---|---|
| Commercial Invoice No. | `V-HY2501` |
| Supplier / Exporter | `SUQIAN PANDA INT'L TRADE` |
| Invoice Value (FCY) | `35,144.20` — the grand total **in dollars, not birr** |
| Country of Origin | `China` |

Then one item row per line on the invoice, exactly as printed — description, quantity,
unit price. For this shipment: the three PVC sheet thicknesses (403 / 293 / 26 pcs),
Blockboard (1,795 pcs), Edge Banding (150), each with its printed unit price.

> The grey hint inside each box shows the words to look for on the paper
> ("Invoice No / CI No", "Seller / Exporter", …).

## 2 · Packing List

Nothing to type. Confirm the quantities you just entered (403 / 293 / 26 / 1,795 / 150)
match this paper. If they don't, the invoice was misread — fix it now, while it's cheap.

## 3 · Customs Declaration / DVP sheet  *(declaration 4-013659)*

| Field | Value |
|---|---|
| Declaration No. | `4-013659` |
| TIN | `0053323233` |
| Tax Payer | `MIHRETEAB MELKIE` |
| Customs Base Value (DVP, ETB) | `11,197,355.00` |

Then the six tax amounts straight off the assessment:

| Line | Amount (ETB) |
|---|---|
| Customs Duty Tax (15%/35%) | `1,787,961.70` |
| Sur tax | `73,142.10` |
| Social Welfare Tax (3%) | `319,666.80` |
| Scanning Fee (7%) | `7,837.00` |
| Vat Receivable | `2,006,719.30` |
| Withholding On Customs | `335,920.59` |

> VAT and withholding are recoverable — the screen automatically washes them out of the
> cost. You'll see them appear under "VAT Rebate" and "Withholding Payable" on the right.

## 4 · Freight Invoice

| Field | Value |
|---|---|
| B/L Number | `PENCB25004089` |
| Sea Freight Charge | `1,230,958.62` |

## 5 · Clearing / Transitor Agent Invoice

Eight lines off the agent's bill:

| Line | Amount (ETB) |
|---|---|
| Port Clearance charges (Djibouti) | `281,346.66` |
| Transportation Djibouti → Modjo | `779,934.00` |
| ESLSE Modjo Port/Terminal service | `37,128.95` |
| Transit Cost | `10,000.00` |
| Container Unstuffing | `42,000.00` |
| Transportation Modjo → warehouse | `76,000.00` |
| Demurrage | `13,778.58` |
| Other | `1,175.72` |

## 6 · Bank Permit & Charge Advice  *(permit DSB/DMB/01/03395/2025)*

| Field | Value |
|---|---|
| Bank Permit No. | `DSB/DMB/01/03395/2025` |
| **Exchange Rate (Permit)** | **`134.5121`** — the rate the whole sheet stands on; copy it to the fourth decimal |
| Service Charge On Opening CAD | `184,334.27` |
| Postage/Swift charges/exchange | `128,451.41` |
| Bank Service Charge on Freight & Port | `46,519.16` |
| Bank CPO charges | `957.73` |

## 7 · Insurance Certificate

| Field | Value |
|---|---|
| Insurance | `4,539.12` |

## 8 · The check  *(now pick up your own cost sheet)*

The right-hand panel has been recalculating the whole time. It should now read:

| Panel line | Expected |
|---|---|
| Invoice Price (FOB, ETB) | **4,727,320.14** — the computer multiplied 35,144.20 × 134.5121 itself; nobody typed this |
| **Customs Total (Purchase)** | **14,706,242.42** ← compare with the bottom line of your hand sheet |
| Supplier Payable | 4,727,320.14 |
| Goods in Transit (GIT) | 5,025,731.82 |
| Customs Valuation Var. (CVD) | 4,953,190.46 |
| VAT Rebate (recoverable) | 2,006,719.30 |
| Withholding Payable | 335,920.59 |

**If Customs Total matches your hand sheet's bottom line, the entry is correct.**
Press **Save & open Cost Sheet** — the server recomputes everything independently and
opens the finished sheet with all 26 lines, ready to **Print** on the company letterhead.

---

## Two honest footnotes

- Per-item landed costs are spread in proportion to each item's FOB value, so an
  individual line may differ from your hand sheet by small rounding. **The grand total is
  the contract — and it ties exactly.**
- If any number was mistyped, the check in step 8 simply won't match. Nothing is saved
  until you press the button, so a mismatch costs nothing — find the line, fix it, watch
  the total snap into place.

## The principle

The computer never invents a number. Every figure is copied from a paper you are
holding; the only arithmetic done for you (dollars × rate) is shown as it happens; and
your own cost sheet — the thing you already trust — is the acceptance test.
