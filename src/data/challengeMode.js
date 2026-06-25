export const CHALLENGE_MODE_TEAM = {
  id: 'spain_world_cup',
  name: '西班牙',
  shortName: '西班牙',
  description: '世界杯挑战模式：率领西班牙从四场友谊赛一路打进世界杯正赛。',
  initialStats: {
    dressingRoom: 70,
    authority: 70,
    mediaSupport: 60,
    fatigue: 0,
    points: 0,
    tactics: 8
  }
};

export const CHALLENGE_MODE_DECISIONS = [
  {
    id: 'management_spy',
    title: '安插眼线，严格规范球员私生活',
    type: 'management',
    description: '作为一个严苛的主教练，你必须让球员们知道，在西班牙国家队的训练基地里，墙上的每项规定后面，都有一些双面胶。',
    effects: { dressingRoom: -5, authority: 5, mediaSupport: 5 }
  },
  {
    id: 'management_party',
    title: '与球员们一同参加聚会，喝无酒精饮料',
    type: 'management',
    description: '你当然说了不准喝可乐，但是有谁会听呢？你只能说服自己，至少你盯着他们，他们还不敢喝酒。',
    effects: { dressingRoom: 10, authority: -5, negativeNews: 1 }
  },
  {
    id: 'management_relaxed',
    title: '每天乐呵呵地上班，毫不约束球员',
    type: 'management',
    description: '从苦难和高压下走出来的你崇尚快乐教育，于是你选择了给球员们最大限度的自由。很可惜，这个世界上的绝大多数人并不能理解这一点。',
    effects: { dressingRoom: 10, authority: -5, mediaSupport: -5 }
  },
  {
    id: 'management_starting_competition',
    title: '亲自宣布首发竞争',
    type: 'management',
    description: '你把首发名单重新摊开，告诉所有人位置不是凭名气拿到的。训练场上的强度立刻上来了，但没人会喜欢安全感被当众拿走。',
    effects: { tactics: 0.5, fatigue: 1, dressingRoom: -5 },
    requiresAuthorityAbove: 40
  },
  {
    id: 'training_hard',
    title: '大幅增加训练量',
    type: 'training',
    description: '你拉高了训练强度，希望尽快把球队的技战术咬合到一起。',
    effects: { tactics: 0.5, fatigue: 6 }
  },
  {
    id: 'training_orange',
    title: '在训练时和大家一起坐在草地上剥橘子',
    type: 'training',
    description: '训练场边的气氛突然柔和下来，球员们难得地笑了。',
    effects: { dressingRoom: 5 }
  },
  {
    id: 'training_secret',
    title: '进行保密训练，拒绝一切消息外传',
    type: 'training',
    description: '训练场大门紧闭，所有消息都被挡在了外面。',
    effects: { tactics: 0.5, mediaSupport: -5 },
    requiresAuthorityAbove: 40
  },
  {
    id: 'training_classico_tape',
    title: '取消赛前训练，让球员观看十五年前的国家德比',
    type: 'training',
    description: '你取消了赛前训练，把球员们带进会议室观看十五年前的国家德比。起初大家以为这是战术课，直到两边的教练员开始打架，比分牌定格在5-0. 几名年轻人开始偷偷搜索“这场比赛后来发生了什么”。你认真地告诉他们：今天的训练重点是理解足球的历史重量。球员们认真地点头，主要是因为终于不用跑圈了。身体得到了休息，战术变得松散了一些，更衣室里的气氛也因为某些旧画面变得微妙起来。',
    effects: { tactics: -0.5, fatigue: -10, dressingRoom: -5 }
  },
  {
    id: 'rest_day_off',
    title: '给球员放假一天',
    type: 'recovery',
    description: '你决定让大家离开基地一天，好把身体和脑子都放松下来。',
    effects: { mediaSupport: -5, fatigue: -5 }
  },
  {
    id: 'cook_paella',
    title: '为球员烹饪西班牙海鲜饭',
    type: 'paella',
    description: '你决定亲自下厨，为球员们做一锅西班牙海鲜饭。严格来说，这并不是训练计划的一部分，也不太像一名国家队主教练该做的事情，但当香味从餐厅里飘出来时，更衣室里的气氛确实缓和了一点。媒体很快拍到了你系着围裙的照片，并称这是“危机中的温情时刻”。当然，也有人开始怀疑你是不是已经放弃了用战术解决问题。',
    effects: { dressingRoom: 10, mediaSupport: 5, fatigue: -2, authority: -5 },
    special: 'cook_paella'
  },
  {
    id: 'find_mole',
    title: '在更衣室抓内鬼',
    type: 'mole',
    description: '你决定亲自清查更衣室里那些若有若无的风声。',
    effects: { dressingRoom: -10, authority: 10 },
    requiresAuthorityAbove: 40
  },
  {
    id: 'legend_speech',
    title: '找名宿鼓舞士气',
    type: 'legend',
    description: '随机邀请一位名宿来到训练基地演讲。正式开赛前可用，且不会重复。',
    effects: {},
    onlyBeforeOfficial: true,
    special: 'legend_speech'
  }
];

