export const FORM_COPY_SLUG = 'form-copy'
export const FORM_COPY_ROLE = 'formCopy'

export type FormCopyValues = Record<string, { en: string; am: string }>

export type FormCopyField = {
  key: string
  group: string
  label: string
  en: string
  am: string
  multiline?: boolean
}

function field(
  key: string,
  group: string,
  label: string,
  en: string,
  am: string,
  multiline?: boolean,
): FormCopyField {
  return { key, group, label, en, am, ...(multiline ? { multiline: true } : {}) }
}

export function isFormCopyItem(item: {
  kind?: string
  slug?: string
  metadata?: Record<string, unknown> | null
}): boolean {
  return (
    item.kind === 'CONFIG' &&
    (item.slug === FORM_COPY_SLUG || item.metadata?.catalogRole === FORM_COPY_ROLE)
  )
}

const SHARED_CONTACT: FormCopyField[] = [
  field('yourName', 'Contact', 'Your name', 'Your name', 'ስምዎ'),
  field('phoneNumber', 'Contact', 'Phone number', 'Phone number', 'ስልክ ቁጥር'),
  field('customerName', 'Contact', 'Customer name', 'Customer name', 'የደንበኛ ስም'),
]

const SHARED_FULFILLMENT: FormCopyField[] = [
  field(
    'fulfillmentTitle',
    'Fulfillment',
    'How to receive order',
    'How would you like to receive your order?',
    'ትዕዛዝዎን እንዴት መቀበል ይፈልጋሉ?',
  ),
  field('selfPickup', 'Fulfillment', 'Self pickup', 'Self Pickup', 'በራስ መውሰድ'),
  field('delivery', 'Fulfillment', 'Delivery', 'Delivery', 'መላክ'),
  field(
    'fulfillmentOr',
    'Fulfillment',
    'Delivery or self pickup heading',
    'Delivery or Self Pickup',
    'መላክ ወይም በራስ መውሰድ',
  ),
  field('deliveryAddress', 'Fulfillment', 'Delivery address', 'Delivery address', 'የመላኪያ አድራሻ'),
  field(
    'deliveryAddressPlaceholder',
    'Fulfillment',
    'Delivery address placeholder',
    'Address in Addis Ababa',
    'አድራሻ በአዲስ አበባ',
  ),
  field('preferredDate', 'Fulfillment', 'Preferred date', 'Preferred delivery / self pickup date', 'የሚመርጡት የመላኪያ / የመውሰጃ ቀን'),
  field('deliveryDate', 'Fulfillment', 'Delivery date', 'Delivery date', 'የመላኪያ ቀን'),
  field('pickupDate', 'Fulfillment', 'Self pickup date', 'Self pickup date', 'የመውሰጃ ቀን'),
  field('deliveryTime', 'Fulfillment', 'Delivery time', 'Delivery time', 'የመላኪያ ሰዓት'),
  field('pickupTime', 'Fulfillment', 'Self pickup time', 'Self pickup time', 'የመውሰጃ ሰዓት'),
  field('pickupLocation', 'Fulfillment', 'Pickup location', 'Pickup location', 'የመውሰጃ ቦታ'),
  field('summaryDate', 'Summary', 'Date', 'Date', 'ቀን'),
  field('summaryTime', 'Summary', 'Time', 'Time', 'ሰዓት'),
  field('summaryAddress', 'Summary', 'Address', 'Address', 'አድራሻ'),
  field('summaryFulfillment', 'Summary', 'Fulfillment', 'Fulfillment', 'አቀራረብ'),
  field('orderSummary', 'Summary', 'Order summary title', 'Order Summary', 'የትዕዛዝ ማጠቃለያ'),
]

const SHARED_ACTIONS: FormCopyField[] = [
  field('confirming', 'Buttons', 'Confirming…', 'Confirming…', 'እየተረጋገጠ ነው…'),
  field('submitting', 'Buttons', 'Submitting…', 'Submitting…', 'እየተላከ ነው…'),
  field('submitOrder', 'Buttons', 'Submit order', 'Submit Order', 'ትዕዛዝ ያስገቡ'),
  field('selected', 'Buttons', 'Selected', 'Selected', 'ተመርጧል'),
  field('selectPackage', 'Buttons', 'Select package', 'Select package', 'ጥቅል ይምረጡ'),
]

