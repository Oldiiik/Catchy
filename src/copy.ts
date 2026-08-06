export type Lang = 'ru' | 'kk' | 'en'

export const LANGS: { id: Lang; short: string; label: string }[] = [
  { id: 'ru', short: 'RU', label: 'Русский' },
  { id: 'kk', short: 'KK', label: 'Қазақша' },
  { id: 'en', short: 'EN', label: 'English' },
]

type Step = { title: string; body: string }
type Figure = { value: string; unit?: string; label: string }
type Trace = { index: string; value: string; unit: string; name: string; body: string }

export type Copy = {
  htmlLang: string
  nav: { why: string; how: string; sensor: string; map: string; state: string; dashboard: string }
  hero: { title: string; lede: string; cta: string; scroll: string }
  significance: {
    eyebrow: string
    title: string
    body: string[]
    figures: [Figure, Figure, Figure]
  }
  stat: { value: string; unit: string; label: string }
  traces: {
    eyebrow: string
    title: string
    body: string
    items: Trace[]
    footnote: string
  }
  how: { eyebrow: string; title: string; steps: [Step, Step, Step] }
  product: { eyebrow: string; title: string; body: string; specs: Figure[] }
  map: {
    eyebrow: string
    title: string
    body: string
    legend: string[]
    live: string
    needKey: string
    error: string
    fields: {
      vessel: string
      time: string
      level: string
      film: string
      fluor: string
      turb: string
      temp: string
      speed: string
      coords: string
      heading: string
    }
  }
  gov: { eyebrow: string; title: string; body: string; cta: string; points: string[] }
  dash: {
    title: string
    subtitle: string
    back: string
    ranges: [string, string, string]
    sector: string
    sectors: string[]
    kpis: [string, string, string, string]
    queue: string
    columns: { vessel: string; level: string; time: string; state: string }
    detail: string
    timeline: string
    timelineNote: string
    median: string
    ack: string
    dispatch: string
    acked: string
    dispatched: string
    search: string
    onlyFlagged: string
    empty: string
    threshold: string
    key: string
    keyHeight: string
    keyCollar: string
    keySweep: string
  }
  footer: { tagline: string; office: string; rights: string; links: string[] }
}