export const CHALLENGE_PREMATCH_TACTIC_GROUPS = [
  {
    id: 'formationDeployment',
    title: '赛前阵容部署',
    options: [
      {
        id: 'formation_433',
        label: '4-3-3',
        description: '熟悉、现代、宽阔。你把三名前锋推到最前面，希望他们能在边路和肋部找到空间。'
      },
      {
        id: 'formation_4231',
        label: '4-2-3-1',
        description: '你决定在中前场之间留出一个连接点。理论上，这能让球队进攻更流畅；实践上，也可能让所有人都把球交给前腰然后开始围观。'
      },
      {
        id: 'formation_442',
        label: '4-4-2',
        description: '简单，直接，古老，但并不一定过时。'
      },
      {
        id: 'formation_4141',
        label: '4-1-4-1',
        description: '你在后防线前放下一名屏障，并试图用四名中场控制局面。只要所有人都记得自己的位置，这会是一套非常体面的阵型。'
      },
      {
        id: 'formation_532',
        label: '5-3-2',
        description: '你增加了一名中卫，把安全感写在阵型图上。足球有时是一种悲观主义。'
      },
      {
        id: 'formation_343',
        label: '3-4-3',
        description: '你选择把阵型推得更大胆。前场看起来人很多，后场看起来也许够用。'
      }
    ]
  }
];