const SHARED_VALIDATION: FormCopyField[] = [
  field('errorName', 'Validation', 'Name required', 'Your name is required.', 'ስምዎ ያስፈልጋል።'),
  field('errorPhone', 'Validation', 'Phone required', 'A phone number is required.', 'ስልክ ቁጥር ያስፈልጋል።'),
  field('errorDate', 'Validation', 'Date required', 'Please choose a date.', 'እባክዎ ቀን ይምረጡ።'),
  field('errorTime', 'Validation', 'Time required', 'Please choose a time.', 'እባክዎ ሰዓት ይምረጡ።'),
  field('errorAddress', 'Validation', 'Address required', 'Enter a delivery address.', 'የመላኪያ አድራሻ ያስገቡ።'),
  field('errorPickupLocation', 'Validation', 'Pickup location required', 'Please choose a pickup location.', 'እባክዎ የመውሰጃ ቦታ ይምረጡ።'),
  field('errorDeliveryMethod', 'Validation', 'Fulfillment required', 'Please choose self pickup or delivery.', 'እባክዎ በራስ መውሰድ ወይም መላክ ይምረጡ።'),
]

const CATERING: FormCopyField[] = [
  field('essentialsTitle', 'Sections', 'Essentials title', 'The essentials', 'አስፈላጊዎቹ'),
  field('essentialsDescription', 'Sections', 'Essentials description', 'These are what we need to get started.', 'እነዚህ ለመጀመር የሚያስፈልጉን ናቸው።', true),
  field('essentialsHint', 'Sections', 'Essentials hint', 'Fill every field above — the next step will appear automatically.', 'ከላይ ያሉትን ሁሉ ይሙሉ — ቀጣዩ ደረጃ በራሱ ይታያል።', true),
  field('guestsLabel', 'Fields', 'Number of guests', 'Number of guests', 'የእንግዶች ቁጥር'),
  field('peopleSuffix', 'Fields', 'People suffix', 'people', 'ሰዎች'),
  field('guestsMinHint', 'Fields', 'Minimum guests hint', 'Minimum {count} guests.', 'ቢያንስ {count} እንግዶች።'),
  field('eventDate', 'Fields', 'Event date', 'Event date', 'የዝግጅት ቀን'),
  field('eventLocation', 'Fields', 'Event location', 'Event location / place', 'የዝግጅት ቦታ'),
  field('eventLocationPlaceholder', 'Fields', 'Event location placeholder', 'Venue or address in Addis Ababa', 'ቦታ ወይም አድራሻ በአዲስ አበባ'),
  field('occasionTitle', 'Sections', 'Occasion title', "What's the occasion?", 'ዝግጅቱ ምንድን ነው?'),
  field('customOccasionLabel', 'Fields', 'Custom occasion', 'Please tell us about your occasion.', 'እባክዎ ስለ ዝግጅትዎ ይንገሩን።', true),
  field('customOccasionPlaceholder', 'Fields', 'Custom occasion placeholder', 'e.g. Housewarming, Anniversary…', 'ምሳሌ፡ የቤት መግባት፣ የምስረታ…'),
  field('mealTypeTitle', 'Sections', 'Meal type title', 'Select Meal Type', 'የምግብ አይነት ይምረጡ'),
  field('mealTypeDescription', 'Sections', 'Meal type description', 'This determines which packages you can choose.', 'ይህ የትኞቹን ጥቅሎች መምረጥ እንደሚችሉ ይወስናል።', true),
  field('fastingTitle', 'Meal type', 'Fasting title', 'Fasting', 'ጾም'),
  field('fastingSubtitle', 'Meal type', 'Fasting subtitle', 'ጾም', 'ጾም'),
  field('fastingDescription', 'Meal type', 'Fasting description', 'One complete vegan package (ማእድ ጾም).', 'አንድ ሙሉ የጾም ጥቅል (ማእድ ጾም)።', true),
  field('nonFastingTitle', 'Meal type', 'Non-fasting title', 'Non-Fasting', 'ፍስክ'),
  field('nonFastingSubtitle', 'Meal type', 'Non-fasting subtitle', 'ፍስክ', 'ፍስክ'),
  field('nonFastingDescription', 'Meal type', 'Non-fasting description', 'Platinum, Gold, or Silver celebration packages.', 'የፕላቲነም፣ ወርቅ ወይም ብር የክብረ በዓል ጥቅሎች።', true),
  field('packageTitleFasting', 'Sections', 'Fasting package title', 'Maed Fasting (ማእድ ጾም)', 'ማእድ ጾም'),
  field('packageTitleNonFasting', 'Sections', 'Non-fasting package title', 'Choose Your Package', 'ጥቅልዎን ይምረጡ'),
  field('packageDescription', 'Sections', 'Package description', 'Every dish is already included — you do not pick individual dishes.', 'ሁሉም ምግቦች አስቀድመው ተካትተዋል — ለየብቻ አይመርጡም።', true),
  field('beveragesTitle', 'Sections', 'Beverages title', 'Would you like to include traditional beverages?', 'ባህላዊ መጠጦች ማካተት ይፈልጋሉ?', true),
  field('beveragesDescription', 'Sections', 'Beverages description', 'Select one option — totals update in the estimate panel.', 'አንድ አማራጭ ይምረጡ — ጠቅላላው በግምት ፓነል ይዘምናል።', true),
  field('perPerson', 'Fields', 'Per person', '/person', '/ሰው'),
  field(
    'fulfillmentMeta',
    'Fulfillment',
    'Fulfillment subtitle template',
    'Event date: {date} · Place: {place}',
    'የዝግጅት ቀን፡ {date} · ቦታ፡ {place}',
  ),
  field('specialRequestsTitle', 'Sections', 'Special requests title', 'Special requests', 'ልዩ ጥያቄዎች'),
  field(
    'specialRequestsDescription',
    'Sections',
    'Special requests description',
    'Dietary notes, spice level, and anything we should know for the kitchen.',
    'የአመጋገብ ማስታወሻ፣ የቅመም መጠን እና ኩሽናው ሊያውቀው የሚገባው።',
    true,
  ),
  field('specialRequestsLabel', 'Fields', 'Special requests field', 'Tell us anything we should know', 'ማንኛውንም ልናውቀው የሚገባ ይንገሩን'),
  field('specialRequestsPlaceholder', 'Fields', 'Special requests placeholder', 'e.g. no salt, less spicy, mild for kids…', 'ምሳሌ፡ ጨው አይደለም፣ ቅመም ይቀንስ…'),
  field('chipNoSalt', 'Chips', 'Chip: no salt', 'No salt', 'ጨው የለም'),
  field('chipLessSpicy', 'Chips', 'Chip: less spicy', 'Less spicy', 'ቅመም ይቀንስ'),
  field('chipNoBerbere', 'Chips', 'Chip: no berbere', 'No berbere', 'በርበሬ የለም'),
  field('chipExtraVegan', 'Chips', 'Chip: extra vegan', 'Extra vegan options', 'ተጨማሪ የጾም አማራጮች'),
  field('chipMildForKids', 'Chips', 'Chip: mild for kids', 'Mild for kids', 'ለልጆች የቀለለ'),
  field('chipNoButter', 'Chips', 'Chip: no butter', 'No butter', 'ቅቤ የለም'),
  field('chipSeparatePlates', 'Chips', 'Chip: separate plates', 'Separate plates', 'የተለዩ ሳህኖች'),
  field('summaryGuests', 'Summary', 'Guests', 'Guests', 'እንግዶች'),
  field('summaryOccasion', 'Summary', 'Occasion', 'Occasion', 'ዝግጅት'),
  field('summaryMealType', 'Summary', 'Meal type', 'Meal Type', 'የምግብ አይነት'),
  field('summaryPackage', 'Summary', 'Package', 'Package', 'ጥቅል'),
  field('summaryBeverage', 'Summary', 'Beverage', 'Beverage', 'መጠጥ'),
  field('summaryPricePerPerson', 'Summary', 'Price / person', 'Price / person', 'ዋጋ / ሰው'),
  field('summaryTotal', 'Summary', 'Total', 'Total', 'ድምር'),
  field('summaryPlace', 'Summary', 'Place', 'Place', 'ቦታ'),
  field('summaryContact', 'Summary', 'Contact', 'Contact', 'እውቂያ'),
  field('summarySpecialRequests', 'Summary', 'Special requests row', 'Special requests', 'ልዩ ጥያቄዎች'),
  field('mealTypeFastingValue', 'Summary', 'Fasting value', 'Fasting (ጾም)', 'ጾም'),
  field('mealTypeNonFastingValue', 'Summary', 'Non-fasting value', 'Non-Fasting (ፍስክ)', 'ፍስክ'),
  field('confirmBooking', 'Buttons', 'Confirm booking', 'Confirm Booking', 'ቦታ ማስያዝ ያረጋግጡ'),
  field('yourEstimate', 'Estimate', 'Your estimate', 'Your estimate', 'የእርስዎ ግምት'),
  field('estimateFormula', 'Estimate', 'Estimate formula', 'Guests × price per person', 'እንግዶች × ዋጋ በሰው'),
  field('estimatePerPerson', 'Estimate', 'Per person row', 'Per person', 'በሰው'),
  field('fillFormToSeeTotal', 'Estimate', 'Fill form hint', 'Fill the form to see total', 'ድምሩን ለማየት ቅጹን ይሙሉ'),
  field('completeStepsToSeeTotal', 'Estimate', 'Complete steps hint', 'Complete the steps to see total', 'ድምሩን ለማየት ደረጃዎቹን ይጨርሱ'),
  field('tapToSelect', 'Buttons', 'Tap to select', 'Tap to select', 'ለመምረጥ ይንኩ'),
  field('hideMenu', 'Buttons', 'Hide menu', 'Hide menu', 'ምናሌ ደብቅ'),
  field('seeMenu', 'Buttons', 'See menu', 'See menu · {count} dishes', 'ምናሌ ይመልከቱ · {count} ምግቦች'),
  field('popular', 'Buttons', 'Popular badge', 'Popular', 'ተወዳጅ'),
  field('errorMinGuests', 'Validation', 'Minimum guests', 'Minimum {count} guests required.', 'ቢያንስ {count} እንግዶች ያስፈልጋሉ።'),
  field('errorLocation', 'Validation', 'Event location required', 'Where is the event?', 'ዝግጅቱ የት ነው?'),
  field('errorOccasion', 'Validation', 'Occasion required', 'Please choose an occasion.', 'እባክዎ ዝግጅት ይምረጡ።'),
  field('errorCustomOccasion', 'Validation', 'Custom occasion required', 'Please tell us about your occasion.', 'እባክዎ ስለ ዝግጅትዎ ይንገሩን።'),
  field('errorMealType', 'Validation', 'Meal type required', 'Please select a meal type.', 'እባክዎ የምግብ አይነት ይምረጡ።'),
  field('errorPackage', 'Validation', 'Package required', 'Please choose a package.', 'እባክዎ ጥቅል ይምረጡ።'),
  field('errorBeverage', 'Validation', 'Beverage required', 'Please choose a beverage option.', 'እባክዎ የመጠጥ አማራጭ ይምረጡ።'),
  ...SHARED_CONTACT.filter((f) => f.key !== 'customerName'),
  ...SHARED_FULFILLMENT,
  ...SHARED_ACTIONS.filter((f) => f.key !== 'submitOrder' && f.key !== 'submitting'),
  ...SHARED_VALIDATION.filter((f) => !['errorName', 'errorPhone', 'errorDate', 'errorTime', 'errorPickupLocation', 'errorDeliveryMethod'].includes(f.key)),
  field('errorName', 'Validation', 'Name required', 'Your name, please.', 'እባክዎ ስምዎን ያስገቡ።'),
  field('errorPhone', 'Validation', 'Phone required', 'A phone number is required.', 'ስልክ ቁጥር ያስፈልጋል።'),
  field('errorDate', 'Validation', 'Date required', 'Please choose a date.', 'እባክዎ ቀን ይምረጡ።'),
  field('errorTime', 'Validation', 'Time required', 'Please choose a time.', 'እባክዎ ሰዓት ይምረጡ።'),
  field('errorPickupLocation', 'Validation', 'Pickup location required', 'Please choose a pickup location.', 'እባክዎ የመውሰጃ ቦታ ይምረጡ።'),
  field('errorDeliveryMethod', 'Validation', 'Fulfillment required', 'Please choose self pickup or delivery.', 'እባክዎ በራስ መውሰድ ወይም መላክ ይምረጡ።'),
]

