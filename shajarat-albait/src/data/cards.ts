import type { DialogCard } from '../types'

/** بطاقات الحوار العائلية — أضف بطاقات جديدة هنا (أو من API لاحقًا) */
export const DIALOG_CARDS: DialogCard[] = [
  { id: 'c1', text: 'ما أجمل موقف عائلي تتمنون أن يتكرر؟', category: 'ذكريات' },
  { id: 'c2', text: 'ما أجمل ذكرى جمعتكم؟', category: 'ذكريات' },
  { id: 'c3', text: 'لو تستطيعون السفر معًا، أين ستذهبون؟', category: 'أحلام' },
  { id: 'c4', text: 'ما الشيء الذي تحبونه في عائلتكم؟', category: 'امتنان' },
  { id: 'c5', text: 'ما أكثر موقف مضحك حصل لكم؟', category: 'ضحك' },
  { id: 'c6', text: 'ما الشيء الذي تتمنون أن تفعلوه معًا قريبًا؟', category: 'أحلام' },
  { id: 'c7', text: 'من الشخص في العائلة الذي ساعدك هذا الأسبوع؟ اشكره الآن.', category: 'امتنان' },
  { id: 'c8', text: 'ما أكلة البيت التي لا تُنسى؟ ومن يطبخها أفضل؟', category: 'ذكريات' },
  { id: 'c9', text: 'لو كانت عائلتكم فريقًا رياضيًا، ما اسمه وما شعاره؟', category: 'ضحك' },
  { id: 'c10', text: 'ما الشيء الذي تعلّمته من أحد أفراد العائلة؟', category: 'امتنان' },
  { id: 'c11', text: 'صِف يومك المثالي مع العائلة من الصباح حتى المساء.', category: 'أحلام' },
  { id: 'c12', text: 'ما أول ذكرى تتذكرها من طفولتك؟', category: 'ذكريات' },
  { id: 'c13', text: 'ما الموهبة التي لا يعرفها الجميع عنك؟', category: 'تعارف' },
  { id: 'c14', text: 'لو اخترعنا عادة عائلية جديدة، ماذا ستكون؟', category: 'أحلام' },
  { id: 'c15', text: 'ما أطرف لقب أُطلق على أحد في العائلة؟ وما قصته؟', category: 'ضحك' },
  { id: 'c16', text: 'ما الذي يجعلك تشعر بالراحة في البيت؟', category: 'امتنان' },
  { id: 'c17', text: 'ما الحلم الذي تريد أن تحققه هذه السنة؟ وكيف نساعدك؟', category: 'تعارف' },
  { id: 'c18', text: 'ما أجمل هدية تلقيتها من أحد في العائلة؟', category: 'ذكريات' },
  { id: 'c19', text: 'لو تبادلنا الأدوار ليوم واحد، من ستكون ولماذا؟', category: 'ضحك' },
  { id: 'c20', text: 'ما الكلمة التي تصف عائلتنا؟ ولماذا اخترتها؟', category: 'امتنان' },
  { id: 'c21', text: 'ما الشيء الصغير الذي يُسعدك ولا ينتبه له أحد؟', category: 'تعارف' },
  { id: 'c22', text: 'ما المكان الذي تتمنى أن نزوره معًا داخل مدينتنا؟', category: 'أحلام' },
  { id: 'c23', text: 'احكِ لنا عن أصعب يوم مرّ عليك وكيف تجاوزته.', category: 'تعارف' },
  { id: 'c24', text: 'ما الأغنية أو القصة التي تذكّرك بالعائلة؟', category: 'ذكريات' },
]

export function cardById(id: string): DialogCard {
  return DIALOG_CARDS.find((c) => c.id === id) ?? DIALOG_CARDS[0]
}

/** Random card, avoiding the ones already used this session when possible */
export function randomCard(exclude: string[] = []): DialogCard {
  const pool = DIALOG_CARDS.filter((c) => !exclude.includes(c.id))
  const list = pool.length ? pool : DIALOG_CARDS
  return list[Math.floor(Math.random() * list.length)]
}