export const CHALLENGE_RANDOM_EVENTS = [
  {
    id: 'locker_room_shirt',
    title: '踩脏的白色球衣',
    description: '众所周知，自从那两个人的交锋之后，每个西班牙国家队的主教练都需要处理深厚的皇萨矛盾。一天，你走进更衣室，发现一件躺在地上的白色球衣，上面全是脚印，队徽已经脏得看不清了。碰巧，队伍中为数不多的一位皇马球员也在这时进入了更衣室。他皱着眉看球衣，又看你。你需要尽快做些什么来应对这个局面…',
    options: [
      {
        text: '告诉他现在队里几乎全是巴萨球员，要隐忍',
        effects: { dressingRoom: 5, authority: -5 },
        followupDescription: '你可能是第一个让皇马球员隐忍的人，哦，也许不是第一个，但至少他们现在没法把你整下课。对方什么话也没说，只是耸了耸肩，而你站在旁边，适时地保持了沉默。至少这一刻，更衣室里没有再多出第二件被踩脏的球衣。'
      },
      {
        text: '大发雷霆，将所有球员喊来质问是谁干的',
        effects: { dressingRoom: -10, authority: 5 },
        followupDescription: '你当场震怒，立刻把所有人都叫回了更衣室。场面一度非常像小学班主任追查是谁在黑板上乱画，只不过这次地上的不是粉笔灰，而是一件已经看不出队徽的白球衣。最后，事情当然没有查出结果，但所有人都成功浪费了一段原本可以拿去休息的时间。你对此还算满意。'
      },
      {
        text: '“阿森纳的人太可恶了，竟敢这样对待热刺队友的球衣，难道俯冲英冠就有原罪吗？！”',
        effects: { negativeNews: 1 },
        followupDescription: '他看着你，像是在判断你究竟是在打圆场，还是已经被这支球队的种种破事逼出了心理问题。你若无其事地站着，仿佛自己刚才说的是一句再正常不过的话。第二天，一些关于国家队主帅精神状态堪忧的小道消息，果然开始在媒体间悄悄流传。'
      }
    ]
  },
  {
    id: 'legends_break_in',
    title: '传奇翻墙',
    description: '保密训练时，你看到两个鬼鬼祟祟的人影翻墙进入了基地，并向着训练场悄无声息地前进。你赶紧带上安保人员上去将他们围住，刚要套麻袋，却发现竟是普约尔与卡西利亚斯！他们连忙解释，说自己只是来凑热闹的，并无扰乱国家队训练的意图。众人面面相觑，十分尴尬。你决定…',
    options: [
      {
        text: '我支持巴塞罗那！将卡西利亚斯套麻袋并扔出去',
        effects: { dressingRoom: 5, mediaSupport: -10, authority: 5 },
        followupDescription: '普约尔欲言又止，但他很快被队里的年轻人围住了。你满意地看着这其乐融融的场景，丝毫没留意到有记者蹲守在门口。第二天马卡报头版头条：震惊！国家队主帅公然羞辱皇马名宿！巴萨前队长获特殊待遇。'
      },
      {
        text: '我支持皇家马德里！将普约尔套麻袋并扔出去',
        effects: { dressingRoom: -10, mediaSupport: 5, authority: 5 },
        followupDescription: '卡西想说点什么，但最终还是保持了沉默。更衣室响起一阵窃窃私语，几个性子直的小年轻气愤地想找你麻烦，但很快被其他队友拦住了。第二天阿斯报头版头条：铁血主帅不惧派系压力！皇马名宿获应有尊重。'
      },
      {
        text: 'I Just Hope Both Team LOSE！将两个人都套麻袋扔出去',
        effects: { dressingRoom: -5, mediaSupport: -5, authority: 10 },
        followupDescription: '是可忍孰不可忍！你将两个人都扔了出去。队员面面相觑，有人小声求情，被你无视；媒体更是觉得你疯了。但从此，基地再也没出现过闲杂人等。'
      },
      {
        text: '让安保人员围住这两人，并打电话给哈维，让他过来处理',
        effects: {},
        followupDescription: '哈维黑着脸把两个人拽走了。队里的年轻球员好奇地探出头，问你为什么三位前辈脸色都这么差？你笑而不语。',
        effectsPreviewText: '什么都没有发生，你松了一口气…'
      }
    ]
  },
  {
    id: 'barca_director_call',
    title: '来自巴萨的电话',
    description: '巴塞罗那的总监打电话给你，委婉地告诉你请不要把他们的球员当驴使，否则他们就要找你的麻烦。无论你实际打算做些什么，在电话里，你总得先给出一个礼貌的回应。你决定回答…',
    options: [
      {
        text: '“嗯嗯好，你说的对，是这样的，我们不会让任何一个巴萨球员进入首发，好了，满意了？”',
        effects: { dressingRoom: -10 },
        followupDescription: '你知道对方听出了你的阴阳怪气，而你也懒得再装出什么合作姿态。挂断电话后，你看着训练名单，忽然意识到自己刚才那几句气话迟早会传进更衣室里。到那时，恐怕没人会觉得这是个玩笑。'
      },
      {
        text: '“好的这边也是理解您的一个良苦用心，不同意，想必我们都是希望西班牙国家队能够在世界杯中走得更远的。”',
        effects: { mediaSupport: 5, authority: 5 },
        followupDescription: '你用一种近乎播音腔的平稳语气说完了这段话，连自己都差点听笑。电话那头似乎被你这套滴水不漏的废话噎住了，半天没找到切入口，只得悻悻挂断。你放下手机，长舒一口气，觉得自己像是刚在会议室里踢赢了一场没有观众的加时赛。只是你也明白，这场闹剧绝不会就这么结束。',
        special: { forceNextRandomEvent: 'heckling' }
      },
      {
        text: '“我能坐到这个位置也是略有一些人脉，当心你们下赛季的var！”',
        effects: { mediaSupport: 5, dressingRoom: -10 },
        followupDescription: '电话那头安静了两秒，像是在重新确认你到底是在开玩笑，还是在认真放狠话。你面不改色地把手机拿远了些，甚至还有点想笑，仿佛自己刚才说出口的不是威胁，而是一句极其普通的客套。挂断之后，你忽然觉得更衣室里的空气大概也快要变得和这通电话一样精彩了。'
      }
    ]
  },
  {
    id: 'canteen_gossip',
    title: '饭堂八卦',
    description: '你加班思考战术布局。下班路过饭堂时，你发现队里几个年轻小孩还在边吃饭边聊天。你在门外偷听，发现他们在聊十几年前国家队的八卦！更重要的是，你发现他们目前扒出来的都是真的！你准备：',
    options: [
      {
        text: '出现在他们面前，冷冷开口：马上就要比赛了还在这聊天？',
        effects: { dressingRoom: -5, authority: 5 },
        followupDescription: '你的队员们噤若寒蝉，赶紧低下头收拾东西走了。'
      },
      {
        text: '加入他们！告知他们一点不为人知的细节，并且告诉他们下场比赛赢球，则告知更多惊天动地的八卦',
        effects: { tactics: 0.5, mediaSupport: -10 },
        followupDescription: '你的队员们围在你身边，聚精会神地听你聊那些过去的事情。然而到了最关键的地方，你卖了个关子。你成功让他们当天晚上辗转反侧，但又在第二天训练的时候精神抖擞。你从未意识到前辈们的故事这么好用…'
      },
      {
        text: '躲在门后继续偷听。万一还有我不知道的事情呢？',
        effects: { authority: -5 },
        followupDescription: '听着听着，你发现他们越说越离谱，话题甚至落到了你身上。这时候再出去打断就晚了，你只能咬牙切齿地偷偷离开，并在第二天面对他们探究的眼神时尽可能若无其事。',
        special: { forceNextRandomEvent: 'heckling' }
      }
    ]
  },
  {
    id: 'press_conference_injury',
    title: '发布会刁难',
    description: '一场发布会上，原本是其乐融融的氛围，突然，一个记者对你发起了刁难：“我听说，有多个俱乐部的教练对您表达了不满，指责您过度使用球员，导致了许多伤病问题……您认为自己需要为此负责吗？”你的反应是：',
    options: [
      {
        text: '拍案而起：“我去，他们自己把球员当驴使还好意思说我？！”',
        effects: { mediaSupport: 5, dressingRoom: -10 },
        followupDescription: '台下先是一片死寂，随后闪光灯像疯了一样亮成一片。你知道自己这句话已经不可能被收回，于是索性坐直了身子，摆出一副“你们能拿我怎样”的表情。当天晚上，支持你的球迷觉得你终于说了句人话；而那些本就看你不顺眼的人，也终于等到了最顺手的一把刀。'
      },
      {
        text: '拿出绳子吊在房顶：“那怎样，弄死我？我也要一起死吗？”',
        effects: { authority: -15 },
        followupDescription: '整个发布会现场都被你这一出吓得手足无措，连提问的记者都忘了把话筒放下。工作人员冲上来时，你还站在原地，神情平静得像什么都没发生过。后来有人说你是在表演崩溃，也有人说你是真的快被逼疯了。无论如何，从那以后，再没人敢在公开场合直接逼问你。'
      },
      {
        text: '面无表情：“伤病是一个无可避免的事情，我们也为此感到很痛心，希望这些俱乐部教练能和我联系沟通，相信大家也不是存心为难。”',
        effects: { mediaSupport: -5 },
        followupDescription: '你把每一个字都说得无比标准，像提前在脑子里排练过二十遍一样。记者没能从你脸上挖出任何情绪，只好带着一点失望坐了回去。发布会平稳结束，外界也挑不出什么大毛病，只是你自己清楚，这种体面的回答从来换不来真正的理解，它只能让所有人暂时找不到更难听的说法。'
      }
    ]
  },
  {
    id: 'cut_inside_reward',
    title: '奖励自己内切',
    description: '你发现一位球员喜欢奖励自己内切。这不是什么好事，因为他的内切技术并不成熟；更不幸的是，他对自己的内切非常有自信，仿佛从隔壁荷兰进修过一样。你最好做点什么来改变，否则你们将会丢失很多绝佳的进球机会，球迷也会感到愤怒。你决定…',
    options: [
      {
        text: '警告他，再内切就把他换下首发',
        effects: { dressingRoom: -5 },
        followupDescription: '你把他叫到一边，语气平静地告诉他：如果下一次还在禁区前沿毫无征兆地横向带球，你会立刻让他坐回替补席。他点了点头，看起来像是听进去了，又像是在脑内复盘自己上一脚内切到底差在哪里。更衣室里有人觉得你太严厉，也有人暗自松了口气。'
      },
      {
        text: '在网上买水军，让球迷在论坛中攻击他的内切',
        effects: { mediaSupport: -5, authority: -5 },
        followupDescription: '几小时后，论坛里开始出现大量语气相似、标点一致的帖子，内容从“别内切了”一路发展到“建议把右脚封印起来”。事情当然很快被媒体发现，他们开始追问这些账号到底是谁买的。你试图保持沉默，但球员看你的眼神已经变得很复杂。'
      },
      {
        text: '给他和隔壁荷兰的神秘内切男剪cp视频并播放给大家看',
        effects: { dressingRoom: 5, mediaSupport: -10 },
        followupDescription: '视频刚放到第三十秒，更衣室里已经有人笑到拍桌。那位球员起初满脸震惊，随后逐渐开始认真分析画面里的跑位和摆腿角度，仿佛真的从中获得了什么启发。队内气氛明显轻松了不少，只是媒体很快得知你在国家队会议室播放了某种难以归类的视频，并对此表现出浓厚兴趣。'
      }
    ]
  },
  {
    id: 'training_collision_argument',
    title: '训练碰撞争议',
    description: '在一次训练中，两个球员撞在一起，同时倒在地上捂住脸。直觉告诉你，这是一场在视野盲区的无意碰撞，但这两个球员似乎有仇，都指责是对方故意撞的，且认为自己的伤更严重。争执引来了很多人，这事恐怕不能糊弄过去了。你决定…',
    options: [
      {
        text: '拿出训练专用var，给他们详细解释并调和',
        effects: { authority: -5 },
        followupDescription: '你让助教调出训练录像，试图从三个角度、两倍慢放和一段非常模糊的远景里还原真相。十五分钟后，你终于证明这只是一次普通碰撞，但两名球员显然都没有因为真相而更高兴。你证明了自己是一个足够严谨、细心和温柔的主帅，很可惜，有的特质并不足以服众。'
      },
      {
        text: '冷笑一声，告诉他们再不起来就都去坐板凳',
        effects: { authority: 5, dressingRoom: -5, mediaSupport: -5 },
        followupDescription: '你冷笑一声，告诉他们如果还有力气吵架，就说明伤势没有严重到需要继续躺着。两个人几乎同时站了起来，动作流畅得让队医都陷入沉思。训练很快恢复了秩序，但更衣室里显然有人觉得你太不近人情。至于媒体，他们已经开始写“国家队主帅漠视球员健康”的标题了。'
      },
      {
        text: '立刻也躺在地上，指责他们撞到了你，让你感觉很不舒服',
        effects: { authority: -10, dressingRoom: 5 },
        followupDescription: '你没有说话，而是非常自然地躺到了两人旁边，捂着脸表示自己也受到了严重影响。训练场沉默了几秒，随后有人终于没忍住笑出了声。两个还在争执的球员看着你，一时间竟不知道该继续控诉对方，还是先把主教练从地上扶起来。权威当然受损了，但至少这场闹剧被一种更加离谱的方式终结了。'
      }
    ]
  },
  {
    id: 'opponent_wizard_curse',
    title: '巫师的诅咒',
    description: '结束了一天辛勤的工作，你躺在床上刷手机。突然你刷到一条新闻：一个来自你下一场对手国家的巫师在网上发视频，声称已经给你队内最具备射术的球星下咒，让他下一场进不了球。这个视频已经登顶趋势榜前十。可以肯定的是你的队员和球迷们都看到了这条消息。你决定…',
    options: [
      {
        text: '无视这条新闻。我是坚定的唯物主义战士。',
        effects: { authority: 5, dressingRoom: -10 },
        followupDescription: '你在队内会议上用非常坚定的语气表示：诅咒不会影响射门，趋势榜也不会改变比赛计划。你的理性态度让自己显得很有主帅风范，但更衣室里的气氛并没有因此轻松多少。好吧，你不得不在心里承认，当你还是个小球员时，你也是个连哪只脚先踩进球场草皮都要提前盘算好的家伙。'
      },
      {
        text: '紧急寻找本国懂塔罗牌的大师进行魔法对轰',
        effects: { mediaSupport: 5, authority: -5 },
        followupDescription: '几个小时后，一位自称熟悉塔罗、星盘和大型赛事能量流动的大师出现在基地附近。媒体对此表现出极大兴趣，甚至开始讨论西班牙是否终于找到了缺失多年的玄学拼图。你的执教路线正在变得很难向外界解释。'
      },
      {
        text: '在赛前突然宣布这位前锋不进入首发，让对手目瞪口呆',
        effects: { dressingRoom: -5 },
        followupDescription: '你没有解释太多，只是在赛前名单里划掉了那位前锋的名字。对手确实可能会感到意外，但你的球员显然也同样意外。你当然可以让那位被下咒的前锋以为自己是输给了战术安排，但你知道他其实是输给了互联网民俗学。'
      }
    ]
  },
  {
    id: 'faction_team_building',
    category: 'heckling',
    title: '派系团建',
    description: '你注意到，球队逐渐分为英超和西甲两派，还伴有正宗板鸭人、巴斯克人与加泰人的矛盾。复杂的人际关系让你头痛欲裂。你打算学习某巴斯克教练的经验，给球员们办一些简单的团建活动。你决定…',
    options: [
      {
        text: '让大家轮流挤柠檬',
        effects: { dressingRoom: -5, mediaSupport: -5, authority: -5 },
        followupDescription: '你宣布团建开始的时候，球员们的表情都很克制，克制得像是生怕自己先笑出来会显得不够尊重主教练。几分钟后，训练基地里弥漫起一股非常真实的柠檬味，而你站在中间，忽然有种自己不是在带国家队，而是在经营某种失败的果汁连锁店的错觉。活动结束后，没人变得更团结，倒是有几个人开始认真讨论你最近是不是压力太大了。'
      },
      {
        text: '将球队关在黑暗的屋子里，并在手中拿一个灯泡',
        effects: { dressingRoom: -5, mediaSupport: -5, authority: -5 },
        followupDescription: '房门关上的那一刻，屋里先是安静了一会儿，随后响起了此起彼伏的质疑声。你举着灯泡，试图发表一些关于信任、团结和共同寻找光明的讲话，可惜这套说辞在完全黑暗的环境里显得格外可疑。几分钟后，有人开始要求出去，有人开始怀疑你是不是从什么成功学培训班偷来了灵感。等到灯重新打开时，矛盾并没有消失，只是多了一层荒诞的包浆。'
      },
      {
        text: '邀请专业扒手在聚餐时偷球员的手机',
        effects: { dressingRoom: -5, mediaSupport: -5, authority: -5 },
        followupDescription: '你的初衷非常正当，甚至可以说相当前卫。既然世界杯期间什么事都有可能发生，那不如提前训练一下球员们的警惕性。于是，在一场原本还算和谐的聚餐中，几部手机非常有教育意义地消失了。短暂的错愕过后，现场迅速乱成一团，有人开始怀疑队友，有人开始怀疑服务员，最后还有人开始怀疑你。等你宣布这其实是一堂别开生面的警觉性训练课时，大家确实都提高了警惕，只不过主要是对你提高了警惕。'
      }
    ]
  },
  {
    id: 'legends_mediation',
    category: 'heckling',
    condition: { seenRandomEvent: 'faction_team_building' },
    title: '名宿调解',
    description: '在进行了上一次失败团建活动后，你痛定思痛，决定用更加平易近人的方式调解更衣室内的矛盾。你找来了一些曾在国家队浸淫多年的西班牙名宿们，开始向他们请教。拉莫斯告诉你，他是一个非常擅长调解更衣室矛盾的人，解决方法很简单：你需要平衡更衣室内的皇萨人员数量。“既然改变不了巴萨球员太多的问题，那你就招皇马名宿坐镇吧！”你觉得他的话有一些道理。你决定…',
    options: [
      {
        text: '找卡西利亚斯来帮忙',
        effects: { dressingRoom: -15, mediaSupport: 10, authority: -5, tactics: 0.5 },
        followupDescription: '卡西利亚斯来得很低调，语气也很温和，看上去确实像个能把事情说开的前辈。可惜你显然高估了这件事的单纯程度。没过多久，皮克也不知道从哪里冒了出来，开始以一种非常自然、自然得令人不安的姿态加入讨论。你眼睁睁看着这场原本旨在调解更衣室矛盾的谈话，逐渐滑向某种你根本插不上嘴的旧日恩怨局。最后，媒体对“国家队团结修复计划”赞不绝口，更衣室里的气氛却比你请人之前还要危险一点。'
      },
      {
        text: '找古蒂和劳尔来帮忙',
        effects: { dressingRoom: -15, mediaSupport: 10, authority: -5, tactics: 0.5 },
        followupDescription: '古蒂和劳尔一前一后地走进基地时，场面一度非常体面，甚至让你觉得自己这次可能终于做对了什么。随后你很快发现，球员们的注意力并没有放在调解矛盾上，而是放在了这两位名宿旁若无人地回忆往昔、互相配合，以及某种很难具体形容但确实存在的微妙氛围上。更糟糕的是，古蒂疑似吃了太多蛋白粉，一个能打十个，以至于更衣室里就算有人心里很不服气，也只能先把情绪咽下去。团结当然没有因此增加多少，但至少那一下午，没人敢大声吵架。'
      },
      {
        text: '找拉莫斯来帮忙',
        effects: { dressingRoom: -15, mediaSupport: 10, authority: -5, tactics: 0.5 },
        followupDescription: '拉莫斯听完你的烦恼后显得非常自信，仿佛更衣室矛盾这种事在他眼里和系鞋带没什么本质区别。起初，一切似乎也确实在往好的方向发展，直到他开始用自己的职业生涯经验向球员们传授“如何在不吃直红的前提下有效管理场上局势”。你站在旁边，越听越觉得哪里不太对，可惜已经晚了。几天之后，基地里悄然刮起了一股比较红黄牌、研究犯规尺度、顺便交流申诉技巧的风气。媒体纷纷称赞你找对了人，更衣室也确实比以前热闹了，只不过热闹的方向和你预想的稍微有一点偏差。'
      }
    ]
  }
];