const AGELGIL: FormCopyField[] = [
  field('mealTypeTitle', 'Sections', 'Meal type title', 'Select Meal Type', 'የምግብ አይነት ይምረጡ'),
  field('mealTypeDescription', 'Sections', 'Meal type description', 'This determines which package contents you see.', 'ይህ የትኛውን ጥቅል ይዘት እንደሚያዩ ይወስናል።', true),
  field('fastingTitle', 'Meal type', 'Fasting title', 'Fasting', 'ጾም'),
  field('fastingSubtitle', 'Meal type', 'Fasting subtitle', 'ጾም', 'ጾም'),
  field('fastingDescription', 'Meal type', 'Fasting description', 'Vegan Agelgil baskets for fasting days.', 'ለጾም ቀናት የአገልግል ቅርጫቶች።', true),
  field('nonFastingTitle', 'Meal type', 'Non-fasting title', 'Non-Fasting', 'ፍስክ'),
  field('nonFastingSubtitle', 'Meal type', 'Non-fasting subtitle', 'ፍስክ', 'ፍስክ'),
  field('nonFastingDescription', 'Meal type', 'Non-fasting description', 'Meat and mixed Agelgil baskets.', 'ስጋ እና የተቀላቀሉ የአገልግል ቅርጫቶች።', true),
  field('packageTypeTitle', 'Sections', 'Package type title', 'Package Type', 'የጥቅል አይነት'),
  field('packageTypeDescription', 'Sections', 'Package type description', 'Special adds extra items on top of Regular.', 'ልዩ ከመደበኛው በላይ ተጨማሪ ዓይነቶች ያክላል።', true),
  field('regularTitle', 'Package type', 'Regular', 'Regular', 'መደበኛ'),
  field('specialTitle', 'Package type', 'Special', 'Special', 'ልዩ'),
  field('regularBlurb', 'Package type', 'Regular blurb', 'Core basket items', 'ዋና የቅርጫት ዓይነቶች'),
  field('specialFastingBlurb', 'Package type', 'Special fasting blurb', 'Regular + Sambusa + አነባብሮ (Anebabro)', 'መደበኛ + ሳምቡሳ + አነባብሮ', true),
  field('specialNonFastingBlurb', 'Package type', 'Special non-fasting blurb', 'Regular + Kitfo + አይብ (Cheese) + Kocho', 'መደበኛ + ክትፎ + አይብ + ቆጮ', true),
  field('packageSizeTitle', 'Sections', 'Package size title', 'Package Size', 'የጥቅል መጠን'),
  field('packageSizeDescription', 'Sections', 'Package size description', 'Each size has a fixed price. We’ll combine sizes if you need more guests.', 'እያንዳንዱ መጠን ቋሚ ዋጋ አለው። ተጨማሪ እንግዶች ካሉ መጠኖችን እናዋህዳለን።', true),
  field('peopleSuffix', 'Fields', 'People suffix', 'people', 'ሰዎች'),
  field('guestsTitle', 'Sections', 'Guest count title', 'How many people are you serving?', 'ስንት ሰዎችን ያቀርባሉ?'),
  field('guestsDescription', 'Sections', 'Guest count description', 'We’ll build the best package combination automatically.', 'ምርጡን የጥቅል ውህደት በራስ እንሰራለን።', true),
  field('recommendedCombo', 'Estimate', 'Recommended combination', 'Recommended combination', 'የሚመከር ውህደት'),
  field('coversPeople', 'Estimate', 'Covers people', 'Covers {count} people · {packages} package(s)', '{count} ሰዎችን ይሸፍናል · {packages} ጥቅል(ዎች)'),
  field('comboLine', 'Estimate', 'Combo line', '{qty} × {size}-person ({price} each)', '{qty} × {size}-ሰው ({price} እያንዳንዱ)'),
  field('summaryTotal', 'Summary', 'Total', 'Total', 'ድምር'),
  field('continueCombo', 'Buttons', 'Continue with combination', 'Continue with this combination', 'በዚህ ውህደት ይቀጥሉ'),
  field('summaryMealType', 'Summary', 'Meal type', 'Meal Type', 'የምግብ አይነት'),
  field('summaryPackageType', 'Summary', 'Package type', 'Package Type', 'የጥቅል አይነት'),
  field('summaryCombo', 'Summary', 'Package combination', 'Package Combination', 'የጥቅል ውህደት'),
  field('summaryTotalGuests', 'Summary', 'Total guests', 'Total Guests', 'ጠቅላላ እንግዶች'),
  field('summaryGuestsValue', 'Summary', 'Guests value template', '{guests} (covers {covered})', '{guests} ({covered} ይሸፍናል)'),
  field('comboLineShort', 'Summary', 'Combo line short', '{qty} × {size}-person', '{qty} × {size}-ሰው'),
  field('grandTotal', 'Summary', 'Grand total', 'Grand Total', 'አጠቃላይ ድምር'),
  field('mealTypeFastingValue', 'Summary', 'Fasting value', 'Fasting (ጾም)', 'ጾም'),
  field('mealTypeNonFastingValue', 'Summary', 'Non-fasting value', 'Non-Fasting (ፍስክ)', 'ፍስክ'),
  field('confirmAgelgil', 'Buttons', 'Confirm Agelgil order', 'Confirm Agelgil Order', 'የአገልግል ትዕዛዝ ያረጋግጡ'),
  field('yourEstimate', 'Estimate', 'Your estimate', 'Your estimate', 'የእርስዎ ግምት'),
  field('estimateHint', 'Estimate', 'Estimate hint', 'Fixed package prices — not per person', 'ቋሚ የጥቅል ዋጋ — በሰው አይደለም'),
  field('summaryGuests', 'Summary', 'Guests', 'Guests', 'እንግዶች'),
  field('summaryComboShort', 'Estimate', 'Combo', 'Combo', 'ውህደት'),
  field('selectToSeeTotal', 'Estimate', 'Select to see total', 'Select options to see total', 'ድምሩን ለማየት አማራጮችን ይምረጡ'),
  field('errorMealType', 'Validation', 'Meal type required', 'Select meal type.', 'የምግብ አይነት ይምረጡ።'),
  field('errorPackageKind', 'Validation', 'Package type required', 'Select Regular or Special.', 'መደበኛ ወይም ልዩ ይምረጡ።'),
  field('errorSize', 'Validation', 'Size required', 'Choose a package size.', 'የጥቅል መጠን ይምረጡ።'),
  field('errorMinGuests', 'Validation', 'Minimum people', 'Minimum 10 people.', 'ቢያንስ 10 ሰዎች።'),
  ...SHARED_CONTACT.filter((f) => f.key !== 'customerName'),
  ...SHARED_FULFILLMENT,
  ...SHARED_ACTIONS.filter((f) => f.key !== 'submitOrder' && f.key !== 'submitting' && f.key !== 'selectPackage' && f.key !== 'selected'),
  ...SHARED_VALIDATION,
]