const ru: Copy = {
  htmlLang: 'ru',
  nav: {
    why: 'Зачем',
    how: 'Как работает',
    sensor: 'Датчик',
    map: 'Карта',
    state: 'Госорганам',
    dashboard: 'Панель',
  },
  hero: {
    title: 'Море предупреждает первым',
    lede:
      'Catchy читает воду с каждого судна, которое её пересекает. Разлив появляется на карте через минуты, а не через недели.',
    cta: 'Посмотреть, как это работает',
    scroll: 'Листайте',
  },
  significance: {
    eyebrow: 'Зачем это нужно',
    title: 'У Каспия нет стока',
    body: [
      'Это самый большой замкнутый водоём на планете. У него нет выхода в океан, и всё, что в него попадает, остаётся внутри.',
      'Нефть не рассеивается. Она сносится течением к мелководным заливам северного побережья — туда, где нерестится осётр и выводит потомство каспийский тюлень.',
      'Разливы находят по спутнику, но спутник проходит над точкой раз в несколько дней и не видит сквозь облака. К моменту обнаружения пятну обычно больше недели.',
    ],
    figures: [
      { value: '371 000', unit: 'км²', label: 'площадь моря, замкнутого со всех сторон' },
      { value: '−1,7', unit: 'м', label: 'падение уровня воды с 2005 года' },
      { value: '5', label: 'государств на одном побережье' },
    ],
  },
  stat: {
    value: '18 400',
    unit: 'тонн',
    label: 'нефтепродуктов попадает в Каспий за год. Большая часть — вне поля зрения.',
  },
  traces: {
    eyebrow: 'Что измеряет',
    title: 'Шесть показателей, снятых с борта',
    body:
      'Клипса не решает, есть разлив или нет. Она снимает физику поверхности и отдаёт цифры. Решение принимает модель на берегу, а подтверждает человек.',
    items: [
      {
        index: '01',
        value: '0,04–12',
        unit: 'мкм',
        name: 'Толщина плёнки',
        body: 'Оптический датчик ловит разницу отражения. Плёнка толщиной в микрон уже видна.',
      },
      {
        index: '02',
        value: '340 / 440',
        unit: 'нм',
        name: 'Флуоресценция',
        body: 'Ультрафиолет отделяет нефть от водорослей: они светятся на разных длинах волн.',
      },
      {
        index: '03',
        value: '0–400',
        unit: 'NTU',
        name: 'Мутность',
        body: 'Взвесь после шторма выглядит как пятно. Мутность показывает, что это не нефть.',
      },
      {
        index: '04',
        value: '−2…+38',
        unit: '°C',
        name: 'Температура воды',
        body: 'От температуры зависит, как быстро плёнка растекается и испаряется.',
      },
      {
        index: '05',
        value: '±2,5',
        unit: 'м',
        name: 'Координаты и курс',
        body: 'Каждое значение привязано к точке и направлению движения судна.',
      },
      {
        index: '06',
        value: '12',
        unit: 'МП',
        name: 'Снимок поверхности',
        body: 'Кадр раз в пять минут. Он же становится доказательством в протоколе.',
      },
    ],
    footnote: 'Данные уходят пакетом раз в минуту. При потере связи пишутся в память клипсы.',
  },
  how: {
    eyebrow: 'Как работает',
    title: 'Три простых действия. Дальше работает сеть.',
    steps: [
      {
        title: 'Клипса на борту',
        body:
          'Датчик крепится на корпус за минуту. Каждые 40 секунд он измеряет плёнку, флуоресценцию и температуру воды.',
      },
      {
        title: 'Снимок воды',
        body:
          'Экипаж фотографирует поверхность. Модель отличает нефтяную плёнку от блика солнца и цветения водорослей.',
      },
      {
        title: 'Точка на карте',
        body:
          'Показания судов складываются в одну картину побережья. Служба видит координаты, время и плотность пятна.',
      },
    ],
  },
  product: {
    eyebrow: 'Датчик',
    title: 'Одна клипса. Ни одного лишнего действия.',
    body:
      'Корпус из морского алюминия, без кнопок и экрана. Питание от солнца, связь через спутник, когда берега не видно.',
    specs: [
      { value: '412 г', label: 'вес' },
      { value: 'IP68', label: 'защита' },
      { value: '11 мес.', label: 'работа без обслуживания' },
      { value: '40 с', label: 'интервал замера' },
    ],
  },
  map: {
    eyebrow: 'Карта',
    title: 'Побережье одним взглядом',
    body: 'Мангистау, Атырау, Тюб-Караган. Каждая точка — судно, которое прошло здесь сегодня.',
    legend: ['Чисто', 'Плёнка', 'Проверка'],
    live: 'Обновлено 2 мин. назад',
    needKey: 'Ключ Google Maps не найден в окружении проекта. Добавьте его и обновите страницу.',
    error: 'Карта не загрузилась. Проверьте ключ и ограничения домена.',
    fields: {
      vessel: 'Судно',
      time: 'Время',
      level: 'Углеводороды',
      film: 'Толщина плёнки',
      fluor: 'Флуоресценция',
      turb: 'Мутность',
      temp: 'Температура',
      speed: 'Скорость',
      coords: 'Координаты',
      heading: 'Курс',
    },
  },
  gov: {
    eyebrow: 'Государственным органам',
    title: 'Данные, пригодные для протокола',
    body:
      'Каждое измерение подписано временем, координатами и идентификатором судна. Экспорт в формате, принятом экологической инспекцией.',
    cta: 'Запросить доступ',
    points: [
      'Хранение данных на территории Казахстана',
      'Выгрузка по участку и периоду',
      'Доступ по ролям для областных управлений',
    ],
  },
  dash: {
    title: 'Оперативная панель',
    subtitle: 'Мангистауская область · сектор Актау',
    back: 'На сайт',
    ranges: ['24 часа', '7 дней', '30 дней'],
    sector: 'Сектор',
    sectors: ['Актау', 'Тюб-Караган', 'Атырау'],
    kpis: ['судов на связи', 'замеров за сутки', 'событий на проверке', 'медианный отклик'],
    queue: 'Очередь событий',
    columns: { vessel: 'Судно', level: 'Уровень', time: 'Время', state: 'Статус' },
    detail: 'Карточка замера',
    timeline: 'Замеры за сутки',
    timelineNote: 'Высота столбца — число замеров в час. Заливка — доля с превышением.',
    median: '6 мин',
    ack: 'Принять в работу',
    dispatch: 'Направить катер',
    acked: 'Принято в работу',
    dispatched: 'Катер направлен',
    search: 'Поиск судна',
    onlyFlagged: 'Только превышения',
    empty: 'Нет судов по этому фильтру',
    threshold: 'Порог реагирования 5 ppm',
    key: 'Обозначения',
    keyHeight: 'Высота столбика — уровень углеводородов',
    keyCollar: 'Кольцо — превышение порога',
    keySweep: 'Расходящийся круг — нужна проверка',
  },
  footer: {
    tagline: 'Мониторинг Каспия',
    office: 'Актау, Казахстан',
    rights: '2026 Catchy',
    links: ['Документация', 'Приватность', 'Партнёрам'],
  },
}

