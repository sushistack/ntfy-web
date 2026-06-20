import { useTranslation } from "react-i18next";
import { Skeleton } from "./Skeleton";

const DataBoundary = ({
    loading = false,
    hasCache = false,
    skeletonCount = 5,
    empty = false,
    emptySlot = null,
    error = null,
    errorAction = null,
    children,
}) => {
    const { t } = useTranslation();

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
                <p className="text-body-sm text-muted">{t("data_boundary_error_generic")}</p>
                {errorAction}
            </div>
        );
    }

    if (loading && !hasCache) {
        const count = Number.isFinite(skeletonCount) && skeletonCount > 0 ? Math.floor(skeletonCount) : 5;
        return <>{Array.from({ length: count }, (_, i) => <Skeleton key={i} />)}</>;
    }

    if (loading && hasCache) {
        return <>{children}</>;
    }

    if (empty) {
        return <>{emptySlot}</>;
    }

    return <>{children}</>;
};

export default DataBoundary;