const SHOP_SHARED: FormCopyField[] = [
  field('chooseProducts', 'Sections', 'Choose products title', 'Choose your products', 'ምርቶችዎን ይምረጡ'),
  field('chooseProductsHint', 'Sections', 'Choose products hint', 'Use the Add and Remove buttons to build your order.', 'ትዕዛዝዎን ለመገንባት አክል እና አስወግድ ይጠቀሙ።', true),
  field('inOrder', 'Buttons', 'In order badge', 'In order', 'በትዕዛዝ ውስጥ'),
  field('perUnit', 'Fields', 'Per unit', 'per {unit}', 'በ {unit}'),
  field('add', 'Buttons', 'Add', 'Add', 'አክል'),
  field('remove', 'Buttons', 'Remove', 'Remove', 'አስወግድ'),
  field('noMatch', 'Messages', 'No search match', 'No products match your search. Try another keyword or category.', 'ምንም ምርት አልተገኘም። ሌላ ቃል ወይም ምድብ ይሞክሩ።', true),
  field('orderDetailsTitle', 'Sections', 'Order details title', 'Your order details', 'የትዕዛዝዎ ዝርዝር'),
  field('additionalNotes', 'Fields', 'Additional notes', 'Additional notes', 'ተጨማሪ ማስታወሻ'),
  field('notesPlaceholder', 'Fields', 'Notes placeholder', 'Allergies, packaging preferences, etc.', 'አለርጂ፣ የማሸጊያ ምርጫ፣ ወዘተ።', true),
  field('orderSummary', 'Summary', 'Order summary', 'Order summary', 'የትዕዛዝ ማጠቃለያ'),
  field('completeDetails', 'Buttons', 'Complete order details', 'Complete order details', 'የትዕዛዝ ዝርዝር ይሙሉ'),
  field('noProductsYet', 'Estimate', 'No products yet', 'No products yet', 'እስካሁን ምርት የለም'),
  field('productsCount', 'Estimate', 'Products count', '{count} product(s)', '{count} ምርት(ዎች)'),
  field('itemsSelected', 'Estimate', 'Items selected', '{count} {unit} selected', '{count} {unit} ተመርጧል'),
  field('tapAdd', 'Estimate', 'Tap add hint', 'Tap Add on a product', 'በምርት ላይ አክል ይንኩ'),
  field('emptySummary', 'Estimate', 'Empty summary', 'Select products from the shop to build your order.', 'ትዕዛዝዎን ለመገንባት ከሱቁ ምርቶች ይምረጡ።', true),
  field('summaryTotal', 'Summary', 'Total', 'Total', 'ድምር'),
  field('errorProducts', 'Validation', 'Products required', 'Select at least one product.', 'ቢያንስ አንድ ምርት ይምረጡ።'),
  field('errorSubmit', 'Validation', 'Submit failed', 'Could not submit your order. Please try again.', 'ትዕዛዝዎን መላክ አልተሳካም። እባክዎ እንደገና ይሞክሩ።', true),
  ...SHARED_CONTACT,
  ...SHARED_FULFILLMENT,
  ...SHARED_ACTIONS.filter((f) => f.key !== 'confirming' && f.key !== 'selectPackage' && f.key !== 'selected'),
  ...SHARED_VALIDATION,
]