export const CHALLENGE_COMPLAINT_LETTERS = [
  {
    id: 'arsenal_letter_1',
    club: '阿森纳',
    title: '来自阿森纳主教练的投诉信',
    description: '亲爱的[名字]，\n很不高兴打扰你，但我看到你场场都把我们的球员安排在首发，连友谊赛都一场不落。你到底想干什么！ ~~你最好期望自己下课之后别来英超，否则我要你好看 别把我家孩子当驴使，还年轻着呢 别欺负我们没有媒体找你的麻烦！~~\n不好意思刚才鬼上身了，写信呢主要是为了和你友好交流一下，这几天我们会安排专业人士来给球员做身体检测，希望你放行，谢谢！\n你真诚的，\n阿森纳俱乐部主教练'
  },
  {
    id: 'barcelona_letter_1',
    club: '巴塞罗那',
    title: '来自巴塞罗那主教练的投诉信',
    description: '亲爱的[名字]，\n你好。我写信是为了就球员使用，尤其是我们俱乐部的球员使用一事与你沟通。\n首先，我完全理解国家队赛事的重要性，也尊重你作为西班牙国家队主教练所做出的排兵布阵决定。理论上来说，巴塞罗那俱乐部始终愿意为国家队事业提供支持。理论上。\n但问题在于，我注意到你对我们球员的使用频率已经逐渐超出了支持的范畴。\n我必须坦率地告诉你，这样的安排会让球员的身体状况承受巨大压力，也会让俱乐部的赛季计划承受巨大压力，还会让主教练本人承受一种很难用文明语言描述的巨大压力。为了保持体面，我已经尽可能克制措辞了。请不要逼我重新考虑这一点。\n当然，我写这封信并不是为了制造无意义的对立。恰恰相反，我希望我们能够像两个理性、成熟、并且都还没有彻底失去耐心的职业人士一样，妥善处理这个问题。接下来几天，我们会安排专业团队前往国家队基地，对相关球员进行身体评估与恢复检查。希望你能够给予配合，不要阻拦。\n如果你愿意减少一点对我方球员的过度热爱，我将对此表示感谢。\n此致\n敬礼\n\n巴塞罗那俱乐部主教练'
  },
  {
    id: 'athletic_bilbao_letter_1',
    club: '毕尔巴鄂竞技',
    title: '来自毕尔巴鄂竞技主教练的投诉信',
    description: '亲爱的[名字]，\nAgur。这是巴斯克语的"你好"，我刚学的。是的，我在努力。我每天早上六点起床背单词，因为我尊重这个地方，尊重这件红白条纹的球衣，尊重这家只用自己孩子的俱乐部。\n而你呢？\n我今天打开电视，看见我的球员——我的——在你们的友谊赛里跑了整整90分钟。90分钟！为了一场谁都不会记得的比赛！\n我理解你喜欢这些巴斯克小伙子。我尊重这一点。说实话，刚听说这个消息的时候，我甚至有点高兴——我想，太好了，西班牙国家队主教练懂我们，他会照顾我们的球员，他知道圣马梅斯意味着什么。\n天真。我太天真了。\n因为我现在才明白，所谓"懂我们"，意思是他知道从哪里下手。一个外人想挖毕尔巴鄂的球员，他不知道该挖谁；可你呢？你连乌奈·西蒙小时候在哪个青年队踢球都知道！\n抱歉。我又激动了。接下来几天，我们会安排医疗团队前往国家队基地，对所有毕尔巴鄂球员进行体检与恢复评估。所有。\n我本人也会去。请你记得放行。\nEskerrik asko.\n你真诚的，\n毕尔巴鄂竞技主教练'
  },
  {
    id: 'psg_letter_1',
    club: '巴黎圣日耳曼',
    title: '来自巴黎圣日耳曼主教练的投诉信',
    description: '[名字]，\n我就不"亲爱的"了。\n我看了你最近的首发。你在想什么我大概都知道。再赢一场就稳了，状态好的时候不用就浪费了，主力是主力是有原因的。这些话我都对自己说过。\n结果你也看到了。\n接下来几天我们的队医会去你那儿，做几个常规检查。不用特地安排，也别想拦着，合同里写了的。你要是没看过那条，那就现在去看一下吧。\n最后多嘴一句，你听不听随便。\n这份工作赢球是没人记得的，输球才会。所以哪几场要把人全压上去，哪几场可以留点，你自己得想清楚。我当年没怎么想清楚。\n希望你比我聪明点。\n\n你不真诚的，\n巴黎圣日耳曼主教练'
  },
  {
    id: 'atletico_madrid_letter_1',
    club: '马德里竞技',
    title: '来自马德里竞技主教练的投诉信',
    description: '亲爱的[名字]，\n友谊赛不是欧冠决赛。请不要再让我的球员像最后十分钟守一球领先那样跑满全场。我们的队医明天会到国家队基地，希望你放行。我也会过去教你怎么摆大巴（不要告诉别人）。\n你真诚的，\n马德里竞技主教练'
  }
];

