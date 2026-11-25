import { correspondenceTopics, mingAdditionalMemberIds } from './correspondence-topic-list.mjs';

export const curatedLetterAlbum = {
  id: 'LJM-CUR-MING-LETTERS',
  tag: '明的家书',
  title: '明的家书',
  description: '船上的人问起家里，家里的人也想知道船几时靠岸。孩子的功课、住处、日常开支和身体，都值得写上一段。这些隔着距离说的家常话，收在网站的主题选览里。写信年代见各件档案。',
};

// 专题只保存公开题名、说明和档案编号，具体档案的公开状态由展示层逐件判断。
export function createCorrespondenceIndex(topics, additionalMingIds) {
  const byId = new Map([[curatedLetterAlbum.id, curatedLetterAlbum]]);
  const byMember = new Map();
  function addMember(itemId, topic) {
    if (!/^LJM-\d{8}-[A-Z]{3}-\d{3}$/.test(itemId) || byMember.has(itemId)) {
      throw new Error(`通信专题的档案编号无效或重复：${itemId}`);
    }
    byMember.set(itemId, topic);
  }
  for (const id of additionalMingIds) addMember(id, curatedLetterAlbum);
  for (const topic of topics) {
    if (!/^LJM-CUR-[A-Z0-9-]+$/.test(topic.id) || byId.has(topic.id) ||
        topic.id === 'LJM-CUR-SHANGHAI-VIEWS' || !topic.title?.trim() || !topic.description?.trim() ||
        !Array.isArray(topic.memberIds) || topic.memberIds.length < 2) {
      throw new Error(`请核对通信专题的编号、标题、说明和成员：${topic.id}`);
    }
    byId.set(topic.id, topic);
    for (const id of topic.memberIds) addMember(id, topic);
  }
  return {
    forId: id => byId.get(id),
    forRecord(record) {
      if (record?.core?.object_type === 'LET' && record.public_view?.tags?.includes(curatedLetterAlbum.tag)) {
        return curatedLetterAlbum;
      }
      return byMember.get(record?.core?.item_id);
    },
  };
}
export const correspondenceIndex = createCorrespondenceIndex(correspondenceTopics, mingAdditionalMemberIds);
