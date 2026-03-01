/**
 * Sachkunde – Berichte, Quiz und Spiele zu römischen Themen.
 */

export interface SachkundeQuizFrage {
  question: string
  options: string[]
  correctIndex: number
}

export interface SachkundePaar {
  begriff: string
  erklaerung: string
}

export interface SachkundeThema {
  id: string
  title: string
  report: string
  quiz: SachkundeQuizFrage[]
  gamePairs: SachkundePaar[]
}

export const SACHKUNDE_TOPICS: SachkundeThema[] = [
  {
    id: 'triumphzug',
    title: 'Triumphzug',
    report: `Der Triumphzug war die höchste Ehrung für einen siegreichen Feldherrn in Rom. Nur ein amtierender Magistrat mit Imperium durfte einen Triumph beantragen – und nur, wenn er einen bedeutenden Sieg in einem „gerechten“ Krieg errungen hatte.

Der Zug bewegte sich durch die Stadt zum Tempel des Jupiter auf dem Kapitol. Der Triumphator fuhr in einer Quadriga, sein Gesicht war rot bemalt (wie die Statue des Jupiter). Hinter ihm marschierten Soldaten, zeigten Beutestücke und führten Gefangene mit. Sklaven hielten dem Sieger eine goldene Krone über das Haupt und flüsterten: „Bedenke, dass du ein Mensch bist.“

Am Ende opferte der Triumphator dem Jupiter und feierte mit einem großen Fest. Der bekannteste Triumph war der von Caesar nach dem Sieg über Gallien.`,
    quiz: [
      { question: 'Wohin zog der Triumphzug?', options: ['Zum Forum Romanum', 'Zum Tempel des Jupiter auf dem Kapitol', 'Zum Circus Maximus', 'Zum Palatin'], correctIndex: 1 },
      { question: 'In welchem Fahrzeug fuhr der Triumphator?', options: ['In einer Sänfte', 'In einer Quadriga', 'Zu Pferd', 'In einer Galeere'], correctIndex: 1 },
      { question: 'Was flüsterten die Sklaven dem Triumphator zu?', options: ['„Du bist unbesiegbar“', '„Bedenke, dass du ein Mensch bist“', '„Rom dankt dir“', '„Jupiter schützt dich“'], correctIndex: 1 },
      { question: 'Wer durfte einen Triumph beantragen?', options: ['Jeder Soldat', 'Nur ein amtierender Magistrat mit Imperium', 'Nur der Senat', 'Nur Priester'], correctIndex: 1 },
    ],
    gamePairs: [
      { begriff: 'Quadriga', erklaerung: 'Viergespann-Wagen des Triumphators' },
      { begriff: 'Kapitol', erklaerung: 'Heiliger Hügel mit Jupiter-Tempel' },
      { begriff: 'Imperium', erklaerung: 'Befehlsgewalt eines Magistrats' },
      { begriff: 'Beute', erklaerung: 'Im Krieg eroberte Schätze' },
    ],
  },
  {
    id: 'patrizier-plebejer',
    title: 'Patrizier und Plebejer',
    report: `In der frühen Römischen Republik war die Gesellschaft in zwei große Gruppen geteilt: die Patrizier und die Plebejer.

Die Patrizier waren die alte Adelsgeschlechter. Sie besaßen das meiste Land, bekleideten die wichtigsten Ämter und Priesterstellen und entschieden im Senat. Nur sie kannten die Gesetze, die zunächst nicht aufgeschrieben waren.

Die Plebejer waren die „einfachen“ Bürger: Bauern, Handwerker, Händler. Sie mussten in der Armee dienen, hatten aber kaum politische Rechte. Wenn sie Schulden hatten, konnten sie versklavt werden.

Nach harten Auseinandersetzungen („Ständekämpfe“) errangen die Plebejer schrittweise mehr Rechte: eigene Volksversammlung (concilium plebis), schriftliche Gesetze (Zwölftafelgesetz), Zugang zu Ämtern. Die Volkstribunen konnten Beschlüsse des Senats blockieren. So wurde Rom zu einer Gesellschaft, in der nicht nur Herkunft, sondern auch Gesetz und Amt zählten.`,
    quiz: [
      { question: 'Wer waren die Patrizier?', options: ['Die ärmsten Bürger', 'Die alten Adelsgeschlechter', 'Fremde Söldner', 'Freigelassene Sklaven'], correctIndex: 1 },
      { question: 'Was war das concilium plebis?', options: ['Ein Gericht', 'Die Volksversammlung der Plebejer', 'Ein Tempel', 'Ein Fest'], correctIndex: 1 },
      { question: 'Wofür sorgte das Zwölftafelgesetz?', options: ['Mehr Land für Patrizier', 'Schriftliche, für alle sichtbare Gesetze', 'Abschaffung der Armee', 'Neue Steuern'], correctIndex: 1 },
      { question: 'Was konnten die Volkstribunen?', options: ['Kriege führen', 'Beschlüsse des Senats blockieren', 'Den Konsul absetzen', 'Tempel weihen'], correctIndex: 1 },
    ],
    gamePairs: [
      { begriff: 'Patrizier', erklaerung: 'Alte Adelsgeschlechter Roms' },
      { begriff: 'Plebejer', erklaerung: 'Einfache Bürger (Bauern, Handwerker)' },
      { begriff: 'Volkstribun', erklaerung: 'Vertreter der Plebejer mit Vetorecht' },
      { begriff: 'Zwölftafelgesetz', erklaerung: 'Erste schriftliche Gesetze Roms' },
    ],
  },
  {
    id: 'rom-sklaven',
    title: 'Rom und seine Sklaven',
    report: `Sklaverei war in der antiken Welt alltäglich – und Rom war eine der größten Sklavenhaltergesellschaften. Sklaven galten rechtlich als „Sachen“, nicht als Personen. Sie konnten gekauft, verkauft, vererbt und bestraft werden.

Sklaven arbeiteten in Haushalten (als Köche, Lehrer, Ärzte), in der Landwirtschaft, in Bergwerken und beim Bau. Besonders gefürchtet waren die Gladiatorenkämpfe und die Arbeit in den Blei- und Silberminen, die oft den Tod bedeuteten.

Es gab aber auch Wege aus der Sklaverei: Freilassung (manumissio) durch den Herrn. Freigelassene wurden römische Bürger, durften aber keine hohen Ämter bekleiden. Manche Sklaven konnten sich selbst freikaufen. Aufstände wie der des Spartacus (73–71 v. Chr.) blieben selten und wurden blutig niedergeschlagen.`,
    quiz: [
      { question: 'Wie galten Sklaven rechtlich in Rom?', options: ['Als Bürger zweiter Klasse', 'Als „Sachen“, nicht als Personen', 'Als Gäste', 'Als Vertragspartner'], correctIndex: 1 },
      { question: 'Was war manumissio?', options: ['Eine Steuer', 'Die Freilassung eines Sklaven', 'Ein Fest', 'Eine Provinz'], correctIndex: 1 },
      { question: 'Wer führte einen großen Sklavenaufstand an?', options: ['Caesar', 'Spartacus', 'Cicero', 'Augustus'], correctIndex: 1 },
      { question: 'Dürften Freigelassene hohe Ämter bekleiden?', options: ['Ja, wie alle Bürger', 'Nein, sie hatten eingeschränkte Rechte', 'Nur im Senat', 'Nur als Priester'], correctIndex: 1 },
    ],
    gamePairs: [
      { begriff: 'Manumissio', erklaerung: 'Freilassung eines Sklaven' },
      { begriff: 'Spartacus', erklaerung: 'Anführer eines Sklavenaufstands' },
      { begriff: 'Gladiatoren', erklaerung: 'Kämpfer in der Arena' },
      { begriff: 'Freigelassener', erklaerung: 'Ehemaliger Sklave mit Bürgerrecht' },
    ],
  },
  {
    id: 'etrusker',
    title: 'Die Etrusker und ihr Einfluss auf Rom',
    report: `Die Etrusker lebten nördlich von Rom in der heutigen Toskana. Sie waren eine hoch entwickelte Kultur mit eigener Sprache, Schrift und Kunst. Lange bevor Rom zur Großmacht wurde, beherrschten die Etrusker weite Teile Italiens.

Ihr Einfluss auf Rom war enorm: Die Römer übernahmen von ihnen die Schrift (über das griechische Alphabet), die Kunst des Tempelbaus mit Tonziegeln und Giebelfiguren, die Toga und viele religiöse Bräuche. Die Wahrsagekunst (Haruspizium: Deutung von Tierlebern) und die Spiele (ludi) sollen etruskische Wurzeln haben. Sogar die römischen Ziffern und die Einteilung des Tages gehen auf etruskische oder gemeinsame Traditionen zurück.

Die letzten etruskischen Könige Roms (die Tarquinier) wurden um 509 v. Chr. vertrieben – der Legende nach wegen der Gewalttat des Tarquinius Superbus. Danach wurde Rom Republik und grenzte sich von der etruskischen Monarchie ab, behielt aber viele ihrer Kulturleistungen bei.`,
    quiz: [
      { question: 'Wo lebten die Etrusker hauptsächlich?', options: ['In Sizilien', 'In der heutigen Toskana', 'In Gallien', 'In Griechenland'], correctIndex: 1 },
      { question: 'Was übernahmen die Römer von den Etruskern?', options: ['Das Christentum', 'Schrift, Tempelbau, viele Bräuche', 'Die Legion', 'Das Kolosseum'], correctIndex: 1 },
      { question: 'Was ist Haruspizium?', options: ['Eine Sportart', 'Wahrsagekunst durch Deutung von Tierlebern', 'Ein Fest', 'Eine Gottheit'], correctIndex: 1 },
      { question: 'Wann wurden die etruskischen Könige aus Rom vertrieben?', options: ['Um 753 v. Chr.', 'Um 509 v. Chr.', 'Um 44 v. Chr.', 'Um 27 v. Chr.'], correctIndex: 1 },
    ],
    gamePairs: [
      { begriff: 'Etrusker', erklaerung: 'Kultur in der Toskana vor Rom' },
      { begriff: 'Haruspizium', erklaerung: 'Deutung von Tierlebern zur Weissagung' },
      { begriff: 'Tarquinier', erklaerung: 'Letzte etruskische Königsdynastie in Rom' },
      { begriff: 'Toga', erklaerung: 'Römisches Gewand mit etruskischem Ursprung' },
    ],
  },
  {
    id: 'raub-sabinerinnen',
    title: 'Der Raub der Sabinerinnen',
    report: `Die Sage vom Raub der Sabinerinnen gehört zu den Gründungsmythen Roms. Romulus hatte mit seinen Männern die neue Stadt Rom gegründet, aber es fehlte an Frauen. Die Nachbarn – unter anderem die Sabiner – weigerten sich, ihre Töchter mit den Römern zu verheiraten.

Romulus lud die Sabiner und andere Nachbarvölker zu einem Fest ein. Auf ein Zeichen hin raubten die Römer die unverheirateten jungen Frauen. Die Sabiner rüsteten zum Krieg. In der Schlacht stürmten die sabinischen Frauen – inzwischen Mütter römischer Kinder – zwischen die kämpfenden Heere und riefen, man solle nicht ihre Väter und Ehemänner gegeneinander kämpfen lassen. So kam es zur Versöhnung: Sabiner und Römer vereinten sich zu einem Volk.

Die Erzählung erklärt einerseits die Verbindung Roms mit den Sabinern, andererseits wirft sie heute Fragen nach Gewalt und Zustimmung auf. In der Antike wurde sie oft als mutiger Gründungsakt gedeutet.`,
    quiz: [
      { question: 'Warum raubten die Römer die Sabinerinnen?', options: ['Als Sklavinnen', 'Weil sie Ehefrauen suchten und die Nachbarn ablehnten', 'Als Geiseln', 'Für ein Opfer'], correctIndex: 1 },
      { question: 'Wer beendete die Schlacht zwischen Römern und Sabinern?', options: ['Romulus', 'Die geraubten Frauen, die zwischen die Heere traten', 'Ein Gott', 'Ein Friedensvertrag'], correctIndex: 1 },
      { question: 'Was folgte aus der Versöhnung?', options: ['Rom wurde zerstört', 'Sabiner und Römer vereinten sich zu einem Volk', 'Die Frauen kehrten heim', 'Romulus wurde abgesetzt'], correctIndex: 1 },
      { question: 'Zu wem lud Romulus zum Fest ein?', options: ['Nur zu den Etruskern', 'Zu den Sabinern und anderen Nachbarn', 'Nur zu den Latinern', 'Zu niemandem'], correctIndex: 1 },
    ],
    gamePairs: [
      { begriff: 'Romulus', erklaerung: 'Gründer Roms und Anstifter des Raubs' },
      { begriff: 'Sabiner', erklaerung: 'Nachbarvolk, dessen Töchter geraubt wurden' },
      { begriff: 'Gründungsmythos', erklaerung: 'Sage zur Erklärung der Stadtgründung' },
      { begriff: 'Versöhnung', erklaerung: 'Vereinigung von Römern und Sabinern durch die Frauen' },
    ],
  },
]

export function getSachkundeTopic(id: string): SachkundeThema | undefined {
  return SACHKUNDE_TOPICS.find((t) => t.id === id)
}

export function getSachkundeTopicIds(): string[] {
  return SACHKUNDE_TOPICS.map((t) => t.id)
}
