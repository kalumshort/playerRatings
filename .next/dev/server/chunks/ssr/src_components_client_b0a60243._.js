module.exports = [
"[project]/src/components/client/GroupClientInitializer.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>GroupClientInitializer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-redux/dist/react-redux.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redux$2f$slices$2f$groupSlice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redux/slices/groupSlice.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function GroupClientInitializer({ groupData }) {
    const dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDispatch"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (groupData) {
            // Push the server-side data into Redux dictionary
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redux$2f$slices$2f$groupSlice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["groupDataSuccess"])({
                [groupData.id]: groupData
            }));
            // Set this as the active club for the UI
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redux$2f$slices$2f$groupSlice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setActiveGroup"])(groupData.id));
        }
    }, [
        groupData,
        dispatch
    ]);
    return null;
}
}),
"[project]/src/components/client/DataInitializer.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DataInitializer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-redux/dist/react-redux.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redux$2f$slices$2f$fixturesSlice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redux/slices/fixturesSlice.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redux$2f$slices$2f$squadSlice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redux/slices/squadSlice.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redux$2f$actions$2f$ratingsActions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/redux/actions/ratingsActions.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
function DataInitializer({ clubId, currentYear, groupId }) {
    const dispatch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDispatch"])();
    // 1. Optimized Boolean selectors
    const hasFixtures = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSelector"])((state)=>!!state.fixtures.byClubId[clubId]?.[currentYear]);
    const hasSquad = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSelector"])((state)=>!!state.teamSquads.byClubId[clubId]?.[currentYear]);
    const hasSeasonRatings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$redux$2f$dist$2f$react$2d$redux$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSelector"])((state)=>groupId ? !!state.playerRatings.byGroupId[groupId]?.players : false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!clubId || !currentYear) return;
        if (!hasFixtures) {
            console.log(`[Data] 📥 Fetching Fixtures: ${clubId} (${currentYear})`);
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redux$2f$slices$2f$fixturesSlice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fetchFixtures"])({
                clubId,
                currentYear
            }));
        }
        if (!hasSquad) {
            console.log(`[Data] 📥 Fetching Squad: ${clubId} (${currentYear})`);
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redux$2f$slices$2f$squadSlice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fetchTeamSquad"])({
                squadId: clubId,
                currentYear
            }));
        }
        if (groupId && !hasSeasonRatings) {
            console.log(`[Data] 📥 Fetching Season Ratings for Group: ${groupId}`);
            dispatch((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$redux$2f$actions$2f$ratingsActions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fetchAllPlayersSeasonOverallRating"])({
                groupId,
                currentYear
            }));
        }
    }, [
        clubId,
        currentYear,
        groupId,
        hasFixtures,
        hasSquad,
        hasSeasonRatings,
        dispatch
    ]);
    return null;
}
}),
];

//# sourceMappingURL=src_components_client_b0a60243._.js.map