const kk: Copy = {
  htmlLang: 'kk',
  nav: {
    why: 'Не үшін',
    how: 'Жұмыс принципі',
    sensor: 'Сенсор',
    map: 'Карта',
    state: 'Мемлекетке',
    dashboard: 'Панель',
  },
  hero: {
    title: 'Теңіз алдымен ескертеді',
    lede:
      'Catchy теңізді кесіп өтетін әрбір кемеден суды оқиды. Төгілу картада апталар емес, минуттар ішінде көрінеді.',
    cta: 'Қалай жұмыс істейтінін көру',
    scroll: 'Төмен',
  },
  significance: {
    eyebrow: 'Не үшін керек',
    title: 'Каспийдің ағысы жоқ',
    body: [
      'Бұл — планетадағы ең үлкен тұйық су айдыны. Мұхитқа шығар жолы жоқ, сондықтан ішіне түскеннің бәрі сонда қалады.',
      'Мұнай таралып кетпейді. Ағыс оны солтүстік жағалаудағы таяз шығанақтарға — бекіре уылдырық шашатын, каспий итбалығы төлдейтін жерге қарай айдайды.',
      'Төгілуді спутниктен көреді, бірақ спутник бір нүктенің үстінен бірнеше күнде бір рет өтеді және бұлт арқылы көрмейді. Байқалған кезде дақтың жасы әдетте бір аптадан асқан.',
    ],
    figures: [
      { value: '371 000', unit: 'км²', label: 'жан-жағы тұйықталған теңіз ауданы' },
      { value: '−1,7', unit: 'м', label: '2005 жылдан бергі су деңгейінің төмендеуі' },
      { value: '5', label: 'бір жағалаудағы мемлекет' },
    ],
  },
  stat: {
    value: '18 400',
    unit: 'тонна',
    label: 'мұнай өнімі жыл сайын Каспийге түседі. Көбі — көзден таса.',
  },
  traces: {
    eyebrow: 'Нені өлшейді',
    title: 'Борттан алынатын алты көрсеткіш',
    body:
      'Қыстырғыш төгілу бар-жоғын өзі шешпейді. Ол су бетінің физикасын өлшеп, сандарды береді. Шешімді жағадағы модель ұсынады, адам растайды.',
    items: [
      {
        index: '01',
        value: '0,04–12',
        unit: 'мкм',
        name: 'Қабықша қалыңдығы',
        body: 'Оптикалық сенсор шағылысу айырмасын ұстайды. Бір микрондық қабықша да көрінеді.',
      },
      {
        index: '02',
        value: '340 / 440',
        unit: 'нм',
        name: 'Флуоресценция',
        body: 'Ультракүлгін сәуле мұнайды балдырдан ажыратады: олар әртүрлі толқында жарқырайды.',
      },
      {
        index: '03',
        value: '0–400',
        unit: 'NTU',
        name: 'Лайлылық',
        body: 'Дауылдан кейінгі шөгінді дақ сияқты көрінеді. Лайлылық оның мұнай емесін көрсетеді.',
      },
      {
        index: '04',
        value: '−2…+38',
        unit: '°C',
        name: 'Су температурасы',
        body: 'Қабықшаның қаншалықты тез жайылып, буланатыны температураға байланысты.',
      },
      {
        index: '05',
        value: '±2,5',
        unit: 'м',
        name: 'Координата мен бағыт',
        body: 'Әр мән нүктеге және кеменің жүріс бағытына байланады.',
      },
      {
        index: '06',
        value: '12',
        unit: 'МП',
        name: 'Бет суреті',
        body: 'Бес минут сайын бір кадр. Сол кадр хаттамада дәлел болады.',
      },
    ],
    footnote:
      'Деректер минут сайын топтамамен жіберіледі. Байланыс үзілсе, қыстырғыш жадына жазылады.',
  },
  how: {
    eyebrow: 'Қалай жұмыс істейді',
    title: 'Үш қарапайым қадам. Қалғанын желі жасайды.',
    steps: [
      {
        title: 'Бортқа қыстырғыш',
        body:
          'Сенсор корпусқа бір минутта бекітіледі. Әр 40 секунд сайын қабықшаны, флуоресценцияны және су температурасын өлшейді.',
      },
      {
        title: 'Судың суреті',
        body:
          'Экипаж бетін суретке түсіреді. Модель мұнай қабықшасын күн шағылысуы мен балдыр гүлдеуінен ажыратады.',
      },
      {
        title: 'Картадағы нүкте',
        body:
          'Кемелердің деректері жағалаудың біртұтас көрінісіне жиналады. Қызмет координатаны, уақытты және дақ тығыздығын көреді.',
      },
    ],
  },
  product: {
    eyebrow: 'Сенсор',
    title: 'Бір қыстырғыш. Артық қимыл жоқ.',
    body:
      'Теңіз алюминийінен жасалған корпус, түймесіз және экрансыз. Күннен қуат алады, жаға көрінбегенде спутник арқылы байланысады.',
    specs: [
      { value: '412 г', label: 'салмағы' },
      { value: 'IP68', label: 'қорғанысы' },
      { value: '11 ай', label: 'қызмет көрсетусіз жұмыс' },
      { value: '40 с', label: 'өлшеу аралығы' },
    ],
  },
  map: {
    eyebrow: 'Карта',
    title: 'Жағалау бір көзқараста',
    body: 'Маңғыстау, Атырау, Түпқараған. Әр нүкте — бүгін осы жерден өткен кеме.',
    legend: ['Таза', 'Қабықша', 'Тексеру'],
    live: '2 мин бұрын жаңартылды',
    needKey: 'Жоба ортасынан Google Maps кілті табылмады. Оны қосып, бетті жаңартыңыз.',
    error: 'Карта жүктелмеді. Кілт пен домен шектеулерін тексеріңіз.',
    fields: {
      vessel: 'Кеме',
      time: 'Уақыт',
      level: 'Көмірсутек',
      film: 'Қабықша қалыңдығы',
      fluor: 'Флуоресценция',
      turb: 'Лайлылық',
      temp: 'Температура',
      speed: 'Жылдамдық',
      coords: 'Координаттар',
      heading: 'Бағыт',
    },
  },
  gov: {
    eyebrow: 'Мемлекеттік органдарға',
    title: 'Хаттамаға жарамды деректер',
    body:
      'Әрбір өлшем уақытпен, координатамен және кеме нөмірімен қол қойылады. Экологиялық инспекция қабылдайтын форматта жүктеледі.',
    cta: 'Қолжетімділік сұрау',
    points: [
      'Деректер Қазақстан аумағында сақталады',
      'Аумақ пен кезең бойынша жүктеп алу',
      'Облыстық басқармаларға рөлдік қолжетімділік',
    ],
  },
  dash: {
    title: 'Жедел панель',
    subtitle: 'Маңғыстау облысы · Ақтау секторы',
    back: 'Сайтқа',
    ranges: ['24 сағат', '7 күн', '30 күн'],
    sector: 'Сектор',
    sectors: ['Ақтау', 'Түпқараған', 'Атырау'],
    kpis: ['байланыстағы кемелер', 'тәулігіне өлшем', 'тексерудегі оқиға', 'медианалық жауап'],
    queue: 'Оқиғалар кезегі',
    columns: { vessel: 'Кеме', level: 'Деңгей', time: 'Уақыт', state: 'Күйі' },
    detail: 'Өлшем картасы',
    timeline: 'Тәулік ішіндегі өлшемдер',
    timelineNote: 'Баған биіктігі — сағаттағы өлшем саны. Толық бөлігі — шектен асқан үлесі.',
    median: '6 мин',
    ack: 'Жұмысқа алу',
    dispatch: 'Катер жіберу',
    acked: 'Жұмысқа алынды',
    dispatched: 'Катер жіберілді',
    search: 'Кеме іздеу',
    onlyFlagged: 'Тек асқандар',
    empty: 'Бұл сүзгі бойынша кеме жоқ',
    threshold: 'Ден қою шегі — 5 ppm',
    key: 'Белгілер',
    keyHeight: 'Бағана биіктігі — көмірсутек деңгейі',
    keyCollar: 'Сақина — шектен асу',
    keySweep: 'Кеңейетін шеңбер — тексеру керек',
  },
  footer: {
    tagline: 'Каспий мониторингі',
    office: 'Ақтау, Қазақстан',
    rights: '2026 Catchy',
    links: ['Құжаттама', 'Құпиялық', 'Серіктестерге'],
  },
}