export const CHALLENGE_FRIENDLY_OPPONENTS = [
  { id: 'netherlands', name: '荷兰', tactics: 8.5, tier: '强队' },
  { id: 'germany_friendly', name: '德国', tactics: 8.5, tier: '强队' },
  { id: 'england', name: '英格兰', tactics: 8.5, tier: '强队' },
  { id: 'switzerland', name: '瑞士', tactics: 7.5, tier: '中等队伍' },
  { id: 'belgium', name: '比利时', tactics: 7.5, tier: '中等队伍' },
  { id: 'poland', name: '波兰', tactics: 7.5, tier: '中等队伍' },
  { id: 'bosnia', name: '波黑', tactics: 6.5, tier: '弱队' },
  { id: 'sweden', name: '瑞典', tactics: 6.5, tier: '弱队' },
  { id: 'north_macedonia', name: '北马其顿', tactics: 6.5, tier: '弱队' }
];

export const CHALLENGE_FRIENDLY_SCHEDULE = [
  { round: 1, dateText: '5月18日', timeText: '21:00' },
  { round: 2, dateText: '5月24日', timeText: '20:45' },
  { round: 3, dateText: '5月30日', timeText: '20:45' },
  { round: 4, dateText: '6月6日', timeText: '21:00' }
];

export const CHALLENGE_LEGENDS = [
  { id: 'torres', name: '托雷斯', effects: { dressingRoom: 5 } },
  { id: 'guti', name: '古蒂', effects: { dressingRoom: 5 } },
  { id: 'xavi', name: '哈维', effects: { tactics: 0.5 } },
  { id: 'casillas', name: '卡西利亚斯', effects: { mediaSupport: 5 } },
  { id: 'pique', name: '皮克', effects: { mediaSupport: 5 } },
  { id: 'bonmati', name: '邦马蒂', effects: { tactics: 0.5 } }
];

