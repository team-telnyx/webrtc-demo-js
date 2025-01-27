import clsx from "clsx"

type H4Props = React.HTMLAttributes<HTMLHeadingElement>

const H4 = ({ children, className, ...props }: H4Props) => {
    return (
        <h3 className={clsx("scroll-m-20 text-xl font-semibold tracking-tight", className)} {...props}>
            {children}
        </h3>
    )
}

export default H4