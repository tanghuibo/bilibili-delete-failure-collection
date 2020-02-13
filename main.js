/**
 * 获取分页数据
 * @param {Function} getDataFunction 获取数据接口
 * @param {Function} getCountFunction 获取数据中的数据大小接口
 * @param {Function} getListFunction 获取数据中列表接口
 */
async function getAllList(getDataFunction, getCountFunction, getListFunction) {
    let resultList = [];
    let data = await getDataFunction(1);
    let count = getCountFunction(data);
    let list = getListFunction(data);
    if (list) {
        resultList = [...resultList, ...list];
    }
    for (let page = 1; page * 20 < count; page++) {
        let data = await getDataFunction(page + 1);
        let list = getListFunction(data);
        if (list) {
            resultList = [...resultList, ...list];
        }
    }
    return resultList;
}

/**
 * 获取导航信息
 */
function getNav() {
    return fetch("https://api.bilibili.com/x/web-interface/nav", {
        "credentials": "include",
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "zh-Hans-CN,zh-CN;q=0.9,zh;q=0.8,en;q=0.7,en-GB;q=0.6,en-US;q=0.5",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "body": null,
        "method": "GET",
        "mode": "cors"
    }).then(data => data.json());
}

/**
 * 获取用户收藏夹列表
 * @param {*} upMid 
 */
async function getAllCollectionList(upMid) {
    return getAllList(page => getCollectionData(upMid, page), data => data.count, data => data.list);
}

/**
 * 获取用户收藏夹(分页)
 * @param {*} upMid 
 * @param {*} page 
 */
function getCollectionData(upMid, page) {
    var myHeaders = new Headers();

    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    return fetch(`https://api.bilibili.com/medialist/gateway/base/created?pn=${page}&ps=20&up_mid=${upMid}&is_space=0&jsonp=jsonp`, requestOptions)
        .then(response => response.json())
        .then(data => {
            console.log(`获取收藏夹标题第${page}页`);
            return data.data;
        })
}

/**
 * 获取收藏夹明细
 * @param {*} collectionId 
 */
function getAllCollectionDetailList(collectionId) {
    return getAllList(page => getCollectionDetailData(collectionId, page), data => data.info.media_count, data => data.medias);
}

/**
 * 获取收藏夹明细(分页)
 * @param {*} collectionId 
 * @param {*} page 
 */
function getCollectionDetailData(collectionId, page) {
    var myHeaders = new Headers();

    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'manual'
    };

    return fetch(`https://api.bilibili.com/medialist/gateway/base/spaceDetail?media_id=${collectionId}&pn=${page}&ps=20&keyword=&order=mtime&type=0&tid=0&jsonp=jsonp`, requestOptions)
        .then(response => response.json())
        .then(data => data && data.data && data.data)
        .then(data => {
            console.log(`获取 "${data.info.title}" 收藏夹中第${page}页`);
            return data;
        })
}

/**
 * 处理收藏夹，删除已失效视频
 * @param {*} collection 
 */
async function processCollection(collection) {
    let collectionDetailList = await getAllCollectionDetailList(collection.id);
    console.log(collectionDetailList);
    let cancelCollectionDetailList = collectionDetailList.filter(item => item.title === '已失效视频');
    for (let collectionDetail of cancelCollectionDetailList) {
        await delCollection(collection.id, collectionDetail.id);

    }
}

/**
 * 删除收藏夹中的视频
 * @param {*} collectionId 
 * @param {*} collectionDetailId 
 */
function delCollection(collectionId, collectionDetailId) {
    return fetch("https://api.bilibili.com/medialist/gateway/coll/resource/batch/del", {
        "credentials": "include",
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "zh-Hans-CN,zh-CN;q=0.9,zh;q=0.8,en;q=0.7,en-GB;q=0.6,en-US;q=0.5",
            "content-type": "application/x-www-form-urlencoded",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "body": `resources=${collectionDetailId}%3A2&media_id=${collectionId}`,
        "method": "POST",
        "mode": "cors"
    }).then(data => {
        console.log("已删除一个失效视频");
        return data.json();
    });
}

(async () => {
    let nav = await getNav();
    let collectionList = await getAllCollectionList(nav.data.mid);
    for (let collection of collectionList) {
        await processCollection(collection);
    }
    console.log("完成");
})();