export const CHALLENGE_GROUP_TEAMS = [
  { id: 'spain_world_cup', name: '西班牙', tactics: 8 },
  { id: 'cape_verde', name: '佛得角', tactics: 6.8 },
  { id: 'saudi_arabia', name: '沙特阿拉伯', tactics: 6.8 },
  { id: 'uruguay', name: '乌拉圭', tactics: 7.5 }
];

export const CHALLENGE_GROUP_FIXTURES = [
  {
    round: 1,
    groupLabel: '世界杯 · H组',
    dateText: '6月15日',
    timeText: '18:00',
    homeId: 'spain_world_cup',
    awayId: 'cape_verde',
    opponentId: 'cape_verde',
    otherFixture: { homeId: 'saudi_arabia', awayId: 'uruguay' }
  },
  {
    round: 2,
    groupLabel: '世界杯 · H组',
    dateText: '6月21日',
    timeText: '18:00',
    homeId: 'spain_world_cup',
    awayId: 'saudi_arabia',
    opponentId: 'saudi_arabia',
    otherFixture: { homeId: 'cape_verde', awayId: 'uruguay' }
  },
  {
    round: 3,
    groupLabel: '世界杯 · H组',
    dateText: '6月27日',
    timeText: '02:00',
    homeId: 'uruguay',
    awayId: 'spain_world_cup',
    opponentId: 'uruguay',
    otherFixture: { homeId: 'cape_verde', awayId: 'saudi_arabia' }
  }
];

