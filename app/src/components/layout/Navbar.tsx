import { useEffect, useState } from 'react'

import { Link, NavLink } from 'react-router'

import { ArrowUpRight, Menu, X } from 'lucide-react'

import LanguageSwitcher from '@/components/common/LanguageSwitcher'

import { useEnabledServices } from '@/hooks/useEnabledServices'

import { useLanguage } from '@/hooks/useLanguage'

import { cn } from '@/lib/utils'

import { usePrimaryNav } from '@/hooks/usePrimaryNav'

import Logo from './Logo'



export default function Navbar() {

  const primaryNavLinks = usePrimaryNav()

  const { isHrefEnabled } = useEnabledServices()

  const { t } = useLanguage()

  const orderNowHref = isHrefEnabled('/traditional-drinks') ? '/traditional-drinks' : null

  const [isScrolled, setIsScrolled] = useState(false)

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)



  useEffect(() => {

    const handleScroll = () => setIsScrolled(window.scrollY > 40)

    handleScroll()

    window.addEventListener('scroll', handleScroll)

    return () => window.removeEventListener('scroll', handleScroll)

  }, [])



  useEffect(() => {

    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : ''

    return () => {

      document.body.style.overflow = ''

    }

  }, [isMobileMenuOpen])



  return (

    <>

      <nav className="fixed inset-x-0 top-0 z-50 flex justify-center px-3">

        <div

          className={cn(

            'flex h-14 max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-b-[1.75rem] bg-cream/95 pl-4 pr-2 backdrop-blur-md transition-shadow duration-300 sm:gap-6 sm:pl-6 lg:h-16',

            isScrolled ? 'shadow-xl shadow-burgundy/15' : 'shadow-lg shadow-burgundy/5',

          )}

        >

          <Logo />



          <div className="hidden items-center gap-4 xl:gap-5 lg:flex">

            {primaryNavLinks.map((link) => (

              <NavLink

                key={link.to}

                to={link.to}

                end={link.to === '/'}

                className={({ isActive }) =>

                  cn(

                    'relative whitespace-nowrap text-sm font-medium transition-colors duration-200 xl:text-[15px]',

                    'after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:bg-burgundy after:transition-all after:duration-200',

                    isActive

                      ? 'text-burgundy after:w-full'

                      : 'text-gray-700 hover:text-burgundy after:w-0',

                  )

                }

              >

                {link.label}

              </NavLink>

            ))}

          </div>



          <div className="ml-auto flex items-center gap-2 sm:gap-3">

            <LanguageSwitcher />



            {orderNowHref ? (

              <Link

                to={orderNowHref}

                className="hidden items-center gap-1.5 rounded-full bg-burgundy py-3 pl-6 pr-5 text-[15px] font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-burgundy-light lg:inline-flex"

              >

                {t('orderNow')}

                <ArrowUpRight className="h-4 w-4" />

              </Link>

            ) : null}



            <button

              onClick={() => setIsMobileMenuOpen(true)}

              aria-label={t('openMenu')}

              className="flex h-10 w-10 items-center justify-center rounded-full text-burgundy lg:hidden"

            >

              <Menu className="h-6 w-6" />

            </button>

          </div>

        </div>

      </nav>



      {isMobileMenuOpen && (

        <div

          className="fixed inset-0 z-50 bg-black/50 lg:hidden"

          onClick={() => setIsMobileMenuOpen(false)}

        />

      )}



      <div

        className={cn(

          'fixed inset-y-0 right-0 z-50 w-72 transform bg-white shadow-xl transition-transform duration-300 ease-out lg:hidden',

          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full',

        )}

      >

        <div className="flex h-full flex-col p-6">

          <button

            onClick={() => setIsMobileMenuOpen(false)}

            aria-label={t('closeMenu')}

            className="self-end p-2 text-gray-600 hover:text-burgundy"

          >

            <X className="h-6 w-6" />

          </button>



          <div className="mt-4 flex justify-center">

            <LanguageSwitcher />

          </div>



          <div className="mt-6 flex flex-col gap-1">

            {primaryNavLinks.map((link) => (

              <NavLink

                key={link.to}

                to={link.to}

                end={link.to === '/'}

                onClick={() => setIsMobileMenuOpen(false)}

                className={({ isActive }) =>

                  cn(

                    'rounded-lg px-3 py-3 text-lg font-medium transition-colors',

                    isActive

                      ? 'bg-burgundy/10 text-burgundy'

                      : 'text-gray-700 hover:bg-cream-warm hover:text-burgundy',

                  )

                }

              >

                {link.label}

              </NavLink>

            ))}

          </div>



          {orderNowHref ? (

            <Link

              to={orderNowHref}

              onClick={() => setIsMobileMenuOpen(false)}

              className="btn-primary mt-auto justify-center"

            >

              {t('orderNow')}

            </Link>

          ) : null}

        </div>

      </div>

    </>

  )

}