const en: Copy = {
  htmlLang: 'en',
  nav: { why: 'Why', how: 'How it works', sensor: 'Sensor', map: 'Map', state: 'For authorities', dashboard: 'Dashboard' },
  hero: {
    title: 'The sea tells us first',
    lede:
      'Catchy reads the water from every boat that crosses it. A spill reaches the map in minutes, not weeks.',
    cta: 'See how it works',
    scroll: 'Scroll',
  },
  significance: {
    eyebrow: 'Why it matters',
    title: 'The Caspian has no outflow',
    body: [
      'It is the largest enclosed body of water on the planet. Nothing drains to an ocean, so whatever enters it stays.',
      'Oil does not disperse. The current carries it toward the shallow bays of the northern shore — the water where sturgeon spawn and Caspian seals raise their pups.',
      'Spills are found by satellite, but a satellite passes over a given point once every few days and cannot see through cloud. By the time a slick is spotted it is usually more than a week old.',
    ],
    figures: [
      { value: '371,000', unit: 'km²', label: 'of sea, closed on every side' },
      { value: '−1.7', unit: 'm', label: 'drop in water level since 2005' },
      { value: '5', label: 'countries on a single shoreline' },
    ],
  },
  stat: {
    value: '18,400',
    unit: 'tonnes',
    label: 'of oil products enter the Caspian each year. Most of it out of anyone’s sight.',
  },
  traces: {
    eyebrow: 'What it measures',
    title: 'Six readings, taken from the deck',
    body:
      'The clip does not decide whether there is a spill. It measures the physics of the surface and hands over numbers. The model ashore proposes, and a person confirms.',
    items: [
      {
        index: '01',
        value: '0.04–12',
        unit: 'µm',
        name: 'Film thickness',
        body: 'An optical sensor reads the difference in reflection. A film one micron thick shows.',
      },
      {
        index: '02',
        value: '340 / 440',
        unit: 'nm',
        name: 'Fluorescence',
        body: 'Ultraviolet separates oil from algae — the two glow at different wavelengths.',
      },
      {
        index: '03',
        value: '0–400',
        unit: 'NTU',
        name: 'Turbidity',
        body: 'Sediment after a storm looks like a slick. Turbidity shows that it is not oil.',
      },
      {
        index: '04',
        value: '−2…+38',
        unit: '°C',
        name: 'Water temperature',
        body: 'Temperature governs how fast a film spreads across the surface and evaporates.',
      },
      {
        index: '05',
        value: '±2.5',
        unit: 'm',
        name: 'Position and heading',
        body: 'Every value is tied to a point and to the direction the vessel was travelling.',
      },
      {
        index: '06',
        value: '12',
        unit: 'MP',
        name: 'Surface photograph',
        body: 'One frame every five minutes. The same frame becomes evidence in the report.',
      },
    ],
    footnote: 'Readings leave in a batch every minute. If the link drops, they are written to the clip.',
  },
  how: {
    eyebrow: 'How it works',
    title: 'Three simple moves. The network does the rest.',
    steps: [
      {
        title: 'A clip on the hull',
        body:
          'The sensor mounts in under a minute. Every 40 seconds it measures sheen, fluorescence and water temperature.',
      },
      {
        title: 'A photo of the water',
        body:
          'The crew photographs the surface. The model separates an oil film from sun glare and algal bloom.',
      },
      {
        title: 'A point on the map',
        body:
          'Readings from every boat merge into one coastal picture. Inspectors see coordinates, time and density.',
      },
    ],
  },
  product: {
    eyebrow: 'The sensor',
    title: 'One clip. Nothing to operate.',
    body:
      'Marine aluminium body, no buttons and no screen. Solar powered, with satellite uplink for the hours when the coast is out of sight.',
    specs: [
      { value: '412 g', label: 'weight' },
      { value: 'IP68', label: 'sealing' },
      { value: '11 mo', label: 'unattended service' },
      { value: '40 s', label: 'sampling interval' },
    ],
  },
  map: {
    eyebrow: 'The map',
    title: 'The coastline at a glance',
    body: 'Mangystau, Atyrau, Tyub-Karagan. Every point is a boat that passed through today.',
    legend: ['Clear', 'Sheen', 'Review'],
    live: 'Updated 2 min ago',
    needKey: 'No Google Maps key was found in the project environment. Add one and reload.',
    error: 'The map did not load. Check the key and its domain restrictions.',
    fields: {
      vessel: 'Vessel',
      time: 'Time',
      level: 'Hydrocarbons',
      film: 'Film thickness',
      fluor: 'Fluorescence',
      turb: 'Turbidity',
      temp: 'Temperature',
      speed: 'Speed',
      coords: 'Position',
      heading: 'Heading',
    },
  },
  gov: {
    eyebrow: 'For authorities',
    title: 'Evidence that holds up on paper',
    body:
      'Every reading is signed with a timestamp, coordinates and a vessel identifier. Export in the format the environmental inspectorate already accepts.',
    cta: 'Request access',
    points: [
      'Data stored inside Kazakhstan',
      'Export by sector and date range',
      'Role-based access for regional offices',
    ],
  },
  dash: {
    title: 'Operations',
    subtitle: 'Mangystau region · Aktau sector',
    back: 'Back to site',
    ranges: ['24 hours', '7 days', '30 days'],
    sector: 'Sector',
    sectors: ['Aktau', 'Tyub-Karagan', 'Atyrau'],
    kpis: ['vessels reporting', 'readings today', 'events under review', 'median response'],
    queue: 'Event queue',
    columns: { vessel: 'Vessel', level: 'Level', time: 'Time', state: 'State' },
    detail: 'Reading record',
    timeline: 'Readings over 24 hours',
    timelineNote: 'Bar height is readings per hour. The fill is the share over threshold.',
    median: '6 min',
    ack: 'Acknowledge',
    dispatch: 'Dispatch a boat',
    acked: 'Acknowledged',
    dispatched: 'Boat dispatched',
    search: 'Find a vessel',
    onlyFlagged: 'Over threshold only',
    empty: 'No vessels match this filter',
    threshold: 'Action threshold 5 ppm',
    key: 'Key',
    keyHeight: 'Column height is the hydrocarbon level',
    keyCollar: 'A collar marks a reading over threshold',
    keySweep: 'An expanding ring needs a person',
  },
  footer: {
    tagline: 'Caspian monitoring',
    office: 'Aktau, Kazakhstan',
    rights: '2026 Catchy',
    links: ['Documentation', 'Privacy', 'Partners'],
  },
}

export const COPY: Record<Lang, Copy> = { ru, kk, en }