export const CHALLENGE_KNOCKOUT_PATHS = {
  first: [
    {
      id: 'r32',
      label: '世界杯三十二强',
      opponent: { id: 'austria', name: '奥地利', tactics: 8.0 },
      opponentPool: [
        { id: 'austria', name: '奥地利', tactics: 8.0 },
        { id: 'algeria', name: '阿尔及利亚', tactics: 7.4 }
      ]
    },
    {
      id: 'r16',
      label: '世界杯十六强',
      opponent: { id: 'portugal', name: '葡萄牙', tactics: 8.5 },
      opponentPool: [
        { id: 'portugal', name: '葡萄牙', tactics: 8.5 },
        { id: 'england', name: '英格兰', tactics: 8.9 },
        { id: 'colombia', name: '哥伦比亚', tactics: 8.4 },
        { id: 'croatia', name: '克罗地亚', tactics: 8.2 },
        { id: 'ghana', name: '加纳', tactics: 7.6 }
      ]
    },
    {
      id: 'qf',
      label: '世界杯八强',
      opponent: { id: 'belgium', name: '比利时', tactics: 8.6 },
      opponentPool: [
        { id: 'belgium', name: '比利时', tactics: 8.6 },
        { id: 'germany', name: '德国', tactics: 8.8 },
        { id: 'netherlands', name: '荷兰', tactics: 8.4 },
        { id: 'colombia', name: '哥伦比亚', tactics: 8.4 },
        { id: 'portugal', name: '葡萄牙', tactics: 8.5 },
        { id: 'usa', name: '美国', tactics: 8.0 }
      ]
    },
    {
      id: 'sf',
      label: '世界杯四强',
      opponent: { id: 'england', name: '英格兰', tactics: 8.9 },
      opponentPool: [
        { id: 'england', name: '英格兰', tactics: 8.9 },
        { id: 'argentina', name: '阿根廷', tactics: 9.2 },
        { id: 'brazil', name: '巴西', tactics: 9.3 },
        { id: 'germany', name: '德国', tactics: 8.8 },
        { id: 'netherlands', name: '荷兰', tactics: 8.4 },
        { id: 'portugal', name: '葡萄牙', tactics: 8.5 },
        { id: 'norway', name: '挪威', tactics: 8.7 },
        { id: 'belgium', name: '比利时', tactics: 8.6 },
        { id: 'colombia', name: '哥伦比亚', tactics: 8.4 }
      ]
    },
    { id: 'final', label: '世界杯决赛', opponent: { id: 'france', name: '法国', tactics: 9.0 } }
  ],
  second: [
    { id: 'r32', label: '世界杯三十二强', opponent: { id: 'argentina', name: '阿根廷', tactics: 9.2 } },
    {
      id: 'r16',
      label: '世界杯十六强',
      opponent: { id: 'australia', name: '澳大利亚', tactics: 7.5 },
      opponentPool: [
        { id: 'australia', name: '澳大利亚', tactics: 7.5 },
        { id: 'egypt', name: '埃及', tactics: 7.7 },
        { id: 'iran', name: '伊朗', tactics: 7.4 },
        { id: 'paraguay', name: '巴拉圭', tactics: 7.6 },
        { id: 'turkiye', name: '土耳其', tactics: 7.9 },
        { id: 'belgium', name: '比利时', tactics: 8.6 }
      ]
    },
    {
      id: 'qf',
      label: '世界杯八强',
      opponent: { id: 'portugal', name: '葡萄牙', tactics: 8.5 },
      opponentPool: [
        { id: 'portugal', name: '葡萄牙', tactics: 8.5 },
        { id: 'colombia', name: '哥伦比亚', tactics: 8.4 },
        { id: 'switzerland', name: '瑞士', tactics: 8.0 },
        { id: 'canada', name: '加拿大', tactics: 7.6 },
        { id: 'germany', name: '德国', tactics: 8.8 },
        { id: 'netherlands', name: '荷兰', tactics: 8.4 }
      ]
    },
    {
      id: 'sf',
      label: '世界杯四强',
      opponent: { id: 'portugal', name: '葡萄牙', tactics: 8.5 },
      opponentPool: [
        { id: 'portugal', name: '葡萄牙', tactics: 8.5 },
        { id: 'argentina', name: '阿根廷', tactics: 9.2 },
        { id: 'brazil', name: '巴西', tactics: 9.3 },
        { id: 'england', name: '英格兰', tactics: 8.9 },
        { id: 'germany', name: '德国', tactics: 8.8 },
        { id: 'netherlands', name: '荷兰', tactics: 8.4 },
        { id: 'norway', name: '挪威', tactics: 8.7 },
        { id: 'belgium', name: '比利时', tactics: 8.6 },
        { id: 'colombia', name: '哥伦比亚', tactics: 8.4 }
      ]
    },
    { id: 'final', label: '世界杯决赛', opponent: { id: 'france', name: '法国', tactics: 9.0 } }
  ],
  third: [
    {
      id: 'r32',
      label: '世界杯三十二强',
      opponent: { id: 'france', name: '法国', tactics: 9.0 },
      opponentPool: [
        { id: 'mexico', name: '墨西哥', tactics: 8.1 },
        { id: 'belgium', name: '比利时', tactics: 8.6 },
        { id: 'france', name: '法国', tactics: 9.0 },
        { id: 'england', name: '英格兰', tactics: 8.9 }
      ]
    },
    {
      id: 'r16',
      label: '世界杯十六强',
      opponent: { id: 'morocco', name: '摩洛哥', tactics: 7.8 },
      opponentPool: [
        { id: 'morocco', name: '摩洛哥', tactics: 7.8 },
        { id: 'croatia', name: '克罗地亚', tactics: 8.2 },
        { id: 'portugal', name: '葡萄牙', tactics: 8.5 }
      ]
    },
    {
      id: 'qf',
      label: '世界杯八强',
      opponent: { id: 'portugal', name: '葡萄牙', tactics: 8.5 },
      opponentPool: [
        { id: 'portugal', name: '葡萄牙', tactics: 8.5 },
        { id: 'brazil', name: '巴西', tactics: 9.3 },
        { id: 'germany', name: '德国', tactics: 8.8 },
        { id: 'netherlands', name: '荷兰', tactics: 8.4 },
        { id: 'colombia', name: '哥伦比亚', tactics: 8.4 }
      ]
    },
    {
      id: 'sf',
      label: '世界杯四强',
      opponent: { id: 'argentina', name: '阿根廷', tactics: 9.2 },
      opponentPool: [
        { id: 'argentina', name: '阿根廷', tactics: 9.2 },
        { id: 'brazil', name: '巴西', tactics: 9.3 },
        { id: 'england', name: '英格兰', tactics: 8.9 },
        { id: 'germany', name: '德国', tactics: 8.8 },
        { id: 'netherlands', name: '荷兰', tactics: 8.4 },
        { id: 'portugal', name: '葡萄牙', tactics: 8.5 },
        { id: 'norway', name: '挪威', tactics: 8.7 },
        { id: 'belgium', name: '比利时', tactics: 8.6 },
        { id: 'colombia', name: '哥伦比亚', tactics: 8.4 }
      ]
    },
    { id: 'final', label: '世界杯决赛', opponent: { id: 'france', name: '法国', tactics: 9.0 } }
  ]
};
