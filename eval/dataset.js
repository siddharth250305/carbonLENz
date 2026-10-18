// Hand-labelled evaluation set for the CarbonLenz evidence extractor.
//
// 23 SYNTHETIC supplier declarations (fictional companies, authored by hand), not real supplier certificates.
// They cover the layouts the extractor meets in practice: labelled lists, kg unit conversion, prose emails,
// tables, OCR-style typos, non-English labels, distractor numbers, and internal (unverified) declarations.
// Ground truth is the value a careful human reader would record for each of the 12 Annex VI evidence fields;
// null means the document does not state it (the extractor must NOT guess one).

const FIELDS = [
  'supplier_name', 'product_description', 'quantity_tonnes', 'declared_emissions',
  'verifier_name', 'accreditation_number', 'accrediting_body', 'installation_id',
  'methodology', 'direct_indirect_split', 'reporting_period', 'site_visit_date',
];

const truth = (t) => Object.fromEntries(FIELDS.map((f) => [f, t[f] ?? null]));

export { FIELDS };

export const DATASET = [
  {
    id: 'D01', style: 'labelled, complete',
    text: `Supplier: Meridian Steelworks Pvt Ltd
Product: Galvanised steel sheet (CN 7210 49 00)
Origin: India
Quantity: 2,400 tonnes
Declared emissions: 2.15 tCO2e/t product
Production route: Blast Furnace (BF-BOF)
Direct emissions: 1.90 tCO2e/t
Indirect emissions: 0.25 tCO2e/t
Monitoring methodology: Calculation-based approach
Installation ID: IN-STL-20418
Reporting period: 2025-01-01 to 2025-12-31
Verification: Third-party verified, reasonable assurance
Verifier: Nordic Verification AB
Accreditation number: SWEDAC-1143
Accrediting body: SWEDAC
Site visit: 2026-02-11`,
    truth: truth({
      supplier_name: 'Meridian Steelworks Pvt Ltd', product_description: 'Galvanised steel sheet',
      quantity_tonnes: 2400, declared_emissions: 2.15, verifier_name: 'Nordic Verification AB',
      accreditation_number: 'SWEDAC-1143', accrediting_body: 'SWEDAC', installation_id: 'IN-STL-20418',
      methodology: 'Calculation-based approach', direct_indirect_split: 'Direct 1.90 / Indirect 0.25',
      reporting_period: '2025-01-01 to 2025-12-31', site_visit_date: '2026-02-11',
    }),
  },
  {
    id: 'D02', style: 'labelled, complete, alternative labels, kg units',
    text: `Manufacturer: Dnipro Rolling Mills LLC
Goods: Cold-rolled steel strip (CN code 72091690)
Country of origin: Ukraine
Net mass: 380,000 kg
Specific embedded emissions: 1,120 kgCO2e/t
Process route: Basic Oxygen Furnace
Methodology: Monitoring plan approved by competent authority
Installation ID: UA-DRM-0077
Reporting period: 01/01/2026 - 30/06/2026
Verification: Verified by an independent third party, limited assurance
Verified by: Kyiv Climate Assurance LLC
Accreditation no: NAAU-3302
Accredited by: NAAU
Site visit: 15 July 2026
Direct emissions: 0.95 tCO2e/t
Indirect emissions: 0.17 tCO2e/t`,
    truth: truth({
      supplier_name: 'Dnipro Rolling Mills LLC', product_description: 'Cold-rolled steel strip',
      quantity_tonnes: 380, declared_emissions: 1.12, verifier_name: 'Kyiv Climate Assurance LLC',
      accreditation_number: 'NAAU-3302', accrediting_body: 'NAAU', installation_id: 'UA-DRM-0077',
      methodology: 'Monitoring plan approved by competent authority', direct_indirect_split: 'Direct 0.95 / Indirect 0.17',
      reporting_period: '01/01/2026 - 30/06/2026', site_visit_date: '15 July 2026',
    }),
  },
  {
    id: 'D03', style: 'dash-separated bullets, complete',
    text: `- Company – Anadolu Rebar Sanayi A.Ş.
- Product – Steel reinforcing bar (CN 7214 20 00)
- Origin – Türkiye
- Volume – 5,200 tonnes
- Carbon footprint – 0.43 tCO2e/t
- Production process – Scrap-EAF
- Direct emissions – 0.31
- Indirect emissions – 0.12
- Monitoring approach – Measurement-based, continuous emissions monitoring
- Plant ID – TR-ARS-5521
- Production period – 2026-01-01 to 2026-03-31
- Assurance – Third-party verified, reasonable assurance
- Verification body – Bosphorus Verification Ltd
- Accreditation certificate – TURKAK-AB-0912
- Accredited by – TURKAK
- Site visit – 2026-04-22`,
    truth: truth({
      supplier_name: 'Anadolu Rebar Sanayi A.Ş.', product_description: 'Steel reinforcing bar',
      quantity_tonnes: 5200, declared_emissions: 0.43, verifier_name: 'Bosphorus Verification Ltd',
      accreditation_number: 'TURKAK-AB-0912', accrediting_body: 'TURKAK', installation_id: 'TR-ARS-5521',
      methodology: 'Measurement-based, continuous emissions monitoring', direct_indirect_split: 'Direct 0.31 / Indirect 0.12',
      reporting_period: '2026-01-01 to 2026-03-31', site_visit_date: '2026-04-22',
    }),
  },
  {
    id: 'D04', style: 'internal declaration, minimal',
    text: `Supplier: Shenyang Coil Works Co., Ltd
Product: Hot-rolled steel coil (CN 7208 10 00)
Origin: China
Quantity: 800 tonnes
Declared emissions: 2.3 tCO2e/t product
Production route: Blast Furnace (BF-BOF)
Verification: Internal supplier declaration only`,
    truth: truth({
      supplier_name: 'Shenyang Coil Works Co., Ltd', product_description: 'Hot-rolled steel coil',
      quantity_tonnes: 800, declared_emissions: 2.3,
    }),
  },
  {
    id: 'D05', style: 'partial, unverified',
    text: `Supplier: Pohang Specialty Steel Co., Ltd
Product: Stainless steel plate (CN 7219 11 00)
Origin: South Korea
Quantity: 150 tonnes
Declared emissions: 3.1 tCO2e/t product
Installation ID: KR-PSS-0310
Methodology: Calculation-based approach
Reporting period: 2025
Verification: Not yet verified`,
    truth: truth({
      supplier_name: 'Pohang Specialty Steel Co., Ltd', product_description: 'Stainless steel plate',
      quantity_tonnes: 150, declared_emissions: 3.1, installation_id: 'KR-PSS-0310',
      methodology: 'Calculation-based approach', reporting_period: '2025',
    }),
  },
  {
    id: 'D06', style: 'partial, verifier named but no accrediting body or site visit',
    text: `Supplier: Delta Iron & Steel Egypt SAE
Product: Steel wire rod (CN 7213 91 10)
Origin: Egypt
Quantity: 3,000 tonnes
Declared emissions: 1.45 tCO2e/t
Production route: DRI-EAF
Verification: Third-party verified
Verifier: Cairo Emissions Verification Co.
Accreditation number: EGAC-VB-208
Reporting period: 2025-07-01 to 2025-12-31`,
    truth: truth({
      supplier_name: 'Delta Iron & Steel Egypt SAE', product_description: 'Steel wire rod',
      quantity_tonnes: 3000, declared_emissions: 1.45, verifier_name: 'Cairo Emissions Verification Co.',
      accreditation_number: 'EGAC-VB-208', reporting_period: '2025-07-01 to 2025-12-31',
    }),
  },
  {
    id: 'D07', style: 'kg unit conversion, internal',
    text: `Supplier: Hanoi Metal Works JSC
Product: Hot-rolled steel bar (CN 7228 30 00)
Origin: Vietnam
Quantity: 640,000 kg
Declared emissions: 1,850 kgCO2e/t
Production route: Scrap-EAF
Verification: Internal supplier declaration only`,
    truth: truth({
      supplier_name: 'Hanoi Metal Works JSC', product_description: 'Hot-rolled steel bar',
      quantity_tonnes: 640, declared_emissions: 1.85,
    }),
  },
  {
    id: 'D08', style: 'kg unit conversion, partial, self-declared',
    text: `Producer: Rio Doce Aços S.A.
Goods: Steel billets (CN 7207 11 14)
Country of origin: Brazil
Net mass: 12,500,000 kg
Specific embedded emissions: 2,050 kgCO2e/t
Process route: BF-BOF
Installation ID: BR-RDA-0142
Monitoring methodology: Calculation-based approach per Annex III
Direct emissions: 1.80 tCO2e/t
Indirect emissions: 0.25 tCO2e/t
Reporting period: 2026-01-01 to 2026-06-30
Verification: Self-declared by the producer`,
    truth: truth({
      supplier_name: 'Rio Doce Aços S.A.', product_description: 'Steel billets',
      quantity_tonnes: 12500, declared_emissions: 2.05, installation_id: 'BR-RDA-0142',
      methodology: 'Calculation-based approach per Annex III', direct_indirect_split: 'Direct 1.80 / Indirect 0.25',
      reporting_period: '2026-01-01 to 2026-06-30',
    }),
  },
  {
    id: 'D09', style: 'prose email, internal declaration',
    text: `Hi team,

Please find our CBAM details for the upcoming shipment. We are Karaganda Metallurgical JSC from Kazakhstan and we will ship 4,100 tonnes of hot-rolled steel plate (CN 7208 51 20) next month. Our emissions intensity is 2.6 tCO2e per tonne, made via the blast furnace route. Everything is a self declaration for now, no external verifier has looked at it yet.

Best regards,
Aigerim`,
    truth: truth({
      supplier_name: 'Karaganda Metallurgical JSC', product_description: 'hot-rolled steel plate',
      quantity_tonnes: 4100, declared_emissions: 2.6,
    }),
  },
  {
    id: 'D10', style: 'prose email, verified details in sentences',
    text: `Dear importer,

Following your request, here is the evidence pack for order 4471. Producer: Taiyuan Forge Co., Ltd. (China). The product is forged steel flanges, CN 7307 91 00, quantity 95 tonnes. Embedded emissions are 2.9 tCO2e/t. The data was verified by Shanghai Green Audit Ltd, accreditation number CNAS-V-5530 issued by CNAS, with a site visit on 2026-03-09. Installation ID is CN-TYF-8802.

Kind regards,
Li Wei`,
    truth: truth({
      supplier_name: 'Taiyuan Forge Co., Ltd.', product_description: 'forged steel flanges',
      quantity_tonnes: 95, declared_emissions: 2.9, verifier_name: 'Shanghai Green Audit Ltd',
      accreditation_number: 'CNAS-V-5530', accrediting_body: 'CNAS', installation_id: 'CN-TYF-8802',
      site_visit_date: '2026-03-09',
    }),
  },
  {
    id: 'D11', style: 'prose email, kg in sentence',
    text: `Subject: CBAM data - galvanised coil

Hello,

Quick note from Anatolia Coating about the galvanised coil we are sending (CN 7210 49 00). It is 72,000 kg in total and the footprint is 1,640 kgCO2e per tonne. Route is BF-BOF. Direct emissions are 1.40 and indirect 0.24 tCO2e/t. The reporting period was January to June 2026.

Thanks,
Mehmet`,
    truth: truth({
      supplier_name: 'Anatolia Coating', product_description: 'galvanised coil',
      quantity_tonnes: 72, declared_emissions: 1.64, direct_indirect_split: 'Direct 1.40 / Indirect 0.24',
      reporting_period: 'January to June 2026',
    }),
  },
  {
    id: 'D12', style: 'pipe table',
    text: `SUPPLIER EMISSIONS DECLARATION
| Field | Value |
| Supplier | Pune Forgings Pvt Ltd |
| Product | Steel forgings (CN 7326 19 00) |
| Quantity | 210 tonnes |
| Emissions | 2.7 tCO2e/t |
| Verifier | Mumbai Carbon Verifiers LLP |
| Accreditation number | NABCB-VB-117 |
| Accrediting body | NABCB |
| Site visit | 2026-05-04 |`,
    truth: truth({
      supplier_name: 'Pune Forgings Pvt Ltd', product_description: 'Steel forgings',
      quantity_tonnes: 210, declared_emissions: 2.7, verifier_name: 'Mumbai Carbon Verifiers LLP',
      accreditation_number: 'NABCB-VB-117', accrediting_body: 'NABCB', site_visit_date: '2026-05-04',
    }),
  },
  {
    id: 'D13', style: 'OCR-style typos',
    text: `Suppller: Gujarat Tube Mills Ltd
Producl: Welded steel tubes (CN 7306 30 00)
Orlgin: India
Quantlty: 1,050 tonnes
Declared emlssions: 1.95 tCO2e/t
Verlfication: Internal declaration only`,
    truth: truth({
      supplier_name: 'Gujarat Tube Mills Ltd', product_description: 'Welded steel tubes',
      quantity_tonnes: 1050, declared_emissions: 1.95,
    }),
  },
  {
    id: 'D14', style: 'OCR-style typos, spaced colons',
    text: `Manufacturer : Zhejiang Wire Products Co Ltd
Product description : Steel wire (CN 7217 10 90)
Net rnass : 760 tonnes
Emissions intensity : 2.05 tCO2e/t
Process route : Scrap-EAF
lnstallation ID : CN-ZWP-3310`,
    truth: truth({
      supplier_name: 'Zhejiang Wire Products Co Ltd', product_description: 'Steel wire',
      quantity_tonnes: 760, declared_emissions: 2.05, installation_id: 'CN-ZWP-3310',
    }),
  },
  {
    id: 'D15', style: 'German labels, decimal comma',
    text: `Lieferant: Rheinstahl Walzwerke GmbH
Produkt: Warmgewalzter Stahlcoil (CN 7208 10 00)
Herkunftsland: Serbia
Menge: 1.500 Tonnen
Spezifische Emissionen: 1,70 tCO2e/t
Verifizierung: Interne Erklärung des Lieferanten`,
    truth: truth({
      supplier_name: 'Rheinstahl Walzwerke GmbH', product_description: 'Warmgewalzter Stahlcoil',
      quantity_tonnes: 1500, declared_emissions: 1.7,
    }),
  },
  {
    id: 'D16', style: 'distractor numbers (ordered vs shipped, previous year)',
    text: `Supplier: Nis Steel Export d.o.o.
Product: Steel sections (CN 7216 32 11)
Origin: Serbia
Ordered quantity: 900 tonnes
Shipped quantity: 850 tonnes
Declared emissions: 1.38 tCO2e/t
Production route: Scrap-EAF
Previous year's emissions: 1.52 tCO2e/t
Verification: Internal supplier declaration only`,
    truth: truth({
      supplier_name: 'Nis Steel Export d.o.o.', product_description: 'Steel sections',
      quantity_tonnes: 850, declared_emissions: 1.38,
    }),
  },
  {
    id: 'D17', style: 'verifier label present but value is "none"',
    text: `Supplier: Cairo Fasteners SAE
Product: Steel bolts and nuts (CN 7318 15 90)
Origin: Egypt
Quantity: 48 tonnes
Declared emissions: 2.4 tCO2e/t
Verifier: None – internal declaration
Installation ID: EG-CF-0066`,
    truth: truth({
      supplier_name: 'Cairo Fasteners SAE', product_description: 'Steel bolts and nuts',
      quantity_tonnes: 48, declared_emissions: 2.4, installation_id: 'EG-CF-0066',
    }),
  },
  {
    id: 'D18', style: 'data sheet with phone number and reference distractors, verifier in one line',
    text: `CBAM supplier data sheet – ref 2026/0457
Supplier: Highveld Alloy Steel (Pty) Ltd
Contact: +27 11 555 0142
Product: Alloy steel bars (CN 7228 20 91)
Origin: South Africa
Quantity: 60 tonnes
Declared emissions: 3.4 tCO2e/t
Verification: Verified by Johannesburg Verification Services (Pty) Ltd, accreditation number SANAS-V-0291, accrediting body SANAS
Site visit: 2026-06-17
Installation ID: ZA-HAS-0090`,
    truth: truth({
      supplier_name: 'Highveld Alloy Steel (Pty) Ltd', product_description: 'Alloy steel bars',
      quantity_tonnes: 60, declared_emissions: 3.4, verifier_name: 'Johannesburg Verification Services (Pty) Ltd',
      accreditation_number: 'SANAS-V-0291', accrediting_body: 'SANAS', installation_id: 'ZA-HAS-0090',
      site_visit_date: '2026-06-17',
    }),
  },
  {
    id: 'D19', style: 'unlabelled paragraph report',
    text: `Emissions declaration. Kharkiv Seamless Tubes JSC (Ukraine) declares 330 tonnes of seamless steel pipes, CN 7304 19 10, with embedded emissions of 2.45 tCO2e/t. The Installation ID is UA-KST-0450 and the reporting period is 2025-10-01 to 2025-12-31. Emissions were determined using a calculation-based approach. Direct emissions of 2.10 tCO2e/t and indirect emissions of 0.35 tCO2e/t were reported. No independent verification has been carried out.`,
    truth: truth({
      supplier_name: 'Kharkiv Seamless Tubes JSC', product_description: 'seamless steel pipes',
      quantity_tonnes: 330, declared_emissions: 2.45, installation_id: 'UA-KST-0450',
      methodology: 'calculation-based approach', direct_indirect_split: 'Direct 2.10 / Indirect 0.35',
      reporting_period: '2025-10-01 to 2025-12-31',
    }),
  },
  {
    id: 'D20', style: 'UPPERCASE labelled, complete',
    text: `SUPPLIER: AL JUBAIL STEEL FZE
PRODUCT: STEEL REBAR (CN 7214 20 00)
ORIGIN: UNITED ARAB EMIRATES
QUANTITY: 7,800 TONNES
DECLARED EMISSIONS: 0.52 TCO2E/T
PRODUCTION ROUTE: SCRAP-EAF
INSTALLATION ID: AE-AJS-1204
METHODOLOGY: MEASUREMENT-BASED
REPORTING PERIOD: 2026-01-01 TO 2026-03-31
VERIFICATION: THIRD-PARTY VERIFIED
VERIFIER: GULF CARBON ASSURANCE LLC
ACCREDITATION NUMBER: EIAC-VB-0075
ACCREDITING BODY: EIAC
SITE VISIT: 2026-04-09
DIRECT EMISSIONS: 0.41 TCO2E/T
INDIRECT EMISSIONS: 0.11 TCO2E/T`,
    truth: truth({
      supplier_name: 'AL JUBAIL STEEL FZE', product_description: 'STEEL REBAR',
      quantity_tonnes: 7800, declared_emissions: 0.52, verifier_name: 'GULF CARBON ASSURANCE LLC',
      accreditation_number: 'EIAC-VB-0075', accrediting_body: 'EIAC', installation_id: 'AE-AJS-1204',
      methodology: 'MEASUREMENT-BASED', direct_indirect_split: 'Direct 0.41 / Indirect 0.11',
      reporting_period: '2026-01-01 TO 2026-03-31', site_visit_date: '2026-04-09',
    }),
  },
  {
    id: 'D21', style: 'uncommon label wording',
    text: `Exporter: Hai Phong Steel Group JSC
Item: Steel plates (CN 7208 52 91)
Country: Vietnam
Quantity (t): 920
Intensity (tCO2e/t): 2.05
Route: BF-BOF
Verification body: Hanoi Climate Verification JSC
Accreditation ref: BoA-VB-0388
Accredited by: Bureau of Accreditation Vietnam
Date of site visit: 2026-02-27
Plant ID: VN-HPS-6100`,
    truth: truth({
      supplier_name: 'Hai Phong Steel Group JSC', product_description: 'Steel plates',
      quantity_tonnes: 920, declared_emissions: 2.05, verifier_name: 'Hanoi Climate Verification JSC',
      accreditation_number: 'BoA-VB-0388', accrediting_body: 'Bureau of Accreditation Vietnam',
      installation_id: 'VN-HPS-6100', site_visit_date: '2026-02-27',
    }),
  },
  {
    id: 'D22', style: 'prose email, kg in sentence, verified',
    text: `Subject: Re: CBAM evidence request

Good afternoon,

Attaching the verified numbers for the hot-dip galvanised wire we ship from Lviv Wire Works LLC in Ukraine. We will deliver 18,500 kg of hot-dip galvanised wire (CN 7217 20 10) with 1,980 kgCO2e/t embedded emissions. Verification was done by Carpathian Carbon Verifiers LLC under accreditation NAAU-VB-221 from the NAAU, site visit 12 May 2026. Our installation ID is UA-LWW-7745. Methodology: calculation-based approach following the Implementing Regulation.

Regards,
Olena`,
    truth: truth({
      supplier_name: 'Lviv Wire Works LLC', product_description: 'hot-dip galvanised wire',
      quantity_tonnes: 18.5, declared_emissions: 1.98, verifier_name: 'Carpathian Carbon Verifiers LLC',
      accreditation_number: 'NAAU-VB-221', accrediting_body: 'NAAU', installation_id: 'UA-LWW-7745',
      methodology: 'calculation-based approach following the Implementing Regulation', site_visit_date: '12 May 2026',
    }),
  },
  {
    id: 'D23', style: 'non-steel sector (aluminium), labelled',
    text: `Supplier: Fjord Aluminium AS
Product: Unwrought aluminium (CN 7601 10 00)
Origin: Norway
Quantity: 2,000 tonnes
Declared emissions: 1.9 tCO2e/t
Verification: Third-party verified
Verifier: Oslo Verification AS
Accreditation number: NA-0412
Accrediting body: Norsk Akkreditering
Installation ID: NO-FA-0011`,
    truth: truth({
      supplier_name: 'Fjord Aluminium AS', product_description: 'Unwrought aluminium',
      quantity_tonnes: 2000, declared_emissions: 1.9, verifier_name: 'Oslo Verification AS',
      accreditation_number: 'NA-0412', accrediting_body: 'Norsk Akkreditering', installation_id: 'NO-FA-0011',
    }),
  },
];
