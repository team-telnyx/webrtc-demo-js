import clsx from "clsx"

type H3Props = React.HTMLAttributes<HTMLHeadingElement>

const H3 = ({ children, className, ...props }: H3Props) => {
    return (
        <h3 className={clsx("scroll-m-20 text-2xl font-semibold tracking-tight", className)} {...props}>
            {children}
        </h3>
    )
}

export default H3