const BALTINA: FormCopyField[] = [
  field('searchPlaceholder', 'Fields', 'Search placeholder', 'Search Baltina products…', 'የባልቲና ምርቶችን ይፈልጉ…'),
  field('detailsHint', 'Sections', 'Order details hint', 'Tell us who you are and how to deliver your Baltina order.', 'እርስዎ ማን እንደሆኑ እና ባልቲና እንዴት እንደሚደርስዎ ይንገሩን።', true),
  ...SHOP_SHARED,
]

const DRINKS: FormCopyField[] = [
  field('searchPlaceholder', 'Fields', 'Search placeholder', 'Search drinks…', 'መጠጦችን ይፈልጉ…'),
  field('detailsHint', 'Sections', 'Order details hint', 'Tell us who you are and how to deliver your drinks order.', 'እርስዎ ማን እንደሆኑ እና መጠጦች እንዴት እንደሚደርሱዎ ይንገሩን።', true),
  ...SHOP_SHARED,
]

const FESTIVAL: FormCopyField[] = [
  field('choosePackage', 'Sections', 'Choose package title', 'Choose your package', 'ጥቅልዎን ይምረጡ'),
  field(
    'choosePackageHint',
    'Sections',
    'Choose package hint',
    'Click a card to select — click again to deselect. Compare what’s included side by side.',
    'ለመምረጥ ካርዱን ይጫኑ — ለመሰረዝ እንደገና ይጫኑ። የሚካተቱትን ጎን ለጎን ያወዳድሩ።',
    true,
  ),
  field('orderDetailsTitle', 'Sections', 'Order details title', 'Your order details', 'የትዕዛዝዎ ዝርዝር'),
  field(
    'detailsHint',
    'Sections',
    'Order details hint',
    'Confirm quantity and how you’d like your festival package delivered.',
    'ብዛት እና የፌስቲቫል ጥቅል እንዴት እንደሚደርስዎ ያረጋግጡ።',
    true,
  ),
  field('selectedPackage', 'Summary', 'Selected package', 'Selected package', 'የተመረጠ ጥቅል'),
  field('eachPrice', 'Fields', 'Each', '{price} each', '{price} እያንዳንዱ'),
  field('quantity', 'Fields', 'Quantity', 'Quantity', 'ብዛት'),
  field('chooseDrink', 'Fields', 'Choose drink', 'Choose your drink (2 L)', 'መጠጥዎን ይምረጡ (2 ሊትር)'),
  field('tej', 'Fields', 'Tej', 'Tej', 'ጠጅ'),
  field('berz', 'Fields', 'Berz', 'Berz', 'ብርዝ'),
  field('orderTotal', 'Summary', 'Order total', 'Order total', 'የትዕዛዝ ድምር'),
  field('selectToContinue', 'Messages', 'Select to continue', 'Select a package above to continue.', 'ለመቀጠል ከላይ ጥቅል ይምረጡ።'),
  field('additionalNotes', 'Fields', 'Additional notes', 'Additional notes', 'ተጨማሪ ማስታወሻ'),
  field('notesPlaceholder', 'Fields', 'Notes placeholder', 'Special requests for your celebration…', 'ለክብረ በዓልዎ ልዩ ጥያቄዎች…', true),
  field('errorPackage', 'Validation', 'Package required', 'Select a festival package.', 'የፌስቲቫል ጥቅል ይምረጡ።'),
  field('errorDrink', 'Validation', 'Drink required', 'Choose Tej or Berz for the Grand Package.', 'ለግራንድ ጥቅል ጠጅ ወይም ብርዝ ይምረጡ።'),
  ...SHARED_CONTACT,
  ...SHARED_FULFILLMENT,
  ...SHARED_ACTIONS,
  ...SHARED_VALIDATION,
]

const GENERIC: FormCopyField[] = [
  field('orderSummary', 'Summary', 'Order summary title', 'Order Summary', 'የትዕዛዝ ማጠቃለያ'),
  field('additionalNotes', 'Fields', 'Additional notes', 'Additional notes', 'ተጨማሪ ማስታወሻ'),
  ...SHARED_CONTACT,
  ...SHARED_FULFILLMENT,
  ...SHARED_ACTIONS,
  ...SHARED_VALIDATION,
]

function dedupe(fields: FormCopyField[]): FormCopyField[] {
  const seen = new Set<string>()
  return fields.filter((f) => {
    if (seen.has(f.key)) return false
    seen.add(f.key)
    return true
  })
}

export function formCopyKindForSlug(slug: string): 'catering' | 'agelgil' | 'festival' | 'baltina' | 'drinks' | 'generic' {
  if (slug === 'catering') return 'catering'
  if (slug === 'agelgil') return 'agelgil'
  if (slug === 'festival' || slug === 'festival-package') return 'festival'
  if (slug === 'baltina') return 'baltina'
  if (slug === 'drinks' || slug === 'traditional-drinks') return 'drinks'
  return 'generic'
}

export function formCopyFieldsForSlug(slug: string): FormCopyField[] {
  const kind = formCopyKindForSlug(slug)
  if (kind === 'catering') return dedupe(CATERING)
  if (kind === 'agelgil') return dedupe(AGELGIL)
  if (kind === 'festival') return dedupe(FESTIVAL)
  if (kind === 'baltina') return dedupe(BALTINA)
  if (kind === 'drinks') return dedupe(DRINKS)
  return dedupe(GENERIC)
}

export function defaultFormCopyValues(slug: string): FormCopyValues {
  return Object.fromEntries(formCopyFieldsForSlug(slug).map((f) => [f.key, { en: f.en, am: f.am }]))
}

export function mergeFormCopyValues(slug: string, stored?: FormCopyValues | null): FormCopyValues {
  const defaults = defaultFormCopyValues(slug)
  if (!stored) return defaults
  const next = { ...defaults }
  for (const [key, value] of Object.entries(stored)) {
    if (!next[key] || !value || typeof value !== 'object') continue
    next[key] = {
      en: typeof value.en === 'string' && value.en.trim() ? value.en : defaults[key].en,
      am: typeof value.am === 'string' ? value.am : defaults[key].am,
    }
  }
  return next
}
